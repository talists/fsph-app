// backend/src/jobs/estoque-cron.js (CORRIGIDO)
import cron from "node-cron";
import { BancoDeSangueService } from "../modules/bancodesangue/bancodesangue.service.js";
import { NotificacoesService } from "../modules/notificacoes/notificacoes.service.js";
import { UsuarioRepository } from "../modules/usuarios/repositories/usuario.repository.js";

cron.schedule("*/30 * * * *", async () => {
  console.log("⏳ [CRON] Iniciando atualização de estoque...");
  try {
    // 1. BUSCA E ATUALIZA O ESTOQUE (ORDEM CORRETA)
    const niveisEstoque = await BancoDeSangueService.fetchFromAPI();

    console.log("✅ [CRON] Estoque atualizado com sucesso");

    // 2. *** LÓGICA DE NOTIFICAÇÃO ***
    const gruposCriticos = niveisEstoque.filter(
      (n) => n.situacao === "CRITICO" || n.situacao === "BAIXO"
    );

    if (gruposCriticos.length > 0) {
      console.log(
        `[CRON] 🚨 ALERTA: ${gruposCriticos.length} grupos em nível crítico.`
      );

      for (const grupo of gruposCriticos) {
        const tipoSanguineo = `${grupo.grupoabo}${
          grupo.fatorrh === "P" ? "+" : "-"
        }`;

        // Busca doadores compatíveis com token FCM
        const usuarios =
          await UsuarioRepository.findByTiposSanguineosComFcmToken([
            tipoSanguineo,
          ]);

        if (usuarios.length > 0) {
          console.log(
            `[CRON] Notificando ${usuarios.length} doadores do tipo ${tipoSanguineo}...`
          );
          await NotificacoesService.alertarDoadoresPorTipo(usuarios, grupo);
        }
      }
    } else {
      console.log("[CRON] Níveis de estoque estáveis.");
    }
  } catch (err) {
    console.error("❌ [CRON] Falha na tarefa de estoque:", err.message);
  }
});
