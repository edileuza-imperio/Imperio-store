"use client";

import React from "react";
import api from "@/Api/conectar";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FiShoppingBag,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiTruck,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

type PedidoItem = {
  id_item?: number;
  id_pedido_item?: number;
  produto_id?: number;
  nome_produto?: string;
  quantidade?: number;
  preco_unitario?: number | string;
  preco_promocional_unitario?: number | string | null;
  subtotal?: number | string;
  imagem?: string;
};

type Pedido = {
  id_pedido?: number;
  usuario_id?: number;
  carrinho_id?: number;
  status_id?: number;
  status_pagamento?: string;
  payment_id?: string;
  preference_id?: string;
  external_reference?: string;
  valor_produtos?: number | string;
  valor_desconto?: number | string;
  valor_frete?: number | string;
  valor_total?: number | string;
  criado_em?: string;
  atualizado_em?: string;
  endereco_entrega?: any;
  itens?: PedidoItem[];
  nome_usuario?: string;
  email_usuario?: string;
};

function toNumber(value: any): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value ?? "").trim();
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

function formatBRL(value: any) {
  return toNumber(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR");
}

function getPedidoStatusLabel(pedido: Pedido) {
  const statusPagamento = String(pedido.status_pagamento ?? "").toLowerCase();

  if (statusPagamento === "aprovado" || statusPagamento === "approved") {
    return "Pago";
  }

  if (statusPagamento === "pendente" || statusPagamento === "pending") {
    return "Pendente";
  }

  if (
    statusPagamento === "cancelado" ||
    statusPagamento === "cancelled" ||
    statusPagamento === "rejeitado" ||
    statusPagamento === "rejected"
  ) {
    return "Cancelado";
  }

  return `Status ${pedido.status_id ?? "-"}`;
}

function getPedidoStatusClass(pedido: Pedido) {
  const statusPagamento = String(pedido.status_pagamento ?? "").toLowerCase();

  if (statusPagamento === "aprovado" || statusPagamento === "approved") {
    return "status-badge success";
  }

  if (statusPagamento === "pendente" || statusPagamento === "pending") {
    return "status-badge warning";
  }

  if (
    statusPagamento === "cancelado" ||
    statusPagamento === "cancelled" ||
    statusPagamento === "rejeitado" ||
    statusPagamento === "rejected"
  ) {
    return "status-badge danger";
  }

  return "status-badge neutral";
}

function pickPedidosArray(resp: any): Pedido[] {
  const dados = resp?.dados ?? resp?.data ?? resp ?? [];

  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados?.pedidos)) return dados.pedidos;
  if (Array.isArray(dados?.dados)) return dados.dados;

  return [];
}

function pickPedidoDetalhe(resp: any): Pedido | null {
  const dados = resp?.dados ?? resp?.data ?? resp ?? null;
  if (!dados) return null;

  if (dados?.pedido) return dados.pedido;
  return dados;
}

