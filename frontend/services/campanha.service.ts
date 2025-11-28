import { apiService } from "./api";
import { isAxiosError } from "axios";

export interface Campanha {
  id: number;
  nome: string;
  descricao?: string;
  local_campanha?: string;
  data_inicio: string;
  data_fim: string;
  criado_em: string;
  organizador?: any; // relacional, pode ser um objeto Usuario
}

class CampanhaService {
  async listarCampanhas(): Promise<Campanha[]> {
    try {
      const resp = await apiService.get<Campanha[]>("/campanhas");
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || "Erro ao listar campanhas");
      }
      throw err;
    }
  }

  async obterCampanha(id: number): Promise<Campanha> {
    try {
      const resp = await apiService.get<Campanha>(`/campanhas/${id}`);
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || "Erro ao obter campanha");
      }
      throw err;
    }
  }

  async minhasCampanhas(): Promise<Campanha[]> {
    try {
      const resp = await apiService.get<Campanha[]>('/campanhas/minhas-campanhas');
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || 'Erro ao listar minhas campanhas');
      }
      throw err;
    }
  }

  async criarCampanha(data: Partial<Campanha>): Promise<Campanha> {
    try {
      const resp = await apiService.post<Campanha>('/campanhas', data);
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || 'Erro ao criar campanha');
      }
      throw err;
    }
  }

  async atualizarCampanha(id: number, data: Partial<Campanha>): Promise<Campanha> {
    try {
      const resp = await apiService.patch<Campanha>(`/campanhas/${id}`, data);
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || 'Erro ao atualizar campanha');
      }
      throw err;
    }
  }

  async removerCampanha(id: number): Promise<void> {
    try {
      await apiService.delete(`/campanhas/${id}`);
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        throw new Error(err.response.data?.msg || 'Erro ao remover campanha');
      }
      throw err;
    }
  }
}

export const campanhaService = new CampanhaService();