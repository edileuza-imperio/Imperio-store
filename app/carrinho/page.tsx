"use client";

import React from "react";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import api from "@/Api/conectar";
import { ToastContainer, toast } from "react-toastify";
import { formatBRL } from "@/components/Bibioteca/functions";
import {
  FiShoppingCart,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiShield,
  FiTruck,
  FiCreditCard,
  FiRefreshCw,
  FiArrowRight,
  FiPackage,
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

  function irParaPagamento() {
    window.location.href = "/carrinho/pagamento";
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <ToastContainer position="top-right" autoClose={2500} theme="dark" />
        <div className="cart-loading-page">
          <div className="cart-loading-box">
            <div className="spinner-border text-warning" />
            <p>Carregando seu carrinho...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" autoClose={2500} theme="dark" />

    

      <main className="cart-page">
        <div className="cart-container">
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
            <div className="cart-grid">
              <div>
                <div className="cart-surface cart-main-box">
                  <h2 className="cart-section-title">Produtos no carrinho</h2>

                  {itens.length === 0 ? (
                    <div className="emptyBox">
                      <h3>Seu carrinho está vazio</h3>
                      <p>Adicione produtos para continuar sua compra.</p>
                    </div>
                  ) : (
                    <div className="items-list">
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
                              <div className="productTag">
                                <FiPackage size={13} />
                                Produto no carrinho
                              </div>

                              <h3 className="productTitle">{item.nome_produto}</h3>

                              <div className="productMeta">
                                Revise quantidade e valor antes de finalizar.
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
                                className="btn btn-outline-danger removeBtn"
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

              <div className="summarySticky">
                <div className="cart-surface summaryCard">
                  <h3 className="summaryTitle">Resumo do pedido</h3>

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

                  <div className="summaryHint">
                    O valor do frete será definido na próxima etapa da compra.
                  </div>

                  <button
                    className="btn btn-brand w-100 mt-4"
                    onClick={irParaPagamento}
                    disabled={itens.length === 0}
                  >
                    <FiArrowRight style={{ marginRight: 8 }} />
                    Continuar compra
                  </button>

                  <button
                    className="btn btn-outline-brand w-100 mt-2"
                    onClick={carregarCarrinho}
                  >
                    <FiRefreshCw style={{ marginRight: 8 }} />
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