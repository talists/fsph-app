// Este arquivo "aumenta" as definições de tipo do Axios
import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    isAuthRequired?: boolean;
  }
}
