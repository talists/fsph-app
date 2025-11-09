// src/modules/usuarios/usuario.service.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { UsuarioRepository } from "./repositories/usuario.repository.js";
import { redisClient } from "../../config/redis.js";
import {
  uploadToCloudflare,
  deleteFromCloudflare,
} from "../../utils/cloudflare.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class UsuarioService {
  static async register(data, file) {
    if (await UsuarioRepository.findByEmail(data.email)) {
      throw new Error("Email já cadastrado");
    }

    const salt = await bcrypt.genSalt();
    const senhaHash = await bcrypt.hash(data.senha, salt);
    let urlFoto = null;
    if (file) {
      console.log(
        "⏳ [BACKEND] Service: A iniciar upload para o Cloudflare..."
      );
      urlFoto = await uploadToCloudflare(file);
      console.log(
        "✅ [BACKEND] Service: Upload para Cloudflare CONCLUÍDO. URL:",
        urlFoto
      );
    }

    const userData = {
      nome: data.nome,
      email: data.email,
      cpf: data.cpf,
      senha: senhaHash,
      numero_telefone: data.numero_telefone || null,
      data_nascimento: data.data_nascimento || null,
      tipo_sanguineo: data.tipo_sanguineo || null,
      cidade: data.cidade || null,
      estado: data.estado || null,
      url_foto_perfil: urlFoto,
    };

    const usuario = await UsuarioRepository.create(userData);
    delete usuario.senha;
    const accessToken = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { id: usuario.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await UsuarioRepository.update(usuario.id, { refresh_token: refreshToken });

    await redisClient.del("usuarios_all");
    await redisClient.set(`usuario_${usuario.id}`, JSON.stringify(usuario), {
      EX: 3600,
    });

    return { accessToken, refreshToken, usuario };
  }

  static async getAll() {
    const cached = await redisClient.get("usuarios_all");
    if (cached) {
      return JSON.parse(cached);
    }

    const usuarios = await UsuarioRepository.findAll();
    usuarios.forEach((u) => delete u.senha);

    await redisClient.set("usuarios_all", JSON.stringify(usuarios), {
      EX: 300,
    });
    return usuarios;
  }

  static async getById(id) {
    const cached = await redisClient.get(`usuario_${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const usuario = await UsuarioRepository.findById(id);
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    delete usuario.senha;
    await redisClient.set(`usuario_${id}`, JSON.stringify(usuario), {
      EX: 3600,
    });
    return usuario;
  }

  static async update(id, data, file) {
    let urlFotoAntiga = null;

    if (file) {
      const usuarioAtual = await UsuarioRepository.findById(id);
      if (usuarioAtual?.url_foto_perfil) {
        urlFotoAntiga = usuarioAtual.url_foto_perfil;
      }

      const novaUrlFoto = await uploadToCloudflare(file);
      data.url_foto_perfil = novaUrlFoto;
    }

    if (data.senha) {
      const salt = await bcrypt.genSalt();
      data.senha = await bcrypt.hash(data.senha, salt);
    }

    const usuarioAtualizado = await UsuarioRepository.update(id, data);
    delete usuarioAtualizado.senha;

    if (urlFotoAntiga) {
      const nomeArquivoAntigo = urlFotoAntiga.split("/").pop();
      await deleteFromCloudflare(nomeArquivoAntigo);
    }

    await redisClient.del("usuarios_all");
    await redisClient.set(`usuario_${id}`, JSON.stringify(usuarioAtualizado), {
      EX: 3600,
    });

    return usuarioAtualizado;
  }

  static async delete(id) {
    await UsuarioRepository.delete(id);
    await redisClient.del(`usuario_${id}`);
    await redisClient.del("usuarios_all");
    return { msg: "Usuário deletado" };
  }

  static async reativarDoadoresElegiveis() {
    console.log("🔄 Verificando doadores para reativar...");

    const usuariosParaReativar =
      await UsuarioRepository.findInaptosParaReativacao();

    if (usuariosParaReativar.length === 0) {
      console.log("Nenhum doador para reativar no momento.");
      return { reativados: 0, usuarios: [] };
    }

    console.log(
      `Encontrados ${usuariosParaReativar.length} doadores para reativar.`
    ); // Pega apenas os IDs para uma atualização em massa

    const ids = usuariosParaReativar.map((u) => u.id);

    await UsuarioRepository.update(ids, { esta_apto_para_doar: true }); // Invalida o cache de cada usuário atualizado

    const cachePromises = ids.map((id) => redisClient.del(`usuario_${id}`));
    await Promise.all(cachePromises);

    console.log(`✅ ${ids.length} doadores foram reativados com sucesso.`);

    // Filtra a lista original para retornar apenas usuários que têm um token
    const usuariosComToken = usuariosParaReativar.filter((u) => u.fcm_token);

    // Retorna a contagem E a lista de usuários com token
    return { reativados: ids.length, usuarios: usuariosComToken };
  }
}
