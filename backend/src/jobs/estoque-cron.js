import cron from "node-cron";
import { BancoDeSangueService } from "../modules/bancodesangue/bancodesangue.service.js";

cron.schedule("*/30 * * * *", async () => { // a cada 30 min
  console.log("⏳ Atualizando estoque de sangue...");
  try {
    await BancoDeSangueService.fetchFromAPI();
    console.log("✅ Estoque atualizado com sucesso");
  } catch (err) {
    console.error("❌ Falha ao atualizar estoque:", err.message);
  }
});
