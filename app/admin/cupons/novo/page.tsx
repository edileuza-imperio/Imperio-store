"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface TipoCupom {
  id_tipo: number;
  nome: string;
  codigo: "percentual" | "valor" | "frete";
}

export default function NovoCupomPage() {
  const router = useRouter();

  const [tipos, setTipos] = useState<TipoCupom[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    codigo: "",
    descricao: "",
    tipo_id: "",
    desconto: "",
    valor_minimo: "",
    limite_uso: "",
    inicio: "",
    expiracao: "",
  });

  const tipoSelecionado = tipos.find(
    (t) => String(t.id_tipo) === String(form.tipo_id)
  );

  /* =========================
     LOAD TIPOS
  ========================= */
  useEffect(() => {
    api
      .get("/admin/cupom/tipos", { withCredentials: true })
      .then((res) => setTipos(res.data?.dados || []))
      .catch(() => toast.error("Erro ao carregar tipos"));
  }, []);

  /* =========================
     AUTO AJUSTE
  ========================= */
  useEffect(() => {
    if (tipoSelecionado?.codigo === "frete") {
      setForm((prev) => ({ ...prev, desconto: "0" }));
    }
  }, [tipoSelecionado]);

  /* =========================
     HELPERS
  ========================= */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function gerarCodigo() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const random = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");

    setForm((prev) => ({ ...prev, codigo: `PROMO-${random}` }));
    toast.info("Código gerado automaticamente");
  }

  /* =========================
     SALVAR
  ========================= */
  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    if (!form.codigo || !form.tipo_id) {
      toast.warning("Código e tipo são obrigatórios");
      return;
    }

    if (
      tipoSelecionado?.codigo !== "frete" &&
      Number(form.desconto) <= 0
    ) {
      toast.warning("Desconto inválido");
      return;
    }

    if (
      form.inicio &&
      form.expiracao &&
      new Date(form.expiracao) < new Date(form.inicio)
    ) {
      toast.warning("Expiração deve ser maior que início");
      return;
    }

    const payload = {
      codigo: form.codigo,
      tipo_id: Number(form.tipo_id),
      desconto:
        tipoSelecionado?.codigo === "frete"
          ? 0
          : Number(form.desconto),
      valor_minimo: Number(form.valor_minimo) || 0,
      limite_uso: form.limite_uso ? Number(form.limite_uso) : null,
      inicio: form.inicio || null,
      expiracao: form.expiracao || null,
      descricao: form.descricao || "",
      statusid: 1,
    };

    try {
      setSalvando(true);
      await api.post("/admin/cupom/criar", payload, {
        withCredentials: true,
      });
      toast.success("Cupom criado com sucesso!");
      setTimeout(() => router.push("/admin/cupons"), 1200);
    } catch {
      toast.error("Erro ao criar cupom");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <ToastContainer />

      <div className="page">
        {/* FORM */}
        <div className="card">
          <header>
            <h1>Criar cupom</h1>
            <p>Defina regras, validade e tipo de desconto</p>
          </header>

          <form onSubmit={salvar}>
            <div className="field">
              <label>Código</label>
              <div className="code">
                <input
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  placeholder="PROMO-XXXX"
                />
                <button type="button" onClick={gerarCodigo}>
                  Gerar
                </button>
              </div>
            </div>

            <div className="grid">
              <div className="field">
                <label>Tipo de cupom</label>
                <select
                  name="tipo_id"
                  value={form.tipo_id}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  {tipos.map((t) => (
                    <option key={t.id_tipo} value={t.id_tipo}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Desconto</label>
                <input
                  type="number"
                  step="0.01"
                  name="desconto"
                  disabled={tipoSelecionado?.codigo === "frete"}
                  value={form.desconto}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Valor mínimo</label>
                <input
                  type="number"
                  step="0.01"
                  name="valor_minimo"
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Limite de uso</label>
                <input
                  type="number"
                  name="limite_uso"
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Início</label>
                <input type="date" name="inicio" onChange={handleChange} />
              </div>

              <div className="field">
                <label>Expiração</label>
                <input type="date" name="expiracao" onChange={handleChange} />
              </div>
            </div>

            <div className="field">
              <label>Descrição</label>
              <input
                name="descricao"
                onChange={handleChange}
                placeholder="Ex: Cupom de boas-vindas"
              />
            </div>

            <button className="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Criar cupom"}
            </button>
          </form>
        </div>

        {/* PREVIEW */}
        <div className="preview">
          <span>Preview</span>
          <h2>{form.codigo || "CÓDIGO"}</h2>

          <strong>
            {tipoSelecionado?.codigo === "percentual" &&
              `${form.desconto || 0}% OFF`}
            {tipoSelecionado?.codigo === "valor" &&
              `R$ ${form.desconto || 0} OFF`}
            {tipoSelecionado?.codigo === "frete" && "Frete grátis"}
          </strong>

          <p>
            {form.inicio || "—"} → {form.expiracao || "—"}
          </p>

          <small>
            Mínimo R$ {form.valor_minimo || 0} · Uso{" "}
            {form.limite_uso || "ilimitado"}
          </small>
        </div>
      </div>

      {/* STYLES */}
      <style jsx>{`
        .page {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 32px;
          padding: 40px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .card {
          background: #fff;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
        }

        header h1 {
          font-size: 24px;
        }

        header p {
          color: #64748b;
          margin-bottom: 24px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }

        input,
        select {
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .code {
          display: flex;
          gap: 8px;
        }

        .code button {
          padding: 0 16px;
          background: #0f172a;
          color: #fff;
          border-radius: 10px;
          font-size: 13px;
        }

        .submit {
          width: 100%;
          margin-top: 24px;
          background: #0f172a;
          color: #fff;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
        }

        .preview {
          background: #0f172a;
          color: #fff;
          padding: 32px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .preview span {
          font-size: 12px;
          opacity: 0.7;
          text-transform: uppercase;
        }

        .preview h2 {
          font-size: 28px;
          letter-spacing: 1px;
        }

        .preview strong {
          font-size: 20px;
        }

        .preview small {
          opacity: 0.7;
        }
      `}</style>
    </>
  );
}
