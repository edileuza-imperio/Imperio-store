"use client";

import { useEffect, useMemo, useState, ChangeEvent } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";
import { FaImage, FaSave, FaTag, FaBoxes } from "react-icons/fa";
import { rotas } from "@/components/Bibioteca/config/rotas";

interface Status {
  id_status: number;
  nome: string;
  descricao?: string;
  cor?: string;
}

export default function NovoProdutoModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
}) {
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

  // ✅ carrega status quando abre
  useEffect(() => {
    if (!open) return;

    const carregarStatus = async () => {
      try {
        const res = await api.get(rotas.admin.api.produtosStatus, { withCredentials: true });
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
  }, [open]);

  // ✅ reseta ao abrir
  useEffect(() => {
    if (!open) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ gera slug e sku quando nome muda
  useEffect(() => {
    if (!open) return;
    setSlug(makeSlug(nome));
    setSku(makeSku(nome));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome, open]);

  // ✅ ESC fecha modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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

  const parseNumber = (v: string): number | "" => {
    if (!v) return "";
    const n = Number(v);
    return Number.isFinite(n) ? n : "";
  };

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

      // ✅ usa sua rota centralizada
      await api.post(rotas.admin.api.produtoCriar, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Produto cadastrado com sucesso!");
      if (onCreated) await onCreated();
      onClose();
    } catch (err: any) {
      console.error("Erro ao criar produto:", err?.response?.data || err?.message || err);
      toast.error(err?.response?.data?.mensagem || "Erro ao criar produto, veja o console");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="np__backdrop" onMouseDown={onClose}>
      <div className="np__modal" onMouseDown={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <header className="np__header">
          <div>
            <div className="np__kicker">Admin</div>
            <h2 className="np__title">Novo Produto</h2>
            <div className="np__sub">Cadastre rapidamente um produto com status e imagem.</div>
          </div>

          <button className="np__close" type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="np__body">
            {/* LEFT */}
            <aside className="np__left">
              <div className="np__panelTitle">
                <FaImage /> Imagem
              </div>

              <label
                className={`np__upload ${preview ? "has" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview" />
                ) : (
                  <div className="np__uploadEmpty">
                    <div className="np__uploadIcon">
                      <FaImage />
                    </div>
                    <div className="np__uploadText">
                      <b>Clique para enviar</b> ou arraste a imagem
                    </div>
                    <div className="np__hint">Recomendado: 1200×1200</div>
                  </div>
                )}

                <input type="file" hidden accept="image/*" onChange={handleImagemChange} />
              </label>

              <div className="np__miniRow">
                <div className="np__mini">
                  <span className="np__miniLabel">Slug</span>
                  <span className="np__miniValue">{slug || "—"}</span>
                </div>
                <div className="np__mini">
                  <span className="np__miniLabel">SKU</span>
                  <span className="np__miniValue">{sku || "—"}</span>
                </div>
              </div>

              <div className="np__panelTitle np__mt">
                <FaTag /> Status
              </div>

              <select
                className="np__input"
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
                <div className="np__statusPreview">
                  <span
                    className="np__pill"
                    style={{
                      background: statusSelecionado.cor || "#6b4c4f",
                      color: getContraste(statusSelecionado.cor),
                    }}
                  >
                    {statusSelecionado.nome}
                  </span>
                  {statusSelecionado.descricao && (
                    <div className="np__statusDesc">{statusSelecionado.descricao}</div>
                  )}
                </div>
              )}
            </aside>

            {/* RIGHT */}
            <section className="np__right">
              <div className="np__panelTitle">
                <FaBoxes /> Dados do produto
              </div>

              <div className="np__grid">
                <div className="np__field np__span2">
                  <label className="np__label">Nome *</label>
                  <input
                    className="np__input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Kit Perfume + Hidratante"
                  />
                </div>

                <div className="np__field">
                  <label className="np__label">Modelo</label>
                  <input
                    className="np__input"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Ex: 2026"
                  />
                </div>

                <div className="np__field np__span3">
                  <label className="np__label">Descrição</label>
                  <textarea
                    className="np__input np__textarea"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Benefícios, tamanho, detalhes do produto..."
                    rows={4}
                  />
                  <div className="np__hint">Dica: 2–4 linhas com diferencial e público-alvo.</div>
                </div>

                <div className="np__field">
                  <label className="np__label">Preço *</label>
                  <input
                    type="number"
                    className="np__input"
                    value={preco}
                    onChange={(e) => setPreco(parseNumber(e.target.value))}
                    min={0}
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>

                <div className="np__field">
                  <label className="np__label">Preço promocional</label>
                  <input
                    type="number"
                    className="np__input"
                    value={precoPromocional}
                    onChange={(e) => setPrecoPromocional(parseNumber(e.target.value))}
                    min={0}
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>

                <div className="np__field">
                  <label className="np__label">Parcelamento</label>
                  <input
                    className="np__input"
                    value={parcelamento}
                    onChange={(e) => setParcelamento(e.target.value)}
                    placeholder="Ex: 10x sem juros"
                  />
                </div>

                <div className="np__field">
                  <label className="np__label">Estoque {!ilimitado ? "*" : ""}</label>
                  <input
                    type="number"
                    className="np__input"
                    value={estoque}
                    onChange={(e) => setEstoque(parseNumber(e.target.value))}
                    disabled={ilimitado}
                    min={0}
                    step="1"
                    placeholder={ilimitado ? "Ilimitado" : "0"}
                  />
                </div>

                <div className="np__field np__span2 np__toggleWrap">
                  <label className="np__toggle">
                    <input
                      type="checkbox"
                      checked={ilimitado}
                      onChange={() => setIlimitado((v) => !v)}
                    />
                    <span>
                      Produto ilimitado <small>(não controla estoque)</small>
                    </span>
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <footer className="np__footer">
            <button type="button" className="np__btn np__btnGhost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>

            <button type="submit" className="np__btn np__btnPrimary" disabled={loading}>
              <FaSave /> {loading ? "Salvando..." : "Salvar produto"}
            </button>
          </footer>
        </form>

        <style jsx global>{`
          .np__backdrop{
            position: fixed;
            inset: 0;
            background: rgba(17,24,39,.55);
            display:flex;
            align-items:center;
            justify-content:center;
            padding: 16px;
            z-index: 9999;
            overflow:auto;
          }

          .np__modal{
            width: min(1100px, 100%);
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius: 18px;
            box-shadow: 0 18px 60px rgba(0,0,0,.25);
            overflow:hidden;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
            color:#111827;
          }

          .np__header{
            display:flex;
            justify-content:space-between;
            gap:12px;
            align-items:flex-start;
            padding: 16px 16px 12px;
            border-bottom:1px solid #e5e7eb;
            background:#fff;
          }
          .np__kicker{
            font-size: 12px;
            color: #6b7280;
            font-weight: 900;
            letter-spacing: .12em;
            text-transform: uppercase;
          }
          .np__title{
            margin: 4px 0 0;
            font-size: 18px;
            font-weight: 950;
            letter-spacing: -.02em;
          }
          .np__sub{
            margin-top: 6px;
            font-size: 12px;
            color:#6b7280;
            font-weight: 700;
          }
          .np__close{
            border:1px solid #e5e7eb;
            background:#fff;
            width:40px;
            height:40px;
            border-radius: 12px;
            cursor:pointer;
            font-weight: 900;
          }

          .np__body{
            display:grid;
            grid-template-columns: 360px 1fr;
            gap: 0;
          }
          @media (max-width: 980px){
            .np__body{ grid-template-columns: 1fr; }
          }

          .np__left{
            padding: 14px;
            border-right:1px solid #e5e7eb;
            background:#fafafa;
          }
          @media (max-width: 980px){
            .np__left{ border-right:none; border-bottom:1px solid #e5e7eb; }
          }

          .np__right{
            padding: 14px;
            background:#fff;
          }

          .np__panelTitle{
            font-weight: 950;
            display:flex;
            align-items:center;
            gap:10px;
            margin-bottom: 10px;
          }
          .np__mt{ margin-top: 14px; }

          .np__upload{
            height: 240px;
            border-radius: 16px;
            border: 1px dashed rgba(15, 23, 42, 0.18);
            background: linear-gradient(180deg, rgba(245, 246, 250, 0.6), rgba(245, 246, 250, 1));
            display: grid;
            place-items: center;
            cursor: pointer;
            overflow: hidden;
            transition: 0.18s ease;
          }
          .np__upload:hover{
            transform: translateY(-1px);
            box-shadow: 0 16px 40px rgba(2, 6, 23, 0.08);
            border-color: rgba(212, 175, 55, 0.55);
          }
          .np__upload.has{ border-style: solid; }
          .np__upload img{ width:100%; height:100%; object-fit: cover; }

          .np__uploadEmpty{ text-align:center; padding: 16px; }
          .np__uploadIcon{
            width: 56px;
            height: 56px;
            border-radius: 18px;
            background: rgba(212, 175, 55, 0.16);
            border: 1px solid rgba(212, 175, 55, 0.22);
            display:grid;
            place-items:center;
            margin: 0 auto 10px;
            color: #6b4c4f;
            font-size: 22px;
          }
          .np__uploadText{
            color:#475569;
            font-size: 14px;
            margin-bottom: 6px;
            font-weight: 800;
          }

          .np__miniRow{
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
          }
          .np__mini{
            background: rgba(245, 246, 250, 0.8);
            border: 1px solid rgba(15, 23, 42, 0.06);
            border-radius: 14px;
            padding: 10px 12px;
          }
          .np__miniLabel{
            display:block;
            font-size: 11px;
            color:#94a3b8;
            margin-bottom: 2px;
            font-weight: 800;
          }
          .np__miniValue{
            font-weight: 900;
            color:#111827;
            font-size: 12px;
            word-break: break-all;
          }

          .np__label{
            font-size: 12px;
            font-weight: 900;
            color:#334155;
            margin-bottom: 6px;
            display:block;
          }

          .np__input{
            width:100%;
            border-radius: 12px;
            padding: 10px 12px;
            border: 1px solid rgba(15, 23, 42, 0.10);
            outline:none;
            font-weight: 800;
            background:#fff;
          }

          .np__input:focus{
            border-color: rgba(212, 175, 55, 0.75);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.14);
          }

          .np__textarea{
            resize: vertical;
            min-height: 120px;
          }

          .np__hint{
            font-size: 12px;
            color:#94a3b8;
            margin-top: 6px;
            font-weight: 700;
          }

          .np__statusPreview{
            margin-top: 10px;
            padding: 12px;
            border-radius: 16px;
            border: 1px solid rgba(15, 23, 42, 0.06);
            background: rgba(245, 246, 250, 0.7);
          }
          .np__pill{
            padding: 6px 14px;
            border-radius: 999px;
            font-weight: 950;
            display:inline-block;
            user-select:none;
          }
          .np__statusDesc{
            margin-top: 8px;
            font-size: 12px;
            color:#64748b;
            font-weight: 700;
          }

          .np__grid{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }
          .np__field{ min-width:0; }
          .np__span2{ grid-column: span 2; }
          .np__span3{ grid-column: span 3; }

          @media (max-width: 980px){
            .np__grid{ grid-template-columns: 1fr; }
            .np__span2, .np__span3{ grid-column: span 1; }
          }

          .np__toggleWrap{
            display:flex;
            align-items:flex-end;
          }
          .np__toggle{
            display:flex;
            gap: 10px;
            align-items:center;
            background: rgba(245, 246, 250, 0.8);
            border: 1px solid rgba(15, 23, 42, 0.06);
            border-radius: 14px;
            padding: 10px 12px;
            width: 100%;
            font-weight: 900;
          }
          .np__toggle input{ width:18px; height:18px; }
          .np__toggle small{
            font-weight: 700;
            color:#64748b;
            margin-left: 6px;
          }

          .np__footer{
            border-top:1px solid #e5e7eb;
            padding: 12px 14px;
            display:flex;
            justify-content:flex-end;
            gap: 10px;
            background:#fff;
          }

          .np__btn{
            border:none;
            border-radius: 14px;
            padding: 10px 14px;
            font-weight: 950;
            cursor:pointer;
            display:inline-flex;
            align-items:center;
            gap: 10px;
            transition: transform .12s ease, background .12s ease, opacity .12s ease;
          }
          .np__btn:active{ transform: translateY(1px); }
          .np__btn:disabled{ opacity:.6; cursor:not-allowed; }

          .np__btnGhost{
            background:#f3f4f6;
            color:#111827;
          }
          .np__btnGhost:hover{ background:#e5e7eb; }

          .np__btnPrimary{
            background:#d4af37;
            color:#fff;
          }
          .np__btnPrimary:hover{ background:#c9a633; }
        `}</style>
      </div>
    </div>
  );
}