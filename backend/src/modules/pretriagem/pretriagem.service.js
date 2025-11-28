// src/modules/pretriagem/pretriagem.service.js

import { PreTriagemRepository } from "./repositories/pretriagem.repository.js";
import { UsuarioRepository } from "../usuarios/repositories/usuario.repository.js";
import { redisClient } from "../../config/redis.js";

const PERGUNTAS = [
  { id: 1, pergunta: "É a primeira vez que você doa sangue?", tipo: "sim_nao" },
  { id: 2, pergunta: "Você pesa mais de 50 kg?", tipo: "sim_nao" },
  { id: 3, pergunta: "Fez tatuagem ou piercing em local não certificado pela ANVISA nos últimos 12 meses?", tipo: "sim_nao" },
  { id: 4, pergunta: "Sexo", tipo: "opcao", opcoes: ["Masculino", "Feminino"] },
  { id: 5, pergunta: "Você está grávida ou amamentando atualmente?", tipo: "sim_nao", condicional: { perguntaId: 4, valor: "Feminino" } },
];

export class PreTriagemService {
  static async getPerguntas() {
    const cache = await redisClient.get("perguntas_pretriagem");
    if (cache) return JSON.parse(cache);
    
    await redisClient.set("perguntas_pretriagem", JSON.stringify(PERGUNTAS), { EX: 3600 });
    return PERGUNTAS;
  }

  static async salvarRespostas(usuarioId, respostas) {
    if (!respostas || respostas.length === 0) {
      throw new Error("Respostas inválidas ou incompletas");
    }

    // Regras apenas para gerar avisos informativos (não reprovação)
    const regrasDeAviso = [
      {
        perguntaId: 2,
        respostaAviso: "não",
        mensagem: "O peso ideal para doar sangue é acima de 50 kg. Caso esteja abaixo, recomendamos aguardar até atingir esse valor para garantir sua segurança durante a doação.",
      },
      {
        perguntaId: 3,
        respostaAviso: "sim",
        mensagem: "Recomenda-se aguardar cerca de 12 meses após fazer uma tatuagem ou piercing em local não certificado pela ANVISA. Isso ajuda a garantir que a doação ocorra com total segurança.",
      },
      {
        perguntaId: 5,
        respostaAviso: "sim",
        mensagem: "Durante a gestação e amamentação, é melhor adiar a doação de sangue. Sua saúde vem em primeiro lugar — esperamos por você quando estiver pronta novamente!",
      },
    ];

    let avisos = [];

    for (const regra of regrasDeAviso) {
      const respostaUsuario = respostas[regra.perguntaId - 1];
      if (respostaUsuario && respostaUsuario.toLowerCase() === regra.respostaAviso.toLowerCase()) {
        avisos.push(regra.mensagem);
      }
    }

    // Nenhum usuário é reprovado
    const aprovado = true;

    const registroData = {
      usuario: { id: usuarioId },
      respostas,
      foi_preliminarmente_aprovado: aprovado,
      avisos,
    };

    const registro = await PreTriagemRepository.save(registroData);

    await UsuarioRepository.update(usuarioId, { esta_apto_para_doar: true });

    await redisClient.del(`usuario_${usuarioId}`);
    await redisClient.del("usuarios_all");

    return { registro, avisos };
  }

  static async verificarPreTriagem(usuarioId) {
    const cache = await redisClient.get(`usuario_${usuarioId}`);
    if (cache) return JSON.parse(cache).esta_apto_para_doar;

    const usuario = await UsuarioRepository.findById(usuarioId);
    return usuario?.esta_apto_para_doar || false;
  }

  static async historico(usuarioId) {
    return await PreTriagemRepository.findByUsuario(usuarioId);
  }
}