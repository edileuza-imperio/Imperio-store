
import conectar from "@/Api/conectar";
import { AxiosRequestConfig, AxiosResponse } from "axios";

type Body = Record<string, unknown> | FormData | string | number | boolean | null;

// 🔧 Função base para criar módulos
function criarModulo(prefixo: string) {
  return {
    get<T = unknown>(rota: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return conectar.get<T>(`${prefixo}${rota}`, config);
    },

    post<T = unknown>(rota: string, data?: Body, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return conectar.post<T>(`${prefixo}${rota}`, data, config);
    },

    put<T = unknown>(rota: string, data?: Body, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return conectar.put<T>(`${prefixo}${rota}`, data, config);
    },

    delete<T = unknown>(rota: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return conectar.delete<T>(`${prefixo}${rota}`, config);
    },

    patch<T = unknown>(rota: string, data?: Body, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      return conectar.patch<T>(`${prefixo}${rota}`, data, config);
    },
  };
}

// 🚀 APIs separadas
export const PainelApi = criarModulo("/painel");
export const InicioApi = criarModulo("");

// 👉 se quiser export default também
export default {
  PainelApi,
  InicioApi,
};