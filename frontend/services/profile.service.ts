import { apiService } from "./api";
import { isAxiosError } from "axios";
import type { User } from "./auth.service";

class ProfileService {
  async getMeuPerfil(): Promise<User> {
    try {
      const resp = await apiService.get<User>("/usuarios/meu-perfil");
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        const data = err.response.data as { msg?: string };
        throw new Error(data?.msg || "Erro ao buscar perfil");
      }
      throw err;
    }
  }

  async updateMeuPerfil(payload: Partial<User>): Promise<User> {
    try {
      const resp = await apiService.patch<User>("/usuarios/meu-perfil", payload);
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        const data = err.response.data as { msg?: string };
        throw new Error(data?.msg || "Erro ao atualizar perfil");
      }
      throw err;
    }
  }

  async uploadFotoPerfil(file: { uri: string; name?: string; type?: string }): Promise<User> {
    try {
      const form = new FormData();
      form.append("file", {
        uri: file.uri,
        name: file.name || "avatar.jpg",
        type: file.type || "image/jpeg",
      } as any);

      const resp = await apiService.post<User>(
        "/usuarios/meu-perfil/foto",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return resp.data;
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        const data = err.response.data as { msg?: string };
        throw new Error(data?.msg || "Erro ao enviar foto");
      }
      throw err;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiService.post("/usuarios/change-password", {
        currentPassword,
        newPassword,
      });
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        const data = err.response.data as { msg?: string };
        throw new Error(data?.msg || "Erro ao alterar senha");
      }
      throw err;
    }
  }

  async updateFcmToken(fcmToken: string): Promise<void> {
    try {
      await apiService.patch("/usuarios/fcm-token", { fcm_token: fcmToken });
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        const data = err.response.data as { msg?: string };
        throw new Error(data?.msg || "Erro ao atualizar token de notificação");
      }
      throw err;
    }
  }
}

export const profileService = new ProfileService();
export type { User };