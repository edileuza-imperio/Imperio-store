"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";

import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";
import useCategoria from "@/Hooks/Categoria/useCategoria";

type Categoria = {
  id_categoria?: number | string;
  nome?: string;
  slug?: string;
  icone?: string;
  descricao?: string;
  imagem?: string;
};

type Produto = {
  id: number | string;
  nome: string;
  descricao?: string;
  preco?: number;
  imagem?: string;
  categoriaSlug?: string;
};

export default function ViewCategoriaSlugPage() {
  const params = useParams();
  const slugParam = String(params?.slug || "").trim().toLowerCase();

  const { categorias, loading, erro } = useCategoria();

  const lista = useMemo(() => {
    return Array.isArray(categorias) ? (categorias as Categoria[]) : [];
  }, [categorias]);

  const categoria = useMemo(() => {
    return lista.find(
      (item) => String(item?.slug || "").trim().toLowerCase() === slugParam
    );
  }, [lista, slugParam]);

  const nomeCategoria = String(categoria?.nome || "Categoria");
  const descricaoCategoria =
    String(categoria?.descricao || "").trim() ||
    "Confira os produtos disponíveis nesta categoria e encontre as melhores opções para o seu estilo de compra.";
  const iconeCategoria = String(categoria?.icone || "bi-grid");
  const slugExibicao = String(categoria?.slug || slugParam || "sem-slug");

  // PRODUTOS EXEMPLO
  // Depois você pode trocar isso por sua API ou hook real.
  const produtosMock: Produto[] = [
    {
      id: 1,
      nome: "Cesta Luxo Rosé",
      descricao: "Uma opção delicada e sofisticada para presentes especiais.",
      preco: 189.9,
      imagem:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
      categoriaSlug: "cestas",
    },
    {
      id: 2,
      nome: "Cesta Premium Encanto",
      descricao: "Itens selecionados com acabamento elegante e visual refinado.",
      preco: 249.9,
      imagem:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
      categoriaSlug: "cestas",
    },
    {
      id: 3,
      nome: "Kit Presente Momentos",
      descricao: "Perfeito para presentear com charme e personalidade.",
      preco: 129.9,
      imagem:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop",
      categoriaSlug: "presentes",
    },
    {
      id: 4,
      nome: "Arranjo Especial Floral",
      descricao: "Composição elegante para datas marcantes e celebrações.",
      preco: 99.9,
      imagem:
        "https://images.unsplash.com/photo-1526045612212-70caf35c14df?q=80&w=1200&auto=format&fit=crop",
      categoriaSlug: "flores",
    },
    {
      id: 5,
      nome: "Cesta Doce Encantada",
      descricao: "Uma combinação linda e saborosa para surpreender.",
      preco: 159.9,
      imagem:
        "https://images.unsplash.com/photo-1481391032119-d89fee407e44?q=80&w=1200&auto=format&fit=crop",
      categoriaSlug: "cestas",
    },
  ];

  const produtosDaCategoria = useMemo(() => {
    return produtosMock.filter(
      (produto) =>
        String(produto.categoriaSlug || "").trim().toLowerCase() === slugParam
    );
  }, [slugParam]);

  const formatarPreco = (valor?: number) => {
    if (typeof valor !== "number") return "Sob consulta";

    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <>
      <Navbar />

      <main className="categoria-page">
        <div className="categoria-container">
          <nav className="breadcrumb">
            <Link href="/" className="breadcrumb-link">
              Início
            </Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/categoria/viecategoria" className="breadcrumb-link">
              Categorias
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{slugExibicao}</span>
          </nav>

          {loading && (
            <div className="state-box">
              <p>Carregando categoria...</p>
            </div>
          )}

          {!loading && erro && (
            <div className="state-box error">
              <p>Erro ao carregar os dados da categoria.</p>
              <Link href="/categoria/viecategoria" className="btn-back">
                Voltar para categorias
              </Link>
            </div>
          )}

          {!loading && !erro && !categoria && (
            <div className="state-box">
              <p>Categoria não encontrada.</p>
              <Link href="/categoria/viecategoria" className="btn-back">
                Voltar para categorias
              </Link>
            </div>
          )}

          {!loading && !erro && categoria && (
            <>
              <section className="top-banner">
                <div className="top-banner-content">
                  <span className="top-chip">Categoria selecionada</span>
                  <h1>{nomeCategoria}</h1>
                  <p>
                    Veja os detalhes da categoria e, ao lado, os produtos
                    relacionados para facilitar sua navegação.
                  </p>
                </div>
              </section>

              <section className="layout-grid">
                <aside className="categoria-info">
                  <div className="categoria-icon-box">
                    <i className={`bi ${iconeCategoria} categoria-icon`} />
                  </div>

                  <span className="mini-badge">Detalhes</span>

                  <h2 className="categoria-title">{nomeCategoria}</h2>

                  <p className="categoria-description">{descricaoCategoria}</p>

                  <div className="categoria-meta">
                    <div className="meta-card">
                      <span className="meta-label">Slug</span>
                      <strong className="meta-value">{slugExibicao}</strong>
                    </div>

                    <div className="meta-card">
                      <span className="meta-label">ID</span>
                      <strong className="meta-value">
                        {String(categoria?.id_categoria || "N/A")}
                      </strong>
                    </div>

                    <div className="meta-card">
                      <span className="meta-label">Ícone</span>
                      <strong className="meta-value">{iconeCategoria}</strong>
                    </div>

                    <div className="meta-card">
                      <span className="meta-label">Status</span>
                      <strong className="meta-value">Ativa</strong>
                    </div>
                  </div>

                  <div className="categoria-actions">
                    <Link href="/categoria/viecategoria" className="btn btn-light">
                      Voltar
                    </Link>

                    <Link
                      href={`/categoria/${encodeURIComponent(slugExibicao)}`}
                      className="btn btn-primary"
                    >
                      Abrir categoria
                    </Link>
                  </div>
                </aside>

                <section className="produtos-area">
                  <div className="produtos-head">
                    <div>
                      <span className="mini-badge">Produtos</span>
                      <h2 className="produtos-title">
                        Produtos da categoria {nomeCategoria}
                      </h2>
                      <p className="produtos-subtitle">
                        Itens relacionados à categoria selecionada.
                      </p>
                    </div>

                    <div className="count-box">
                      {produtosDaCategoria.length} item
                      {produtosDaCategoria.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {produtosDaCategoria.length > 0 ? (
                    <div className="produtos-grid">
                      {produtosDaCategoria.map((produto) => (
                        <article key={produto.id} className="produto-card">
                          <div className="produto-image-wrap">
                            <img
                              src={produto.imagem || "/placeholder.png"}
                              alt={produto.nome}
                              className="produto-image"
                            />
                          </div>

                          <div className="produto-body">
                            <h3 className="produto-title">{produto.nome}</h3>
                            <p className="produto-description">
                              {produto.descricao || "Produto sem descrição."}
                            </p>

                            <div className="produto-footer">
                              <strong className="produto-price">
                                {formatarPreco(produto.preco)}
                              </strong>

                              <button type="button" className="produto-btn">
                                Ver produto
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-products">
                      <p>
                        Nenhum produto foi encontrado para esta categoria no
                        momento.
                      </p>
                    </div>
                  )}
                </section>
              </section>
            </>
          )}
        </div>

        <style jsx>{`
          .categoria-page {
            min-height: 100vh;
            background:
              radial-gradient(circle at top left, #fff1eb 0%, transparent 25%),
              radial-gradient(circle at bottom right, #fdf1ec 0%, transparent 25%),
              linear-gradient(180deg, #fffaf8 0%, #fff6f2 48%, #ffffff 100%);
            padding: 24px 16px 60px;
          }

          .categoria-container {
            max-width: 1380px;
            margin: 0 auto;
          }

          .breadcrumb {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #8f7676;
          }

          .breadcrumb-link {
            text-decoration: none;
            color: #9c6670;
            font-weight: 700;
          }

          .breadcrumb-link:hover {
            text-decoration: underline;
          }

          .breadcrumb-separator {
            color: #c3a7a7;
          }

          .breadcrumb-current {
            color: #5c4747;
            font-weight: 800;
          }

          .top-banner {
            margin-bottom: 24px;
            border: 1px solid #f0ddd7;
            border-radius: 30px;
            background:
              linear-gradient(135deg, rgba(183, 110, 121, 0.08) 0%, rgba(244, 230, 219, 0.8) 100%),
              #ffffff;
            box-shadow: 0 18px 40px rgba(138, 92, 92, 0.08);
            overflow: hidden;
          }

          .top-banner-content {
            padding: 34px 30px;
          }

          .top-banner-content h1 {
            margin: 10px 0 12px;
            font-size: clamp(30px, 5vw, 50px);
            line-height: 1.08;
            color: #352525;
            font-weight: 800;
          }

          .top-banner-content p {
            margin: 0;
            max-width: 760px;
            color: #705f5f;
            font-size: 16px;
            line-height: 1.8;
          }

          .top-chip,
          .mini-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: fit-content;
            padding: 8px 14px;
            border-radius: 999px;
            background: #f9ece7;
            color: #a3626d;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.02em;
          }

          .layout-grid {
            display: grid;
            grid-template-columns: 370px minmax(0, 1fr);
            gap: 22px;
            align-items: start;
          }

          .categoria-info {
            position: sticky;
            top: 95px;
            padding: 24px;
            border-radius: 28px;
            background: linear-gradient(180deg, #fffefe 0%, #fff6f1 100%);
            border: 1px solid #f0ddd7;
            box-shadow: 0 14px 30px rgba(0, 0, 0, 0.05);
          }

          .categoria-icon-box {
            width: 84px;
            height: 84px;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
            background: linear-gradient(135deg, #b76e79 0%, #e7c8c0 100%);
            box-shadow: 0 12px 24px rgba(183, 110, 121, 0.18);
          }

          .categoria-icon {
            font-size: 34px;
            color: #ffffff;
          }

          .categoria-title {
            margin: 14px 0 12px;
            font-size: 30px;
            line-height: 1.12;
            color: #2d2020;
            font-weight: 800;
          }

          .categoria-description {
            margin: 0;
            color: #6c5c5c;
            line-height: 1.8;
            font-size: 15px;
          }

          .categoria-meta {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 22px;
          }

          .meta-card {
            padding: 14px 16px;
            border-radius: 18px;
            background: #fffaf7;
            border: 1px solid #f2e1da;
          }

          .meta-label {
            display: block;
            margin-bottom: 6px;
            font-size: 11px;
            color: #9e7e7e;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .meta-value {
            color: #3b2a2a;
            font-size: 14px;
            word-break: break-word;
          }

          .categoria-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 22px;
          }

          .btn {
            min-height: 46px;
            padding: 0 18px;
            border-radius: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-weight: 800;
            transition: 0.2s ease;
          }

          .btn-primary {
            background: linear-gradient(135deg, #b76e79 0%, #a85f6a 100%);
            color: #ffffff;
            box-shadow: 0 12px 22px rgba(183, 110, 121, 0.2);
          }

          .btn-primary:hover {
            transform: translateY(-2px);
          }

          .btn-light {
            background: #fff4ef;
            color: #8b5f68;
            border: 1px solid #efd8d0;
          }

          .btn-light:hover {
            background: #fceee8;
          }

          .produtos-area {
            padding: 24px;
            border-radius: 28px;
            background: #ffffff;
            border: 1px solid #f0ddd7;
            box-shadow: 0 14px 30px rgba(0, 0, 0, 0.05);
          }

          .produtos-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
          }

          .produtos-title {
            margin: 12px 0 8px;
            font-size: 30px;
            color: #2d2020;
            font-weight: 800;
          }

          .produtos-subtitle {
            margin: 0;
            color: #736060;
            font-size: 15px;
          }

          .count-box {
            min-width: 88px;
            text-align: center;
            padding: 10px 14px;
            border-radius: 14px;
            background: #fbefea;
            color: #9b6670;
            font-weight: 800;
            font-size: 13px;
            border: 1px solid #f0ddd7;
          }

          .produtos-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .produto-card {
            overflow: hidden;
            border-radius: 22px;
            background: #fffdfc;
            border: 1px solid #f2e1da;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .produto-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 28px rgba(0, 0, 0, 0.07);
          }

          .produto-image-wrap {
            height: 220px;
            background: #f7efeb;
            overflow: hidden;
          }

          .produto-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .produto-body {
            padding: 18px;
          }

          .produto-title {
            margin: 0 0 10px;
            font-size: 20px;
            color: #2f2020;
            font-weight: 800;
          }

          .produto-description {
            margin: 0;
            color: #6d5d5d;
            font-size: 14px;
            line-height: 1.75;
            min-height: 48px;
          }

          .produto-footer {
            margin-top: 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
          }

          .produto-price {
            color: #9e5f6a;
            font-size: 18px;
          }

          .produto-btn {
            border: none;
            outline: none;
            cursor: pointer;
            min-height: 42px;
            padding: 0 16px;
            border-radius: 12px;
            background: #b76e79;
            color: #ffffff;
            font-weight: 800;
            transition: 0.2s ease;
          }

          .produto-btn:hover {
            background: #a85f6a;
          }

          .empty-products,
          .state-box {
            padding: 28px;
            border-radius: 24px;
            background: #fffaf7;
            border: 1px solid #f0ddd7;
            text-align: center;
            color: #746363;
          }

          .state-box.error {
            color: #a74d5d;
          }

          .btn-back {
            display: inline-flex;
            margin-top: 16px;
            text-decoration: none;
            color: #9d6570;
            font-weight: 800;
          }

          .btn-back:hover {
            text-decoration: underline;
          }

          @media (max-width: 1180px) {
            .layout-grid {
              grid-template-columns: 320px minmax(0, 1fr);
            }

            .produtos-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 900px) {
            .layout-grid {
              grid-template-columns: 1fr;
            }

            .categoria-info {
              position: static;
            }
          }

          @media (max-width: 768px) {
            .categoria-page {
              padding: 18px 12px 44px;
            }

            .top-banner-content,
            .categoria-info,
            .produtos-area {
              padding: 20px;
              border-radius: 22px;
            }

            .top-banner-content h1,
            .produtos-title {
              font-size: 26px;
            }

            .produto-image-wrap {
              height: 190px;
            }

            .produtos-head {
              flex-direction: column;
              align-items: stretch;
            }
          }
        `}</style>
      </main>

      <FooterPrincipal />
    </>
  );
}