"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import { FiEdit2, FiInfo, FiTrash2 } from "react-icons/fi";

type Produto = {
  id_produto?: number | string;
  id?: number | string;
  nome?: string;
  slug?: string;
  descricao?: string;
  imagem?: string;
  miniatura?: string;
  preco?: number | string;
  preco_promocional?: number | string | null;
  sku?: string;
  modelo?: string;
  marca?: string;
  categoria_id?: number | string;
  status_id?: number | string;
  criado_em?: string;
  atualizado_em?: string;
};

function extrairListaProdutos(data: any): Produto[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  if (Array.isArray(data?.produtos)) return data.produtos;
  if (Array.isArray(data?.dados?.produtos)) return data.dados.produtos;
  return [];
}

function formatarPreco(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterIdProduto(produto: Produto) {
  return String(produto.id_produto ?? produto.id ?? "");
}

function obterBaseApi() {
  const baseUrl = String(api?.defaults?.baseURL || "").trim();

  if (!baseUrl) return "";

  try {
    const url = new URL(baseUrl);
    return url.origin;
  } catch {
    return baseUrl.replace(/\/+$/, "");
  }
}

function montarUrlImagem(caminho?: string) {
  if (!caminho) return "";

  const valor = String(caminho).trim();

  if (!valor) return "";

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("blob:") ||
    valor.startsWith("data:")
  ) {
    return valor;
  }

  const baseApi = obterBaseApi();

  if (!baseApi) {
    return valor.startsWith("/") ? valor : `/${valor}`;
  }

  if (valor.startsWith("/")) {
    return `${baseApi}${valor}`;
  }

  return `${baseApi}/${valor}`;
}

function obterImagemProduto(produto: Produto) {
  const caminho = produto.miniatura || produto.imagem || "";
  return montarUrlImagem(caminho);
}

function obterBadgeStatus(statusId?: number | string) {
  const valor = String(statusId ?? "");

  if (valor === "1") return { texto: "Ativo", classe: "ativo" };
  if (valor === "2") return { texto: "Inativo", classe: "inativo" };

  return { texto: "Sem status", classe: "neutro" };
}

export default function ProdutosListaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarProdutos() {
      try {
        setCarregando(true);
        setErro("");

        const response = await api.get("/produtos");
        const lista = extrairListaProdutos(response?.data);
        setProdutos(lista);
      } catch (error: any) {
        console.error("Erro ao carregar produtos:", error);
        setErro(
          error?.response?.data?.mensagem ||
            "Não foi possível carregar os produtos."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);

  const produtosOrdenados = useMemo(() => {
    return [...produtos].sort((a, b) =>
      String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
    );
  }, [produtos]);

  return (
    <div className="pagina-lista">
      <div className="conteiner-lista">
        <section className="topbar">
          <div className="lado-esquerdo">
            <span className="tag-topo">Catálogo de produtos</span>
          </div>

          <div className="hero-acoes">
            <Link href="/Admin/produtos" className="btn-topo btn-topo-light">
              Ver resumo
            </Link>

            <Link
              href="/Admin/produtos/cadastrar"
              className="btn-topo btn-topo-primary"
            >
              + Novo produto
            </Link>
          </div>
        </section>

        {carregando ? (
          <div className="estado">Carregando produtos...</div>
        ) : erro ? (
          <div className="estado estado-erro">{erro}</div>
        ) : produtosOrdenados.length === 0 ? (
          <div className="estado">Nenhum produto encontrado.</div>
        ) : (
          <section className="grid-produtos">
            {produtosOrdenados.map((produto) => {
              const id = obterIdProduto(produto);
              const imagem = obterImagemProduto(produto);
              const badge = obterBadgeStatus(produto.status_id);

              return (
                <article className="card-produto" key={id || Math.random()}>
                  <div className="imagem-produto">
                    {imagem ? (
                      <img
                        src={imagem}
                        alt={produto.nome || "Produto"}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector(".sem-imagem")) {
                            const fallback = document.createElement("div");
                            fallback.className = "sem-imagem";
                            fallback.textContent = "Sem imagem";
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="sem-imagem">Sem imagem</div>
                    )}
                  </div>

                  <div className="conteudo-card">
                    <div className="linha-superior">
                      <span className={`badge-status ${badge.classe}`}>
                        {badge.texto}
                      </span>

                      <span className="sku" title={produto.sku || ""}>
                        {produto.sku || "Sem SKU"}
                      </span>
                    </div>

                    <h2 title={produto.nome || ""}>
                      {produto.nome || "Produto sem nome"}
                    </h2>

                    <p className="descricao" title={produto.descricao || ""}>
                      {produto.descricao || "Sem descrição cadastrada."}
                    </p>

                    <div className="bloco-preco">
                      <strong className="preco-principal">
                        {formatarPreco(produto.preco)}
                      </strong>

                      {produto.preco_promocional ? (
                        <span className="preco-promo">
                          Promo: {formatarPreco(produto.preco_promocional)}
                        </span>
                      ) : (
                        <span className="preco-promo sem-promo">
                          Sem promoção
                        </span>
                      )}
                    </div>

                    <div className="info-rapida">
                      <div className="icone-info">
                        <FiInfo size={15} />
                      </div>

                      <div className="texto-info">
                        <span>Informação rápida</span>
                        <strong title={`${produto.marca || "Sem marca"} • ${produto.modelo || "Sem modelo"}`}>
                          {produto.marca || "Sem marca"} • {produto.modelo || "Sem modelo"}
                        </strong>
                      </div>
                    </div>

                    <div className="acoes-card">
                      <Link
                        href={`/Admin/produtos/${id}`}
                        className="acao acao-info"
                      >
                        <FiInfo size={14} />
                        <span>Informações</span>
                      </Link>

                      <Link
                        href={`/Admin/produtos/editar/${id}`}
                        className="acao acao-editar"
                      >
                        <FiEdit2 size={14} />
                        <span>Editar</span>
                      </Link>

                      <button
                        type="button"
                        className="acao acao-excluir"
                        onClick={() => {
                          console.log("Excluir produto:", id);
                        }}
                      >
                        <FiTrash2 size={14} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      <style jsx>{`
        
      `}</style>
    </div>
  );
}