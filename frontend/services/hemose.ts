import axios from "axios";

const HEMOSE = axios.create({
  baseURL: "https://api.fsph.se.gov.br",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export type TipoAgendamento = "D" | "M" | "C"; // D: individual, M: medula, C: campanha

export function tipoToPerm(tipo: TipoAgendamento) {
  return {
    perm_individual: tipo === "D" ? "S" : "N",
    perm_medula:     tipo === "M" ? "S" : "N",
    perm_campanha:   tipo === "C" ? "S" : "N",
  };
}

// Doadores
export async function getDoadorInfoByCPF(cpf: string) {
  const { data } = await HEMOSE.get(`/apiagendamento/doador/getinfo/${cpf}`);
  return data;
}
export async function getAgendamentosByCPF(cpf: string) {
  const { data } = await HEMOSE.get(`/apiagendamento/doador/agendamentos/${cpf}`);
  return data;
}

// Fluxo de agendamento
export async function listarCidades(tipo: TipoAgendamento) {
  const { perm_individual, perm_medula, perm_campanha } = tipoToPerm(tipo);
  const { data } = await HEMOSE.get(
    `/apiagendamento/cidades/${perm_individual}/${perm_medula}/${perm_campanha}`
  );
  return data as Array<{ id_cidade: number; nome: string }>;
}
export async function listarLocais(id_cidade: number, tipo: TipoAgendamento) {
  const { perm_individual, perm_medula, perm_campanha } = tipoToPerm(tipo);
  const { data } = await HEMOSE.get(
    `/apiagendamento/local/${id_cidade}/${perm_individual}/${perm_medula}/${perm_campanha}`
  );
  return data as Array<{ id_local: number; nome: string; endereco?: string }>;
}
export async function listarTodosOsDias(id_local: number, tipo: TipoAgendamento) {
  const { perm_individual, perm_medula, perm_campanha } = tipoToPerm(tipo);
  const { data } = await HEMOSE.get(
    `/apiagendamento/blocoagendamento/listarAllDate/${id_local}/${perm_individual}/${perm_medula}/${perm_campanha}`
  );
  return data as string[]; // 'YYYY-MM-DD'
}
export async function listarHorariosPorDia(dateSelected: string, id_local: number, tipo: TipoAgendamento) {
  const { perm_individual, perm_medula, perm_campanha } = tipoToPerm(tipo);
  const { data } = await HEMOSE.get(
    `/apiagendamento/blocoagendamento/listarByDate/${dateSelected}/${id_local}/${perm_individual}/${perm_medula}/${perm_campanha}`
  );
  return data as Array<{ id_bloco_doacao: number; hora: string }>;
}

// Marcar agendamento
export type AgendarPayload = {
  doador_nome: string;
  doador_dt_nascimento: string; // dd/mm/aaaa
  doador_email: string;
  doador_cpf: string;
  doador_telefone: string;
  doador_sexo: "M" | "F";
  tipo: TipoAgendamento; // D ou M (campanha usa outro endpoint)
  id_bloco_doacao: number;
  caminho_autorizacao?: string;
};
export async function marcarAgendamento(body: AgendarPayload) {
  const form = new FormData();
  (Object.entries(body) as [string, any][]).forEach(([k, v]) =>
    form.append(k, String(v))
  );
  const { data } = await HEMOSE.post(
    "/apiagendamento/agendamento/marcar",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data; // protocolo/ok
}
