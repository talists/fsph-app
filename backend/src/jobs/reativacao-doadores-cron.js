// src/jobs/reativacao-doadores-cron.js
import cron from "node-cron";
import { UsuarioService } from "../modules/usuarios/usuario.service.js";

// Agenda a tarefa para rodar todos os dias às 4 da manhã
cron.schedule("0 4 * * *", async () => {
  console.log("⏰ Executando tarefa agendada: Reativação de Doadores.");
  try {
    const resultado = await UsuarioService.reativarDoadoresElegiveis();
    console.log(` Tarefa de reativação concluída. Total: ${resultado.reativados} doadores.`);
  } catch (err) {
    console.error("❌ Falha na tarefa de reativação de doadores:", err.message);
  }
});