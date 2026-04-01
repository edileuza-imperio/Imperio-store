"use client";

import React from "react";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import api from "@/Api/conectar";
import "bootstrap/dist/css/bootstrap.min.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatBRL } from "@/components/Bibioteca/functions";
import {
  FiShoppingCart,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiShield,
  FiTruck,
  FiCreditCard,
} from "react-icons/fi";

type CarrinhoItem = {
  id_item: number;
  id_produto?: number;
  nome_produto: string;
  preco_unitario: number | string;
  preco_promocional_unitario?: number | string | null;
  quantidade: number;
  subtotal?: number | string;
  imagem?: string;
};

function num(v: any): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const raw = String(v ?? "").trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d,.-]/g, "");

  let normalized = cleaned;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function pickCarrinho(resp: any): any[] {
  const base = resp?.dados ?? resp?.data ?? resp;

  if (Array.isArray(base)) return base;
  if (Array.isArray(base?.itens)) return base.itens;

  return [];
}

function normalizarItens(lista: any[]): CarrinhoItem[] {
  return lista.map((item) => {
    const precoPromo =
      item?.preco_promocional_unitario !== undefined &&
      item?.preco_promocional_unitario !== null &&
      item?.preco_promocional_unitario !== ""
        ? item.preco_promocional_unitario
        : null;

    return {
      id_item: Number(item?.id_item ?? item?.id_carrinho_item ?? item?.id ?? 0),
      id_produto:
        Number(item?.produto_id ?? item?.id_produto ?? 0) || undefined,
      nome_produto: String(
        item?.nome_produto ??
          item?.nome ??
          item?.titulo ??
          item?.produto_nome ??
          "Produto"
      ).trim(),
      preco_unitario: item?.preco_unitario ?? 0,
      preco_promocional_unitario: precoPromo,
      quantidade: Number(item?.quantidade ?? 1),
      subtotal: item?.subtotal ?? null,
      imagem:
        item?.imagem ??
        item?.miniatura ??
        item?.imagem_produto ??
        item?.foto ??
        item?.produto_imagem ??
        item?.produto_miniatura ??
        "",
    };
  });
}

