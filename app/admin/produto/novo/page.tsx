"use client";

import { useEffect, useMemo, useState, ChangeEvent } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft, FaImage, FaSave, FaTag, FaBoxes } from "react-icons/fa";
import { rotas } from "@/components/Bibioteca/config/rotas";

interface Status {
  id_status: number;
  nome: string;
  descricao?: string; // ✅ agora traz descrição
  cor?: string;
}

export default function CadastroProdutoPage() {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");

  const [preco, setPreco] = useState<number | "">("");
  const [precoPromocional, setPrecoPromocional] = useState<number | "">("");

  const [estoque, setEstoque] = useState<number | "">("");
  const [ilimitado, setIlimitado] = useState(false);

  const [modelo, setModelo] = useState("");
  const [parcelamento, setParcelamento] = useState("");
  const [sku, setSku] = useState("");

  const [statusList, setStatusList] = useState<Status[]>([]);
  const [statusId, setStatusId] = useState<number | "">("");

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const statusSelecionado = useMemo(
    () => statusList.find((s) => s.id_status === statusId) ?? null,
    [statusList, statusId]
  );

  // ✅ helper de slug / sku
  const normalize = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const makeSlug = (v: string) =>
    normalize(v)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "");

  const makeSku = (v: string) => {
    if (!v) return "";
    const stamp = Date.now().toString().slice(-5);
    const base = normalize(v)
      .toUpperCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .slice(0, 10);
    return `${base}-${stamp}`;
  };

  // ✅ contraste do status
  const getContraste = (cor?: string) => {
    if (!cor) return "#111827";
    const hex = cor.replace("#", "");
    if (hex.length !== 6) return "#111827";
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#111827" : "#ffffff";
  };

  // ✅ carrega status (rota nova)
  useEffect(() => {
    const carregarStatus = async () => {
      try {
        const res = await api.get(rotas.admin.api.produtosStatus);
        const dados = res.data?.dados ?? res.data ?? [];
        const list = Array.isArray(dados) ? dados : Array.isArray(dados?.dados) ? dados.dados : [];

        setStatusList(list);
        setStatusId(list?.[0]?.id_status ?? "");
      } catch (err: any) {
        console.error("Erro ao carregar status:", err?.response?.data || err?.message || err);
        toast.error("Erro ao carregar status");
      }
    };

    carregarStatus();
  }, []);

  // ✅ gera slug e sku quando nome muda
  useEffect(() => {
    setSlug(makeSlug(nome));
    setSku(makeSku(nome));
  }, [nome]);

  // ✅ image change + cleanup
  const handleImagemChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);

    if (preview) URL.revokeObjectURL(preview);

    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (!f) return;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const formatMoney = (v: number | "") => {
    if (v === "") return "";
    return v;
  };

  const parseNumber = (v: string): number | "" => {
    if (!v) return "";
    const n = Number(v);
    return Number.isFinite(n) ? n : "";
  };

  // ✅ submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nomeTrim = nome.trim();
    if (!nomeTrim) return toast.warning("Informe o nome");
    if (preco === "" || Number(preco) <= 0) return toast.warning("Informe um preço válido");
    if (!ilimitado && (estoque === "" || Number(estoque) < 0)) return toast.warning("Informe o estoque");
    if (!statusId) return toast.warning("Selecione um status");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nome", nomeTrim);
      formData.append("slug", slug);
      formData.append("descricao", descricao);
      formData.append("preco", String(preco));
      if (precoPromocional !== "") formData.append("preco_promocional", String(precoPromocional));
      formData.append("estoque", String(ilimitado ? 0 : estoque));
      formData.append("ilimitado", ilimitado ? "1" : "0");
      formData.append("modelo", modelo);
      formData.append("parcelamento", parcelamento);
      formData.append("sku", sku);
      formData.append("statusid", String(statusId));
      if (file) formData.append("imagem", file);

      // ⚠️ mantém sua rota atual (se você já centralizou depois, troca aqui)
      await api.post("/admin/produto/criar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Produto cadastrado com sucesso!");

      // reset
      setNome("");
      setSlug("");
      setDescricao("");
      setPreco("");
      setPrecoPromocional("");
      setEstoque("");
      setIlimitado(false);
      setModelo("");
      setParcelamento("");
      setSku("");
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setStatusId(statusList?.[0]?.id_status ?? "");
    } catch (err: any) {
      console.error("Erro ao criar produto:", err?.response?.data || err?.message || err);
      toast.error(err?.response?.data?.mensagem || "Erro ao criar produto, veja o console");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 cadastro-bg">
      <ToastContainer position="top-right" />

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="page-title">Cadastrar Produto</h1>
          <p className="page-subtitle">Crie um produto com imagem, descrição e status.</p>
        </div>

        <Link href="/admin/produtos" className="btn btn-dark-soft">
          <FaArrowLeft /> Voltar
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* COL ESQ */}
          <div className="col-lg-4">
            <div className="cardx">
              <div className="cardx-head">
                <div className="cardx-title">
                  <FaImage /> Imagem
                </div>
                <div className="cardx-sub">PNG/JPG • arraste e solte</div>
              </div>

              <label
                className={`upload ${preview ? "has" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview" />
                ) : (
                  <div className="upload-empty">
                    <div className="upload-ico">
                      <FaImage />
                    </div>
                    <div className="upload-text">
                      <b>Clique para enviar</b> ou arraste a imagem aqui
                    </div>
                    <div className="upload-hint">Tamanho recomendado: 1200×1200</div>
                  </div>
                )}

                <input type="file" hidden accept="image/*" onChange={handleImagemChange} />
              </label>

              <div className="mini-row">
                <div className="mini">
                  <span className="mini-label">Slug</span>
                  <span className="mini-value">{slug || "—"}</span>
                </div>
                <div className="mini">
                  <span className="mini-label">SKU</span>
                  <span className="mini-value">{sku || "—"}</span>
                </div>
              </div>
            </div>

            <div className="cardx mt-4">
              <div className="cardx-head">
                <div className="cardx-title">
                  <FaTag /> Status
                </div>
                <div className="cardx-sub">Selecione o status do produto</div>
              </div>

              <select
                className="form-select inputx"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value ? Number(e.target.value) : "")}
                disabled={!statusList.length}
              >
                {!statusList.length && <option value="">Carregando...</option>}
                {statusList.map((s) => (
                  <option key={s.id_status} value={s.id_status}>
                    {s.nome}
                    {s.descricao ? ` — ${s.descricao}` : ""}
                  </option>
                ))}
              </select>

              {statusSelecionado && (
                <div className="status-preview">
                  <span
                    className="status-pill"
                    style={{
                      background: statusSelecionado.cor || "#6b4c4f",
                      color: getContraste(statusSelecionado.cor),
                    }}
                  >
                    {statusSelecionado.nome}
                  </span>
                  {statusSelecionado.descricao && (
                    <div className="status-desc">{statusSelecionado.descricao}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COL DIR */}
          <div className="col-lg-8">
            <div className="cardx">
              <div className="cardx-head">
                <div className="cardx-title">
                  <FaBoxes /> Dados do produto
                </div>
                <div className="cardx-sub">Campos essenciais + descrição</div>
              </div>

              <div className="row g-3">
                <div className="col-md-8">
                  <label className="lbl">Nome *</label>
                  <input
                    className="form-control inputx"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Kit Perfume + Hidratante"
                  />
                </div>

                <div className="col-md-4">
                  <label className="lbl">Modelo</label>
                  <input
                    className="form-control inputx"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Ex: 2026"
                  />
                </div>

                <div className="col-12">
                  <label className="lbl">Descrição</label>
                  <textarea
                    className="form-control inputx"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva benefícios, tamanho, detalhes do produto..."
                    rows={5}
                  />
                  <div className="hintx">
                    Dica: use 2–4 linhas com o que é, para quem é, e o diferencial.
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="lbl">Preço *</label>
                  <input
                    type="number"
                    className="form-control inputx"
                    value={formatMoney(preco)}
                    onChange={(e) => setPreco(parseNumber(e.target.value))}
                    min={0}
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>

                <div className="col-md-4">
                  <label className="lbl">Preço promocional</label>
                  <input
                    type="number"
                    className="form-control inputx"
                    value={formatMoney(precoPromocional)}
                    onChange={(e) => setPrecoPromocional(parseNumber(e.target.value))}
                    min={0}
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>

                <div className="col-md-4">
                  <label className="lbl">Parcelamento</label>
                  <input
                    className="form-control inputx"
                    value={parcelamento}
                    onChange={(e) => setParcelamento(e.target.value)}
                    placeholder="Ex: 10x sem juros"
                  />
                </div>

                <div className="col-md-4">
                  <label className="lbl">Estoque {!ilimitado ? "*" : ""}</label>
                  <input
                    type="number"
                    className="form-control inputx"
                    value={estoque}
                    onChange={(e) => setEstoque(parseNumber(e.target.value))}
                    disabled={ilimitado}
                    min={0}
                    step="1"
                    placeholder={ilimitado ? "Ilimitado" : "0"}
                  />
                </div>

                <div className="col-md-8 d-flex align-items-end">
                  <div className="toggle">
                    <input
                      id="ilimitado"
                      type="checkbox"
                      checked={ilimitado}
                      onChange={() => setIlimitado((v) => !v)}
                    />
                    <label htmlFor="ilimitado">
                      Produto ilimitado <span>(não controla estoque)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="actions">
                <button className="btn btn-gold" disabled={loading} type="submit">
                  <FaSave /> {loading ? "Salvando..." : "Salvar produto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <style jsx global>{`
        .cadastro-bg {
          background: #f5f6fa;
          min-height: 100vh;
        }

        .page-title {
          font-weight: 900;
          color: #2c2f33;
          margin: 0;
        }
        .page-subtitle {
          color: #8a8f98;
          margin: 4px 0 0;
        }

        .btn-dark-soft {
          background: #6b4c4f;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .cardx {
          background: #fff;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(15, 23, 42, 0.06);
        }

        .cardx-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .cardx-title {
          font-weight: 900;
          color: #111827;
          display: inline-flex;
          gap: 10px;
          align-items: center;
        }

        .cardx-sub {
          font-size: 12px;
          color: #94a3b8;
        }

        .upload {
          height: 320px;
          border-radius: 16px;
          border: 1px dashed rgba(15, 23, 42, 0.18);
          background: linear-gradient(180deg, rgba(245, 246, 250, 0.6), rgba(245, 246, 250, 1));
          display: grid;
          place-items: center;
          cursor: pointer;
          overflow: hidden;
          transition: 0.18s ease;
        }

        .upload:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 40px rgba(2, 6, 23, 0.08);
          border-color: rgba(212, 175, 55, 0.55);
        }

        .upload.has {
          border-style: solid;
        }

        .upload img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .upload-empty {
          text-align: center;
          padding: 16px;
        }

        .upload-ico {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: rgba(212, 175, 55, 0.16);
          border: 1px solid rgba(212, 175, 55, 0.22);
          display: grid;
          place-items: center;
          margin: 0 auto 10px;
          color: #6b4c4f;
          font-size: 22px;
        }

        .upload-text {
          color: #475569;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .upload-hint {
          color: #94a3b8;
          font-size: 12px;
        }

        .mini-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        .mini {
          background: rgba(245, 246, 250, 0.8);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 14px;
          padding: 10px 12px;
        }

        .mini-label {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 2px;
        }

        .mini-value {
          font-weight: 800;
          color: #111827;
          font-size: 12px;
          word-break: break-all;
        }

        .lbl {
          font-size: 12px;
          font-weight: 800;
          color: #334155;
          margin-bottom: 6px;
        }

        .inputx {
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(15, 23, 42, 0.10);
        }

        .inputx:focus {
          border-color: rgba(212, 175, 55, 0.75);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.14);
        }

        .hintx {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 6px;
        }

        .toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(245, 246, 250, 0.8);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 14px;
          padding: 10px 12px;
          width: 100%;
        }

        .toggle input {
          width: 18px;
          height: 18px;
        }

        .toggle label {
          font-weight: 800;
          color: #111827;
        }

        .toggle label span {
          font-weight: 600;
          color: #64748b;
          margin-left: 6px;
          font-size: 12px;
        }

        .status-preview {
          margin-top: 10px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          background: rgba(245, 246, 250, 0.7);
        }

        .status-pill {
          padding: 6px 14px;
          border-radius: 999px;
          font-weight: 900;
          display: inline-block;
          user-select: none;
        }

        .status-desc {
          margin-top: 8px;
          font-size: 12px;
          color: #64748b;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
        }

        .btn-gold {
          background: #d4af37;
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 12px 16px;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .btn-gold:hover {
          background: #c9a633;
        }

        .btn-gold:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}