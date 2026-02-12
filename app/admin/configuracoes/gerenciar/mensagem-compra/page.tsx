"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type MensagemCompraConfig = {
  id?: number;
  ativo: boolean;

  // canais
  enviar_email: boolean;
  enviar_whatsapp: boolean;
  enviar_sms: boolean;

  // templates
  email_assunto: string;
  email_corpo: string;

  telefone_corpo: string; // usado pra whatsapp/sms
};

const DEFAULT: MensagemCompraConfig = {
  ativo: true,
  enviar_email: true,
  enviar_whatsapp: false,
  enviar_sms: false,
  email_assunto: "Pedido #{PEDIDO_ID} confirmado ✅",
  email_corpo:
    "Olá {NOME},\n\nSeu pedido #{PEDIDO_ID} foi confirmado!\nTotal: R$ {TOTAL}\n\nAcompanhe: {LINK_PEDIDO}\n\nObrigado pela compra!",
  telefone_corpo:
    "Olá {NOME}! ✅ Pedido #{PEDIDO_ID} confirmado. Total: R$ {TOTAL}. Acompanhe: {LINK_PEDIDO}",
};

function aplicarPreview(texto: string) {
  const exemplo = {
    "{NOME}": "Maria",
    "{PEDIDO_ID}": "1234",
    "{TOTAL}": "199,90",
    "{LINK_PEDIDO}": "https://universoimperio.com.br/meus-pedidos/1234",
  };

  let out = texto;
  for (const [k, v] of Object.entries(exemplo)) out = out.split(k).join(v);
  return out;
}

export default function MensagemCompraPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<MensagemCompraConfig>(DEFAULT);

  // ✅ Ajuste estes endpoints para o que você criar no backend
  const ENDPOINT_GET = "/admin/configuracoes/mensagem-compra";
  const ENDPOINT_SAVE = "/admin/configuracoes/mensagem-compra";

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await api.get(ENDPOINT_GET);
      const dados = res.data?.dados;

      if (dados) {
        setCfg({
          ...DEFAULT,
          ...dados,
          ativo: Boolean(dados.ativo ?? DEFAULT.ativo),
          enviar_email: Boolean(dados.enviar_email ?? DEFAULT.enviar_email),
          enviar_whatsapp: Boolean(dados.enviar_whatsapp ?? DEFAULT.enviar_whatsapp),
          enviar_sms: Boolean(dados.enviar_sms ?? DEFAULT.enviar_sms),
        });
      } else {
        setCfg(DEFAULT);
      }
    } catch (err: any) {
      // Se não existir ainda, mantém default
      console.error("❌ Erro ao carregar config:", err.response?.data || err.message || err);
      setCfg(DEFAULT);
    } finally {
      setLoading(false);
    }
  };

  const salvar = async () => {
    setSaving(true);
    try {
      await api.post(ENDPOINT_SAVE, cfg);
      toast.success("Configuração salva com sucesso!");
    } catch (err: any) {
      console.error("❌ Erro ao salvar config:", err.response?.data || err.message || err);
      toast.error("Erro ao salvar configuração (veja o console)");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4 dashboard-bg">
        <div className="text-center py-5">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 dashboard-bg">
      <ToastContainer position="top-right" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold title">Mensagem Pós-Compra</h1>
          <p className="text-muted">
            Configure a mensagem que será enviada quando o pedido for finalizado.
          </p>
        </div>

        <button className="btn btn-gold" onClick={salvar} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="row g-4">
        {/* CARD: STATUS + CANAIS */}
        <div className="col-12 col-lg-4">
          <div className="card-soft p-3">
            <h5 className="mb-3">Ativação</h5>

            <label className="check-line">
              <input
                type="checkbox"
                checked={cfg.ativo}
                onChange={(e) => setCfg((c) => ({ ...c, ativo: e.target.checked }))}
              />
              <span>Ativo</span>
            </label>

            <hr />

            <h5 className="mb-2">Canais de envio</h5>

            <label className="check-line">
              <input
                type="checkbox"
                checked={cfg.enviar_email}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, enviar_email: e.target.checked }))
                }
              />
              <span>Email</span>
            </label>

            <label className="check-line">
              <input
                type="checkbox"
                checked={cfg.enviar_whatsapp}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, enviar_whatsapp: e.target.checked }))
                }
              />
              <span>WhatsApp</span>
            </label>

            <label className="check-line">
              <input
                type="checkbox"
                checked={cfg.enviar_sms}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, enviar_sms: e.target.checked }))
                }
              />
              <span>SMS</span>
            </label>

            <hr />

            <div className="small text-muted">
              Variáveis disponíveis:
              <div className="vars">
                <span>{"{NOME}"}</span>
                <span>{"{PEDIDO_ID}"}</span>
                <span>{"{TOTAL}"}</span>
                <span>{"{LINK_PEDIDO}"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD: EMAIL */}
        <div className="col-12 col-lg-8">
          <div className="card-soft p-3 mb-4">
            <h5 className="mb-3">Template Email</h5>

            <div className="mb-3">
              <label className="form-label">Assunto</label>
              <input
                className="form-control"
                value={cfg.email_assunto}
                onChange={(e) => setCfg((c) => ({ ...c, email_assunto: e.target.value }))}
                placeholder="Assunto do email"
                disabled={!cfg.enviar_email}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Corpo</label>
              <textarea
                className="form-control"
                rows={7}
                value={cfg.email_corpo}
                onChange={(e) => setCfg((c) => ({ ...c, email_corpo: e.target.value }))}
                placeholder="Mensagem do email"
                disabled={!cfg.enviar_email}
              />
            </div>

            <div className="preview">
              <div className="preview-title">Preview</div>
              <pre className="preview-box">{aplicarPreview(cfg.email_corpo)}</pre>
            </div>
          </div>

          {/* CARD: TELEFONE (WHATS/SMS) */}
          <div className="card-soft p-3">
            <h5 className="mb-3">Template Telefone (WhatsApp / SMS)</h5>

            <div className="mb-3">
              <label className="form-label">Mensagem</label>
              <textarea
                className="form-control"
                rows={5}
                value={cfg.telefone_corpo}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, telefone_corpo: e.target.value }))
                }
                placeholder="Mensagem do WhatsApp/SMS"
                disabled={!cfg.enviar_whatsapp && !cfg.enviar_sms}
              />
            </div>

            <div className="preview">
              <div className="preview-title">Preview</div>
              <pre className="preview-box">{aplicarPreview(cfg.telefone_corpo)}</pre>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .dashboard-bg { background: #f5f6fa; min-height: 100vh; }
        .title { color: #6b4c4f; }
        .btn-gold { background: #d4af37; color: #fff; border: none; padding: 10px 16px; border-radius: 10px; }
        .card-soft { background: #fff; border-radius: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
        .check-line { display: flex; align-items: center; gap: 10px; padding: 8px 0; cursor: pointer; }
        .check-line input { width: 18px; height: 18px; }
        .vars { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .vars span { background: #f1f1f1; padding: 3px 8px; border-radius: 999px; font-size: 12px; }
        .preview { margin-top: 10px; }
        .preview-title { font-weight: 700; margin-bottom: 6px; color: #6b4c4f; }
        .preview-box { background: #0b1220; color: #e5e7eb; border-radius: 12px; padding: 12px; white-space: pre-wrap; }
      `}</style>
    </div>
  );
}
