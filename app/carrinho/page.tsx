"use client";

import React from "react";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import api from "@/Api/conectar";
import "bootstrap/dist/css/bootstrap.min.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatBRL } from "@/components/Bibioteca/functions";

type CarrinhoItem = {
  id_item: number;
  nome_produto: string;
  preco_unitario: number | string;
  quantidade: number;
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

function pickCarrinho(resp: any): CarrinhoItem[] {
  const base = resp?.dados ?? resp?.data ?? resp;

  if (Array.isArray(base)) return base;
  if (Array.isArray(base?.itens)) return base.itens;

  return [];
}

function imagemUrl(path?: string) {
  if (!path) return "/placeholder.png";
  if (/^https?:\/\//i.test(path)) return path;

  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  const clean = String(path).replace(/^\/+/, "");

  if (clean.startsWith("upload/")) return `${base}/${clean}`;

  return `${base}/upload/${clean}`;
}

export default function CarrinhoPage() {
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [itens, setItens] = React.useState<CarrinhoItem[]>([]);

  const subtotal = React.useMemo(() => {
    return itens.reduce((acc, item) => {
      return acc + num(item.preco_unitario) * (item.quantidade || 1);
    }, 0);
  }, [itens]);

  async function carregarCarrinho() {
    setLoading(true);
    setErro(null);

    try {
      const resp = await api.get("/carrinho");
      const lista = pickCarrinho(resp.data);
      setItens(lista);
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

  async function alterarQuantidade(id: number, qtd: number) {
    if (qtd < 1) return;

    try {
      await api.put(`/carrinho/item/${id}`, { quantidade: qtd });

      setItens((prev) =>
        prev.map((item) =>
          item.id_item === id ? { ...item, quantidade: qtd } : item
        )
      );
    } catch {
      toast.error("Erro ao atualizar quantidade.");
    }
  }

  async function removerItem(id: number) {
    try {
      await api.delete(`/carrinho/item/${id}`);
      setItens((prev) => prev.filter((item) => item.id_item !== id));
      toast.success("Item removido do carrinho.");
    } catch {
      toast.error("Erro ao remover item.");
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
          background: #fff7f1;
        }

        .surface {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #eee;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }

        .itemCard {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 14px;
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 14px;
          align-items: center;
        }

        .productImg {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 12px;
        }

        .qtdBox {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .qtdBtn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid #ddd;
          background: white;
          font-weight: bold;
        }

        .summarySticky {
          position: sticky;
          top: 90px;
        }

        .btn-brand {
          background: #15373e;
          color: white;
          border-radius: 10px;
          font-weight: bold;
        }

        .btn-outline-brand {
          border: 1px solid #15373e;
          color: #15373e;
          border-radius: 10px;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .itemCard {
            grid-template-columns: 1fr;
          }

          .productImg {
            width: 100%;
            height: 180px;
          }
        }
      `}</style>

      <main className="container py-5">
        {erro ? (
          <div className="alert alert-warning">{erro}</div>
        ) : (
          <div className="row g-4">

            {/* LISTA DE PRODUTOS */}
            <div className="col-lg-8">
              <div className="surface p-4">
                <h4 className="mb-4 fw-bold">Produtos no carrinho</h4>

                {itens.length === 0 ? (
                  <div className="alert alert-warning">
                    Seu carrinho está vazio.
                  </div>
                ) : (
                  <div className="d-grid gap-3">
                    {itens.map((item) => (
                      <div key={item.id_item} className="itemCard">
                        <img
                          className="productImg"
                          src={imagemUrl(item.imagem)}
                          alt={item.nome_produto}
                        />

                        <div>
                          <div className="fw-bold">
                            {item.nome_produto}
                          </div>

                          <div className="text-muted small">
                            {formatBRL(num(item.preco_unitario))}
                          </div>

                          <div className="text-muted small">
                            Subtotal:{" "}
                            <strong>
                              {formatBRL(
                                num(item.preco_unitario) * item.quantidade
                              )}
                            </strong>
                          </div>
                        </div>

                        <div className="d-grid gap-2">
                          <div className="qtdBox">
                            <button
                              className="qtdBtn"
                              onClick={() =>
                                alterarQuantidade(
                                  item.id_item,
                                  item.quantidade - 1
                                )
                              }
                            >
                              −
                            </button>

                            <strong>{item.quantidade}</strong>

                            <button
                              className="qtdBtn"
                              onClick={() =>
                                alterarQuantidade(
                                  item.id_item,
                                  item.quantidade + 1
                                )
                              }
                            >
                              +
                            </button>
                          </div>

                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removerItem(item.id_item)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RESUMO */}
            <div className="col-lg-4">
              <div className="surface p-4 summarySticky">
                <h5 className="fw-bold mb-3">Resumo</h5>

                <div className="d-flex justify-content-between">
                  <span>Itens</span>
                  <strong>{itens.length}</strong>
                </div>

                <hr />

                <div className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <strong>{formatBRL(subtotal)}</strong>
                </div>

                <hr />

                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold">{formatBRL(subtotal)}</span>
                </div>

                <button
                  className="btn btn-brand w-100 mt-3"
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
              </div>
            </div>

          </div>
        )}
      </main>

      <Footer />
    </>
  );
}