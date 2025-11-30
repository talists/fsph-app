// services/hemose.ts
import { apiService } from "./api";

export type TipoAgendamento = "D" | "M" | "C";

// Helper para converter tipo em flags S/N
export function tipoToPerm(tipo: TipoAgendamento) {
  return {
    perm_individual: tipo === "D" ? "S" : "N",
    perm_medula: tipo === "M" ? "S" : "N",
    perm_campanha: tipo === "C" ? "S" : "N",
  };
}

// --- Doadores (Via Backend) ---
export async function getDoadorInfoByCPF(cpf: string) {
  // Chama: SEU_BACKEND/api/agendamentos/apiagendamento/doador/getinfo/:cpf
  const { data } = await apiService.get(
    `/agendamentos/apiagendamento/doador/getinfo/${cpf}`
  );
  return data;
}

export async function getAgendamentosByCPF(cpf: string) {
  const { data } = await apiService.get(
    `/agendamentos/apiagendamento/doador/agendamentos/${cpf}`
  );
  return data;
}

// Alias para compatibilidade
export const getAgendamentosDoador = getAgendamentosByCPF;

// Cancelar agendamento
export async function desmarcarAgendamento(protocolo: string) {
  const { data } = await apiService.delete(
    `/agendamentos/apiagendamento/agendamento/desmarcar/${protocolo}`
  );
  return data;
}

// --- Fluxo de Agendamento (Via Backend) ---
export async function listarCidades(tipo: TipoAgendamento) {
  const { perm_individual, perm_medula, perm_campanha } = tipoToPerm(tipo);
  const { data } = await apiService.get(
    `/agendamentos/apiagendamento/cidades/${perm_individual}/${perm_medula}/${perm_campanha}`
  );
  return data; // O backend já retorna o array correto
}

export async function listarLocais(id_cidade: number, tipo: TipoAgendamento) {
  const { perm_individual, perm_medula, perm_campanha } = tipoToPerm(tipo);
  const { data } = await apiService.get(
    `/agendamentos/apiagendamento/local/${id_cidade}/${perm_individual}/${perm_medula}/${perm_campanha}`
  );
  return data;
}

export async function listarTodosOsDias(
  id_local: number,
  tipo: TipoAgendamento
) {
  const { perm_individual, perm_medula, perm_campanha } = tipoToPerm(tipo);
  const { data } = await apiService.get(
    `/agendamentos/apiagendamento/blocoagendamento/listarAllDate/${id_local}/${perm_individual}/${perm_medula}/${perm_campanha}`
  );
  return data;
}

export async function listarHorariosPorDia(
  dateSelected: string,
  id_local: number,
  tipo: TipoAgendamento
) {
  const { perm_individual, perm_medula, perm_campanha } = tipoToPerm(tipo);
  // O backend deve retornar a lista de blocos.
  // Se o backend retornar { data: [...] }, o apiService.get retorna isso em response.data.
  const response = await apiService.get(
    `/agendamentos/apiagendamento/blocoagendamento/listarByDate/${dateSelected}/${id_local}/${perm_individual}/${perm_medula}/${perm_campanha}`
  );

  const apiData = response.data;
  // Tratamento para garantir que pegamos o array de horários
  const horarios = Array.isArray(apiData) ? apiData : apiData.data || [];

  return horarios.map((item: any) => ({
    id_bloco_doacao: item.id || item.id_bloco_doacao,
    hora:
      item.hora ||
      `${item.min_hora?.slice(0, 5)} - ${item.max_hora?.slice(0, 5)}`,
    vagas_restantes: item.vagas_restantes,
    qt_maxima: item.qt_maxima,
    min_hora: item.min_hora,
    max_hora: item.max_hora,
  }));
}

// --- Marcar Agendamento (Via Backend - Upload/FormData) ---
export type AgendarPayload = {
  doador_nome: string;
  doador_dt_nascimento: string;
  doador_email: string;
  doador_cpf: string;
  doador_telefone: string;
  doador_sexo: "M" | "F";
  tipo: TipoAgendamento;
  id_bloco_doacao: number;
  caminho_autorizacao?: string; // O arquivo seria passado aqui, mas o frontend geralmente envia o objeto File/Blob separado
};

export async function marcarAgendamento(body: AgendarPayload) {
  // O backend espera Multipart Form Data por causa do upload.single
  const form = new FormData();

  // Adiciona os campos de texto
  Object.entries(body).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      form.append(k, String(v));
    }
  });

  // NOTA: Se houver upload de arquivo real, ele deve vir no body como um objeto { uri, name, type }
  // e ser appendado como 'caminho_autorizacao'.

  const { data } = await apiService.post(
    "/agendamentos/apiagendamento/agendamento/marcar",
    form
    // O Axios/Browser define o Content-Type multipart automaticamente quando vê FormData
  );
  return data;
}
