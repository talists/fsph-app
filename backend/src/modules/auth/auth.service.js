// src/modules/auth/auth.service.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "../auth/repositories/auth.repository.js";
import { redisClient } from "../../config/redis.js";
import { sendEmail } from "../../utils/email.js";

const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES = "30d";

export class AuthService {

  static async login(email, senha) {
    const usuario = await AuthRepository.findByEmail(email);
    
    if (!usuario) throw new Error("Usuário não encontrado");
    if (!usuario.senha) throw new Error("Conta vinculada com a Google. Use login com o provedor.");
    
    const match = await bcrypt.compare(senha, usuario.senha);
    if (!match) throw new Error("Senha incorreta");

    const accessToken = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
    const refreshToken = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });

    await AuthRepository.update(usuario.id, { refresh_token: refreshToken });

    await redisClient.set(`token_usuario_${usuario.id}`, accessToken, { EX: 60 * 15 }); // 15 minutos

    // CORREÇÃO: Remove a senha antes de retornar e inclui todos os campos necessários
    delete usuario.senha;
    delete usuario.refresh_token;

    return { 
      accessToken, 
      refreshToken, 
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo_sanguineo: usuario.tipo_sanguineo,
        url_foto_perfil: usuario.url_foto_perfil
      }
    };
  }

  static async logout(usuarioId) {
    await redisClient.del(`token_usuario_${usuarioId}`);
    await AuthRepository.update(usuarioId, { refresh_token: null });
    
    return { msg: "Logout realizado com sucesso" };
  }

  // O metodo para o refreshToken
  static async refreshToken(tokenRecebido) {
    if (!tokenRecebido) throw new Error("Refresh token não fornecido");

    const payload = jwt.verify(tokenRecebido, JWT_SECRET);

    // Busca o usuário e verifica se o token recebido é o mesmo que está salvo no banco
    const usuario = await AuthRepository.findById(payload.id);
    if (!usuario || usuario.refresh_token !== tokenRecebido) {
      throw new Error("Refresh token inválido ou revogado.");
    }

    // Se tudo estiver ok, gera um NOVO access token
    const newAccessToken = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });

    // Atualiza o token no Redis
    await redisClient.set(`token_usuario_${usuario.id}`, newAccessToken, { EX: 60 * 15 });

    return { accessToken: newAccessToken };
  }

  static async esqueciSenha(usuarioEmail){
    const usuario = await AuthRepository.findByEmail(usuarioEmail);
    
    if (!usuario) {
      return { msg: "Se um usuário com este e-mail existir, um link de redefinição foi enviado." };
    }

    const resetToken = jwt.sign(
      { id: usuario.id, tipo: 'senha-reset'},
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/resetar-senha?token=${resetToken}`;

    const emailHtml = 
      `
        <h1>Redefinição de Senha - Gota a Gota</h1>
        <p>Olá, ${usuario.nome}!</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Se foi você, clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetLink}">Redefinir Minha Senha</a>
        <p>Este link é válido por 15 minutos.</p>
        <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
      `;
      
    await sendEmail({
      to: usuario.email,
      subject: 'Redefinição de Senha - Gota a Gota',
      html: emailHtml,
    });

    return { msg: "Se um usuário com este e-mail existir, um link de redefinição foi enviado." };
  }

  static async alterarSenha(usuarioId, senhaAtual, novaSenha) {
    const usuario = await AuthRepository.findById(usuarioId);
    if (!usuario) throw new Error("Usuário não encontrado");

    if (!usuario.senha)
      throw new Error("Usuário Google não possui senha local.");

    const match = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!match) throw new Error("Senha atual incorreta");

    const novaHash = await bcrypt.hash(novaSenha, 10);
    await AuthRepository.updateSenha(usuarioId, novaHash);

    return { msg: "Senha alterada com sucesso" };
  }
}