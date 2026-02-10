"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import AcoesProduto from "@/components/pdcomponentes/AcoesProduto";
import CepCard from "@/components/pdcomponentes/CepCard";
import ProdutoDescricao from "@/components/pdcomponentes/ProdutoDescricao";
import ProdutoImagem from "@/components/pdcomponentes/ProdutoImagem";
import ProdutoInfo from "@/components/pdcomponentes/ProdutoInfo";
import Navbar from "@/components/site/menu/navbar";

interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string;
  preco: number;
  slug: string;
  estoque: number;
  ilimitado: number;
  imagem?: string;
  imagensSecundarias?: string[];
  status_nome?: string;
  categoria_nome?: string;
  destaque?: number;
  parcelas?: number;
  created_at?: string;
}

const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;
  const base = api.defaults.baseURL ?? "";
  return caminho.startsWith("http")
    ? caminho
    : `${base.replace(/\/$/, "")}/${caminho.replace(/^\/+/, "")}`;
};

export default function ProdutoPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const pathname = usePathname(); // pega a rota atual
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) buscarProduto(slug);
  }, [slug]);

  const buscarProduto = async (slug: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/produto/slug/${slug}`);
      if (res.data && res.data.dados) {
        const p = res.data.dados;
        p.imagem = getImagemUrl(p.imagem);
        p.imagensSecundarias = p.imagensSecundarias?.map(getImagemUrl) || [];
        p.parcelas = 10;
        setProduto(p);
      } else {
        toast.error("Produto não encontrado");
      }
    } catch (err: any) {
      console.error("Erro ao buscar produto:", err.response?.data || err.message);
      toast.error("Erro ao buscar produto");
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar breadcrumb da URL
  const gerarBreadcrumb = () => {
    if (!pathname) return [];
    const partes = pathname.split("/").filter(Boolean);
    const breadcrumb = partes.map((parte, idx) => {
      // Formata texto bonito
      const nome = parte.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      // URL até essa parte
      const url = "/" + partes.slice(0, idx + 1).join("/");
      return { nome, url };
    });
    return breadcrumb;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center my-5" style={{ height: "60vh" }}>
          <div className="spinner-border text-rosa-queimado" role="status" style={{ width: "4rem", height: "4rem" }}>
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </>
    );
  }

  if (!produto) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">Produto não encontrado</div>
      </>
    );
  }

  const breadcrumb = gerarBreadcrumb();

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" />

      <div className="container my-5">
        {/* Breadcrumb dinâmico */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb breadcrumb-custom bg-light p-2 rounded">
            {breadcrumb.map((item, idx) => (
              <li
                key={idx}
                className={`breadcrumb-item ${idx === breadcrumb.length - 1 ? "active fw-semibold text-gold" : ""}`}
                aria-current={idx === breadcrumb.length - 1 ? "page" : undefined}
              >
                {idx === breadcrumb.length - 1 ? (
                  item.nome
                ) : (
                  <a href={item.url} className="text-decoration-none text-rosa-queimado">
                    {item.nome}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="row g-4">
          {/* Coluna esquerda: imagens */}
          <div className="col-lg-6">
            <ProdutoImagem produto={produto} />
          </div>

          {/* Coluna direita: informações */}
          <div className="col-lg-6 d-flex flex-column gap-4">
            <ProdutoInfo produto={produto} />
            <CepCard />
            <AcoesProduto produto={produto} />
          </div>
        </div>

        {/* Descrição e informações técnicas */}
        <ProdutoDescricao produto={produto} />
      </div>
    </>
  );
}
