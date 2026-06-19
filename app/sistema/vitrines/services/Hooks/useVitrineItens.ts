import { useMemo, useState } from "react";

import {
  adicionarItensNaVitrine,
  buscarCampanhas,
  buscarProdutos,
  Campanha,
  filtrarCampanhas,
  filtrarProdutos,
  Produto,
  TipoItem,
} from "../vitrineItemService";

type Params = {
  id?: string | string[];
  tipo: TipoItem;
  onSucesso?: () => void;
};

export function useVitrineItens({ id, tipo, onSucesso }: Params) {
  const vitrineId = Array.isArray(id) ? id[0] : id;

  const ehCampanha = tipo === "campanha";
  const ehProduto = tipo === "produto";

  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const campanhasFiltradas = useMemo(() => {
    return filtrarCampanhas(campanhas, busca);
  }, [campanhas, busca]);

  const produtosFiltrados = useMemo(() => {
    return filtrarProdutos(produtos, busca);
  }, [produtos, busca]);

  const totalEncontrados = ehCampanha
    ? campanhasFiltradas.length
    : produtosFiltrados.length;

  function limparSelecaoEBusca() {
    setSelecionadas([]);
    setBusca("");
  }

  async function carregarCampanhas() {
    try {
      setLoading(true);

      const lista = await buscarCampanhas();

      setCampanhas(lista);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }

  async function carregarProdutos() {
    try {
      setLoading(true);

      const lista = await buscarProdutos();

      console.log("LISTA FINAL DE PRODUTOS:", lista);

      setProdutos(lista);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  async function carregarItens() {
    limparSelecaoEBusca();

    if (ehCampanha) {
      await carregarCampanhas();
      return;
    }

    if (ehProduto) {
      await carregarProdutos();
      return;
    }

    setLoading(false);
  }

  async function atualizarLista() {
    limparSelecaoEBusca();

    if (ehCampanha) {
      await carregarCampanhas();
      return;
    }

    if (ehProduto) {
      await carregarProdutos();
      return;
    }

    setLoading(false);
  }

  function alternarSelecao(idItem: number) {
    if (!idItem) return;

    setSelecionadas((atual) => {
      if (atual.includes(idItem)) {
        return atual.filter((item) => item !== idItem);
      }

      return [...atual, idItem];
    });
  }

  async function salvarItens() {
    if (!vitrineId) return;

    if (selecionadas.length === 0) {
      alert(
        ehCampanha
          ? "Selecione pelo menos uma campanha."
          : "Selecione pelo menos um produto."
      );
      return;
    }

    try {
      setSalvando(true);

      await adicionarItensNaVitrine({
        vitrineId,
        selecionadas,
        tipo,
      });

      alert(
        ehCampanha
          ? "Campanhas adicionadas com sucesso."
          : "Produtos adicionados com sucesso."
      );

      onSucesso?.();
    } catch (error: any) {
      console.error("Erro ao adicionar itens:", error);

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        "Erro ao adicionar itens na vitrine.";

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return {
    vitrineId,
    ehCampanha,
    ehProduto,

    campanhasFiltradas,
    produtosFiltrados,
    totalEncontrados,

    selecionadas,
    busca,
    loading,
    salvando,

    setBusca,
    carregarItens,
    atualizarLista,
    alternarSelecao,
    salvarItens,
  };
}