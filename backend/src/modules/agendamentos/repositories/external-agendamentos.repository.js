// src/modules/agendamento/external-repository.js
import axios from "axios";
const API_BASE = "https://api.fsph.se.gov.br/apiagendamento";

export const ExternalAgendamentoRepository = {
  getInfoDoador: async (cpf) => (await axios.get(`${API_BASE}/doador/getinfo/${cpf}`)).data,
  getAgendamentosDoador: async (cpf) => (await axios.get(`${API_BASE}/doador/agendamentos/${cpf}`)).data,
  marcarAgendamento: async (formData, headers) => (await axios.post(`${API_BASE}/agendamento/marcar`, formData, { headers })).data,
  editarAgendamento: async (dados) => (await axios.patch(`${API_BASE}/agendamento/editar`, dados)).data,
  desmarcarAgendamento: async (protocolo) => (await axios.delete(`${API_BASE}/agendamento/desmarcar/${protocolo}`)).data,
  listarCidades: async (perm_individual, perm_medula, perm_campanha) =>
    (await axios.get(`${API_BASE}/cidades/${perm_individual}/${perm_medula}/${perm_campanha}`)).data,
  listarLocais: async (id_cidade, perm_individual, perm_medula, perm_campanha) =>
    (await axios.get(`${API_BASE}/local/${id_cidade}/${perm_individual}/${perm_medula}/${perm_campanha}`)).data,
  listarBlocosByLocal: async (id_local, perm_individual, perm_medula, perm_campanha) =>
    (await axios.get(`${API_BASE}/blocoagendamento/listarAllDate/${id_local}/${perm_individual}/${perm_medula}/${perm_campanha}`)).data,
  listarBlocosByDate: async (dateSelected, id_local, perm_individual, perm_medula, perm_campanha) =>
    (await axios.get(`${API_BASE}/blocoagendamento/listarByDate/${dateSelected}/${id_local}/${perm_individual}/${perm_medula}/${perm_campanha}`)).data,
};
