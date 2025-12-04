/**
 * HEMOSE Service - Calls HEMOSE API directly from frontend
 * Used to fetch donation history and donor information
 */

import axios from 'axios';

const HEMOSE_API = axios.create({
    baseURL: 'https://api.fsph.se.gov.br/apiagendamento',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Get donor info directly from HEMOSE API
 */
export async function getHemoseDoadorInfo(cpf: string) {
    try {
        console.log('📡 [HEMOSE-DIRECT] Buscando info do doador para CPF:', cpf);
        const response = await HEMOSE_API.get(`/doador/getinfo/${cpf}`);
        console.log('✅ [HEMOSE-DIRECT] Info do doador recebida:', response.data);
        return response.data;
    } catch (error: any) {
        const status = error?.response?.status;
        console.error('❌ [HEMOSE-DIRECT] Erro ao buscar info do doador:', {
            cpf,
            status,
            message: error?.message,
        });
        // Tratar 400 como "CPF não encontrado" - retornar null em vez de lançar erro
        if (status === 400) {
            console.log(`ℹ️ [HEMOSE-DIRECT] CPF ${cpf} não encontrado (400). Retornando null.`);
            return null;
        }
        throw error;
    }
}

/**
 * Get appointments/donations from HEMOSE API
 */
export async function getHemoseAgendamentos(cpf: string) {
    try {
        console.log('📡 [HEMOSE-DIRECT] Buscando agendamentos para CPF:', cpf);
        const response = await HEMOSE_API.get(`/doador/agendamentos/${cpf}`);
        console.log('✅ [HEMOSE-DIRECT] Agendamentos recebidos:', response.data);
        return response.data;
    } catch (error: any) {
        const status = error?.response?.status;
        console.error('❌ [HEMOSE-DIRECT] Erro ao buscar agendamentos:', {
            cpf,
            status,
            message: error?.message,
        });
        // Tratar 400 como "sem agendamentos" - retornar array vazio em vez de lançar erro
        if (status === 400) {
            console.log(`ℹ️ [HEMOSE-DIRECT] Nenhum agendamento para CPF ${cpf} (400). Retornando [].`);
            return [];
        }
        throw error;
    }
}

/**
 * Get donation history (completed donations only)
 */
export async function getHemoseDonationHistory(cpf: string) {
    try {
        console.log('📡 [HEMOSE-DIRECT] Buscando histórico de doações para CPF:', cpf);

        // Get both doador info and agendamentos
        const [doadorInfo, agendamentos] = await Promise.all([
            getHemoseDoadorInfo(cpf),
            getHemoseAgendamentos(cpf),
        ]);

        // Filter only completed donations
        const completedDonations = Array.isArray(agendamentos)
            ? agendamentos.filter((ag: any) => {
                const status = (ag.status || ag.situacao || '').toLowerCase();
                return status.includes('realiz') || status.includes('concluí') || status.includes('completed');
            })
            : [];

        console.log('✅ [HEMOSE-DIRECT] Doações realizadas encontradas:', completedDonations.length);

        return {
            doadorInfo,
            donations: completedDonations,
        };
    } catch (error: any) {
        const status = error?.response?.status;
        console.error('❌ [HEMOSE-DIRECT] Erro ao buscar histórico de doações:', {
            status,
            message: error?.message,
        });
        // Se a chamada retornou 400, isso é normal (CPF não existe)
        // Retornar dados vazios em vez de lançar erro
        if (status === 400) {
            console.log(`ℹ️ [HEMOSE-DIRECT] CPF não encontrado na HEMOSE (400). Retornando dados vazios.`);
            return {
                doadorInfo: null,
                donations: [],
            };
        }
        throw error;
    }
}
