"use client";

import api from "@/Api/conectar";
import { useRouter } from "next/navigation";
import {
  FiPackage,
  FiEdit,
  FiImage,
  FiTrash2,
  FiStar,
  FiEye,
  FiEyeOff,
  FiBox,
} from "react-icons/fi";

type Produto = {
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

type Props = {
  produtos: Produto[];
  loading?: boolean;
  onDelete?: (produto: Produto) => void;
};

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";
  const base = api.defaults.baseURL || "";
  if (caminho.startsWith("http")) return caminho;
  return `${base.replace(/\/$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
}

function formatMoney(value: number | string | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosCards({
  produtos,
  loading = false,
  onDelete,
}: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="cardsWrapper">
        <div className="loadingBox">
          <div className="loadingIcon">
            <FiPackage size={34} />
          </div>
          <p>Carregando produtos...</p>
        </div>

        <style jsx>{`
          .cardsWrapper {
            width: 100%;
          }

          .loadingBox {
            min-height: 320px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            color: #6b7280;
            background: #ffffff;
            border: 1px solid #ece7f5;
            border-radius: 24px;
            padding: 24px;
          }

          .loadingIcon {
            width: 72px;
            height: 72px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f3ecff;
            color: #7c3aed;
          }

          .loadingBox p {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
          }
        `}</style>
      </div>
    );
  }

  if (!produtos.length) {
    return (
      <div className="cardsWrapper">
        <div className="emptyBox">
          <div className="emptyIcon">
            <FiPackage size={40} />
          </div>
          <h3>Nenhum produto encontrado</h3>
          <p>Ainda não há produtos cadastrados no catálogo.</p>
        </div>

        <style jsx>{`
          .cardsWrapper {
            width: 100%;
          }

          .emptyBox {
            min-height: 360px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            text-align: center;
            background: #ffffff;
            border: 1px solid #ece7f5;
            border-radius: 24px;
            padding: 24px;
          }

          .emptyIcon {
            width: 84px;
            height: 84px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f3ecff;
            color: #7c3aed;
          }

          .emptyBox h3 {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
            color: #111827;
          }

          .emptyBox p {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cardsWrapper">
      <div className="grid">
        {produtos.map((produto) => {
          const precoNormal = Number(produto.preco || 0);
          const precoPromocional = Number(produto.preco_promocional || 0);
          const temPromocao =
            precoPromocional > 0 && precoPromocional < precoNormal;
          const precoFinal = temPromocao ? precoPromocional : precoNormal;

          const estoque =
            Number(produto.ilimitado ?? 0) === 1
              ? "∞"
              : Number(produto.estoque ?? 0);

          const visivel = Number(produto.catalogo ?? 0) === 1;

          return (
            <article key={produto.id_produto} className="card">
              <div className="imageArea">
                {produto.imagem ? (
                  <img
                    src={getImagemUrl(produto.imagem)}
                    alt={produto.nome}
                    className="image"
                  />
                ) : (
                  <div className="imagePlaceholder">
                    <FiBox size={28} />
                    <span>Sem imagem</span>
                  </div>
                )}

                <div className="topBadges">
                  <span className={`miniBadge ${visivel ? "visible" : "hidden"}`}>
                    {visivel ? (
                      <>
                        <FiEye size={13} />
                        Visível
                      </>
                    ) : (
                      <>
                        <FiEyeOff size={13} />
                        Oculto
                      </>
                    )}
                  </span>

                  {produto.destaque ? (
                    <span className="miniBadge featured">
                      <FiStar size={13} />
                      Destaque
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="body">
                <div className="header">
                  <span className="categoria">
                    {produto.categoria_nome || "Sem categoria"}
                  </span>

                  <h3 className="nome">{produto.nome}</h3>

                  <p className="meta">
                    ID #{produto.id_produto}
                    {produto.sku ? ` • SKU: ${produto.sku}` : ""}
                  </p>
                </div>

                <div className="precoArea">
                  {temPromocao ? (
                    <>
                      <span className="precoAntigo">
                        {formatMoney(precoNormal)}
                      </span>
                      <strong className="precoAtual promo">
                        {formatMoney(precoFinal)}
                      </strong>
                    </>
                  ) : (
                    <strong className="precoAtual">
                      {formatMoney(precoFinal)}
                    </strong>
                  )}
                </div>

                <div className="infoBadges">
                  <span className="infoBadge stock">Estoque: {estoque}</span>
                  <span className={`infoBadge ${visivel ? "ok" : "off"}`}>
                    {visivel ? "No catálogo" : "Fora do catálogo"}
                  </span>
                </div>

                <div className="actions">
                  <button
                    type="button"
                    className="actionBtn edit"
                    onClick={() =>
                      router.push(`/painel/produtos/${produto.id_produto}/editar`)
                    }
                  >
                    <FiEdit size={16} />
                    Editar
                  </button>

                  <button
                    type="button"
                    className="actionBtn images"
                    onClick={() =>
                      router.push(
                        `/painel/produtos/${produto.id_produto}/editar?aba=imagens`
                      )
                    }
                  >
                    <FiImage size={16} />
                    Imagens
                  </button>

                  <button
                    type="button"
                    className="actionBtn delete"
                    onClick={() => onDelete?.(produto)}
                  >
                    <FiTrash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <style jsx>{`
        .cardsWrapper {
          width: 100%;
          max-width: 100%;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 22px;
          width: 100%;
          align-items: start;
        }

        .card {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          background: #ffffff;
          border: 1px solid #eee7f7;
          box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(17, 24, 39, 0.1);
          border-color: #dccff3;
        }

        .imageArea {
          position: relative;
          width: 100%;
          height: 240px;
          background: linear-gradient(180deg, #fcfbff 0%, #f5f1fb 100%);
        }

        .image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .imagePlaceholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
          background: linear-gradient(180deg, #faf7ff 0%, #f3ecff 100%);
          font-size: 14px;
          font-weight: 600;
        }

        .topBadges {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .miniBadge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }

        .miniBadge.visible {
          color: #166534;
          background: rgba(220, 252, 231, 0.96);
        }

        .miniBadge.hidden {
          color: #991b1b;
          background: rgba(254, 226, 226, 0.96);
        }

        .miniBadge.featured {
          color: #92400e;
          background: rgba(254, 243, 199, 0.96);
        }

        .body {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .categoria {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          max-width: 100%;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f3ecff;
          color: #6d28d9;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .nome {
          margin: 0;
          font-size: 18px;
          line-height: 1.4;
          font-weight: 800;
          color: #111827;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 50px;
          word-break: break-word;
        }

        .meta {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
          word-break: break-word;
        }

        .precoArea {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .precoAntigo {
          font-size: 14px;
          color: #9ca3af;
          text-decoration: line-through;
          font-weight: 600;
        }

        .precoAtual {
          font-size: 26px;
          font-weight: 900;
          color: #111827;
          line-height: 1.1;
        }

        .precoAtual.promo {
          color: #7c3aed;
        }

        .infoBadges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .infoBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          background: #f3f4f6;
          color: #374151;
        }

        .infoBadge.stock {
          background: #eef2ff;
          color: #4338ca;
        }

        .infoBadge.ok {
          background: #dcfce7;
          color: #166534;
        }

        .infoBadge.off {
          background: #fee2e2;
          color: #991b1b;
        }

        .actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 4px;
        }

        .actionBtn {
          border: 0;
          outline: 0;
          min-height: 42px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          transition:
            transform 0.18s ease,
            opacity 0.18s ease;
          white-space: nowrap;
        }

        .actionBtn:hover {
          transform: translateY(-1px);
        }

        .actionBtn.edit {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .actionBtn.images {
          background: #f5f3ff;
          color: #6d28d9;
        }

        .actionBtn.delete {
          background: #fef2f2;
          color: #dc2626;
        }

        .actionBtn:active {
          transform: scale(0.98);
        }

        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .imageArea {
            height: 220px;
          }

          .actions {
            grid-template-columns: 1fr;
          }

          .precoAtual {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}