function imagemUrl(path?: string) {
  if (!path) return "/placeholder.png";
  if (/^https?:\/\//i.test(path)) return path;

  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  const clean = String(path).replace(/^\/+/, "");

  if (!clean) return "/placeholder.png";

  if (clean.startsWith("upload/")) return `${base}/${clean}`;

  return `${base}/upload/${clean}`;
}

function precoFinalItem(item: CarrinhoItem) {
  const promo = num(item.preco_promocional_unitario);
  if (promo > 0) return promo;
  return num(item.preco_unitario);
}

export default function CarrinhoPage() {
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [itens, setItens] = React.useState<CarrinhoItem[]>([]);
  const [acaoItemId, setAcaoItemId] = React.useState<number | null>(null);

  const subtotal = React.useMemo(() => {
    return itens.reduce((acc, item) => {
      return acc + precoFinalItem(item) * (item.quantidade || 1);
    }, 0);
  }, [itens]);

  const totalItens = React.useMemo(() => {
    return itens.reduce((acc, item) => acc + item.quantidade, 0);
  }, [itens]);

  async function carregarCarrinho() {
    setLoading(true);
    setErro(null);

    try {
      const resp = await api.get("/carrinho/itens", {
        withCredentials: true,
      });

      const listaBruta = pickCarrinho(resp.data);
      const listaNormalizada = normalizarItens(listaBruta);

      setItens(listaNormalizada);
    } catch (e: any) {
      setErro(e?.response?.data?.mensagem || "Erro ao carregar carrinho.");
      setItens([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    carregarCarrinho();
  }, []);

  async function alterarQuantidade(item: CarrinhoItem, qtd: number) {
    if (qtd < 1) return;

    try {
      setAcaoItemId(item.id_item);

      await api.put(
        `/carrinho/item/${item.id_item}`,
        {
          quantidade: qtd,
          preco: num(item.preco_unitario),
          preco_promocional:
            item.preco_promocional_unitario !== null &&
            item.preco_promocional_unitario !== undefined &&
            item.preco_promocional_unitario !== ""
              ? num(item.preco_promocional_unitario)
              : null,
        },
        {
          withCredentials: true,
        }
      );

      await carregarCarrinho();
      toast.success("Quantidade atualizada.");
    } catch {
      toast.error("Erro ao atualizar quantidade.");
    } finally {
      setAcaoItemId(null);
    }
  }

  async function removerItem(id: number) {
    try {
      setAcaoItemId(id);

      await api.delete(`/carrinho/item/${id}`, {
        withCredentials: true,
      });

      await carregarCarrinho();
      toast.success("Item removido do carrinho.");
    } catch {
      toast.error("Erro ao remover item.");
    } finally {
      setAcaoItemId(null);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="spinner-border text-warning" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" autoClose={2500} theme="dark" />

      <style jsx global>{`
        body {
          background: linear-gradient(180deg, #fffaf6 0%, #fff3ea 100%);
        }

        .cart-page {
          padding: 40px 0 64px;
        }

        .cart-surface {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 24px;
          border: 1px solid rgba(226, 214, 207, 0.9);
          box-shadow: 0 18px 45px rgba(115, 82, 62, 0.08);
          backdrop-filter: blur(6px);
        }

        .cart-hero {
          padding: 24px 26px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .cart-hero-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .cart-hero-icon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #d18b72 0%, #b96558 100%);
          color: #fff;
          box-shadow: 0 12px 24px rgba(185, 101, 88, 0.22);
        }

        .cart-hero h1 {
          margin: 0;
          font-size: 28px;
          color: #3f2d26;
          font-weight: 800;
        }

        .cart-hero p {
          margin: 4px 0 0;
          color: #7d6358;
          font-size: 14px;
        }

        .cart-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          background: #fff3ea;
          border: 1px solid #efd8cb;
          color: #8e5f4e;
          font-weight: 700;
        }

        .cart-main-box {
          padding: 22px;
        }

        .itemCard {
          background: linear-gradient(180deg, #ffffff 0%, #fffaf7 100%);
          border: 1px solid #f0e4dc;
          border-radius: 22px;
          padding: 16px;
          display: grid;
          grid-template-columns: 110px 1fr auto;
          gap: 18px;
          align-items: center;
          box-shadow: 0 10px 24px rgba(85, 60, 46, 0.05);
        }

        .productImageWrap {
          width: 110px;
          height: 110px;
          border-radius: 18px;
          overflow: hidden;
          background: #f8eee8;
          border: 1px solid #f1dfd5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .productImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .productContent {
          min-width: 0;
        }

        .productTitle {
          margin: 0 0 6px;
          font-size: 18px;
          line-height: 1.3;
          color: #3f2d26;
          font-weight: 800;
        }

        .productMeta {
          color: #8a7064;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .priceRow {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .priceOld {
          color: #b89e92;
          text-decoration: line-through;
          font-size: 13px;
          font-weight: 600;
        }

        .priceNow {
          color: #a84f45;
          font-size: 20px;
          font-weight: 800;
        }

        .subtotalText {
          margin-top: 8px;
          color: #70574d;
          font-size: 14px;
        }

        .itemActions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .qtdBox {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 16px;
          background: #fff8f3;
          border: 1px solid #efddd2;
        }

        .qtdBtn {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid #e4cfc3;
          background: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #8b5b49;
          transition: 0.2s ease;
        }

        .qtdBtn:hover {
          background: #fff2ea;
        }

        .qtdBtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .qtdValue {
          min-width: 24px;
          text-align: center;
          font-weight: 800;
          color: #49342c;
        }

        .removeBtn {
          border-radius: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .summaryCard {
          padding: 24px;
        }

        .summaryTitle {
          margin: 0 0 18px;
          font-size: 22px;
          color: #3f2d26;
          font-weight: 800;
        }

        .summaryLine {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 15px;
          color: #6c564c;
          margin-bottom: 14px;
        }

        .summaryLine strong {
          color: #3f2d26;
        }

        .summaryTotal {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #ead9cf;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .summaryTotal span {
          font-size: 16px;
          color: #5f4a42;
          font-weight: 700;
        }

        .summaryTotal strong {
          font-size: 26px;
          color: #a84f45;
          font-weight: 900;
        }

        .summarySticky {
          position: sticky;
          top: 90px;
        }

        .btn-brand {
          background: linear-gradient(135deg, #b55f53 0%, #8f433a 100%);
          color: white;
          border: none;
          border-radius: 16px;
          min-height: 50px;
          font-weight: 800;
          box-shadow: 0 14px 28px rgba(143, 67, 58, 0.2);
        }

        .btn-brand:hover {
          color: white;
          opacity: 0.96;
        }

        .btn-outline-brand {
          border: 1px solid #caa998;
          color: #8b5a49;
          background: #fff;
          border-radius: 16px;
          min-height: 48px;
          font-weight: 800;
        }

        .benefitsGrid {
          margin-top: 18px;
          display: grid;
          gap: 10px;
        }

        .benefitItem {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          border-radius: 16px;
          background: #fffaf7;
          border: 1px solid #f0e4dc;
        }

        .benefitItem svg {
          margin-top: 2px;
          color: #b55f53;
          flex-shrink: 0;
        }

        .benefitItem strong {
          display: block;
          color: #4b372f;
          font-size: 14px;
        }

        .benefitItem p {
          margin: 2px 0 0;
          color: #7d6358;
          font-size: 12px;
        }

        .emptyBox {
          padding: 28px;
          border-radius: 20px;
          background: #fffaf7;
          border: 1px dashed #e7cfc1;
          color: #7e665b;
          text-align: center;
        }

        @media (max-width: 992px) {
          .summarySticky {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .itemCard {
            grid-template-columns: 1fr;
          }

          .productImageWrap {
            width: 100%;
            height: 220px;
          }

          .itemActions {
            align-items: stretch;
          }

          .qtdBox {
            justify-content: center;
          }
        }
      `}</style>

      <main className="cart-page">
        <div className="container">
          <div className="cart-surface cart-hero">
            <div className="cart-hero-left">
              <div className="cart-hero-icon">
                <FiShoppingCart size={26} />
              </div>
              <div>
                <h1>Seu carrinho</h1>
                <p>Revise seus produtos antes de continuar a compra.</p>
              </div>
            </div>

            <div className="cart-chip">
              {totalItens} {totalItens === 1 ? "item" : "itens"}
            </div>
          </div>

          {erro ? (
            <div className="alert alert-warning">{erro}</div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="cart-surface cart-main-box">
                  <h4 className="mb-4 fw-bold" style={{ color: "#3f2d26" }}>
                    Produtos no carrinho
                  </h4>

                  {itens.length === 0 ? (
                    <div className="emptyBox">
                      Seu carrinho está vazio.
                    </div>
                  ) : (
                    <div className="d-grid gap-3">
                      {itens.map((item) => {
                        const precoAtual = precoFinalItem(item);
                        const precoAntigo =
                          num(item.preco_promocional_unitario) > 0
                            ? num(item.preco_unitario)
                            : 0;

                        const subtotalItem = precoAtual * item.quantidade;
                        const carregandoItem = acaoItemId === item.id_item;

                        return (
                          <div key={item.id_item} className="itemCard">
                            <div className="productImageWrap">
                              <img
                                className="productImg"
                                src={imagemUrl(item.imagem)}
                                alt={item.nome_produto}
                              />
                            </div>

                            <div className="productContent">
                              <h3 className="productTitle">{item.nome_produto}</h3>

                              <div className="productMeta">
                                Produto no carrinho
                              </div>

                              <div className="priceRow">
                                {precoAntigo > 0 && (
                                  <span className="priceOld">
                                    {formatBRL(precoAntigo)}
                                  </span>
                                )}

                                <strong className="priceNow">
                                  {formatBRL(precoAtual)}
                                </strong>
                              </div>

                              <div className="subtotalText">
                                Subtotal: <strong>{formatBRL(subtotalItem)}</strong>
                              </div>
                            </div>

                            <div className="itemActions">
                              <div className="qtdBox">
                                <button
                                  className="qtdBtn"
                                  onClick={() =>
                                    alterarQuantidade(item, item.quantidade - 1)
                                  }
                                  disabled={carregandoItem || item.quantidade <= 1}
                                >
                                  <FiMinus size={16} />
                                </button>

                                <span className="qtdValue">{item.quantidade}</span>

                                <button
                                  className="qtdBtn"
                                  onClick={() =>
                                    alterarQuantidade(item, item.quantidade + 1)
                                  }
                                  disabled={carregandoItem}
                                >
                                  <FiPlus size={16} />
                                </button>
                              </div>

                              <button
                                className="btn btn-outline-danger btn-sm removeBtn"
                                onClick={() => removerItem(item.id_item)}
                                disabled={carregandoItem}
                              >
                                <FiTrash2 size={15} />
                                <span>Remover</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-lg-4">
                <div className="cart-surface summaryCard summarySticky">
                  <h5 className="summaryTitle">Resumo do pedido</h5>

                  <div className="summaryLine">
                    <span>Quantidade de itens</span>
                    <strong>{totalItens}</strong>
                  </div>

                  <div className="summaryLine">
                    <span>Subtotal</span>
                    <strong>{formatBRL(subtotal)}</strong>
                  </div>

                  <div className="summaryLine">
                    <span>Frete</span>
                    <strong>A calcular</strong>
                  </div>

                  <div className="summaryTotal">
                    <span>Total</span>
                    <strong>{formatBRL(subtotal)}</strong>
                  </div>

                  <button
                    className="btn btn-brand w-100 mt-4"
                    onClick={() => (window.location.href = "/checkout")}
                    disabled={itens.length === 0}
                  >
                    Continuar compra
                  </button>

                  <button
                    className="btn btn-outline-brand w-100 mt-2"
                    onClick={carregarCarrinho}
                  >
                    Atualizar carrinho
                  </button>

                  <div className="benefitsGrid">
                    <div className="benefitItem">
                      <FiTruck size={18} />
                      <div>
                        <strong>Entrega segura</strong>
                        <p>Acompanhe seu pedido com mais tranquilidade.</p>
                      </div>
                    </div>

                    <div className="benefitItem">
                      <FiShield size={18} />
                      <div>
                        <strong>Compra protegida</strong>
                        <p>Seus dados e pagamento com mais segurança.</p>
                      </div>
                    </div>

                    <div className="benefitItem">
                      <FiCreditCard size={18} />
                      <div>
                        <strong>Pagamento facilitado</strong>
                        <p>Mais praticidade para concluir sua compra.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}