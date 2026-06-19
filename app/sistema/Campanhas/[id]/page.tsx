"use client";

import api from "@/Api/conectar";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiEdit,
  FiImage,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";

import "../../../../components/styles/sistema/campanha-form.css";
import { imagemFundo } from "@/components/Bibioteca/imagem";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string | null;
  banner?: string | null;
  statusid: number;
  inicio?: string | null;
  fim?: string | null;
  criado?: string | null;
  atualizado?: string | null;
};

type Produto = {
  id_produto: number;
  nome: string;
  slug?: string;
  imagem?: string | null;
  preco?: number | string;
  statusid?: number;
};

export default function CampanhaDetalhePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarCampanha() {
    try {
      setLoading(true);
      setErro("");

      const response = await api.get(`/painel/campanha/${id}`);

      const dados = response.data?.dados;
      const item = dados?.campanha || dados;

      setCampanha(item);
    } catch (error) {
      console.error(error);
      setErro("Erro ao carregar campanha.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarProdutos() {
    try {
      const response = await api.get(`/painel/campanha/${id}/produtos`);

      const dados = response.data?.dados;

      const lista =
        Array.isArray(dados)
          ? dados
          : Array.isArray(dados?.produtos)
            ? dados.produtos
            : Array.isArray(dados?.dados)
              ? dados.dados
              : [];

      setProdutos(lista);
    } catch (error) {
      console.error(error);
    }
  }

  async function excluirCampanha() {
    if (!confirm("Deseja excluir esta campanha?")) return;

    try {
      await api.delete(`/painel/campanha/${id}`);
      router.push("/sistema/campanhas");
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir campanha.");
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "Não informado";

    return new Date(data.replace(" ", "T")).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  useEffect(() => {
    carregarCampanha();
    carregarProdutos();
  }, [id]);

  if (loading) {
    return (
      <main className="campanhaDetalhePage">
        <div className="loading">
          <span />
          <p>Carregando campanha...</p>
        </div>
      </main>
    );
  }

  if (erro || !campanha) {
    return (
      <main className="campanhaDetalhePage">
        <div className="alertError">{erro || "Campanha não encontrada."}</div>

        <Link href="/sistema/campanhas" className="backButton">
          <FiArrowLeft />
          Voltar
        </Link>
      </main>
    );
  }

  return (
    <main className="campanhaDetalhePage">
      <section className="campanhaHeader">
        <div>
          <span className="label">Campanha #{campanha.id_campanha}</span>
          <h1>{campanha.titulo}</h1>
          <p>{campanha.descricao || "Sem descrição cadastrada."}</p>
        </div>

        <div className="headerActions">
          <Link href="/sistema/campanhas" className="backButton">
            <FiArrowLeft />
            Voltar
          </Link>

          <button className="refreshButton" onClick={carregarCampanha}>
            <FiRefreshCw />
            Atualizar
          </button>
        </div>
      </section>

      <section className="campanhaHero">
        <div className="campanhaBanner">
          {campanha.banner ? (
            <img src={imagemFundo(campanha.banner)} alt={campanha.titulo} />
          ) : (
            <div className="bannerPlaceholder">
              <FiImage />
              <strong>Sem banner</strong>
            </div>
          )}

          <div className="heroOverlay" />

          <span
            className={
              campanha.statusid === 1
                ? "statusBadge active"
                : "statusBadge inactive"
            }
          >
            {campanha.statusid === 1 ? "Ativa" : "Inativa"}
          </span>

          <div className="floatingActions">
            <Link
              href={`/sistema/campanhas/${campanha.id_campanha}/editar`}
              className="floatAction edit"
              title="Editar campanha"
            >
              <FiEdit />
            </Link>

            <button
              className="floatAction delete"
              onClick={excluirCampanha}
              title="Excluir campanha"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>

        <div className="campanhaInfoGrid">
          <div className="infoCard">
            <FiCalendar />
            <span>Início</span>
            <strong>{formatarData(campanha.inicio)}</strong>
          </div>

          <div className="infoCard">
            <FiCalendar />
            <span>Fim</span>
            <strong>{formatarData(campanha.fim)}</strong>
          </div>

          <div className="infoCard">
            <FiPackage />
            <span>Produtos</span>
            <strong>{produtos.length}</strong>
          </div>
        </div>
      </section>

      <section className="produtosSection">
        <div className="sectionTitle">
          <div>
            <span className="label">Produtos vinculados</span>
            <h2>Produtos da campanha</h2>
          </div>

          <Link
            href={`/sistema/campanhas/${campanha.id_campanha}/produtos`}
            className="addProductButton"
          >
            <FiPlus />
            Gerenciar produtos
          </Link>
        </div>

        {produtos.length === 0 ? (
          <div className="emptyBox">
            <FiPackage />
            <h3>Nenhum produto vinculado</h3>
            <p>Adicione produtos para aparecerem nesta campanha.</p>
          </div>
        ) : (
          <div className="produtosGrid">
            {produtos.map((produto) => (
              <article className="produtoCard" key={produto.id_produto}>
                <div className="produtoImage">
                  {produto.imagem ? (
                    <img src={imagemFundo(produto.imagem)} alt={produto.nome} />
                  ) : (
                    <FiPackage />
                  )}
                </div>

                <div className="produtoInfo">
                  <h3>{produto.nome}</h3>
                  <span>Produto #{produto.id_produto}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}