"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Status {
  id_status: number;
  nome: string;
  codigo: string;
}

export default function NovoBannerPage() {
  const [step, setStep] = useState<1 | 2>(1);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [link, setLink] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [status, setStatus] = useState<Status[]>([]);
  const [statusId, setStatusId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // ===============================
  // STATUS
  // ===============================
  useEffect(() => {
    api.get("/admin/status")
      .then(res => {
        setStatus(res.data.dados || []);
        const ativo = res.data.dados?.find((s: Status) => s.codigo === "ativo");
        if (ativo) setStatusId(ativo.id_status);
      })
      .catch(() => toast.error("Erro ao carregar status"));
  }, []);

  // ===============================
  // PREVIEW IMAGE
  // ===============================
  useEffect(() => {
    if (!imagem) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imagem);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  // ===============================
  // SALVAR
  // ===============================
  async function salvarBanner() {
    if (!titulo || !imagem || !statusId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("titulo", titulo);
      form.append("descricao", descricao);
      form.append("link", link);
      form.append("statusid", String(statusId));
      form.append("imagem", imagem);

      await api.post("/admin/banner/criar", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Banner criado com sucesso");

      setStep(1);
      setTitulo("");
      setDescricao("");
      setLink("");
      setImagem(null);
      setPreview(null);

    } catch (err: any) {
      toast.error(err.response?.data?.mensagem || "Erro ao salvar banner");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <ToastContainer />

      <header className="header">
        <h1>Novo Banner</h1>
        <p>Crie banners principais da sua loja</p>
      </header>

      {/* STEPS */}
      <div className="steps">
        <div className={`step ${step === 1 ? "active" : ""}`}>Informações</div>
        <div className={`step ${step === 2 ? "active" : ""}`}>Preview & Imagem</div>
      </div>

      <div className="layout">
        {/* FORM */}
        <div className="card">
          {step === 1 && (
            <>
              <div className="grid">
                <div>
                  <label>Título *</label>
                  <input value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>

                <div>
                  <label>Status *</label>
                  <select
                    value={statusId ?? ""}
                    onChange={e => setStatusId(Number(e.target.value))}
                  >
                    <option value="">Selecione</option>
                    {status.map(s => (
                      <option key={s.id_status} value={s.id_status}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Link</label>
                  <input value={link} onChange={e => setLink(e.target.value)} />
                </div>

                <div>
                  <label>Descrição</label>
                  <input value={descricao} onChange={e => setDescricao(e.target.value)} />
                </div>
              </div>

              <div className="actions">
                <button
                  className="primary"
                  disabled={!titulo || !statusId}
                  onClick={() => setStep(2)}
                >
                  Próximo
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <label>Imagem do Banner *</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImagem(e.target.files?.[0] || null)}
              />

              <div className="actions space">
                <button onClick={() => setStep(1)}>Voltar</button>
                <button className="primary" onClick={salvarBanner} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Banner"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* PREVIEW REAL */}
        <div className="preview-card">
          <div className="banner-preview">
            {preview ? (
              <>
                <img src={preview} />
                <div className="overlay">
                  <h2>{titulo || "Título do Banner"}</h2>
                  <p>{descricao || "Descrição do banner aparece aqui"}</p>
                </div>
              </>
            ) : (
              <span>Preview do banner</span>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .page {
          background: #f4f6f8;
          min-height: 100vh;
          padding: 40px;
        }

        .header h1 {
          font-size: 28px;
        }

        .header p {
          color: #6b7280;
          margin-bottom: 24px;
        }

        .steps {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          max-width: 1100px;
        }

        .step {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          background: #e5e7eb;
          text-align: center;
          font-weight: 600;
        }

        .step.active {
          background: #111827;
          color: #fff;
        }

        .layout {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 24px;
          max-width: 1100px;
        }

        .card {
          background: #fff;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 12px 30px rgba(0,0,0,.08);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        label {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
          display: block;
        }

        input, select {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 12px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
        }

        .actions.space {
          justify-content: space-between;
        }

        button {
          padding: 12px 18px;
          border-radius: 14px;
          border: none;
          font-weight: 600;
          background: #e5e7eb;
          cursor: pointer;
        }

        button.primary {
          background: #111827;
          color: #fff;
        }

        .preview-card {
          background: #fff;
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,.08);
        }

        .banner-preview {
          position: relative;
          height: 320px;
          border-radius: 14px;
          overflow: hidden;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .banner-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(0,0,0,.55),
            rgba(0,0,0,.15)
          );
          color: #fff;
          padding: 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 60%;
        }

        .overlay h2 {
          font-size: 26px;
          margin-bottom: 6px;
        }

        .overlay p {
          opacity: .9;
        }
      `}</style>
    </div>
  );
}
