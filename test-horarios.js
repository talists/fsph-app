// Teste horários para uma data específica
const axios = require('axios');

const HEMOSE = axios.create({
  baseURL: "https://api.fsph.se.gov.br",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

async function testHorarios() {
  console.log('🕐 Testando horários para hoje (2025-11-03)...');
  
  try {
    const dateString = '2025-11-03';
    console.log(`\n📅 Buscando horários para: ${dateString}`);
    
    const response = await HEMOSE.get(`/apiagendamento/blocoagendamento/listarByDate/${dateString}/1/S/N/N`);
    console.log('✅ Resposta completa:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data) {
      console.log('\n📋 Horários disponíveis:');
      response.data.data.forEach((horario, index) => {
        console.log(`${index + 1}. ID: ${horario.id_bloco_doacao} - Horário: ${horario.hora}`);
      });
    } else {
      console.log('⚠️ Nenhum horário encontrado na resposta');
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar horários:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
    console.log('URL tentada:', error.config?.url);
  }
}

testHorarios();