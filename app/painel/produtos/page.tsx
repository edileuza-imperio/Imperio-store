"use client";

import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import api from "@/Api/conectar";
import ProdutosCards from "@/components/Painel/produtos/ProdutosCards";
import ModalCadastrarProduto from "@/components/Painel/produtos/ModalCadastrarProduto";

export type Produto = {
  id_produto: number;
  nome: string;
  slug?: string;
  descricao?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  estoque?: number;
  ilimitado?: number;
  imagem?: string;
  categoria_id?: number | null;
  categoria_nome?: string | null;
  statusid?: number | null;
  status_nome?: string | null;
  catalogo?: number;
  destaque?: number | null;
  sku?: string;
  modelo?: string;
};

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.produtos != null) return payload.produtos as T;
  return payload as T;
}

export default function ProdutosPainelPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  async function carregarProdutos() {
    try {
      setLoading(true);

      const response = await api.get("/admin/produtos", {
        withCredentials: true,
      });

      const listaProdutos = resolveApi<Produto[]>(response.data) || [];
      setProdutos(Array.isArray(listaProdutos) ? listaProdutos : []);
    } catch (error) {
      console.error(error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  async function excluirProduto(produto: Produto) {
    const ok = window.confirm(`Deseja excluir o produto "${produto.nome}"?`);
    if (!ok) return;

    try {
      await api.delete(`/admin/produto/${produto.id_produto}/remover`, {
        withCredentials: true,
      });

      await carregarProdutos();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Erro ao excluir produto."
      );
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  return (
    <>
      <div className="pageWrap">
        <div className="pageHeader">
          <div>
            <h1 className="pageTitle">Produtos</h1>
            <p className="pageSubtitle">
              Gerencie os itens cadastrados no catálogo da loja
            </p>
          </div>

          <button
            type="button"
            className="newBtn"
            onClick={() => setOpenModal(true)}
          >
            <FiPlus size={18} />
            Novo produto
          </button>
        </div>

        <ProdutosCards
          produtos={produtos}
          loading={loading}
          onDelete={excluirProduto}
        />
      </div>

      <ModalCadastrarProduto
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={carregarProdutos}
      />

      <style jsx>{`
        .pageWrap {
          padding: 24px;
          width: 100%;
          max-width: 100%;
        }

        .pageHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .pageTitle {
          margin: 0;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 900;
          color: #111827;
        }

        .pageSubtitle {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .newBtn {
          border: 0;
          outline: 0;
          min-height: 48px;
          padding: 0 18px;
          border-radius: 16px;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 12px 24px rgba(124, 58, 237, 0.25);
          transition: 0.2s ease;
        }

        .newBtn:hover {
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .pageWrap {
            padding: 16px;
          }

          .pageHeader {
            align-items: stretch;
          }

          .newBtn {
            width: 100%;
          }

          .pageTitle {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}