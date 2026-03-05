"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/Api/conectar";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
};

type Produto = {
  id_produto: number;
  nome: string;
  slug: string;
  descricao?: string;
  preco: number;
  imagem?: string;
};

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";

  const base = api.defaults.baseURL || "";
  const clean = String(caminho).replace(/^\/+/, "");

  return `${base}/${clean}`;
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CampanhaPage() {
  const params = useParams();

  const slug = Array.isArray(params.slug)
    ? params.slug[0]
    : params.slug;

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const res = await api.get(`/admin/campanha/ativa/${slug}`);

      const dados = res.data?.dados ?? {};

      setCampanha(dados.campanha ?? null);
      setProdutos(Array.isArray(dados.produtos) ? dados.produtos : []);
    } catch (err) {
      console.error("Erro ao carregar campanha:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) {
      carregar();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark"></div>
      </div>
    );
  }

  if (!campanha) {
    return (
      <div className="container py-5 text-center">
        <h3>Campanha não encontrada</h3>
      </div>
    );
  }

  return (
    <section style={{ background: "#f5eee8", padding: "80px 0" }}>
      <div className="container">

        {/* HEADER DA CAMPANHA */}

        <div className="text-center mb-5">

          {campanha.banner && (
            <img
              src={getImagemUrl(campanha.banner)}
              className="img-fluid rounded shadow mb-4"
              alt={campanha.titulo}
            />
          )}

          <h1 className="fw-bold">{campanha.titulo}</h1>

          {campanha.descricao && (
            <p className="text-muted">{campanha.descricao}</p>
          )}

        </div>

        {/* LISTA DE PRODUTOS */}

        <div className="row g-4">

          {produtos.length === 0 && (
            <div className="text-center">
              <p>Nenhum produto nesta campanha</p>
            </div>
          )}

          {produtos.map((p) => {
            const img = getImagemUrl(p.imagem);

            return (
              <div
                key={p.id_produto}
                className="col-12 col-sm-6 col-lg-4 col-xl-3"
              >

                <div
                  className="card border-0 shadow-sm h-100"
                  style={{ borderRadius: 16 }}
                >

                  <div className="position-relative">

                    {img ? (
                      <img
                        src={img}
                        alt={p.nome}
                        className="card-img-top"
                        style={{
                          height: 240,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light"
                        style={{ height: 240 }}
                      >
                        Sem imagem
                      </div>
                    )}

                    <span className="badge bg-success position-absolute top-0 start-0 m-2">
                      Campanha
                    </span>

                  </div>

                  <div className="card-body d-flex flex-column">

                    <h6 className="fw-semibold">
                      {p.nome}
                    </h6>

                    {p.descricao && (
                      <p className="small text-muted">
                        {p.descricao}
                      </p>
                    )}

                    <div
                      className="fw-bold fs-5 mb-3"
                      style={{ color: "#c78c5c" }}
                    >
                      {formatMoney(p.preco)}
                    </div>

                    <div className="mt-auto d-flex gap-2">

                      <Link
                        href={`/produto/${p.slug}`}
                        className="btn btn-outline-dark w-100"
                      >
                        <i className="bi bi-eye"></i>
                      </Link>

                      <button
                        className="btn text-white w-100"
                        style={{ background: "#c78c5c" }}
                      >
                        <i className="bi bi-cart-plus"></i>
                      </button>

                    </div>

                  </div>

                </div>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}