// Teste manual da API HEMOSE
const axios = require('axios');

const HEMOSE = axios.create({
  baseURL: "https://api.fsph.se.gov.br",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

async function testAPI() {
  console.log('🧪 Testando API HEMOSE...');
  
  try {
    // Teste 1: Listar cidades
    console.log('\n1. Testando listarCidades...');
    const cidades = await HEMOSE.get('/apiagendamento/cidades/S/N/N'); // Para doação de sangue
    console.log('Cidades:', cidades.data);
    
    // Teste 2: Listar locais (assumindo que Aracaju é id_cidade = 1)
    console.log('\n2. Testando listarLocais...');
    const locais = await HEMOSE.get('/apiagendamento/local/1/S/N/N');
    console.log('Locais:', locais.data);
    
    // Teste 3: Listar datas disponíveis (assumindo local id = 1)
    console.log('\n3. Testando listarTodosOsDias...');
    const datas = await HEMOSE.get('/apiagendamento/blocoagendamento/listarAllDate/1/S/N/N');
    console.log('Datas disponíveis:', datas.data);
    
    // Teste 4: Listar horários para uma data específica
    if (datas.data && datas.data.length > 0) {
      const primeiraData = datas.data[0];
      console.log(`\n4. Testando listarHorariosPorDia para ${primeiraData}...`);
      const horarios = await HEMOSE.get(`/apiagendamento/blocoagendamento/listarByDate/${primeiraData}/1/S/N/N`);
      console.log('Horários disponíveis:', horarios.data);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
    console.log('URL tentada:', error.config?.url);
  }
}

testAPI();