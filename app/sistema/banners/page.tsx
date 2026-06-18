"use client";

import api from "@/Api/conectar";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { imagemFundo } from "@/components/Bibioteca/imagem";

type Banner = {
  id_banner: number;
  titulo: string;
  descricao?: string;
  imagem?: string;
  link?: string | null;
  statusid: number;
  visualizacoes?: number;
  cliques?: number;
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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
    if (!confirm("Deseja excluir este banner?")) return;

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
          <span className="label">Painel administrativo</span>
          <h1>Banners</h1>
          <p>Gerencie imagens, links, cliques e visualizações dos banners.</p>
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
          <p>Cadastre o primeiro banner para exibir no site.</p>
        </section>
      ) : (
        <section className="bannersGrid">
          {banners.map((banner) => (
            <article className="bannerCard" key={banner.id_banner}>
              <div className="bannerImage">
                {banner.imagem ? (
                  <img src={imagemFundo(banner.imagem)} alt={banner.titulo} />
                ) : (
                  <div className="imagePlaceholder">
                    <FiImage />
                  </div>
                )}

                <div className="imageOverlay" />

                <span
                  className={
                    banner.statusid === 1
                      ? "statusBadge active"
                      : "statusBadge inactive"
                  }
                >
                  {banner.statusid === 1 ? "Ativo" : "Inativo"}
                </span>

                <div className="floatingActions">
                  <Link
                    href={`/sistema/banners/${banner.id_banner}/editar`}
                    className="floatAction edit"
                    title="Editar banner"
                  >
                    <FiEdit />
                  </Link>

                  <button
                    className="floatAction delete"
                    onClick={() => excluirBanner(banner.id_banner)}
                    title="Excluir banner"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="bannerContent">
                <div className="bannerTop">
                  <span className="label">Banner #{banner.id_banner}</span>

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

                <h2>{banner.titulo}</h2>

                <p>{banner.descricao || "Sem descrição cadastrada."}</p>

                {banner.link && (
                  <a
                    className="bannerLink"
                    href={banner.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir link do banner
                  </a>
                )}
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