"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Produto = {
  id_produto?: number | string;
  id?: number | string;
  nome?: string;
  titulo?: string;
  slug?: string;
  descricao?: string;
  preco?: number | string;
  imagem?: string;
  status?: {
    nome?: string;
    codigo?: string;
  } | string;
};

function normalizarLista(payload: any): Produto[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

function obterIdProduto(item: Produto) {
  return item.id_produto ?? item.id ?? "";
}

function obterNomeProduto(item: Produto) {
  return item.nome ?? item.titulo ?? "Produto sem nome";
}

function formatarPreco(valor?: number | string) {
  if (valor === null || valor === undefined || valor === "") {
    return "Não informado";
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return String(valor);
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosDaCampanhaPage() {
  const router = useRouter();
  const params = useParams();

  const campanhaId = useMemo(() => {
    return String(params?.id ?? "");
  }, [params]);

  const [produtosCampanha, setProdutosCampanha] = useState<Produto[]>([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const carregarProdutosCampanha = useCallback(async () => {
    if (!campanhaId) return;

    try {
      setLoading(true);
      setErro(null);

      const response = await api.get(`/painel/campanha/${campanhaId}/produtos`, {
        withCredentials: true,
      });

      const lista = normalizarLista(response?.data);
      setProdutosCampanha(lista);
    } catch (error: any) {
      console.error("Erro ao carregar produtos da campanha:", error);
      setErro(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível carregar os produtos da campanha."
      );
      setProdutosCampanha([]);
    } finally {
      setLoading(false);
    }
  }, [campanhaId]);

  const carregarProdutosDisponiveis = useCallback(async () => {
    try {
      setLoadingProdutos(true);

      // ajuste essa rota se no seu projeto estiver diferente
      const response = await api.get("/produtos", {
        withCredentials: true,
      });

      const lista = normalizarLista(response?.data);
      setProdutosDisponiveis(lista);

      if (lista.length > 0) {
        const primeiroId = String(obterIdProduto(lista[0]));
        setProdutoSelecionado(primeiroId);
      }
    } catch (error: any) {
      console.error("Erro ao carregar produtos disponíveis:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível carregar os produtos para seleção."
      );
      setProdutosDisponiveis([]);
    } finally {
      setLoadingProdutos(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutosCampanha();
    carregarProdutosDisponiveis();
  }, [carregarProdutosCampanha, carregarProdutosDisponiveis]);

  const produtosJaNaCampanha = useMemo(() => {
    const idsCampanha = new Set(
      produtosCampanha.map((item) => String(obterIdProduto(item)))
    );

    return produtosDisponiveis.filter(
      (item) => !idsCampanha.has(String(obterIdProduto(item)))
    );
  }, [produtosCampanha, produtosDisponiveis]);

  useEffect(() => {
    if (!produtoSelecionado && produtosJaNaCampanha.length > 0) {
      setProdutoSelecionado(String(obterIdProduto(produtosJaNaCampanha[0])));
    }
  }, [produtoSelecionado, produtosJaNaCampanha]);

  async function adicionarProduto() {
    if (!produtoSelecionado) {
      toast.warning("Selecione um produto.");
      return;
    }

    const numeroProduto = Number(produtoSelecionado);

    if (Number.isNaN(numeroProduto)) {
      toast.warning("Produto selecionado inválido.");
      return;
    }

    try {
      setAdicionando(true);

      const response = await api.post(
        `/painel/campanha/${campanhaId}/produto`,
        {
          produtoId: numeroProduto,
          produto_id: numeroProduto,
          id_produto: numeroProduto,
        },
        {
          withCredentials: true,
        }
      );

      const payload = response?.data;
      const sucesso =
        response?.status === 200 ||
        response?.status === 201 ||
        payload?.status === 200 ||
        payload?.status === 201;

      if (!sucesso) {
        toast.error(payload?.mensagem || "Não foi possível adicionar o produto.");
        return;
      }

      toast.success(payload?.mensagem || "Produto adicionado à campanha com sucesso.");

      await carregarProdutosCampanha();

      const proximoDisponivel = produtosJaNaCampanha.find(
        (item) => String(obterIdProduto(item)) !== String(numeroProduto)
      );

      setProdutoSelecionado(
        proximoDisponivel ? String(obterIdProduto(proximoDisponivel)) : ""
      );
    } catch (error: any) {
      console.error("Erro ao adicionar produto:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao adicionar produto na campanha."
      );
    } finally {
      setAdicionando(false);
    }
  }

  async function removerProduto(produtoId: string) {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover este produto da campanha?"
    );

    if (!confirmar) return;

    try {
      setRemovendoId(produtoId);

      const response = await api.delete(
        `/painel/campanha/${campanhaId}/produto/${produtoId}`,
        {
          withCredentials: true,
        }
      );

      const payload = response?.data;
      const sucesso =
        response?.status === 200 ||
        response?.status === 204 ||
        payload?.status === 200 ||
        payload?.status === 204;

      if (!sucesso) {
        toast.error(payload?.mensagem || "Não foi possível remover o produto.");
        return;
      }

      toast.success(payload?.mensagem || "Produto removido da campanha com sucesso.");

      setProdutosCampanha((prev) =>
        prev.filter((item) => String(obterIdProduto(item)) !== String(produtoId))
      );
    } catch (error: any) {
      console.error("Erro ao remover produto:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao remover produto da campanha."
      );
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="pagina">
        <div className="topo">
          <div>
            <span className="badge">Campanhas</span>
            <h1>Produtos da campanha</h1>
            <p>
              Gerencie os produtos vinculados à campanha <strong>#{campanhaId}</strong>.
            </p>
          </div>

          <div className="topoAcoes">
            <button
              type="button"
              className="btnSecundario"
              onClick={() => router.push("/Admin/campanhas")}
            >
              Voltar
            </button>

            <button
              type="button"
              className="btnSecundario"
              onClick={() => {
                carregarProdutosCampanha();
                carregarProdutosDisponiveis();
              }}
            >
              Atualizar
            </button>
          </div>
        </div>

        <div className="cardAdicionar">
          <div className="cardAdicionarTexto">
            <h2>Adicionar produto na campanha</h2>
            <p>Escolha um produto da lista para vinculá-lo a esta campanha.</p>
          </div>

          <div className="acoesAdicionar">
            <select
              value={produtoSelecionado}
              onChange={(e) => setProdutoSelecionado(e.target.value)}
              disabled={loadingProdutos || produtosJaNaCampanha.length === 0}
            >
              {loadingProdutos ? (
                <option value="">Carregando produtos...</option>
              ) : produtosJaNaCampanha.length === 0 ? (
                <option value="">Nenhum produto disponível</option>
              ) : (
                produtosJaNaCampanha.map((produto) => {
                  const id = String(obterIdProduto(produto));
                  const nome = obterNomeProduto(produto);
                  return (
                    <option key={id} value={id}>
                      {nome} — ID {id}
                    </option>
                  );
                })
              )}
            </select>

            <button
              type="button"
              className="btnPrimario"
              disabled={
                adicionando ||
                loadingProdutos ||
                !produtoSelecionado ||
                produtosJaNaCampanha.length === 0
              }
              onClick={adicionarProduto}
            >
              {adicionando ? "Adicionando..." : "Adicionar produto"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="estado">
            <div className="loader" />
            <p>Carregando produtos da campanha...</p>
          </div>
        ) : erro ? (
          <div className="estado">
            <h3>Erro ao carregar</h3>
            <p>{erro}</p>
            <button
              type="button"
              className="btnPrimario"
              onClick={() => carregarProdutosCampanha()}
            >
              Tentar novamente
            </button>
          </div>
        ) : produtosCampanha.length === 0 ? (
          <div className="estado">
            <h3>Nenhum produto nesta campanha</h3>
            <p>Selecione um produto acima para adicionar.</p>
          </div>
        ) : (
          <div className="grid">
            {produtosCampanha.map((item) => {
              const produtoId = String(obterIdProduto(item));
              const nome = obterNomeProduto(item);

              return (
                <div className="cardProduto" key={produtoId}>
                  <div className="cardHeader">
                    <div>
                      <h3>{nome}</h3>
                      <span className="sub">ID: {produtoId}</span>
                    </div>
                  </div>

                  <div className="infos">
                    <div className="infoBox">
                      <span className="label">Slug</span>
                      <strong>{item.slug || "Não informado"}</strong>
                    </div>

                    <div className="infoBox">
                      <span className="label">Preço</span>
                      <strong>{formatarPreco(item.preco)}</strong>
                    </div>

                    <div className="infoBox full">
                      <span className="label">Imagem</span>
                      <strong>{item.imagem || "Sem imagem"}</strong>
                    </div>

                    <div className="infoBox full">
                      <span className="label">Descrição</span>
                      <p>{item.descricao?.trim() || "Sem descrição cadastrada."}</p>
                    </div>
                  </div>

                  <div className="cardFooter">
                    <button
                      type="button"
                      className="btnExcluir"
                      disabled={removendoId === produtoId}
                      onClick={() => removerProduto(produtoId)}
                    >
                      {removendoId === produtoId
                        ? "Removendo..."
                        : "Remover da campanha"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .pagina {
          min-height: 100%;
          padding: 24px;
          background: #f5f7fa;
        }

        .topo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .badge {
          display: inline-block;
          margin-bottom: 10px;
          background: #e9eef5;
          color: #344054;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .topo h1 {
          margin: 0 0 8px;
          font-size: 32px;
          line-height: 1.1;
          color: #101828;
          font-weight: 800;
        }

        .topo p {
          margin: 0;
          color: #475467;
          font-size: 15px;
          max-width: 720px;
        }

        .topoAcoes {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cardAdicionar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 22px;
          box-shadow: 0 10px 30px rgba(16, 24, 40, 0.05);
        }

        .cardAdicionarTexto h2 {
          margin: 0 0 6px;
          font-size: 22px;
          color: #101828;
        }

        .cardAdicionarTexto p {
          margin: 0;
          color: #475467;
        }

        .acoesAdicionar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .acoesAdicionar select {
          min-width: 320px;
          border: 1px solid #d0d5dd;
          background: #fff;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 15px;
          color: #101828;
          outline: none;
        }

        .acoesAdicionar select:focus {
          border-color: #98a2b3;
          box-shadow: 0 0 0 4px rgba(152, 162, 179, 0.14);
        }

        .btnPrimario,
        .btnSecundario,
        .btnExcluir {
          border: none;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btnPrimario {
          background: #111827;
          color: #ffffff;
        }

        .btnSecundario {
          background: #ffffff;
          color: #344054;
          border: 1px solid #d0d5dd;
        }

        .btnExcluir {
          background: #fee4e2;
          color: #b42318;
          width: 100%;
        }

        .btnPrimario:disabled,
        .btnSecundario:disabled,
        .btnExcluir:disabled,
        .acoesAdicionar select:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .estado {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 24px;
          padding: 40px 24px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(16, 24, 40, 0.05);
        }

        .estado h3 {
          margin: 0 0 10px;
          color: #101828;
          font-size: 22px;
        }

        .estado p {
          margin: 0 0 18px;
          color: #475467;
        }

        .loader {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 4px solid #eaecf0;
          border-top-color: #111827;
          margin: 0 auto 14px;
          animation: girar 0.9s linear infinite;
        }

        @keyframes girar {
          to {
            transform: rotate(360deg);
          }
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .cardProduto {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(16, 24, 40, 0.05);
        }

        .cardHeader {
          padding: 20px;
          border-bottom: 1px solid #eaecf0;
        }

        .cardHeader h3 {
          margin: 0 0 6px;
          font-size: 21px;
          color: #101828;
        }

        .sub {
          font-size: 13px;
          color: #667085;
        }

        .infos {
          padding: 18px 20px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .infoBox {
          background: #f9fafb;
          border: 1px solid #eaecf0;
          border-radius: 16px;
          padding: 14px;
          min-width: 0;
        }

        .infoBox.full {
          grid-column: span 2;
        }

        .label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #667085;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 8px;
        }

        .infoBox strong {
          color: #101828;
          font-size: 14px;
          word-break: break-word;
        }

        .infoBox p {
          margin: 0;
          color: #475467;
          line-height: 1.6;
          word-break: break-word;
        }

        .cardFooter {
          padding: 0 20px 20px;
        }

        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .pagina {
            padding: 16px;
          }

          .topo h1 {
            font-size: 26px;
          }

          .cardAdicionar {
            padding: 16px;
          }

          .acoesAdicionar {
            width: 100%;
          }

          .acoesAdicionar select,
          .btnPrimario,
          .btnSecundario {
            width: 100%;
            min-width: 100%;
          }

          .infos {
            grid-template-columns: 1fr;
          }

          .infoBox.full {
            grid-column: span 1;
          }
        }
      `}</style>
    </>
  );
}