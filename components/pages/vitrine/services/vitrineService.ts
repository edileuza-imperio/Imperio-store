import api from "@/Api/conectar";
import { ConfiguracoesVitrine, PayloadCadastrarVitrine } from "../types/vitrineTypes";



export async function buscarConfiguracoesVitrine():
Promise<ConfiguracoesVitrine> {

  const response =
    await api.get("/configuracoes");

  const data = response.data;

  return {
    niveis: data?.niveis || [],
    status: data?.status || [],
  };
}

export async function criarVitrine(
  payload: PayloadCadastrarVitrine
) {
  const response =
    await api.post("/vitrine", payload);

  return response.data;
}