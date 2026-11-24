"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Image as ImageIcon,
  ImagePlus,
  Images,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import conexao from "@/Services/Conexao/Conexao";

type Produto = {
  id_produto: number;
  nome: string;
  sku?: string;
  ativo?: boolean | number;
};

type ImagemProduto = {
  id_imagem?: number;
  imagem_id?: number;
  id?: number;
  produto_id?: number;
  url: string;
  texto_alternativo?: string | null;
  principal?: boolean | number | string;
  ordem?: number;
};

type FormularioImagem = {
  url: string;
  texto_alternativo: string;
};

const formularioInicial: FormularioImagem = {
  url: "",
  texto_alternativo: "",
};

function obterIdImagem(imagem: ImagemProduto): number {
  return Number(imagem.id_imagem ?? imagem.imagem_id ?? imagem.id ?? 0);
}

function ehPrincipal(valor: ImagemProduto["principal"]): boolean {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

function extrairMensagemErro(error: any): string {
  return (
    error?.response?.data?.mensagem ||
    error?.response?.data?.erro ||
    error?.message ||
    "Não foi possível concluir a operação."
  );
}

function validarResposta(payload: any): void {
  if (payload?.sucesso === false) {
    throw new Error(
      payload?.mensagem || "A API não conseguiu concluir a operação.",
    );
  }
}

export default function GerenciarImagensPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [imagens, setImagens] = useState<ImagemProduto[]>([]);

  const [buscaProduto, setBuscaProduto] = useState("");
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [carregandoImagens, setCarregandoImagens] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [imagemEditando, setImagemEditando] = useState<ImagemProduto | null>(
    null,
  );
  const [formulario, setFormulario] =
    useState<FormularioImagem>(formularioInicial);

  const produtoSelecionado = useMemo(
    () =>
      produtos.find((produto) => String(produto.id_produto) === produtoId) ??
      null,
    [produtos, produtoId],
  );

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return produtos;

    return produtos.filter((produto) =>
      `${produto.nome} ${produto.sku ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(termo),
    );
  }, [produtos, buscaProduto]);

  const totalImagens = imagens.length;
  const totalPrincipais = imagens.filter((imagem) =>
    ehPrincipal(imagem.principal),
  ).length;

  const carregarProdutos = useCallback(async () => {
    try {
      setCarregandoProdutos(true);
      setErro("");

      const resposta = await conexao.get("/painel/produtos", {
        withCredentials: true,
      });

      validarResposta(resposta.data);

      const lista = resposta.data?.dados?.produtos;
      if (!Array.isArray(lista)) {
        throw new Error(
          "A API não retornou a lista de produtos no formato esperado.",
        );
      }

      setProdutos(lista);
      setProdutoId((atual) => {
        if (
          atual &&
          lista.some((produto: Produto) => String(produto.id_produto) === atual)
        ) {
          return atual;
        }
        return lista.length ? String(lista[0].id_produto) : "";
      });
    } catch (error) {
      console.error("[GERENCIAR IMAGENS - PRODUTOS]", error);
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoProdutos(false);
    }
  }, []);

  const carregarImagens = useCallback(async (id: string) => {
    if (!id) {
      setImagens([]);
      return;
    }

    try {
      setCarregandoImagens(true);
      setErro("");

      const resposta = await conexao.get(`/painel/produtos/${id}/imagens`, {
        withCredentials: true,
      });

      validarResposta(resposta.data);

      const lista = resposta.data?.dados?.imagens;
      if (!Array.isArray(lista)) {
        throw new Error("A API não retornou as imagens no formato esperado.");
      }

      setImagens(lista);
    } catch (error) {
      console.error("[GERENCIAR IMAGENS]", error);
      setImagens([]);
      setErro(extrairMensagemErro(error));
    } finally {
      setCarregandoImagens(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  useEffect(() => {
    carregarImagens(produtoId);
  }, [produtoId, carregarImagens]);

  function abrirNovaImagem() {
    setImagemEditando(null);
    setFormulario(formularioInicial);
    setErro("");
    setMensagem("");
    setModalAberto(true);
  }

  function abrirEdicaoImagem(imagem: ImagemProduto) {
    setImagemEditando(imagem);
    setFormulario({
      url: imagem.url ?? "",
      texto_alternativo: imagem.texto_alternativo ?? "",
    });
    setErro("");
    setMensagem("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setImagemEditando(null);
    setFormulario(formularioInicial);
  }

  async function salvarImagem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!produtoId) {
      setErro("Selecione um produto antes de cadastrar uma imagem.");
      return;
    }

    const url = formulario.url.trim();
    try {
      const endereco = new URL(url);
      if (endereco.protocol !== "http:" && endereco.protocol !== "https:") {
        throw new Error("Informe uma URL HTTP ou HTTPS válida.");
      }
    } catch {
      setErro(
        "Informe um endereço de imagem válido, começando com https:// ou http://.",
      );
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const idImagem = imagemEditando ? obterIdImagem(imagemEditando) : 0;
      const payload = {
        url,
        texto_alternativo: formulario.texto_alternativo.trim() || null,
        principal: imagemEditando
          ? ehPrincipal(imagemEditando.principal)
          : imagens.length === 0,
        ordem: imagemEditando
          ? Number(imagemEditando.ordem ?? 0)
          : imagens.length,
      };

      if (imagemEditando) {
        if (!idImagem) {
          throw new Error(
            "Não consegui identificar o ID desta imagem retornado pela API.",
          );
        }

        const resposta = await conexao.put(
          `/painel/produtos/${produtoId}/imagens/${idImagem}`,
          payload,
          { withCredentials: true },
        );
        validarResposta(resposta.data);
        setMensagem(
          resposta.data?.mensagem || "Imagem atualizada com sucesso.",
        );
      } else {
        const resposta = await conexao.post(
          `/painel/produtos/${produtoId}/imagens`,
          payload,
          { withCredentials: true },
        );
        validarResposta(resposta.data);
        setMensagem(
          resposta.data?.mensagem || "Imagem cadastrada com sucesso.",
        );
      }

      setModalAberto(false);
      setImagemEditando(null);
      setFormulario(formularioInicial);
      await carregarImagens(produtoId);
    } catch (error) {
      console.error("[SALVAR IMAGEM]", error);
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function definirPrincipal(imagem: ImagemProduto) {
    const idImagem = obterIdImagem(imagem);
    if (!idImagem || !produtoId) {
      setErro("Não foi possível identificar a imagem selecionada.");
      return;
    }

    try {
      setErro("");
      setMensagem("");

      const resposta = await conexao.put(
        `/painel/produtos/${produtoId}/imagens/${idImagem}/principal`,
        {},
        { withCredentials: true },
      );
      validarResposta(resposta.data);

      setMensagem(resposta.data?.mensagem || "Imagem principal atualizada.");
      await carregarImagens(produtoId);
    } catch (error) {
      console.error("[DEFINIR IMAGEM PRINCIPAL]", error);
      setErro(extrairMensagemErro(error));
    }
  }

  async function excluirImagem(imagem: ImagemProduto) {
    const idImagem = obterIdImagem(imagem);
    if (!idImagem || !produtoId) {
      setErro("Não foi possível identificar a imagem selecionada.");
      return;
    }

    const confirmar = window.confirm(
      "Deseja realmente excluir esta imagem do produto? Essa ação não poderá ser desfeita.",
    );
    if (!confirmar) return;

    try {
      setErro("");
      setMensagem("");

      const resposta = await conexao.delete(
        `/painel/produtos/${produtoId}/imagens/${idImagem}`,
        { withCredentials: true },
      );
      validarResposta(resposta.data);

      setMensagem(resposta.data?.mensagem || "Imagem excluída com sucesso.");
      await carregarImagens(produtoId);
    } catch (error) {
      console.error("[EXCLUIR IMAGEM]", error);
      setErro(extrairMensagemErro(error));
    }
  }

  return (
    <main className="imagens-page">
      <header className="topo">
        <div>
          <div className="eyebrow">
            <span /> GERENCIAMENTO DA LOJA
          </div>
          <h1>Imagens dos produtos</h1>
          <p>
            Gerencie as fotos, a imagem principal e a ordem visual de cada
            produto.
          </p>
        </div>

        <Link href="/painel/produtos" className="botao-voltar">
          <ArrowLeft size={17} /> Voltar aos produtos
        </Link>
      </header>

      {erro && !modalAberto && (
        <div className="alerta erro">
          <AlertCircle size={18} />
          <span>{erro}</span>
          <button
            type="button"
            onClick={() => setErro("")}
            aria-label="Fechar erro"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {mensagem && (
        <div className="alerta sucesso">
          <Check size={18} />
          <span>{mensagem}</span>
          <button
            type="button"
            onClick={() => setMensagem("")}
            aria-label="Fechar mensagem"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="resumo-grid">
        <article className="resumo-card">
          <div className="resumo-icone">
            <Package size={20} />
          </div>
          <div>
            <span>Produto selecionado</span>
            <strong>{produtoSelecionado?.nome ?? "—"}</strong>
          </div>
        </article>
        <article className="resumo-card">
          <div className="resumo-icone">
            <Images size={20} />
          </div>
          <div>
            <span>Total de imagens</span>
            <strong>{totalImagens}</strong>
          </div>
        </article>
        <article className="resumo-card">
          <div className="resumo-icone">
            <Star size={20} />
          </div>
          <div>
            <span>Imagem principal</span>
            <strong>{totalPrincipais > 0 ? "Definida" : "Não definida"}</strong>
          </div>
        </article>
      </section>

      <section className="painel-galeria">
        <div className="painel-cabecalho">
          <div>
            <span className="rotulo">BIBLIOTECA DE IMAGENS</span>
            <h2>Galeria do produto</h2>
            <p>
              Escolha um produto para visualizar e administrar suas imagens.
            </p>
          </div>

          <button
            type="button"
            className="botao-atualizar"
            onClick={() =>
              produtoId ? carregarImagens(produtoId) : carregarProdutos()
            }
            disabled={carregandoProdutos || carregandoImagens}
          >
            <RefreshCw
              size={16}
              className={
                carregandoProdutos || carregandoImagens ? "girando" : ""
              }
            />
            Atualizar
          </button>
        </div>

        <div className="seletor-produto">
          <div className="campo-busca">
            <Search size={17} />
            <input
              type="search"
              placeholder="Filtrar produtos por nome ou SKU..."
              value={buscaProduto}
              onChange={(event) => setBuscaProduto(event.target.value)}
            />
          </div>

          <div className="campo-select">
            <label htmlFor="produto-imagens">Produto</label>
            <select
              id="produto-imagens"
              value={produtoId}
              onChange={(event) => setProdutoId(event.target.value)}
              disabled={carregandoProdutos || produtosFiltrados.length === 0}
            >
              {carregandoProdutos ? (
                <option value="">Carregando produtos...</option>
              ) : produtosFiltrados.length === 0 ? (
                <option value="">Nenhum produto encontrado</option>
              ) : (
                produtosFiltrados.map((produto) => (
                  <option key={produto.id_produto} value={produto.id_produto}>
                    {produto.nome} {produto.sku ? `— ${produto.sku}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            className="botao-adicionar"
            onClick={abrirNovaImagem}
            disabled={!produtoId || carregandoProdutos}
          >
            <Plus size={18} /> Adicionar imagem
          </button>
        </div>

        {carregandoProdutos ? (
          <div className="estado-vazio">
            <Loader2 size={26} className="girando" />
            <span>Carregando produtos...</span>
          </div>
        ) : produtos.length === 0 ? (
          <div className="estado-vazio">
            <Package size={34} />
            <strong>Nenhum produto cadastrado</strong>
            <span>Cadastre um produto antes de gerenciar suas imagens.</span>
          </div>
        ) : carregandoImagens ? (
          <div className="estado-vazio">
            <Loader2 size={26} className="girando" />
            <span>Carregando imagens...</span>
          </div>
        ) : imagens.length === 0 ? (
          <div className="estado-vazio">
            <ImageIcon size={38} />
            <strong>Este produto ainda não possui imagens</strong>
            <span>Adicione uma imagem para começar a montar a galeria.</span>
            <button
              type="button"
              className="botao-adicionar vazio-botao"
              onClick={abrirNovaImagem}
            >
              <ImagePlus size={17} /> Adicionar primeira imagem
            </button>
          </div>
        ) : (
          <div className="grade-imagens">
            {imagens
              .slice()
              .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
              .map((imagem, indice) => {
                const principal = ehPrincipal(imagem.principal);
                return (
                  <article
                    className={`imagem-card ${principal ? "imagem-destaque" : ""}`}
                    key={obterIdImagem(imagem) || `${imagem.url}-${indice}`}
                  >
                    <div className="imagem-foto">
                      <img
                        src={imagem.url}
                        alt={
                          imagem.texto_alternativo ||
                          produtoSelecionado?.nome ||
                          "Imagem do produto"
                        }
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          const fallback = event.currentTarget
                            .nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div className="imagem-falha">
                        <ImageIcon size={30} />
                        <span>Não foi possível carregar</span>
                      </div>
                      {principal && (
                        <span className="selo-principal">
                          <Star size={13} fill="currentColor" /> Principal
                        </span>
                      )}
                      <span className="selo-ordem">
                        #{Number(imagem.ordem ?? indice) + 1}
                      </span>
                    </div>

                    <div className="imagem-info">
                      <strong>
                        {imagem.texto_alternativo?.trim() ||
                          "Sem texto alternativo"}
                      </strong>
                      <small title={imagem.url}>{imagem.url}</small>
                    </div>

                    <div className="imagem-acoes">
                      {!principal && (
                        <button
                          type="button"
                          className="acao-principal"
                          onClick={() => definirPrincipal(imagem)}
                        >
                          <Star size={15} /> Definir principal
                        </button>
                      )}
                      <button
                        type="button"
                        className="acao-editar"
                        onClick={() => abrirEdicaoImagem(imagem)}
                        title="Editar imagem"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="acao-excluir"
                        onClick={() => excluirImagem(imagem)}
                        title="Excluir imagem"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>

      <div className="observacao-api">
        <AlertCircle size={17} />
        <span>
          <strong>Sobre o envio:</strong> a rota atual do backend cadastra
          imagens recebendo uma URL em JSON. Para selecionar arquivos
          diretamente do computador e armazená-los no servidor, será necessário
          adicionar um endpoint de upload no PHP.
        </span>
      </div>

      {modalAberto && (
        <div
          className="modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharModal();
          }}
        >
          <section
            className="modal-imagem"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-imagem"
          >
            <header className="modal-topo">
              <div>
                <span className="rotulo">IMAGENS DO PRODUTO</span>
                <h2 id="titulo-modal-imagem">
                  {imagemEditando ? "Editar imagem" : "Adicionar imagem"}
                </h2>
                <p>{produtoSelecionado?.nome}</p>
              </div>
              <button
                type="button"
                className="fechar-modal"
                onClick={fecharModal}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={salvarImagem} className="form-imagem">
              {erro && (
                <div className="alerta erro">
                  <AlertCircle size={17} />
                  <span>{erro}</span>
                </div>
              )}

              <div className="aviso-url">
                <ImagePlus size={20} />
                <div>
                  <strong>Endereço da imagem</strong>
                  <span>
                    Informe uma URL pública da imagem (HTTP ou HTTPS).
                  </span>
                </div>
              </div>

              <label className="campo-form">
                URL da imagem <span>*</span>
                <input
                  type="url"
                  value={formulario.url}
                  onChange={(event) =>
                    setFormulario((atual) => ({
                      ...atual,
                      url: event.target.value,
                    }))
                  }
                  placeholder="https://seusite.com/imagens/produto.jpg"
                  required
                  autoFocus
                />
              </label>

              <label className="campo-form">
                Texto alternativo
                <input
                  type="text"
                  value={formulario.texto_alternativo}
                  onChange={(event) =>
                    setFormulario((atual) => ({
                      ...atual,
                      texto_alternativo: event.target.value,
                    }))
                  }
                  placeholder="Descreva o que aparece na imagem"
                  maxLength={255}
                />
                <small>Ajuda na acessibilidade e na descrição da imagem.</small>
              </label>

              {formulario.url.trim() && (
                <div className="previsao-form">
                  <img
                    src={formulario.url}
                    alt={formulario.texto_alternativo || "Prévia da imagem"}
                  />
                  <span>Pré-visualização</span>
                </div>
              )}

              <footer className="modal-rodape">
                <button
                  type="button"
                  className="botao-cancelar"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="botao-adicionar"
                  disabled={salvando}
                >
                  {salvando ? (
                    <>
                      <Loader2 size={17} className="girando" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={17} />{" "}
                      {imagemEditando
                        ? "Salvar alterações"
                        : "Cadastrar imagem"}
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <style jsx>{`
        .imagens-page {
          width: 100%;
          min-width: 0;
          padding: 28px clamp(16px, 3vw, 38px) 40px;
          color: #f5edf1;
          font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
          box-sizing: border-box;
        }
        .imagens-page * {
          box-sizing: border-box;
        }
        .topo {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }
        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
          color: #d98ca7;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }
        .eyebrow span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d98ca7;
          box-shadow: 0 0 10px #d98ca7;
        }
        .topo h1 {
          margin: 0;
          color: #fff5f8;
          font-size: clamp(24px, 3vw, 31px);
          font-weight: 750;
          letter-spacing: -0.8px;
        }
        .topo p {
          margin: 7px 0 0;
          color: #988993;
          font-size: 12px;
        }
        .botao-voltar {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          border: 1px solid #49303c;
          border-radius: 9px;
          color: #d0bdc7;
          font-size: 11px;
          font-weight: 650;
          text-decoration: none;
          white-space: nowrap;
          transition: 0.2s;
        }
        .botao-voltar:hover {
          background: #38232e;
          border-color: #765064;
          color: #eda8c0;
        }
        .alerta {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          margin-bottom: 16px;
          border: 1px solid;
          border-radius: 9px;
          font-size: 12px;
        }
        .alerta button {
          display: flex;
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }
        .erro {
          border-color: #7d3944;
          background: #642c351f;
          color: #ed9ba4;
        }
        .sucesso {
          border-color: #37664e;
          background: #34744d1c;
          color: #8bd2a8;
        }
        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .resumo-card {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
          padding: 17px;
          border: 1px solid #392a34;
          border-radius: 13px;
          background: linear-gradient(145deg, #241c22, #191518);
        }
        .resumo-icone {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 11px;
          background: #d98ca71a;
          color: #d98ca7;
        }
        .resumo-card div:last-child {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }
        .resumo-card span {
          color: #a998a2;
          font-size: 10px;
        }
        .resumo-card strong {
          overflow: hidden;
          color: #f4e9ee;
          font-size: 15px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .painel-galeria {
          overflow: hidden;
          border: 1px solid #392a34;
          border-radius: 15px;
          background: #1d171c;
        }
        .painel-cabecalho {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 22px;
          border-bottom: 1px solid #342831;
        }
        .rotulo {
          color: #d98ca7;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }
        .painel-cabecalho h2 {
          margin: 6px 0 4px;
          color: #fff5f8;
          font-size: 17px;
        }
        .painel-cabecalho p {
          margin: 0;
          color: #91828b;
          font-size: 11px;
        }
        .botao-atualizar,
        .botao-adicionar,
        .botao-cancelar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 41px;
          padding: 0 15px;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
          transition: 0.2s;
        }
        .botao-atualizar {
          border: 1px solid #493642;
          background: #292027;
          color: #c9bac3;
        }
        .botao-atualizar:hover {
          border-color: #d98ca7;
          color: #f4c6d6;
        }
        .botao-adicionar {
          border: 1px solid #d47f9e;
          background: linear-gradient(135deg, #d98ca7, #b85f80);
          color: #21151b;
        }
        .botao-adicionar:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .botao-adicionar:disabled,
        .botao-atualizar:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .seletor-produto {
          display: grid;
          grid-template-columns: minmax(190px, 0.9fr) minmax(230px, 1.2fr) auto;
          align-items: end;
          gap: 13px;
          padding: 17px 22px;
          border-bottom: 1px solid #342831;
          background: #211a20;
        }
        .campo-busca {
          display: flex;
          align-items: center;
          gap: 9px;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #44323e;
          border-radius: 9px;
          background: #171216;
          color: #a88c9b;
        }
        .campo-busca input {
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #f5edf1;
          font-size: 11px;
        }
        .campo-busca input::placeholder {
          color: #766872;
        }
        .campo-select {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .campo-select label {
          color: #d8c8d0;
          font-size: 10px;
          font-weight: 700;
        }
        .campo-select select {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #44323e;
          border-radius: 9px;
          outline: 0;
          background: #171216;
          color: #e5d8df;
          font-size: 11px;
        }
        .estado-vazio {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 9px;
          min-height: 250px;
          padding: 30px;
          text-align: center;
          color: #998791;
        }
        .estado-vazio strong {
          color: #e7d9e0;
          font-size: 13px;
        }
        .estado-vazio span {
          font-size: 11px;
        }
        .vazio-botao {
          margin-top: 8px;
        }
        .grade-imagens {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          padding: 22px;
        }
        .imagem-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #40303a;
          border-radius: 12px;
          background: #211a20;
          transition:
            border-color 0.2s,
            transform 0.2s;
        }
        .imagem-card:hover {
          transform: translateY(-2px);
          border-color: #85536b;
        }
        .imagem-destaque {
          border-color: #9a617a;
          box-shadow: 0 0 0 1px #9a617a33;
        }
        .imagem-foto {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 190px;
          overflow: hidden;
          background: #171216;
        }
        .imagem-foto img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .imagem-falha {
          display: none;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          height: 100%;
          color: #8e7d87;
          font-size: 10px;
        }
        .selo-principal {
          position: absolute;
          top: 10px;
          left: 10px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border: 1px solid #9d6b36;
          border-radius: 20px;
          background: #33271d;
          color: #eac181;
          font-size: 9px;
          font-weight: 800;
        }
        .selo-ordem {
          position: absolute;
          right: 10px;
          bottom: 10px;
          padding: 5px 8px;
          border-radius: 6px;
          background: #090709b8;
          color: #e8dce2;
          font-size: 9px;
          font-weight: 700;
        }
        .imagem-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
          padding: 12px 13px 9px;
        }
        .imagem-info strong {
          overflow: hidden;
          color: #e9dce3;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .imagem-info small {
          overflow: hidden;
          color: #8f7e89;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .imagem-acoes {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px 12px;
        }
        .acao-principal {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 1;
          min-height: 32px;
          padding: 0 8px;
          border: 1px solid #59452e;
          border-radius: 7px;
          background: #34291e;
          color: #e8c184;
          font-size: 9px;
          font-weight: 750;
          cursor: pointer;
        }
        .acao-principal:hover {
          border-color: #c79a57;
          background: #473720;
        }
        .acao-editar,
        .acao-excluir {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 33px;
          height: 32px;
          border: 1px solid #44323e;
          border-radius: 7px;
          background: #292027;
          cursor: pointer;
        }
        .acao-editar {
          color: #a9bfe2;
        }
        .acao-excluir {
          color: #df858e;
        }
        .acao-editar:hover {
          border-color: #8ba8d3;
        }
        .acao-excluir:hover {
          border-color: #df858e;
        }
        .observacao-api {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 16px;
          padding: 13px 15px;
          border: 1px solid #51412e;
          border-radius: 9px;
          background: #292219;
          color: #d8bd91;
          font-size: 10px;
          line-height: 1.6;
        }
        .observacao-api svg {
          flex-shrink: 0;
          margin-top: 1px;
        }
        .observacao-api strong {
          color: #f0d29d;
        }
        .modal-fundo {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: #080608d9;
          backdrop-filter: blur(6px);
        }
        .modal-imagem {
          width: 100%;
          max-width: 560px;
          max-height: calc(100dvh - 36px);
          overflow: auto;
          border: 1px solid #503747;
          border-radius: 15px;
          background: #211920;
          box-shadow: 0 25px 90px #000b;
        }
        .modal-topo {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding: 22px 24px;
          border-bottom: 1px solid #3b2b35;
        }
        .modal-topo h2 {
          margin: 7px 0 5px;
          color: #fff2f7;
          font-size: 20px;
        }
        .modal-topo p {
          margin: 0;
          color: #a18f99;
          font-size: 11px;
        }
        .fechar-modal {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid #4b3543;
          border-radius: 9px;
          background: #2b2029;
          color: #d9cbd2;
          cursor: pointer;
        }
        .form-imagem {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 23px 24px;
        }
        .aviso-url {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px;
          border: 1px solid #49313e;
          border-radius: 9px;
          background: #241a21;
          color: #cf9eb3;
        }
        .aviso-url div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .aviso-url strong {
          color: #e8c5d3;
          font-size: 11px;
        }
        .aviso-url span {
          color: #9b8792;
          font-size: 10px;
          line-height: 1.5;
        }
        .campo-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #d8c8d0;
          font-size: 11px;
          font-weight: 700;
        }
        .campo-form > span {
          color: #ed8fae;
        }
        .campo-form input {
          width: 100%;
          height: 43px;
          padding: 0 12px;
          border: 1px solid #493440;
          border-radius: 8px;
          outline: 0;
          background: #151115;
          color: #f1e9ed;
          font-size: 12px;
        }
        .campo-form input:focus {
          border-color: #b57491;
          box-shadow: 0 0 0 3px #d589a61a;
        }
        .campo-form input::placeholder {
          color: #74636d;
        }
        .campo-form small {
          color: #82717c;
          font-size: 9px;
          font-weight: 400;
        }
        .previsao-form {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border: 1px solid #44313e;
          border-radius: 9px;
          background: #171216;
          color: #a9949f;
          font-size: 10px;
        }
        .previsao-form img {
          width: 62px;
          height: 62px;
          object-fit: contain;
          border-radius: 6px;
          background: #211a20;
        }
        .modal-rodape {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 15px;
          border-top: 1px solid #3b2b35;
        }
        .botao-cancelar {
          border: 1px solid #493642;
          background: #292027;
          color: #c9bac3;
        }
        .botao-cancelar:hover {
          border-color: #d98ca7;
          color: #f4c6d6;
        }
        .girando {
          animation: girar 1s linear infinite;
        }
        @keyframes girar {
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 1100px) {
          .grade-imagens {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .topo {
            align-items: flex-start;
            flex-direction: column;
          }
          .resumo-grid {
            grid-template-columns: 1fr;
          }
          .seletor-produto {
            grid-template-columns: 1fr;
          }
          .seletor-produto .botao-adicionar {
            width: 100%;
          }
          .grade-imagens {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 14px;
          }
          .imagem-foto {
            height: 160px;
          }
        }
        @media (max-width: 460px) {
          .grade-imagens {
            grid-template-columns: 1fr;
          }
          .imagem-foto {
            height: 210px;
          }
          .painel-cabecalho {
            align-items: flex-start;
          }
          .modal-rodape {
            flex-direction: column-reverse;
          }
          .modal-rodape button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
