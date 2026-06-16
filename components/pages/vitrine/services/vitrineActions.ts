import { getNivelId, getStatusId } from "../types/vitrineUtils";
import { buscarConfiguracoesVitrine, criarVitrine } from "./vitrineService";



export async function carregarConfiguracoesModal() {
  const configuracoes =
    await buscarConfiguracoesVitrine();

  const nivelSistema =
    configuracoes.niveis.find((nivel) => {

      const id = getNivelId(nivel);

      const texto =
        `${nivel.nome || ""} ${nivel.codigo || ""}`
          .toLowerCase();

      return (
        id === 1 ||
        texto.includes("sistema")
      );
    });

  const statusAtivo =
    configuracoes.status.find((status) => {

      const id = getStatusId(status);

      const texto =
        `${status.nome || ""} ${status.codigo || ""}`
          .toLowerCase();

      return (
        id === 1 ||
        texto.includes("ativo")
      );
    });

  return {
    nivelSistema,
    statusLista: configuracoes.status,
    statusPadrao:
      statusAtivo
        ? getStatusId(statusAtivo)
        : 1,
  };
}

export async function salvarNovaVitrine(
  payload: any
) {
  return await criarVitrine(payload);
}