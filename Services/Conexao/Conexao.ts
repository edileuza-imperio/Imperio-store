import axios from "axios";

const conexao = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  timeout: 15000,

  // Permite receber e enviar cookies de sessão.
  withCredentials: true,
});

export default conexao;
