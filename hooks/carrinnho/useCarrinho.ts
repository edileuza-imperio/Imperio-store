"use client";

import { useEffect, useState } from "react";
import { carrinhoService } from "@/services/carrinho.service";

export interface ProdutoCarrinho {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  imagem?: string;
}

export function useCarrinho() {
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [produtos, setProdutos] = useState<ProdutoCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [desconto, setDesconto] = useState(0);

  // 🔹 carregar usuário
  useEffect(() => {
    carrinhoService.buscarUsuario()
      .then(usuario => setUsuarioId(usuario.id))
      .catch(() => setLoading(false));
  }, []);

  // 🔹 carregar carrinho
  useEffect(() => {
    if (!usuarioId) return;

    carrinhoService.buscarCarrinho(usuarioId)
      .then(itens => {
        setProdutos(itens.map((item: any) => ({
          id: item.produto_id,
          nome: item.nome,
          preco: item.preco_unitario,
          quantidade: item.quantidade,
          imagem: item.imagem
        })));
      })
      .finally(() => setLoading(false));
  }, [usuarioId]);

  // 🔹 ações
  const removerProduto = async (id: number) => {
    await carrinhoService.removerItem(id);
    setProdutos(p => p.filter(i => i.id !== id));
  };

  const alterarQuantidade = async (id: number, quantidade: number) => {
    if (quantidade < 1) return;
    await carrinhoService.atualizarQuantidade(id, quantidade);
    setProdutos(p =>
      p.map(i => i.id === id ? { ...i, quantidade } : i)
    );
  };

  // 🔹 cálculos
  const subtotal = produtos.reduce(
    (t, p) => t + p.preco * p.quantidade, 0
  );

  const frete = produtos.length ? 19.9 : 0;
  const total = subtotal + frete - desconto;

  // 🔹 cupom
  const aplicarCupom = (codigo: string) => {
    if (codigo === "DESC10") {
      setDesconto(subtotal * 0.1);
      return true;
    }
    return false;
  };

  return {
    produtos,
    loading,
    subtotal,
    frete,
    total,
    desconto,
    aplicarCupom,
    removerProduto,
    alterarQuantidade
  };
}
