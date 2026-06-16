"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Search,
  Calendar,
  BadgeCheck,
  Pencil,
  Trash2,
  Megaphone,
  PackagePlus,
  X,
  ImageIcon,
} from "lucide-react";

import "../../../components/styles/sistema/campanha.css";

interface Campanha {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao: string;
  banner: string;
  statusid: number;
  inicio: string;
  fim: string;
  criado: string;
  atualizado: string;
}

export default function CampanhasPage() {
  const [loading, setLoading] = useState(true);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [busca, setBusca] = useState("");
  const [modalProdutos, setModalProdutos] = useState(false);

  useEffect(() => {
    carregarCampanhas();
  }, []);

  async function carregarCampanhas() {
    try {
      setLoading(true);

      const response = await api.get("/painel/campanhas");

      const lista =
        response.data?.dados?.dados ||
        response.data?.dados ||
        response.data ||
        [];

      setCampanhas(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }

  async function excluirCampanha(id: number) {
    const confirmar = confirm("Deseja realmente excluir esta campanha?");

    if (!confirmar) return;

    try {
      await api.delete(`/painel/campanha/${id}`);

      setCampanhas((old) =>
        old.filter((item) => item.id_campanha !== id)
      );

      alert("Campanha removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover campanha:", error);
      alert("Erro ao remover campanha.");
    }
  }

  function formatarData(data: string) {
    if (!data) return "-";

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
      return data;
    }

    return dataConvertida.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatarImagem(imagem: string) {
    if (!imagem) return "";

    const baseURL = String(api.defaults.baseURL || "").replace(/\/$/, "");
    const caminho = imagem.replace(/^\//, "");

    return `${baseURL}/${caminho}`;
  }

  const campanhasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return campanhas;

    return campanhas.filter((campanha) =>
      `${campanha.titulo || ""} ${campanha.slug || ""} ${campanha.descricao || ""}`
        .toLowerCase()
        .includes(termo)
    );
  }, [campanhas, busca]);

  const totalAtivas = useMemo(() => {
    return campanhas.filter((campanha) => Number(campanha.statusid) === 1)
      .length;
  }, [campanhas]);

  return (
    <main className="campanhas-page">
      <header className="campanhas-header">
        <div className="campanhas-header-text">
          <span>Painel administrativo</span>

          <h1>
            <Megaphone size={30} />
            Campanhas
          </h1>

          <p>Gerencie campanhas, banners e produtos promocionais.</p>
        </div>

        <div className="campanhas-header-right">
          <div className="campanhas-stats">
            <span>{campanhas.length} campanhas</span>
            <span>{totalAtivas} ativas</span>
          </div>

          <div className="campanhas-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar campanha..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>
        </div>
      </header>

      {loading && (
        <section className="campanhas-loading">
          <Megaphone size={34} />
          <strong>Carregando campanhas...</strong>
        </section>
      )}

      {!loading && campanhasFiltradas.length === 0 && (
        <section className="campanhas-empty">
          <Megaphone size={58} />

          <h2>Nenhuma campanha encontrada</h2>

          <p>Cadastre sua primeira campanha promocional para aparecer no site.</p>

          <Link
            href="/painel/sistema/campanhas/cadastrar"
            className="campanhas-empty-button"
          >
            <Plus size={20} />
            Nova campanha
          </Link>
        </section>
      )}

      {!loading && campanhasFiltradas.length > 0 && (
        <section className="campanhas-grid">
          {campanhasFiltradas.map((campanha) => {
            const ativa = Number(campanha.statusid) === 1;
            const imagem = formatarImagem(campanha.banner);

            return (
              <article key={campanha.id_campanha} className="campanhas-card">
                <div className="campanhas-banner">
                  {imagem ? (
                    <img
                      src={imagem}
                      alt={campanha.titulo}
                      className="campanhas-banner-img"
                    />
                  ) : (
                    <div className="campanhas-no-image">
                      <ImageIcon size={36} />
                      <span>Sem imagem</span>
                    </div>
                  )}

                  <div className="campanhas-overlay" />

                  <span
                    className={`campanhas-status ${
                      ativa
                        ? "campanhas-status-ativa"
                        : "campanhas-status-inativa"
                    }`}
                  >
                    <BadgeCheck size={14} />
                    {ativa ? "Ativa" : "Inativa"}
                  </span>
                </div>

                <div className="campanhas-content">
                  <span className="campanhas-slug">/{campanha.slug}</span>

                  <h2>{campanha.titulo}</h2>

                  <p>{campanha.descricao || "Sem descrição cadastrada."}</p>

                  <div className="campanhas-periodo">
                    <Calendar size={16} />

                    <span>
                      {formatarData(campanha.inicio)} -{" "}
                      {formatarData(campanha.fim)}
                    </span>
                  </div>

                  <div className="campanhas-actions">
                    <Link
                      href={`/painel/sistema/Campanhas/${campanha.id_campanha}`}
                      className="campanhas-edit-button"
                    >
                      <Pencil size={16} />
                      Editar
                    </Link>

                    <button
                      type="button"
                      className="campanhas-delete-button"
                      onClick={() => excluirCampanha(campanha.id_campanha)}
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {modalProdutos && (
        <div
          className="campanhas-modal-overlay"
          onMouseDown={() => setModalProdutos(false)}
        >
          <section
            className="campanhas-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="campanhas-modal-header">
              <div>
                <span>Produtos promocionais</span>
                <h2>Selecionar campanha</h2>
              </div>

              <button type="button" onClick={() => setModalProdutos(false)}>
                <X size={22} />
              </button>
            </header>

            <div className="campanhas-modal-list">
              {campanhas.map((campanha) => (
                <Link
                  key={campanha.id_campanha}
                  href={`/painel/sistema/campanhas/${campanha.id_campanha}/produtos`}
                  className="campanhas-modal-item"
                >
                  <div>
                    <h3>{campanha.titulo}</h3>

                    <span>
                      {formatarData(campanha.inicio)} -{" "}
                      {formatarData(campanha.fim)}
                    </span>
                  </div>

                  <PackagePlus size={22} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="campanhas-floating-group">
        <button
          type="button"
          className="campanhas-floating campanhas-floating-product"
          onClick={() => setModalProdutos(true)}
          aria-label="Adicionar produto em campanha"
        >
          <PackagePlus size={24} />
        </button>

        <Link
          href="/painel/sistema/campanhas/cadastrar"
          className="campanhas-floating campanhas-floating-add"
          aria-label="Nova campanha"
        >
          <Plus size={28} />
        </Link>
      </div>
    </main>
  );
}