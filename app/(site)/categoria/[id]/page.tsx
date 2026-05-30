import api from "@/Api/conectar";
import Link from "next/link";

type Produto = {
  id_produto: number;
  nome: string;
  preco: string | number;
  preco_promocional?: string | number;
  imagem?: string;
  slug?: string;
  categoria_nome?: string;
  estoque?: number;
  ilimitado?: number;
  descricao?: string;
};

function formatMoney(valor: string | number | undefined) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "/sem-imagem.png";

  const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
  const clean = String(caminho).replace(/^\/+/, "");

  return `${base}/${clean}`;
}

function resumoDescricao(texto?: string, limite = 88) {
  if (!texto) return "Produto disponível nesta categoria.";

  const limpa = texto.replace(/\s+/g, " ").trim();

  if (limpa.length <= limite) return limpa;

  return `${limpa.slice(0, limite).trim()}...`;
}

// 🔥 SERVER COMPONENT (SEM useParams, SEM use client)
export default async function CategoriaPage({
  params,
}: {
  params: { id: string };
}) {
  let produtos: Produto[] = [];

  try {
    const res = await api.get(`/produtos/categoria/${params.id}`);

    const lista = Array.isArray(res.data?.dados)
      ? res.data.dados
      : Array.isArray(res.data)
      ? res.data
      : [];

    produtos = lista;
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
  }

  const nomeCategoria =
    produtos[0]?.categoria_nome || "Categoria";

  return (
    <main className="page">
      <div className="container">
        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/categoria">Categorias</Link>
          <span>›</span>
          <span>{nomeCategoria}</span>
        </div>

        {/* HERO */}
        <section className="hero">
          <h1>{nomeCategoria}</h1>
          <p>
            Explore nossa seleção de produtos desta categoria.
          </p>

          <div className="stat">
            {produtos.length}{" "}
            {produtos.length === 1 ? "Produto" : "Produtos"}
          </div>
        </section>

        {/* EMPTY */}
        {produtos.length === 0 && (
          <div className="empty">
            Nenhum produto encontrado.
          </div>
        )}

        {/* GRID */}
        <section className="grid">
          {produtos.map((produto) => {
            const precoPromocional = Number(
              produto.preco_promocional || 0
            );
            const precoNormal = Number(produto.preco || 0);

            const precoFinal =
              precoPromocional > 0
                ? precoPromocional
                : precoNormal;

            const semEstoque =
              Number(produto.ilimitado || 0) !== 1 &&
              Number(produto.estoque || 0) <= 0;

            return (
              <article key={produto.id_produto} className="card">
                {/* IMAGE */}
                <Link
                  href={`/produto/${
                    produto.slug || produto.id_produto
                  }`}
                >
                  <img
                    src={getImagemUrl(produto.imagem)}
                    alt={produto.nome}
                  />
                </Link>

                {/* INFO */}
                <div className="info">
                  <span className="cat">
                    {produto.categoria_nome || nomeCategoria}
                  </span>

                  <Link
                    href={`/produto/${
                      produto.slug || produto.id_produto
                    }`}
                  >
                    <h3>{produto.nome}</h3>
                  </Link>

                  <p>{resumoDescricao(produto.descricao)}</p>

                  <div className="price">
                    {precoPromocional > 0 && (
                      <del>
                        {formatMoney(precoNormal)}
                      </del>
                    )}

                    <strong>
                      {formatMoney(precoFinal)}
                    </strong>
                  </div>

                  <div className="actions">
                    <Link
                      href={`/produto/${
                        produto.slug || produto.id_produto
                      }`}
                      className="btn"
                    >
                      Ver produto
                    </Link>

                    {semEstoque && (
                      <span className="out">
                        Sem estoque
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}