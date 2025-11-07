// Teste rápido para verificar a estrutura da resposta da API HEMOSE
const axios = require('axios');

const HEMOSE = axios.create({
  baseURL: "https://api.fsph.se.gov.br",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

async function testQuick() {
  try {
    const response = await HEMOSE.get('/apiagendamento/blocoagendamento/listarByDate/2025-11-03/1/S/N/N');
    
    console.log('Estrutura da resposta:');
    console.log('response.data.status:', response.data.status);
    console.log('response.data.err:', response.data.err);
    console.log('response.data.data (primeiros 3 itens):');
    
    const horarios = response.data.data || [];
    const primeiros3 = horarios.slice(0, 3);
    
    primeiros3.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log('  id:', item.id);
      console.log('  min_hora:', item.min_hora);
      console.log('  max_hora:', item.max_hora);
      console.log('  vagas_restantes:', item.vagas_restantes);
      
      // Testar formatação
      const horarioFormatado = `${item.min_hora.slice(0,5)} - ${item.max_hora.slice(0,5)}`;
      console.log('  hora formatada:', horarioFormatado);
    });
    
    // Testar mapeamento completo
    console.log('\nMapeamento completo:');
    const horariosMappeados = horarios.slice(0,2).map((item) => ({
      id_bloco_doacao: item.id,
      hora: `${item.min_hora.slice(0,5)} - ${item.max_hora.slice(0,5)}`,
      vagas_restantes: item.vagas_restantes,
      qt_maxima: item.qt_maxima
    }));
    
    console.log(JSON.stringify(horariosMappeados, null, 2));
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testQuick();