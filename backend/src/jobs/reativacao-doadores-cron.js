// src/jobs/reativacao-doadores-cron.js (MODIFICADO)
import cron from "node-cron";
import { UsuarioService } from "../modules/usuarios/usuario.service.js";
// 1. IMPORTE O SERVIÇO DE NOTIFICAÇÃO
import { NotificacoesService } from "../modules/notificacoes/notificacoes.service.js";

// Agenda a tarefa para rodar todos os dias às 4 da manhã
cron.schedule("0 4 * * *", async () => {
  console.log("⏰ [CRON] Executando tarefa: Reativação de Doadores.");
  try {
    // 2. PEGUE O RESULTADO COMPLETO
    const resultado = await UsuarioService.reativarDoadoresElegiveis();
    console.log(
      `[CRON] Tarefa de reativação concluída. Total: ${resultado.reativados} doadores.`
    );

    // 3. *** LÓGICA DE NOTIFICAÇÃO ADICIONADA ***
    if (resultado.usuarios && resultado.usuarios.length > 0) {
      console.log(
        `[CRON] Notificando ${resultado.usuarios.length} doadores reativados...`
      );

      const tokens = resultado.usuarios.map((u) => u.fcm_token);
      const titulo = "Você já pode doar novamente! 🎉";
      const corpo =
        "Seu período de inaptidão terminou. Sua doação é muito importante. Agende hoje mesmo!";

      // Envia a notificação para todos os usuários reativados
      await NotificacoesService.enviarNotificacoes(
        tokens,
        titulo,
        corpo,
        { navigateTo: "/(tabs)/doar" } // Data extra para navegação no app
      );
    }
  } catch (err) {
    console.error("❌ [CRON] Falha na tarefa de reativação:", err.message);
  }
});
