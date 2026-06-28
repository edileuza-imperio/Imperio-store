import axios, { AxiosInstance } from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.universoimperio.com.br/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Erro na requisição da API:", error);

    return Promise.reject(error);
  }
);

export default api;