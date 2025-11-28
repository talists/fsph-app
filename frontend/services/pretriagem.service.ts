import { apiService } from "./api";
import { isAxiosError } from "axios";

export interface PreTriagem {
  id: number;
  respostas: any; //  um objeto ou array de respostas
  foi_preliminarmente_aprovado: boolean;
  criado_em: string;
  usuario?: any; // relacional, pode ser um objeto Usuario
}

class PreTriagemService {
  // Retorna o conjunto de perguntas que o backend expõe
  async listarPerguntas(): Promise<any[]> {
    try {
      const resp = await apiService.get<any[]>('/pretriagem/perguntas');
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || 'Erro ao buscar perguntas de pré-triagem');
      }
      throw err;
    }
  }

  // Envia as respostas do usuário para o backend
  async salvarRespostas(respostas: any): Promise<PreTriagem> {
    try {
      const resp = await apiService.post<PreTriagem>('/pretriagem/respostas', { respostas });
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || 'Erro ao salvar respostas de pré-triagem');
      }
      throw err;
    }
  }

  // Recupera o histórico de respostas do usuário autenticado
  async historico(): Promise<PreTriagem[]> {
    try {
      const resp = await apiService.get<PreTriagem[]>('/pretriagem/historico');
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || 'Erro ao buscar histórico de pré-triagem');
      }
      throw err;
    }
  }

  // Métodos herdados / admin (mantidos caso o backend ofereça rotas adicionais)
  async listarPreTriagens(): Promise<PreTriagem[]> {
    try {
      const resp = await apiService.get<PreTriagem[]>('/pretriagem');
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || 'Erro ao listar pré-triagens');
      }
      throw err;
    }
  }

  async obterPreTriagem(id: number): Promise<PreTriagem> {
    try {
      const resp = await apiService.get<PreTriagem>(`/pretriagem/${id}`);
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || 'Erro ao obter pré-triagem');
      }
      throw err;
    }
  }
}

export const pretriagemService = new PreTriagemService();