export default function AdminPedidosPage() {
  const [loading, setLoading] = React.useState(true);
  const [pedidos, setPedidos] = React.useState<Pedido[]>([]);
  const [busca, setBusca] = React.useState("");
  const [erro, setErro] = React.useState<string | null>(null);

  const [abrirModal, setAbrirModal] = React.useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = React.useState<Pedido | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = React.useState(false);

  async function carregarPedidos() {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get("/pedidos");
      console.log("[admin/pedidos] resposta /pedidos:", response.data);

      const lista = pickPedidosArray(response.data);
      setPedidos(lista);
    } catch (error: any) {
      console.log("[admin/pedidos] erro ao carregar pedidos:", error);
      console.log("[admin/pedidos] erro response:", error?.response);
      console.log("[admin/pedidos] erro response data:", error?.response?.data);

      setErro(error?.response?.data?.mensagem || "Não foi possível carregar os pedidos.");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    carregarPedidos();
  }, []);

  async function visualizarPedido(pedido: Pedido) {
    if (!pedido?.id_pedido) return;

    try {
      setAbrirModal(true);
      setCarregandoDetalhe(true);
      setPedidoSelecionado(null);

      const response = await api.get(`/pedido/${pedido.id_pedido}/com-itens`);
      console.log("[admin/pedidos] detalhe pedido:", response.data);

      const detalhe = pickPedidoDetalhe(response.data);
      setPedidoSelecionado(detalhe);
    } catch (error: any) {
      console.log("[admin/pedidos] erro ao carregar detalhe:", error);
      console.log("[admin/pedidos] erro detalhe response:", error?.response?.data);

      setPedidoSelecionado(pedido);
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  const pedidosFiltrados = React.useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return pedidos;

    return pedidos.filter((pedido) => {
      return (
        String(pedido.id_pedido ?? "").includes(termo) ||
        String(pedido.usuario_id ?? "").includes(termo) ||
        String(pedido.status_pagamento ?? "").toLowerCase().includes(termo) ||
        String(pedido.nome_usuario ?? "").toLowerCase().includes(termo) ||
        String(pedido.email_usuario ?? "").toLowerCase().includes(termo) ||
        String(pedido.external_reference ?? "").toLowerCase().includes(termo)
      );
    });
  }, [pedidos, busca]);

  const totalPedidos = pedidos.length;
  const totalPendentes = pedidos.filter((p) =>
    ["pendente", "pending"].includes(String(p.status_pagamento ?? "").toLowerCase())
  ).length;
  const totalPagos = pedidos.filter((p) =>
    ["aprovado", "approved"].includes(String(p.status_pagamento ?? "").toLowerCase())
  ).length;
  const totalCancelados = pedidos.filter((p) =>
    ["cancelado", "cancelled", "rejeitado", "rejected"].includes(
      String(p.status_pagamento ?? "").toLowerCase()
    )
  ).length;

  const faturamento = pedidos.reduce((acc, pedido) => acc + toNumber(pedido.valor_total), 0);

  return (
    <>
      <style jsx global>{`
        body {
          background: linear-gradient(180deg, #fffaf6 0%, #fff3ea 100%);
        }

        .admin-pedidos-page {
          padding: 28px;
        }

        .hero-box {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(233, 214, 204, 0.9);
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 18px 45px rgba(115, 82, 62, 0.08);
          margin-bottom: 22px;
        }

        .hero-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .hero-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .hero-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #d18b72 0%, #b96558 100%);
          color: #fff;
          box-shadow: 0 12px 24px rgba(185, 101, 88, 0.22);
        }

        .hero-title {
          margin: 0;
          font-size: 28px;
          color: #3f2d26;
          font-weight: 900;
        }

        .hero-subtitle {
          margin: 4px 0 0;
          color: #7d6358;
          font-size: 14px;
        }

        .toolbar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .search-box {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 50px;
          padding: 0 14px;
          border-radius: 16px;
          background: #fff;
          border: 1px solid #e7d6cc;
        }

        .search-box input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          color: #43312a;
        }

        .btn-brand {
          background: linear-gradient(135deg, #b55f53 0%, #8f433a 100%);
          color: #fff;
          border: none;
          border-radius: 16px;
          min-height: 50px;
          padding: 0 18px;
          font-weight: 800;
          box-shadow: 0 14px 28px rgba(143, 67, 58, 0.2);
        }

        .btn-brand:hover {
          color: #fff;
          opacity: 0.96;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(233, 214, 204, 0.9);
          border-radius: 24px;
          padding: 18px;
          box-shadow: 0 14px 30px rgba(115, 82, 62, 0.06);
        }

        .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fff3ea;
          color: #a55d4f;
        }

        .stat-label {
          font-size: 13px;
          color: #7d6358;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
          color: #3f2d26;
        }

        .content-box {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(233, 214, 204, 0.9);
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 18px 45px rgba(115, 82, 62, 0.08);
        }

        .table-wrap {
          overflow-x: auto;
        }

        .pedidos-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 10px;
        }

        .pedidos-table thead th {
          font-size: 13px;
          color: #7b6258;
          font-weight: 800;
          padding: 0 14px 8px;
          white-space: nowrap;
        }

        .pedidos-table tbody tr {
          background: #fffaf7;
          border: 1px solid #efdfd6;
        }

        .pedidos-table tbody td {
          padding: 16px 14px;
          color: #4b372f;
          font-size: 14px;
          vertical-align: middle;
          border-top: 1px solid #efdfd6;
          border-bottom: 1px solid #efdfd6;
        }

        .pedidos-table tbody td:first-child {
          border-left: 1px solid #efdfd6;
          border-top-left-radius: 16px;
          border-bottom-left-radius: 16px;
        }

        .pedidos-table tbody td:last-child {
          border-right: 1px solid #efdfd6;
          border-top-right-radius: 16px;
          border-bottom-right-radius: 16px;
        }

        .pedido-id {
          font-weight: 900;
          color: #3f2d26;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          min-width: 94px;
        }

        .status-badge.success {
          background: #eafaf0;
          color: #1c7c47;
          border: 1px solid #cfeeda;
        }

        .status-badge.warning {
          background: #fff7e7;
          color: #9a6a00;
          border: 1px solid #f4dfaa;
        }

        .status-badge.danger {
          background: #fff0f0;
          color: #b42318;
          border: 1px solid #f3c7c7;
        }

        .status-badge.neutral {
          background: #f5f1ef;
          color: #6c564c;
          border: 1px solid #ead9cf;
        }

        .action-btn {
          border: none;
          background: #fff;
          color: #8b5a49;
          border: 1px solid #e7d6cc;
          min-width: 42px;
          height: 42px;
          border-radius: 12px;
        }

        .empty-box {
          padding: 40px 18px;
          text-align: center;
          color: #7e665b;
          border-radius: 18px;
          border: 1px dashed #e7cfc1;
          background: #fffaf7;
        }

        .modal-backdrop-custom {
          position: fixed;
          inset: 0;
          background: rgba(43, 28, 22, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal-card-custom {
          width: min(980px, 100%);
          max-height: 90vh;
          overflow: auto;
          background: #fff;
          border-radius: 24px;
          border: 1px solid #ead9cf;
          box-shadow: 0 24px 60px rgba(32, 18, 14, 0.22);
          padding: 22px;
        }

        .modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .modal-title {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          color: #3f2d26;
        }

        .close-btn {
          border: none;
          background: #fff6f2;
          color: #8f433a;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          font-size: 22px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .detail-card {
          background: #fffaf7;
          border: 1px solid #efdfd6;
          border-radius: 18px;
          padding: 16px;
        }

        .detail-label {
          font-size: 12px;
          font-weight: 800;
          color: #8a6d61;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .detail-value {
          font-size: 15px;
          color: #3f2d26;
          font-weight: 700;
          word-break: break-word;
        }

        .items-box {
          background: #fffaf7;
          border: 1px solid #efdfd6;
          border-radius: 18px;
          padding: 16px;
        }

        .item-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid #efdfd6;
          align-items: center;
        }

        .item-row:last-child {
          border-bottom: none;
        }

        .item-name {
          font-size: 14px;
          color: #3f2d26;
          font-weight: 800;
        }

        .item-meta {
          font-size: 13px;
          color: #7d6358;
        }

        @media (max-width: 1100px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .admin-pedidos-page {
            padding: 18px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .item-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="admin-pedidos-page">
        <div className="hero-box">
          <div className="hero-header">
            <div className="hero-left">
              <div className="hero-icon">
                <FiShoppingBag size={26} />
              </div>

              <div>
                <h1 className="hero-title">Pedidos</h1>
                <p className="hero-subtitle">
                  Visualize, filtre e acompanhe todos os pedidos do sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <FiSearch size={18} />
              <input
                type="text"
                placeholder="Buscar por ID, usuário, e-mail, referência ou status..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <button type="button" className="btn btn-brand" onClick={carregarPedidos}>
              <FiRefreshCw size={18} style={{ marginRight: 8 }} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Total de pedidos</div>
                <div className="stat-value">{totalPedidos}</div>
              </div>
              <div className="stat-icon">
                <FiShoppingBag size={20} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Pendentes</div>
                <div className="stat-value">{totalPendentes}</div>
              </div>
              <div className="stat-icon">
                <FiClock size={20} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Pagos</div>
                <div className="stat-value">{totalPagos}</div>
              </div>
              <div className="stat-icon">
                <FiCheckCircle size={20} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Cancelados</div>
                <div className="stat-value">{totalCancelados}</div>
              </div>
              <div className="stat-icon">
                <FiXCircle size={20} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div>
                <div className="stat-label">Faturamento</div>
                <div className="stat-value" style={{ fontSize: 18 }}>
                  {formatBRL(faturamento)}
                </div>
              </div>
              <div className="stat-icon">
                <FiDollarSign size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="content-box">
          {loading ? (
            <div className="empty-box">Carregando pedidos...</div>
          ) : erro ? (
            <div className="alert alert-warning mb-0">{erro}</div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="empty-box">Nenhum pedido encontrado.</div>
          ) : (
            <div className="table-wrap">
              <table className="pedidos-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Pagamento</th>
                    <th>Total</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {pedidosFiltrados.map((pedido) => (
                    <tr key={pedido.id_pedido}>
                      <td>
                        <div className="pedido-id">#{pedido.id_pedido ?? "-"}</div>
                      </td>

                      <td>
                        <div>{pedido.nome_usuario || `Usuário ${pedido.usuario_id ?? "-"}`}</div>
                        <small style={{ color: "#7d6358" }}>
                          {pedido.email_usuario || `ID usuário: ${pedido.usuario_id ?? "-"}`}
                        </small>
                      </td>

                      <td>
                        <span className={getPedidoStatusClass(pedido)}>
                          {getPedidoStatusLabel(pedido)}
                        </span>
                      </td>

                      <td style={{ fontWeight: 800 }}>{formatBRL(pedido.valor_total)}</td>

                      <td>{formatDate(pedido.criado_em)}</td>

                      <td>
                        <button
                          type="button"
                          className="action-btn"
                          title="Visualizar pedido"
                          onClick={() => visualizarPedido(pedido)}
                        >
                          <FiEye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {abrirModal && (
        <div className="modal-backdrop-custom" onClick={() => setAbrirModal(false)}>
          <div className="modal-card-custom" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">
                Pedido #{pedidoSelecionado?.id_pedido ?? "..."}
              </h2>

              <button
                type="button"
                className="close-btn"
                onClick={() => setAbrirModal(false)}
              >
                ×
              </button>
            </div>

            {carregandoDetalhe ? (
              <div className="empty-box">Carregando detalhes do pedido...</div>
            ) : pedidoSelecionado ? (
              <>
                <div className="detail-grid">
                  <div className="detail-card">
                    <div className="detail-label">Status do pagamento</div>
                    <div className="detail-value">{getPedidoStatusLabel(pedidoSelecionado)}</div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-label">Valor total</div>
                    <div className="detail-value">{formatBRL(pedidoSelecionado.valor_total)}</div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-label">Valor produtos</div>
                    <div className="detail-value">{formatBRL(pedidoSelecionado.valor_produtos)}</div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-label">Frete</div>
                    <div className="detail-value">{formatBRL(pedidoSelecionado.valor_frete)}</div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-label">Usuário</div>
                    <div className="detail-value">
                      {pedidoSelecionado.nome_usuario ||
                        pedidoSelecionado.email_usuario ||
                        `ID ${pedidoSelecionado.usuario_id ?? "-"}`}
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-label">Criado em</div>
                    <div className="detail-value">{formatDate(pedidoSelecionado.criado_em)}</div>
                  </div>

                  <div className="detail-card" style={{ gridColumn: "1 / -1" }}>
                    <div className="detail-label">Endereço de entrega</div>
                    <div className="detail-value">
                      {pedidoSelecionado.endereco_entrega ? (
                        <>
                          {pedidoSelecionado.endereco_entrega?.endereco || "-"}
                          {pedidoSelecionado.endereco_entrega?.numero
                            ? `, ${pedidoSelecionado.endereco_entrega.numero}`
                            : ""}
                          {pedidoSelecionado.endereco_entrega?.complemento
                            ? ` - ${pedidoSelecionado.endereco_entrega.complemento}`
                            : ""}
                          <br />
                          {pedidoSelecionado.endereco_entrega?.bairro || "-"} -{" "}
                          {pedidoSelecionado.endereco_entrega?.cidade || "-"}
                          {pedidoSelecionado.endereco_entrega?.estado
                            ? `/${pedidoSelecionado.endereco_entrega.estado}`
                            : ""}
                          <br />
                          CEP: {pedidoSelecionado.endereco_entrega?.cep || "-"}
                        </>
                      ) : (
                        "Endereço não informado."
                      )}
                    </div>
                  </div>
                </div>

                <div className="items-box">
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: "#3f2d26",
                      marginBottom: 10,
                    }}
                  >
                    Itens do pedido
                  </div>

                  {pedidoSelecionado.itens && pedidoSelecionado.itens.length > 0 ? (
                    pedidoSelecionado.itens.map((item, index) => (
                      <div
                        key={item.id_item ?? item.id_pedido_item ?? `${item.produto_id}-${index}`}
                        className="item-row"
                      >
                        <div>
                          <div className="item-name">
                            {item.nome_produto || "Produto"}
                          </div>
                          <div className="item-meta">
                            Produto ID: {item.produto_id ?? "-"}
                          </div>
                        </div>

                        <div className="item-meta">
                          Qtd: <strong>{item.quantidade ?? 1}</strong>
                        </div>

                        <div className="item-meta" style={{ fontWeight: 800 }}>
                          {formatBRL(item.subtotal)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-box">Nenhum item encontrado neste pedido.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-box">Não foi possível carregar os detalhes.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}