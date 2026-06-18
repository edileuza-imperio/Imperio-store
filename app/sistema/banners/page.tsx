"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FiEdit,
  FiEye,
  FiImage,
  FiMousePointer,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";
import "../../../components/styles/sistema/banner.css";

type Banner = {
  id_banner: number;
  titulo: string;
  descricao?: string;
  imagem?: string;
  link?: string | null;
  statusid: number;
  visualizacoes?: number;
  cliques?: number;
  criado?: string;
  atualizado?: string;
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const apiOrigin = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return base.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
  }, []);

  function imagemUrl(imagem?: string) {
    if (!imagem) return "";

    if (imagem.startsWith("http")) {
      return imagem;
    }

    return `${apiOrigin}/${imagem.replace(/^\/+/, "")}`;
  }

  async function carregarBanners() {
    try {
      setLoading(true);
      setErro("");

      const response = await api.get("/painel/banners");

      const payload = response.data?.dados;

      const lista =
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.dados)
            ? payload.dados
            : [];

      setBanners(lista);
    } catch (error) {
      console.error(error);
      setErro("Erro ao carregar banners.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirBanner(id: number) {
    const confirmar = confirm("Deseja excluir este banner?");

    if (!confirmar) return;

    try {
      await api.delete(`/painel/banner/${id}`);
      setBanners((atual) => atual.filter((banner) => banner.id_banner !== id));
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir banner.");
    }
  }

  useEffect(() => {
    carregarBanners();
  }, []);

  if (loading) {
    return (
      <main className="bannersPage">
        <div className="loading">
          <span />
          <p>Carregando banners...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bannersPage">
      <section className="bannersHeader">
        <div>
          <span className="label">Painel</span>
          <h1>Banners</h1>
          <p>Gerencie os banners exibidos no site.</p>
        </div>

        <button className="refreshButton" onClick={carregarBanners}>
          <FiRefreshCw />
          Atualizar
        </button>
      </section>

      {erro && <div className="alertError">{erro}</div>}

      {banners.length === 0 ? (
        <section className="emptyBox">
          <FiImage />
          <h2>Nenhum banner cadastrado</h2>
          <p>Cadastre seu primeiro banner para aparecer no site.</p>
        </section>
      ) : (
        <section className="bannersGrid">
          {banners.map((banner) => (
            <article className="bannerCard" key={banner.id_banner}>
              <div className="bannerImage">
                {banner.imagem ? (
                  <img src={imagemUrl(banner.imagem)} alt={banner.titulo} />
                ) : (
                  <FiImage />
                )}

                <span
                  className={
                    banner.statusid === 1
                      ? "statusBadge active"
                      : "statusBadge inactive"
                  }
                >
                  {banner.statusid === 1 ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="bannerContent">
                <span className="label">Banner #{banner.id_banner}</span>

                <h2>{banner.titulo}</h2>

                <p>{banner.descricao || "Sem descrição cadastrada."}</p>

                <div className="bannerStats">
                  <span>
                    <FiEye />
                    {banner.visualizacoes ?? 0}
                  </span>

                  <span>
                    <FiMousePointer />
                    {banner.cliques ?? 0}
                  </span>
                </div>
              </div>

              <div className="bannerActions">
                <Link
                  href={`/sistema/banners/${banner.id_banner}/editar`}
                  className="actionButton edit"
                >
                  <FiEdit />
                  Editar
                </Link>

                <button
                  className="actionButton delete"
                  onClick={() => excluirBanner(banner.id_banner)}
                >
                  <FiTrash2 />
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <Link href="/sistema/banners/cadastrar" className="floatingAdd">
        <FiPlus />
      </Link>
    </main>
  );
}