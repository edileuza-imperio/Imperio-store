"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

interface Cupom {
  id_cupom: number;
  codigo: string;
  descricao: string;
  tipo_nome: string;
  tipo_codigo: string; // "percentual", "fixo", "frete"
  desconto: number | null;
  valor_minimo: number;
  limite_uso: number | null;
  usado: number;
  inicio: string;
  expiracao: string;
  statusid: number; // 1 = ativo, 7 = publicado, 8 = desativado
  publico: number; // 7 = público, outro = privado
}

export default function CuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    console.log("📦 Carregando cupons do backend...");
    try {
      const res = await api.get("/admin/cupons", { withCredentials: true });
      setCupons(res.data.dados || []);
      console.log("✅ Cupons carregados:", res.data.dados);
    } catch (e) {
      console.error("❌ Erro ao carregar cupons:", e);
    } finally {
      setLoading(false);
    }
  }

  async function remover(id: number) {
    if (!confirm("Deseja remover este cupom?")) return;

    console.log(`🗑 Removendo cupom ID ${id}...`);

    try {
      await api.delete(`/admin/cupom/${id}/remover`, { withCredentials: true });

      console.log("✅ Cupom removido com sucesso");
      await carregar();
    } catch (e) {
      console.error("❌ Erro ao remover cupom:", e);
      alert("Erro ao remover cupom.");
    }
  }

  async function alternarPublicacao(cupom: Cupom) {
    const novoStatus = cupom.statusid === 7 ? 8 : 7;

    console.log(
      `🔄 Alterando status do cupom ID ${cupom.id_cupom} para ${novoStatus}...`
    );

    try {
      await api.put(
        `/admin/cupom/${cupom.id_cupom}/status/${novoStatus}`,
        {},
        { withCredentials: true }
      );

      await carregar();
    } catch (e) {
      console.error("❌ Erro ao atualizar status:", e);
      alert("Erro ao atualizar status do cupom.");
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="cupons-page">
      {/* HEADER */}
      <div className="page-header">
        <h1>
          <i className="bi bi-ticket-perforated" /> Cupons
        </h1>
        <div className="actions">
          <Link href="/admin/cupons/novo" className="btn primary">
            <i className="bi bi-plus-circle" /> Novo Cupom
          </Link>
          <Link href="/admin/cupons/tipos" className="btn secondary">
            <i className="bi bi-tags" /> Tipos
          </Link>
        </div>
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <p className="info">Carregando cupons...</p>
      ) : cupons.length === 0 ? (
        <p className="info">Nenhum cupom cadastrado</p>
      ) : (
        <div className="cards">
          {cupons.map((c) => (
            <div className="cupom-card" key={c.id_cupom}>
              <div className="card-top">
                <div className="badges">
                  <span
                    className={`status ${
                      c.statusid === 7
                        ? "publicado"
                        : c.statusid === 8
                        ? "desativado"
                        : "ativo"
                    }`}
                  >
                    {c.statusid === 7
                      ? "Publicado"
                      : c.statusid === 8
                      ? "Desativado"
                      : "Ativo"}
                  </span>
                  <span
                    className={`badge-publico ${
                      c.publico === 7 ? "publico" : "privado"
                    }`}
                  >
                    {c.publico === 7 ? "Público" : "Privado"}
                  </span>
                </div>
                <div className="acoes">
                  <Link
                    href={`/admin/cupons/${c.id_cupom}`}
                    className="icon edit"
                    title="Editar"
                  >
                    <i className="bi bi-pencil-square" />
                  </Link>
                  <button
                    className="icon delete"
                    onClick={() => remover(c.id_cupom)}
                    title="Remover"
                  >
                    <i className="bi bi-trash" />
                  </button>
                  <button
                    className="icon publish"
                    onClick={() => alternarPublicacao(c)}
                    title={c.statusid === 7 ? "Desativar" : "Publicar"}
                  >
                    <i className="bi bi-upload" />
                  </button>
                </div>
              </div>

              <h3 className="codigo">{c.codigo}</h3>
              <p className="descricao">{c.descricao}</p>

              <div className="linha">
                <span>Tipo</span>
                <strong>
                  {c.tipo_nome} ({c.tipo_codigo})
                </strong>
              </div>

              <div className="linha">
                <span>Desconto</span>
                <strong>
                  {c.tipo_codigo === "frete"
                    ? "Frete Grátis"
                    : c.tipo_codigo === "percentual"
                    ? `${Number(c.desconto || 0)}%`
                    : `R$ ${Number(c.desconto || 0).toFixed(2)}`}
                </strong>
              </div>

              <div className="linha">
                <span>Uso</span>
                <strong>
                  {c.usado} / {c.limite_uso ?? "∞"}
                </strong>
              </div>

              <div className="linha">
                <span>Validade</span>
                <strong>
                  {c.inicio} → {c.expiracao}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSS */}
      <style jsx global>{`
        .cupons-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 20px;
          font-family: "Inter", sans-serif;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-header h1 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 24px;
          color: #111827;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn.primary {
          background: linear-gradient(135deg, #ec4899, #3b82f6);
          color: #fff;
        }

        .btn.primary:hover {
          opacity: 0.9;
        }

        .btn.secondary {
          background: #1f2937;
          border: 1px solid #374151;
          color: #fff;
        }

        .btn.secondary:hover {
          opacity: 0.9;
        }

        .info {
          text-align: center;
          color: #6b7280;
          padding: 40px;
          font-size: 16px;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .cupom-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.2s;
        }

        .cupom-card:hover {
          transform: translateY(-4px);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .badges {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .status {
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status.publicado {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .status.desativado {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .status.ativo {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .badge-publico {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-publico.publico {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .badge-publico.privado {
          background: rgba(107, 114, 128, 0.15);
          color: #6b7280;
        }

        .acoes {
          display: flex;
          gap: 6px;
        }

        .icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .icon.edit {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .icon.edit:hover {
          background: rgba(59, 130, 246, 0.25);
        }

        .icon.delete {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .icon.delete:hover {
          background: rgba(239, 68, 68, 0.25);
        }

        .icon.publish {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .icon.publish:hover {
          background: rgba(16, 185, 129, 0.25);
        }

        .codigo {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }

        .descricao {
          font-size: 14px;
          color: #6b7280;
        }

        .linha {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          border-top: 1px dashed #e5e7eb;
          padding-top: 6px;
        }

        .linha span {
          color: #6b7280;
        }

        .linha strong {
          color: #111827;
        }
      `}</style>
    </div>
  );
}
