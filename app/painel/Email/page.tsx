"use client";

import { useMemo, useState } from "react";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPaperPlane, FaCopy, FaTrash, FaEnvelopeOpenText } from "react-icons/fa";

export default function EmailPage() {
  const [para, setPara] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  const podeEnviar = useMemo(() => {
    return para.trim() && assunto.trim() && mensagem.trim();
  }, [para, assunto, mensagem]);

  async function copiarTexto(txt: string) {
    try {
      await navigator.clipboard.writeText(txt);
      toast.success("Copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  function limpar() {
    setPara("");
    setAssunto("");
    setMensagem("");
  }

  async function enviar() {
    if (!podeEnviar) {
      toast.error("Preencha Para, Assunto e Mensagem.");
      return;
    }

    try {
      setLoading(true);

      // ✅ rota do seu backend (criaremos abaixo)
      // POST /admin/email/enviar
      await api.post(
        "/admin/email/enviar",
        { para, assunto, mensagem },
        { withCredentials: true }
      );

      toast.success("Email enviado com sucesso!");
      limpar();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.mensagem || "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p">
      <ToastContainer position="top-right" autoClose={2400} newestOnTop theme="light" />

      <div className="head">
        <div className="left">
          <div className="kicker">
            <span className="dot" />
            Painel
          </div>
          <h1 className="title">
            <FaEnvelopeOpenText /> Emails
          </h1>
          <p className="sub">Envie emails para clientes/usuários diretamente do painel.</p>
        </div>

        <div className="right">
          <button className="btn ghost" onClick={limpar} disabled={loading}>
            <FaTrash /> Limpar
          </button>
          <button className="btn primary" onClick={enviar} disabled={loading || !podeEnviar}>
            <FaPaperPlane /> {loading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <label className="lbl">Para</label>
          <div className="field">
            <input
              value={para}
              onChange={(e) => setPara(e.target.value)}
              placeholder="email@exemplo.com"
              type="email"
              autoComplete="email"
            />
            <button className="iconBtn" onClick={() => copiarTexto(para)} disabled={!para}>
              <FaCopy />
            </button>
          </div>
        </div>

        <div className="row">
          <label className="lbl">Assunto</label>
          <input
            className="input"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Assunto do email..."
          />
        </div>

        <div className="row">
          <label className="lbl">Mensagem</label>
          <textarea
            className="textarea"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Digite sua mensagem..."
            rows={10}
          />
          <div className="hint">
            Dica: você pode escrever normal (texto simples). Se quiser HTML depois, eu te monto um template.
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(:root) {
          --ink: #0b1220;
          --muted: rgba(11, 18, 32, 0.62);
          --line: rgba(11, 18, 32, 0.10);
          --primary: #6d28d9;
          --primary2: #8b5cf6;
          --card: rgba(255, 255, 255, 0.78);
          --shadow: 0 18px 60px rgba(11, 18, 32, 0.10);
        }

        .p {
          padding: 18px 18px 28px;
          border-radius: 18px;
          min-height: 92vh;
          background:
            radial-gradient(1200px 520px at 12% -10%, rgba(109, 40, 217, 0.12), transparent 60%),
            radial-gradient(980px 520px at 90% -10%, rgba(245, 158, 11, 0.10), transparent 60%),
            linear-gradient(180deg, rgba(11, 18, 32, 0.03), transparent 50%);
        }

        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.68);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          backdrop-filter: blur(14px);
          margin-bottom: 12px;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(11, 18, 32, 0.04);
          border: 1px solid rgba(11, 18, 32, 0.08);
          color: rgba(11, 18, 32, 0.70);
          font-size: 0.82rem;
          font-weight: 950;
          width: fit-content;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          box-shadow: 0 0 0 5px rgba(139, 92, 246, 0.18);
        }

        .title {
          margin: 10px 0 6px;
          font-size: 2rem;
          font-weight: 1000;
          letter-spacing: -0.03em;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sub {
          margin: 0;
          color: var(--muted);
          font-weight: 650;
        }

        .right {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .btn {
          height: 44px;
          padding: 0 14px;
          border-radius: 14px;
          font-weight: 950;
          border: 1px solid var(--line);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          color: var(--ink);
          box-shadow: 0 10px 26px rgba(11, 18, 32, 0.08);
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow);
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .btn.primary {
          color: #fff;
          background: linear-gradient(135deg, var(--primary), var(--primary2));
          border-color: rgba(255, 255, 255, 0.22);
        }
        .btn.ghost {
          background: rgba(255, 255, 255, 0.74);
        }

        .card {
          border-radius: 18px;
          background: var(--card);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          overflow: hidden;
          backdrop-filter: blur(14px);
          padding: 16px;
          display: grid;
          gap: 14px;
        }

        .row {
          display: grid;
          gap: 8px;
        }

        .lbl {
          font-weight: 950;
          color: rgba(11, 18, 32, 0.78);
          font-size: 13px;
        }

        .field {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .input,
        .field input,
        .textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(11, 18, 32, 0.12);
          background: rgba(255, 255, 255, 0.92);
          padding: 12px 12px;
          outline: none;
          font-weight: 750;
          color: var(--ink);
        }

        .textarea {
          resize: vertical;
          min-height: 220px;
        }

        .iconBtn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(11, 18, 32, 0.12);
          background: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          display: grid;
          place-items: center;
          color: rgba(11, 18, 32, 0.78);
        }
        .iconBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hint {
          font-size: 12px;
          color: rgba(11, 18, 32, 0.55);
          font-weight: 650;
        }
      `}</style>
    </div>
  );
}