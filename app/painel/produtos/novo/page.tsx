"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";

type Categoria = {
  id_categoria: number;
  nome: string;
};

type Status = {
  id_status?: number;
  id?: number;
  nome?: string;
  titulo?: string;
};

type ProdutoForm = {
  nome: string;
  slug: string;
  descricao: string;
  preco: string;
  preco_promocional: string;
  estoque: string;
  ilimitado: boolean;
  categoria_id: string;
  statusid: string;
  catalogo: boolean;
  sku: string;
  modelo: string;
  imagem: File | null;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NovoProdutoPage() {

  const router = useRouter();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState<ProdutoForm>({
    nome: "",
    slug: "",
    descricao: "",
    preco: "",
    preco_promocional: "",
    estoque: "0",
    ilimitado: false,
    categoria_id: "",
    statusid: "",
    catalogo: true,
    sku: "",
    modelo: "",
    imagem: null,
  });

  async function carregarDados() {
    try {

      const [resCategorias, resStatus] = await Promise.all([
        api.get("/admin/categorias"),
        api.get("/admin/produtos/status"),
      ]);

      setCategorias(resCategorias.data?.dados || []);
      setStatusList(resStatus.data?.dados || []);

    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {

    if (!form.imagem) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(form.imagem);
    setPreview(url);

    return () => URL.revokeObjectURL(url);

  }, [form.imagem]);

  function handleChange<K extends keyof ProdutoForm>(
    campo: K,
    valor: ProdutoForm[K]
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleNome(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      nome: value,
      slug: slugify(value),
    }));
  }

  async function salvarProduto(e: FormEvent) {

    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do produto");
      return;
    }

    try {

      setSalvando(true);

      const body = new FormData();

      body.append("nome", form.nome);
      body.append("slug", form.slug);
      body.append("descricao", form.descricao);
      body.append("preco", form.preco.replace(",", "."));
      body.append("preco_promocional", form.preco_promocional.replace(",", "."));
      body.append("estoque", form.estoque);
      body.append("ilimitado", form.ilimitado ? "1" : "0");
      body.append("catalogo", form.catalogo ? "1" : "0");
      body.append("sku", form.sku);
      body.append("modelo", form.modelo);

      if (form.categoria_id) body.append("categoria_id", form.categoria_id);
      if (form.statusid) body.append("statusid", form.statusid);
      if (form.imagem) body.append("imagem", form.imagem);

      await api.post("/admin/produto/criar", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Produto cadastrado com sucesso");

      router.push("/admin/produtos");

    } catch (error: any) {

      console.error(error);

      alert(
        error?.response?.data?.mensagem ||
        "Erro ao cadastrar produto"
      );

    } finally {

      setSalvando(false);

    }
  }

  return (
    <div className="page">

      <div className="top">

        <div>
          <span className="badge">Cadastro</span>
          <h1>Novo produto</h1>
          <p>Cadastre um novo produto no catálogo.</p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => router.push("/admin/produtos")}
        >
          Voltar
        </button>

      </div>

      <form className="form" onSubmit={salvarProduto}>

        <div className="grid">

          <div className="full">
            <label>Nome</label>
            <input
              value={form.nome}
              onChange={handleNome}
            />
          </div>

          <div>
            <label>Slug</label>
            <input
              value={form.slug}
              onChange={(e) => handleChange("slug", slugify(e.target.value))}
            />
          </div>

          <div>
            <label>SKU</label>
            <input
              value={form.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
            />
          </div>

          <div>
            <label>Modelo</label>
            <input
              value={form.modelo}
              onChange={(e) => handleChange("modelo", e.target.value)}
            />
          </div>

          <div>
            <label>Categoria</label>
            <select
              value={form.categoria_id}
              onChange={(e) => handleChange("categoria_id", e.target.value)}
            >
              <option value="">Selecione</option>

              {categorias.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nome}
                </option>
              ))}

            </select>
          </div>

          <div>
            <label>Status</label>
            <select
              value={form.statusid}
              onChange={(e) => handleChange("statusid", e.target.value)}
            >
              <option value="">Selecione</option>

              {statusList.map((status, i) => {

                const id = status.id_status ?? status.id ?? i;

                return (
                  <option key={id} value={id}>
                    {status.nome || status.titulo}
                  </option>
                );

              })}
            </select>
          </div>

          <div className="full">
            <label>Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
            />
          </div>

          <div>
            <label>Preço</label>
            <input
              value={form.preco}
              onChange={(e) => handleChange("preco", e.target.value)}
            />
          </div>

          <div>
            <label>Preço promocional</label>
            <input
              value={form.preco_promocional}
              onChange={(e) => handleChange("preco_promocional", e.target.value)}
            />
          </div>

          <div>
            <label>Estoque</label>
            <input
              type="number"
              value={form.estoque}
              onChange={(e) => handleChange("estoque", e.target.value)}
            />
          </div>

          <div className="checks">

            <label>
              <input
                type="checkbox"
                checked={form.catalogo}
                onChange={(e) => handleChange("catalogo", e.target.checked)}
              />
              Visível no catálogo
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.ilimitado}
                onChange={(e) => handleChange("ilimitado", e.target.checked)}
              />
              Estoque ilimitado
            </label>

          </div>

          <div>
            <label>Imagem principal</label>
            <input
              type="file"
              onChange={(e) => handleChange("imagem", e.target.files?.[0] || null)}
            />
          </div>

          <div className="preview">

            {preview
              ? <img src={preview} />
              : <span>Sem imagem</span>
            }

          </div>

        </div>

        <div className="actions">

          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push("/admin/produtos")}
          >
            Cancelar
          </button>

          <button
            className="btn-primary"
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Cadastrar produto"}
          </button>

        </div>

      </form>

      <style jsx>{`

      .page{
        padding:30px;
      }

      .top{
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:25px;
      }

      .badge{
        background:#fff1f5;
        padding:6px 12px;
        border-radius:999px;
        font-size:12px;
        font-weight:700;
      }

      .form{
        background:white;
        padding:25px;
        border-radius:20px;
        border:1px solid #eee;
      }

      .grid{
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:16px;
      }

      .full{
        grid-column:1/-1;
      }

      input,select,textarea{
        width:100%;
        padding:10px;
        border-radius:10px;
        border:1px solid #ddd;
      }

      textarea{
        min-height:120px;
      }

      .checks{
        display:flex;
        flex-direction:column;
        justify-content:center;
        gap:10px;
      }

      .preview{
        border:1px dashed #ddd;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:10px;
        height:140px;
      }

      .preview img{
        width:100%;
        height:100%;
        object-fit:cover;
      }

      .actions{
        display:flex;
        justify-content:flex-end;
        gap:10px;
        margin-top:20px;
      }

      .btn-primary{
        background:#e11d74;
        color:white;
        border:none;
        padding:10px 18px;
        border-radius:10px;
      }

      .btn-secondary{
        background:#eee;
        border:none;
        padding:10px 18px;
        border-radius:10px;
      }

      `}</style>

    </div>
  );
}