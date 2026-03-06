"use client";

import React from "react";
import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";
import api from "@/Api/conectar";
import {
  PedidoApi,
  DetalhesApi,
  PedidoItemApi,
} from "@/components/Bibioteca/pedidos";
import { toNumber, formatDate, formatBRL, pickObjectPayload, pickUserId, montarEndereco, resolveStatus } from "@/components/Bibioteca/functions";


export default function PedidosPage() {
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  const [usuarioId, setUsuarioId] = React.useState<number | null>(null);
  const [pedidos, setPedidos] = React.useState<PedidoApi[]>([]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [detLoading, setDetLoading] = React.useState(false);
  const [detalhes, setDetalhes] = React.useState<DetalhesApi | null>(null);

  async function carregarPedidos() {
    setLoading(true);
    setErro(null);

    try {
      const meRes = await api.get("/me");
      const meObj = pickObjectPayload(meRes);
      const uid = pickUserId(meObj);

      if (!uid) {
        setUsuarioId(null);
        setPedidos([]);
        setErro("Você precisa estar logado para ver seus pedidos.");
        return;
      }

      setUsuarioId(uid);

      const pedidosRes = await api.get("/pedidos");
      const payload = pickObjectPayload(pedidosRes);

      const lista: PedidoApi[] = Array.isArray(payload?.pedidos)
        ? payload.pedidos
        : Array.isArray(payload)
        ? payload
        : [];

      const normalized = lista.map((p) => ({
        ...p,
        id: Number(p.id ?? p.id_pedido ?? p.pedido_id ?? 0),
      }));

      setPedidos(normalized);
    } catch (e: any) {
      const msg =
        e?.response?.data?.mensagem ||
        e?.response?.data?.erro ||
        e?.message ||
        "Erro ao carregar pedidos.";
      setErro(String(msg));
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  async function abrirDetalhes(pedidoId?: number) {
    if (!pedidoId) return;

    setModalOpen(true);
    setDetLoading(true);
    setDetalhes(null);

    try {
      const [pedidoRes, itensRes] = await Promise.all([
        api.get(`/pedido/${pedidoId}`),
        api.get(`/pedido/${pedidoId}/itens`),
      ]);

      const pedidoObj = pickObjectPayload(pedidoRes);
      const itensObj = pickObjectPayload(itensRes);

      const pedido = pedidoObj?.pedido ? pedidoObj.pedido : pedidoObj;

      const itens: PedidoItemApi[] = Array.isArray(itensObj?.itens)
        ? itensObj.itens
        : Array.isArray(itensObj)
        ? itensObj
        : [];

      const detalhesFormatados: DetalhesApi = {
        id: Number(
          pedido?.id_pedido ?? pedido?.pedido_id ?? pedido?.id ?? pedidoId
        ),
        statusid: pedido?.statusid ?? pedido?.status_id,
        status: pedido?.status,
        status_nome: pedido?.status_nome,
        status_codigo: pedido?.status_codigo,
        total: pedido?.total ?? 0,
        frete: pedido?.frete ?? 0,
        metodo_pagamento: pedido?.metodo_pagamento,
        endereco: montarEndereco(
          pedido?.endereco ??
            pedido?.carrinho_endereco ??
            pedido?.endereco_entrega
        ),
        itens,
      };

      setDetalhes(detalhesFormatados);
    } catch (e: any) {
      const msg =
        e?.response?.data?.mensagem ||
        e?.response?.data?.erro ||
        e?.message ||
        "Erro ao carregar detalhes do pedido.";

      setDetalhes({
        id: pedidoId,
        status: "Erro",
        total: 0,
        frete: 0,
        itens: [],
        endereco: msg,
      });
    } finally {
      setDetLoading(false);
    }
  }

  React.useEffect(() => {
    carregarPedidos();
  }, []);

  const totalPedidos = pedidos.length;

  return (
    <>
      <Navbar />

      <div className="pedidos-page">
        <header className="pedidos-hero">
          <div className="container py-5">
            <div className="row g-4 align-items-center">
              <div className="col-12 col-lg-7">
                <div className="hero-eyebrow mb-2">Área do cliente</div>
                <h1 className="hero-title mb-3">Meus Pedidos</h1>
                <p className="hero-subtitle mb-0">
                  Acompanhe o status das suas compras, confira detalhes e tenha
                  tudo organizado em um só lugar.
                </p>
              </div>

              <div className="col-12 col-lg-5">
                <div className="hero-card p-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="hero-card-label">Pedidos</div>
                      <div className="hero-card-value">
                        {loading ? "…" : totalPedidos}
                      </div>
                    </div>
                    <div className="hero-card-icon" aria-hidden>
                      🧾
                    </div>
                  </div>

                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    <span className="chip">Rápido</span>
                    <span className="chip">Seguro</span>
                    <span className="chip">Atualizado</span>
                  </div>

                  <div className="divider my-4" />

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-brand flex-grow-1"
                      type="button"
                      onClick={carregarPedidos}
                      disabled={loading}
                    >
                      {loading ? "Carregando..." : "Atualizar"}
                    </button>

                    <button
                      className="btn btn-ghost"
                      type="button"
                      title="Ajuda"
                      onClick={() =>
                        alert("Fale com o suporte e informe o número do pedido.")
                      }
                    >
                      ?
                    </button>
                  </div>

                  {usuarioId ? (
                    <div className="mt-3 small text-white-50">
                      Cliente #{usuarioId}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container pb-5">
          <div className="card card-surface border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-transparent border-0 p-4 d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">
              <div>
                <h2 className="h5 mb-1">Histórico de pedidos</h2>
                <p className="text-muted mb-0">
                  {erro ? "Atenção:" : "Veja seus pedidos e acompanhe o status."}
                </p>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-outline-brand"
                  type="button"
                  onClick={carregarPedidos}
                  disabled={loading}
                >
                  Recarregar
                </button>
              </div>
            </div>

            <div className="card-body p-0">
              {erro ? (
                <div className="p-4">
                  <div className="alert alert-warning mb-0" role="alert">
                    {erro}
                  </div>
                </div>
              ) : loading ? (
                <div className="p-4">
                  <div className="skeleton-row" />
                  <div className="skeleton-row" />
                  <div className="skeleton-row" />
                </div>
              ) : pedidos.length === 0 ? (
                <div className="p-5 text-center">
                  <div className="empty-emoji mb-3">🛍️</div>
                  <h3 className="h5 mb-2">Você ainda não fez nenhum pedido</h3>
                  <p className="text-muted mb-4">
                    Assim que você comprar algo, seus pedidos vão aparecer aqui
                    com o status atualizado.
                  </p>
                  <button
                    className="btn btn-brand"
                    type="button"
                    onClick={() => (window.location.href = "/")}
                  >
                    Ir para a loja
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-head">
                      <tr>
                        <th className="ps-4">Pedido</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Pagamento</th>
                        <th className="text-end">Total</th>
                        <th className="text-end pe-4">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pedidos.map((p) => {
                        const id = Number(p.id ?? p.id_pedido ?? p.pedido_id ?? 0);
                        const { label, tone } = resolveStatus(p);
                        const total = toNumber(p.total);

                        return (
                          <tr key={String(id)} className="row-hover">
                            <td className="ps-4">
                              <div className="d-flex align-items-center gap-3">
                                <div className="order-dot" />
                                <div>
                                  <div className="fw-semibold">#{id}</div>
                                  <div className="text-muted small">
                                    {p.metodo_pagamento
                                      ? `Pagamento: ${p.metodo_pagamento}`
                                      : "Compra online"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="text-muted">
                              {formatDate(
                                p.criado ??
                                  p.created_at ??
                                  p.data ??
                                  p.atualizado
                              )}
                            </td>

                            <td>
                              <span className={`badge badge-soft badge-${tone}`}>
                                {label}
                              </span>
                            </td>

                            <td className="text-muted">
                              {p.metodo_pagamento ?? "-"}
                            </td>

                            <td className="text-end fw-semibold">
                              {formatBRL(total)}
                            </td>

                            <td className="text-end pe-4">
                              <button
                                className="btn btn-sm btn-outline-brand me-2"
                                type="button"
                                onClick={() => abrirDetalhes(id)}
                              >
                                Detalhes
                              </button>

                              <button
                                className="btn btn-sm btn-brand"
                                type="button"
                                onClick={() =>
                                  alert(
                                    "Rastreamento: implemente quando tiver o código/transportadora."
                                  )
                                }
                              >
                                Rastrear
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card-footer bg-transparent border-0 p-4 d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-end">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-brand btn-sm"
                  type="button"
                  disabled
                >
                  Anterior
                </button>
                <button
                  className="btn btn-outline-brand btn-sm"
                  type="button"
                  disabled
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </main>

        {modalOpen && (
          <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
            <div className="ui-modal">
              <div className="ui-modal-header">
                <div>
                  <div className="ui-modal-title">Detalhes do Pedido</div>
                  <div className="ui-modal-subtitle text-muted">
                    {detLoading
                      ? "Carregando..."
                      : `Pedido #${detalhes?.id ?? ""}`}
                  </div>
                </div>

                <button
                  className="btn btn-ghost-dark"
                  onClick={() => setModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="ui-modal-body">
                {detLoading ? (
                  <>
                    <div className="skeleton-row" />
                    <div className="skeleton-row" />
                    <div className="skeleton-row" />
                  </>
                ) : detalhes ? (
                  <>
                    <div className="detail-grid">
                      <div className="detail-card">
                        <div className="detail-label">Status</div>
                        <div className="detail-value">
                          <span
                            className={`badge badge-soft badge-${resolveStatus(
                              detalhes
                            ).tone}`}
                          >
                            {resolveStatus(detalhes).label}
                          </span>
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-label">Total</div>
                        <div className="detail-value">
                          {formatBRL(toNumber(detalhes.total))}
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-label">Frete</div>
                        <div className="detail-value">
                          {formatBRL(toNumber(detalhes.frete))}
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-label">Pagamento</div>
                        <div className="detail-value">
                          {detalhes.metodo_pagamento ?? "-"}
                        </div>
                      </div>

                      <div className="detail-card detail-wide">
                        <div className="detail-label">Endereço</div>
                        <div className="detail-value">
                          {detalhes.endereco ? (
                            detalhes.endereco
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <hr className="my-3" />

                    <div className="fw-semibold mb-2">Itens</div>

                    {Array.isArray(detalhes.itens) && detalhes.itens.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                          <thead className="table-head">
                            <tr>
                              <th>Produto</th>
                              <th className="text-center">Qtd</th>
                              <th className="text-end">Unit.</th>
                              <th className="text-end">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalhes.itens.map((it, idx) => {
                              const nome =
                                it.nome ??
                                it.titulo ??
                                it.nome_produto ??
                                `Produto #${it.produto_id ?? ""}`;

                              const qtd = Number(it.quantidade ?? 0);
                              const unit = toNumber(it.preco_unitario);
                              const sub = toNumber(it.subtotal) || unit * qtd;

                              return (
                                <tr key={idx}>
                                  <td>{nome}</td>
                                  <td className="text-center">{qtd}</td>
                                  <td className="text-end">
                                    {formatBRL(unit)}
                                  </td>
                                  <td className="text-end fw-semibold">
                                    {formatBRL(sub)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-muted">Nenhum item encontrado.</div>
                    )}
                  </>
                ) : (
                  <div className="text-muted">Sem detalhes.</div>
                )}
              </div>

              <div className="ui-modal-footer">
                <button
                  className="btn btn-outline-brand"
                  onClick={() => setModalOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <FooterPrincipal />

      <style jsx global>{`
        :root {
          --cream: #fff3ea;
          --cream-2: #fffaf5;
          --line: #eadfd3;
          --text: #2a2a2a;
          --brand: #15373e;
          --brand-2: #0e2328;
          --gold: #c7a16a;
        }

        .pedidos-page {
          background: linear-gradient(180deg, var(--cream), #ffffff 70%);
          color: var(--text);
        }

        .pedidos-hero {
          background: radial-gradient(
              900px 480px at 15% 20%,
              rgba(199, 161, 106, 0.22),
              transparent 55%
            ),
            radial-gradient(
              800px 420px at 85% 10%,
              rgba(255, 255, 255, 0.12),
              transparent 55%
            ),
            linear-gradient(135deg, var(--brand), var(--brand-2));
          color: #fff;
          border-bottom-left-radius: 28px;
          border-bottom-right-radius: 28px;
          margin-bottom: 22px;
        }

        .hero-eyebrow {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.88);
          font-weight: 600;
          font-size: 0.9rem;
          letter-spacing: 0.2px;
        }

        .hero-title {
          font-size: clamp(1.9rem, 3.2vw, 2.6rem);
          font-weight: 800;
          line-height: 1.05;
          text-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
        }

        .hero-subtitle {
          color: rgba(255, 255, 255, 0.82);
          max-width: 60ch;
        }

        .hero-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 22px;
          backdrop-filter: blur(10px);
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.35);
        }

        .hero-card-label {
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.95rem;
          font-weight: 600;
        }

        .hero-card-value {
          font-size: 2.3rem;
          font-weight: 900;
          letter-spacing: -0.6px;
        }

        .hero-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 1.8rem;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.92);
          font-weight: 700;
          font-size: 0.82rem;
        }

        .divider {
          height: 1px;
          width: 100%;
          background: rgba(255, 255, 255, 0.18);
        }

        .card-surface {
          background: var(--cream-2);
          border: 1px solid var(--line) !important;
          box-shadow: 0 18px 50px rgba(26, 26, 26, 0.08);
        }

        .rounded-4 {
          border-radius: 20px !important;
        }

        .table-head th {
          background: rgba(255, 243, 234, 0.85) !important;
          color: #1f2937;
          font-weight: 800;
          border-bottom: 1px solid var(--line) !important;
          padding-top: 14px !important;
          padding-bottom: 14px !important;
        }

        .row-hover {
          transition: background 130ms ease;
        }

        .row-hover:hover {
          background: rgba(255, 243, 234, 0.45);
        }

        .order-dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: var(--gold);
          box-shadow: 0 0 0 6px rgba(199, 161, 106, 0.18);
        }

        .btn-brand {
          background: linear-gradient(180deg, #1c434b, var(--brand));
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          font-weight: 800;
          letter-spacing: 0.2px;
        }

        .btn-brand:hover {
          filter: brightness(1.03);
          color: #fff;
        }

        .btn-outline-brand {
          background: transparent;
          border: 1px solid rgba(21, 55, 62, 0.35);
          color: var(--brand);
          border-radius: 12px;
          font-weight: 800;
        }

        .btn-outline-brand:hover {
          background: rgba(21, 55, 62, 0.06);
          color: var(--brand);
        }

        .btn-ghost {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #fff;
          border-radius: 12px;
          font-weight: 900;
          width: 44px;
        }

        .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #fff;
        }

        .btn-ghost-dark {
          background: rgba(21, 55, 62, 0.08);
          border: 1px solid rgba(21, 55, 62, 0.18);
          color: var(--brand);
          border-radius: 12px;
          font-weight: 900;
          width: 42px;
          height: 42px;
        }

        .btn-ghost-dark:hover {
          background: rgba(21, 55, 62, 0.12);
          color: var(--brand);
        }

        .badge-soft {
          border-radius: 999px;
          padding: 8px 10px;
          font-weight: 800;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .badge-ok {
          background: rgba(34, 197, 94, 0.12);
          color: #166534;
        }

        .badge-warn {
          background: rgba(245, 158, 11, 0.14);
          color: #92400e;
        }

        .badge-info {
          background: rgba(59, 130, 246, 0.12);
          color: #1e3a8a;
        }

        .badge-brand {
          background: rgba(21, 55, 62, 0.12);
          color: var(--brand);
        }

        .badge-danger {
          background: rgba(239, 68, 68, 0.12);
          color: #991b1b;
        }

        .empty-emoji {
          font-size: 2.4rem;
        }

        .skeleton-row {
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(90deg, #f3eee7, #ffffff, #f3eee7);
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite;
          border: 1px solid var(--line);
          margin-bottom: 12px;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .ui-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: grid;
          place-items: center;
          padding: 16px;
          z-index: 9999;
        }

        .ui-modal {
          width: min(920px, 100%);
          background: var(--cream-2);
          border: 1px solid var(--line);
          border-radius: 20px;
          box-shadow: 0 30px 120px rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }

        .ui-modal-header {
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--line);
          background: rgba(255, 243, 234, 0.7);
        }

        .ui-modal-title {
          font-weight: 900;
          color: #1f2937;
        }

        .ui-modal-body {
          padding: 18px;
        }

        .ui-modal-footer {
          padding: 16px 18px;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          background: rgba(255, 243, 234, 0.7);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .detail-card {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 12px;
        }

        .detail-wide {
          grid-column: 1 / -1;
        }

        .detail-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .detail-value {
          font-weight: 800;
          color: #111827;
        }

        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}