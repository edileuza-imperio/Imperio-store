'use client';

import { useState, useEffect, ChangeEvent } from "react";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface Status {
  id_status: number;
  nome: string;
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
  const [statusSelecionado, setStatusSelecionado] = useState<Status | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Carrega os status do backend
  useEffect(() => {
    const carregarStatus = async () => {
      try {
        const res = await api.get("/admin/status");
        const dados = res.data.dados || [];
        setStatusList(dados);
        setStatusSelecionado(dados[0] || null);
      } catch (err: any) {
        console.error("Erro ao carregar status:", err.response?.data || err.message || err);
      }
    };
    carregarStatus();
  }, []);

  // Gera slug automaticamente
  useEffect(() => {
    setSlug(
      nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
    );

    // Gera SKU automático: nome + timestamp
    if (nome) {
      const timestamp = Date.now();
      const skuGenerated = nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .substring(0, 8) + "-" + timestamp.toString().slice(-5);
      setSku(skuGenerated);
    } else {
      setSku("");
    }
  }, [nome]);

  const handleImagemChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const toggleStatus = () => {
    if (!statusSelecionado) return;
    const idx = statusList.findIndex(s => s.id_status === statusSelecionado.id_status);
    setStatusSelecionado(statusList[(idx + 1) % statusList.length]);
  };

  const getContraste = (cor?: string) => {
    if (!cor) return "#000";
    const hex = cor.replace("#", "");
    if (hex.length !== 6) return "#000";
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000" : "#fff";
  };

  // ===== SUBMIT DO FORM =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!nome || preco === "" || (!ilimitado && estoque === "") || !statusSelecionado) {
      toast.warning("Preencha todos os campos obrigatórios");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("slug", slug);
    formData.append("descricao", descricao);
    formData.append("preco", preco.toString());
    if (precoPromocional !== "") formData.append("preco_promocional", precoPromocional.toString());
    formData.append("estoque", estoque.toString());
    formData.append("ilimitado", ilimitado ? "1" : "0");
    formData.append("modelo", modelo);
    formData.append("parcelamento", parcelamento);
    formData.append("sku", sku);
    formData.append("statusid", statusSelecionado.id_status.toString());

    const file = (document.getElementById("imagemUpload") as HTMLInputElement)?.files?.[0];
    if (file) formData.append("imagem", file);

    try {
      const response = await api.post("/admin/produto/criar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Produto cadastrado com sucesso!");

      // reset form
      setNome(""); setSlug(""); setDescricao(""); setPreco(""); setPrecoPromocional("");
      setEstoque(""); setIlimitado(false); setModelo(""); setParcelamento(""); setSku(""); setPreview(null);
      setStatusSelecionado(statusList[0] || null);
    } catch (err: any) {
      console.error("Erro ao criar produto:", err.response?.data || err.message || err);
      toast.error("Erro ao criar produto, veja o console");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-bg container-fluid py-4">
      <ToastContainer />
      <h1 className="page-title">Cadastrar Produto</h1>
      <p className="page-subtitle">Informações básicas do produto</p>

      <div className="row g-4 mt-2">
        {/* UPLOAD */}
        <div className="col-lg-4">
          <label className="upload-card">
            {preview ? <img src={preview} /> : <span>Adicionar imagem</span>}
            <input id="imagemUpload" type="file" hidden accept="image/*" onChange={handleImagemChange} />
          </label>
        </div>

        {/* FORM */}
        <div className="col-lg-8">
          <form className="form-card" onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label>Nome</label>
                <input className="form-control" value={nome} onChange={e => setNome(e.target.value)} />
              </div>

              <div className="col-md-6">
                <label>Slug</label>
                <input className="form-control" value={slug} readOnly />
              </div>

              <div className="col-md-6">
                <label>Preço</label>
                <input type="number" className="form-control" value={preco} onChange={e => setPreco(Number(e.target.value))} />
              </div>

              <div className="col-md-6">
                <label>Preço Promocional</label>
                <input type="number" className="form-control" value={precoPromocional} onChange={e => setPrecoPromocional(Number(e.target.value))} />
              </div>

              <div className="col-md-6">
                <label>Estoque</label>
                <input type="number" disabled={ilimitado} className="form-control" value={estoque} onChange={e => setEstoque(Number(e.target.value))} />
              </div>

              <div className="col-md-6">
                <label>Modelo</label>
                <input type="text" className="form-control" value={modelo} onChange={e => setModelo(e.target.value)} />
              </div>

              <div className="col-md-6">
                <label>Parcelamento</label>
                <input type="text" className="form-control" value={parcelamento} onChange={e => setParcelamento(e.target.value)} />
              </div>

              <div className="col-md-6">
                <label>SKU</label>
                <input type="text" className="form-control" value={sku} readOnly />
              </div>

              <div className="col-12 d-flex align-items-center gap-2">
                <input type="checkbox" checked={ilimitado} onChange={() => setIlimitado(!ilimitado)} />
                <strong>Produto ilimitado</strong>
              </div>

              <div className="col-12 d-flex align-items-center gap-3">
                <strong>Status:</strong>
                {statusSelecionado && (
                  <span
                    className="status-pill"
                    onClick={toggleStatus}
                    style={{
                      background: statusSelecionado.cor || "#6b4c4f",
                      color: getContraste(statusSelecionado.cor)
                    }}
                  >
                    {statusSelecionado.nome}
                  </span>
                )}
              </div>
            </div>

            <button className="btn btn-primary mt-4" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Produto"}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .dashboard-bg { background: #f5f6fa; min-height: 100vh; }
        .page-title { font-weight: 700; color: #2c2f33; }
        .page-subtitle { color: #8a8f98; margin-bottom: 8px; }
        .form-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,.06); }
        .form-control { border-radius: 10px; padding: 10px 14px; }
        .form-control:focus { border-color: #d4af37; box-shadow: 0 0 0 2px rgba(212,175,55,.15); }
        .upload-card { height: 300px; background: #fff; border-radius: 18px; box-shadow: 0 10px 30px rgba(0,0,0,.08); display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: 500; color: #6b7280; }
        .upload-card img { max-width: 100%; max-height: 100%; border-radius: 14px; object-fit: contain; }
        .status-pill { padding: 6px 16px; border-radius: 999px; font-weight: 600; cursor: pointer; transition: transform .15s; }
        .status-pill:hover { transform: scale(1.06); }
        .btn-primary { background: #d4af37; border: none; }
        .btn-primary:hover { background: #c9a633; }
      `}</style>
    </div>
  );
}
