"use client";

import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  FolderTree,
  Layers,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";


type Categoria = {
  id_categoria: number;
  categoria_pai_id?: number | null;
  nome: string;
  slug?: string;
  descricao?: string | null;
  imagem_url?: string | null;
  ordem?: number;
  ativo?: boolean | number;
  status_id?: number;
  filhos?: Categoria[];
};

type FormularioCategoria = {
  nome: string;
  slug: string;
  descricao: string;
  categoria_pai_id: string;
  imagem_url: string;
  ordem: string;
  ativo: boolean;
};

const FORMULARIO_INICIAL: FormularioCategoria = {
  nome: "",
  slug: "",
  descricao: "",
  categoria_pai_id: "",
  imagem_url: "",
  ordem: "0",
  ativo: true,
};

function gerarSlug(valor: string): string {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 220);
}

function extrairCategorias(payload: any): Categoria[] {
  const possibilidades = [
    payload?.dados?.categorias,
    payload?.dados?.dados,
    payload?.categorias,
    payload?.data?.categorias,
    payload?.data?.dados,
    payload?.data,
    payload?.dados,
    payload,
  ];

  return possibilidades.find(Array.isArray) ?? [];
}

function erroApi(error: any, padrao: string): string {
  return (
    error?.response?.data?.mensagem ||
    error?.response?.data?.erro ||
    error?.response?.data?.message ||
    error?.message ||
    padrao
  );
}

function validarResposta(payload: any): void {
  if (
    payload?.sucesso === false ||
    (typeof payload?.status === "number" && payload.status >= 400)
  ) {
    throw new Error(
      payload?.mensagem || payload?.erro || "A operação não foi concluída.",
    );
  }
}

function estaAtiva(categoria: Categoria): boolean {
  return (
    categoria.ativo === undefined ||
    (String(categoria.ativo) !== "0" &&
      String(categoria.ativo).toLowerCase() !== "false")
  );
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todas" | "ativas" | "inativas"
  >("todas");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [formulario, setFormulario] =
    useState<FormularioCategoria>(FORMULARIO_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const [expandido, setExpandido] = useState<Set<number>>(new Set());

  const carregarCategorias = useCallback(async (silencioso = false) => {
    try {
      if (silencioso) setAtualizando(true);
      else setCarregando(true);
      setErro("");

      const resposta = await conexao.get(ROTAS.CATEGORIAS.PAINEL.ARVORE, {
        withCredentials: true,
      });

      validarResposta(resposta.data);
      const lista = extrairCategorias(resposta.data);

      // A rota de árvore pode devolver uma estrutura aninhada.
      setCategorias(lista);
      setExpandido(new Set(lista.map((item) => Number(item.id_categoria))));
    } catch (error: any) {
      console.error("[UNIVERSO IMPÉRIO | CATEGORIAS] Erro ao carregar:", error);
      setErro(erroApi(error, "Não foi possível carregar as categorias."));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregarCategorias();
  }, [carregarCategorias]);

  useEffect(() => {
    if (!sucesso) return;
    const temporizador = window.setTimeout(() => setSucesso(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [sucesso]);

  const categoriasPlanas = useMemo(() => {
    const resultado: Categoria[] = [];
    const percorrer = (lista: Categoria[], nivel = 0) => {
      lista.forEach((categoria) => {
        resultado.push({ ...categoria, __nivel: nivel } as Categoria & {
          __nivel: number;
        });
        if (
          categoria.filhos?.length &&
          expandido.has(Number(categoria.id_categoria))
        ) {
          percorrer(categoria.filhos, nivel + 1);
        }
      });
    };
    percorrer(categorias);
    return resultado;
  }, [categorias, expandido]);

  const categoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return categoriasPlanas.filter((categoria) => {
      const correspondeBusca =
        !termo ||
        categoria.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        (categoria.slug ?? "").toLocaleLowerCase("pt-BR").includes(termo);

      const correspondeStatus =
        filtroStatus === "todas" ||
        (filtroStatus === "ativas" && estaAtiva(categoria)) ||
        (filtroStatus === "inativas" && !estaAtiva(categoria));

      return correspondeBusca && correspondeStatus;
    });
  }, [categoriasPlanas, busca, filtroStatus]);

  const totalAtivas = categoriasPlanas.filter(estaAtiva).length;
  const totalInativas = categoriasPlanas.length - totalAtivas;
  const totalPrincipais = categorias.filter(
    (categoria) => !categoria.categoria_pai_id,
  ).length;

  function abrirCadastro() {
    setEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(categoria: Categoria) {
    setEditando(categoria.id_categoria);
    setFormulario({
      nome: categoria.nome ?? "",
      slug: categoria.slug ?? "",
      descricao: categoria.descricao ?? "",
      categoria_pai_id: categoria.categoria_pai_id
        ? String(categoria.categoria_pai_id)
        : "",
      imagem_url: categoria.imagem_url ?? "",
      ordem: String(categoria.ordem ?? 0),
      ativo: estaAtiva(categoria),
    });
    setErro("");
    setModalAberto(true);
  }

  function alterarNome(nome: string) {
    setFormulario((atual) => ({
      ...atual,
      nome,
      slug:
        editando === null || atual.slug === gerarSlug(atual.nome)
          ? gerarSlug(nome)
          : atual.slug,
    }));
  }

  async function salvarCategoria(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (salvando) return;

    if (!formulario.nome.trim()) {
      setErro("Informe o nome da categoria.");
      return;
    }

    if (!formulario.slug.trim()) {
      setErro("Informe o slug da categoria.");
      return;
    }

    const dados = {
      nome: formulario.nome.trim(),
      slug: formulario.slug.trim(),
      descricao: formulario.descricao.trim() || null,
      categoria_pai_id: formulario.categoria_pai_id
        ? Number(formulario.categoria_pai_id)
        : null,
      imagem_url: formulario.imagem_url.trim() || null,
      ordem: Number(formulario.ordem) || 0,
      ativo: formulario.ativo,
      status_id: 1,
    };

    try {
      setSalvando(true);
      setErro("");

      if (editando !== null) {
        const resposta = await conexao.put(
          ROTAS.CATEGORIAS.PAINEL.ATUALIZAR(editando),
          dados,
          { withCredentials: true },
        );
        validarResposta(resposta.data);
        setSucesso("Categoria atualizada com sucesso.");
      } else {
        const resposta = await conexao.post(
          ROTAS.CATEGORIAS.PAINEL.CADASTRAR,
          dados,
          { withCredentials: true },
        );
        validarResposta(resposta.data);
        setSucesso("Categoria cadastrada com sucesso.");
      }

      setModalAberto(false);
      setFormulario(FORMULARIO_INICIAL);
      await carregarCategorias(true);
    } catch (error: any) {
      console.error("[UNIVERSO IMPÉRIO | CATEGORIAS] Erro ao salvar:", error);
      setErro(erroApi(error, "Não foi possível salvar a categoria."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluirCategoria(categoria: Categoria) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a categoria "${categoria.nome}"? Essa ação não poderá ser desfeita.`,
    );
    if (!confirmar) return;

    try {
      setExcluindo(categoria.id_categoria);
      setErro("");

      const resposta = await conexao.delete(
        ROTAS.CATEGORIAS.PAINEL.EXCLUIR(categoria.id_categoria),
        { withCredentials: true },
      );
      validarResposta(resposta.data);
      setSucesso("Categoria excluída com sucesso.");
      await carregarCategorias(true);
    } catch (error: any) {
      console.error("[UNIVERSO IMPÉRIO | CATEGORIAS] Erro ao excluir:", error);
      setErro(erroApi(error, "Não foi possível excluir a categoria."));
    } finally {
      setExcluindo(null);
    }
  }

  function alternarExpandido(id: number) {
    setExpandido((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const idsDescendentes = (categoria: Categoria): number[] => {
    const ids: number[] = [];
    const percorrer = (item: Categoria) => {
      item.filhos?.forEach((filho) => {
        ids.push(Number(filho.id_categoria));
        percorrer(filho);
      });
    };
    percorrer(categoria);
    return ids;
  };

  const idsBloqueados = useMemo(() => {
    if (editando === null) return new Set<number>();
    const encontrar = (lista: Categoria[]): Categoria | undefined => {
      for (const item of lista) {
        if (Number(item.id_categoria) === editando) return item;
        const encontrado = item.filhos ? encontrar(item.filhos) : undefined;
        if (encontrado) return encontrado;
      }
      return undefined;
    };
    const atual = encontrar(categorias);
    return new Set(atual ? [editando, ...idsDescendentes(atual)] : [editando]);
  }, [categorias, editando]);

  return (
    <main className="categorias-page">
      <header className="pagina-topo">
        <div>
          <div className="breadcrumb">
            <a href="/painel">Painel</a>
            <ChevronRight size={13} />
            <span>Categorias</span>
          </div>
          <div className="titulo-principal">
            <div className="titulo-icone">
              <FolderTree size={23} />
            </div>
            <div>
              <h1>Gerenciamento de categorias</h1>
              <p>Organize os produtos da loja em categorias e subcategorias.</p>
            </div>
          </div>
        </div>
        <button className="botao-primario" onClick={abrirCadastro}>
          <Plus size={17} /> Nova categoria
        </button>
      </header>

      {erro && (
        <div className="mensagem mensagem-erro" role="alert">
          <AlertCircle size={17} />
          <span>{erro}</span>
          <button onClick={() => setErro("")} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
      )}
      {sucesso && (
        <div className="mensagem mensagem-sucesso" role="status">
          <Check size={17} />
          <span>{sucesso}</span>
          <button onClick={() => setSucesso("")} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="indicadores">
        <article className="indicador">
          <span className="indicador-icone">
            <Layers size={19} />
          </span>
          <div>
            <small>TOTAL DE CATEGORIAS</small>
            <strong>{categoriasPlanas.length}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone verde">
            <Check size={19} />
          </span>
          <div>
            <small>CATEGORIAS ATIVAS</small>
            <strong>{totalAtivas}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone neutro">
            <FolderTree size={19} />
          </span>
          <div>
            <small>CATEGORIAS PRINCIPAIS</small>
            <strong>{totalPrincipais}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone amarelo">
            <Tag size={19} />
          </span>
          <div>
            <small>CATEGORIAS INATIVAS</small>
            <strong>{totalInativas}</strong>
          </div>
        </article>
      </section>

      <section className="painel-listagem">
        <div className="listagem-topo">
          <div>
            <span className="sobrelinha">CATÁLOGO</span>
            <h2>Categorias cadastradas</h2>
            <p>Visualize e gerencie a estrutura do catálogo.</p>
          </div>
          <button
            className="botao-atualizar"
            onClick={() => void carregarCategorias(true)}
            disabled={atualizando || carregando}
          >
            <RefreshCw size={15} className={atualizando ? "girando" : ""} />
            Atualizar
          </button>
        </div>

        <div className="filtros">
          <div className="busca">
            <Search size={17} />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome ou slug..."
            />
            {busca && (
              <button onClick={() => setBusca("")} aria-label="Limpar busca">
                <X size={15} />
              </button>
            )}
          </div>
          <div className="filtro-status">
            <button
              className={filtroStatus === "todas" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("todas")}
            >
              Todas
            </button>
            <button
              className={filtroStatus === "ativas" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("ativas")}
            >
              Ativas
            </button>
            <button
              className={filtroStatus === "inativas" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("inativas")}
            >
              Inativas
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="estado-vazio">
            <LoaderCircle className="girando" size={25} />
            <strong>Carregando categorias...</strong>
          </div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="estado-vazio">
            <FolderTree size={30} />
            <strong>
              {busca
                ? "Nenhuma categoria encontrada"
                : "Nenhuma categoria cadastrada"}
            </strong>
            <span>
              {busca
                ? "Tente pesquisar por outro nome."
                : "Comece criando a primeira categoria da loja."}
            </span>
            {!busca && (
              <button className="botao-primario" onClick={abrirCadastro}>
                <Plus size={16} /> Criar categoria
              </button>
            )}
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela-categorias">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Slug</th>
                  <th>Ordem</th>
                  <th>Status</th>
                  <th className="acoes-coluna">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categoriasFiltradas.map((categoria) => {
                  const nivel = Number(
                    (categoria as Categoria & { __nivel?: number }).__nivel ??
                      0,
                  );
                  const possuiFilhos = Boolean(categoria.filhos?.length);
                  const aberta = expandido.has(Number(categoria.id_categoria));
                  return (
                    <tr key={categoria.id_categoria}>
                      <td>
                        <div
                          className="categoria-identidade"
                          style={{ paddingLeft: `${nivel * 25}px` }}
                        >
                          {possuiFilhos ? (
                            <button
                              className="expandir"
                              onClick={() =>
                                alternarExpandido(
                                  Number(categoria.id_categoria),
                                )
                              }
                              aria-label={
                                aberta
                                  ? "Recolher subcategorias"
                                  : "Expandir subcategorias"
                              }
                            >
                              {aberta ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          ) : (
                            <span className="sem-expandir" />
                          )}
                          <span
                            className={`categoria-icone ${nivel > 0 ? "filha" : ""}`}
                          >
                            <FolderTree size={16} />
                          </span>
                          <div>
                            <strong>{categoria.nome}</strong>
                            <small>
                              {nivel > 0
                                ? "Subcategoria"
                                : "Categoria principal"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="slug">{categoria.slug || "—"}</span>
                      </td>
                      <td>{categoria.ordem ?? 0}</td>
                      <td>
                        <span
                          className={`status ${estaAtiva(categoria) ? "ativo" : "inativo"}`}
                        >
                          <i />
                          {estaAtiva(categoria) ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        <div className="acoes">
                          <button
                            className="acao-editar"
                            onClick={() => abrirEdicao(categoria)}
                            title="Editar categoria"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="acao-excluir"
                            onClick={() => void excluirCategoria(categoria)}
                            disabled={excluindo === categoria.id_categoria}
                            title="Excluir categoria"
                          >
                            {excluindo === categoria.id_categoria ? (
                              <LoaderCircle size={15} className="girando" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="rodape-tabela">
          Exibindo <strong>{categoriasFiltradas.length}</strong> de{" "}
          <strong>{categoriasPlanas.length}</strong> categorias
        </div>
      </section>

      {modalAberto && (
        <div
          className="modal-fundo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvando)
              setModalAberto(false);
          }}
        >
          <section
            className="modal-categoria"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-titulo"
          >
            <header className="modal-topo">
              <div className="modal-icone">
                <FolderTree size={20} />
              </div>
              <div>
                <h2 id="modal-titulo">
                  {editando ? "Editar categoria" : "Nova categoria"}
                </h2>
                <p>Preencha as informações do catálogo.</p>
              </div>
              <button
                className="fechar-modal"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>

            <form onSubmit={salvarCategoria}>
              <div className="campo">
                <label htmlFor="categoria-nome">
                  Nome da categoria <b>*</b>
                </label>
                <input
                  id="categoria-nome"
                  value={formulario.nome}
                  onChange={(e) => alterarNome(e.target.value)}
                  placeholder="Ex.: Decoração"
                  maxLength={180}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="categoria-slug">
                  Slug <b>*</b>
                </label>
                <input
                  id="categoria-slug"
                  value={formulario.slug}
                  onChange={(e) =>
                    setFormulario((atual) => ({
                      ...atual,
                      slug: gerarSlug(e.target.value),
                    }))
                  }
                  placeholder="decoracao"
                  maxLength={220}
                  required
                />
                <small>Endereço amigável utilizado no catálogo.</small>
              </div>
              <div className="campo">
                <label htmlFor="categoria-pai">Categoria principal</label>
                <select
                  id="categoria-pai"
                  value={formulario.categoria_pai_id}
                  onChange={(e) =>
                    setFormulario((atual) => ({
                      ...atual,
                      categoria_pai_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Nenhuma (categoria principal)</option>
                  {categoriasPlanas
                    .filter(
                      (item) => !idsBloqueados.has(Number(item.id_categoria)),
                    )
                    .map((item) => (
                      <option key={item.id_categoria} value={item.id_categoria}>
                        {item.nome}
                      </option>
                    ))}
                </select>
                <small>
                  Selecione uma categoria para criar uma subcategoria.
                </small>
              </div>
              <div className="campo">
                <label htmlFor="categoria-descricao">Descrição</label>
                <textarea
                  id="categoria-descricao"
                  rows={3}
                  value={formulario.descricao}
                  onChange={(e) =>
                    setFormulario((atual) => ({
                      ...atual,
                      descricao: e.target.value,
                    }))
                  }
                  placeholder="Descreva esta categoria..."
                />
              </div>
              <div className="campos-duplos">
                <div className="campo">
                  <label htmlFor="categoria-imagem">URL da imagem</label>
                  <input
                    id="categoria-imagem"
                    value={formulario.imagem_url}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        imagem_url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="campo">
                  <label htmlFor="categoria-ordem">Ordem de exibição</label>
                  <input
                    id="categoria-ordem"
                    type="number"
                    value={formulario.ordem}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        ordem: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <label className="opcao-ativo">
                <span>
                  <strong>Categoria ativa</strong>
                  <small>Disponibilizar esta categoria no catálogo.</small>
                </span>
                <input
                  type="checkbox"
                  checked={formulario.ativo}
                  onChange={(e) =>
                    setFormulario((atual) => ({
                      ...atual,
                      ativo: e.target.checked,
                    }))
                  }
                />
              </label>

              {erro && (
                <div className="erro-modal">
                  <AlertCircle size={15} />
                  {erro}
                </div>
              )}

              <footer className="modal-acoes">
                <button
                  type="button"
                  className="botao-cancelar"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="botao-primario"
                  disabled={salvando}
                >
                  {salvando ? (
                    <LoaderCircle size={16} className="girando" />
                  ) : (
                    <Check size={16} />
                  )}
                  {salvando
                    ? "Salvando..."
                    : editando
                      ? "Salvar alterações"
                      : "Cadastrar categoria"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <style jsx>{estilos}</style>
    </main>
  );
}

const estilos = `
  .categorias-page{width:100%;max-width:1240px;margin:0 auto;padding:26px clamp(14px,2.5vw,30px) 40px;color:#f5edf1;font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;box-sizing:border-box}
  .categorias-page *{box-sizing:border-box}
  .pagina-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:22px}
  .breadcrumb{display:flex;align-items:center;gap:8px;margin-bottom:13px;color:#8e7c87;font-size:11px}
  .breadcrumb a{color:#a8949e;text-decoration:none}.breadcrumb a:hover{color:#e9a1ba}
  .titulo-principal{display:flex;align-items:center;gap:12px}
  .titulo-icone{width:46px;height:46px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #684153;border-radius:12px;background:linear-gradient(135deg,#50303e,#30202a);color:#eda8c0}
  .titulo-principal h1{margin:0 0 5px;color:#f8eff3;font-size:clamp(20px,2vw,26px);font-weight:750;letter-spacing:-.7px}
  .titulo-principal p{margin:0;color:#a894a0;font-size:12px}
  button{font:inherit;cursor:pointer}.botao-primario{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:10px 15px;border:1px solid #bd7894;border-radius:9px;background:linear-gradient(135deg,#a85f7b,#87445f);color:#fff;font-size:11px;font-weight:750;box-shadow:0 5px 16px #9b557526;transition:.2s}
  .botao-primario:hover{filter:brightness(1.12);transform:translateY(-1px)}.botao-primario:disabled{opacity:.6;cursor:not-allowed}
  .mensagem{display:flex;align-items:center;gap:10px;padding:12px 14px;margin-bottom:14px;border:1px solid;border-radius:9px;font-size:11px}.mensagem span{flex:1}.mensagem button{display:flex;border:0;background:transparent;color:inherit}
  .mensagem-erro{background:#351c25;border-color:#75404f;color:#f2aabd}.mensagem-sucesso{background:#192b22;border-color:#365b46;color:#a8dfbd}
  .indicadores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:17px}
  .indicador{display:flex;align-items:center;gap:12px;min-width:0;padding:16px;border:1px solid #3f2b36;border-radius:12px;background:linear-gradient(145deg,#211a20,#1b161b)}
  .indicador-icone{width:39px;height:39px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #694153;border-radius:10px;background:#392630;color:#e9a1ba}
  .indicador-icone.verde{background:#1c3026;border-color:#365b46;color:#8ed0a8}.indicador-icone.neutro{background:#28232b;border-color:#49404d;color:#c6b4ca}.indicador-icone.amarelo{background:#342b20;border-color:#66502e;color:#e5c17c}
  .indicador div{display:flex;flex-direction:column;gap:5px;min-width:0}.indicador small{color:#978590;font-size:8px;font-weight:750;letter-spacing:.7px}.indicador strong{color:#f7edf2;font-size:23px;line-height:1.1}
  .painel-listagem{overflow:hidden;border:1px solid #3f2b36;border-radius:13px;background:radial-gradient(circle at top right,rgba(126,65,91,.06),transparent 38%),#1c171b;box-shadow:0 8px 24px #0002}
  .listagem-topo{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:20px 21px 16px;border-bottom:1px solid #392832}
  .sobrelinha{color:#c987a1;font-size:8px;font-weight:800;letter-spacing:1.2px}.listagem-topo h2{margin:5px 0;color:#f1e7ec;font-size:15px}.listagem-topo p{margin:0;color:#94818d;font-size:10px}
  .botao-atualizar{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #493440;border-radius:8px;background:#211a20;color:#cdbac5;font-size:10px}.botao-atualizar:hover{border-color:#936078;color:#f0b2c8}.botao-atualizar:disabled{opacity:.6;cursor:not-allowed}
  .filtros{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid #392832}
  .busca{display:flex;align-items:center;gap:9px;width:min(100%,360px);height:38px;padding:0 11px;border:1px solid #493440;border-radius:8px;background:#151115;color:#9d8995}.busca:focus-within{border-color:#a96b85}.busca input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#f1e9ed;font:inherit;font-size:10px}.busca input::placeholder{color:#74636d}.busca button{display:flex;border:0;background:transparent;color:#a8949e}
  .filtro-status{display:flex;gap:4px;padding:3px;border:1px solid #3f2b36;border-radius:8px;background:#171216}.filtro-status button{padding:7px 11px;border:0;border-radius:6px;background:transparent;color:#988590;font-size:9px}.filtro-status button.selecionado{background:#573344;color:#f4c4d5}
  .tabela-scroll{width:100%;overflow-x:auto}.tabela-categorias{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}.tabela-categorias th{padding:12px 17px;background:#211a20;color:#8f7c88;font-size:8px;font-weight:800;letter-spacing:.8px;text-transform:uppercase}.tabela-categorias td{padding:12px 17px;border-top:1px solid #342630;color:#cdbdc6;font-size:10px}.tabela-categorias tbody tr:hover{background:#251c23}.tabela-categorias .acoes-coluna{text-align:right}
  .categoria-identidade{display:flex;align-items:center;gap:9px;min-width:240px}.expandir{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:0;border-radius:5px;background:transparent;color:#b99eac}.expandir:hover{background:#392630;color:#f0b2c8}.sem-expandir{width:22px;flex:0 0 22px}
  .categoria-icone{width:31px;height:31px;display:flex;align-items:center;justify-content:center;border:1px solid #694153;border-radius:8px;background:#392630;color:#e9a1ba}.categoria-icone.filha{border-color:#4b3d50;background:#29222e;color:#c6a8d0}
  .categoria-identidade div{display:flex;flex-direction:column;gap:4px}.categoria-identidade strong{color:#eee2e9;font-size:10px}.categoria-identidade small{color:#806f7a;font-size:8px}
  .slug{color:#b69eaa;font-family:ui-monospace,SFMono-Regular,monospace;font-size:9px}.status{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid;border-radius:20px;font-size:8px;font-weight:750}.status i{width:6px;height:6px;border-radius:50%;background:currentColor}.status.ativo{border-color:#345d46;background:#1b3025;color:#8fd0a7}.status.inativo{border-color:#65434a;background:#321f25;color:#e4a0ad}
  .acoes{display:flex;justify-content:flex-end;gap:6px}.acoes button{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:1px solid;border-radius:7px;background:transparent;transition:.2s}.acao-editar{border-color:#665044!important;color:#e1bd8a}.acao-editar:hover{background:#3b2b20}.acao-excluir{border-color:#69404a!important;color:#e69aaa}.acao-excluir:hover{background:#3a2028}.acoes button:disabled{opacity:.5;cursor:not-allowed}
  .rodape-tabela{padding:12px 18px;border-top:1px solid #392832;color:#8f7d88;font-size:9px}.rodape-tabela strong{color:#d8c4ce}
  .estado-vazio{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:220px;padding:30px;color:#8d7b87;text-align:center}.estado-vazio strong{color:#d8c7d0;font-size:12px}.estado-vazio span{font-size:10px}.estado-vazio .botao-primario{margin-top:7px}
  .modal-fundo{position:fixed;inset:0;z-index:1500;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px;background:rgba(8,5,8,.76);backdrop-filter:blur(5px)}
  .modal-categoria{width:min(100%,590px);max-height:calc(100vh - 40px);overflow-y:auto;border:1px solid #60404f;border-radius:14px;background:#1d171c;box-shadow:0 25px 80px #0008}
  .modal-topo{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:11px;padding:17px 19px;border-bottom:1px solid #392832;background:#211a20}
  .modal-icone{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:1px solid #694153;border-radius:10px;background:#392630;color:#e9a1ba}.modal-topo h2{margin:0 0 4px;color:#f4eaf0;font-size:14px}.modal-topo p{margin:0;color:#988590;font-size:9px}.fechar-modal{display:flex;margin-left:auto;padding:7px;border:0;border-radius:7px;background:transparent;color:#bdaab5}.fechar-modal:hover{background:#392630;color:#fff}
  .modal-categoria form{padding:18px 20px 20px}.campo{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}.campo label{color:#d8c8d0;font-size:10px;font-weight:700}.campo label b{color:#ed8fae}.campo input,.campo textarea,.campo select{width:100%;min-width:0;padding:10px 11px;border:1px solid #493440;border-radius:8px;outline:0;background:#151115;color:#f1e9ed;font-family:inherit;font-size:10px}.campo input,.campo select{height:39px}.campo textarea{resize:vertical;line-height:1.5}.campo input:focus,.campo textarea:focus,.campo select:focus{border-color:#b57491;box-shadow:0 0 0 3px #d589a617}.campo small{color:#82717c;font-size:8px}.campo select option{background:#1c171b}
  .campos-duplos{display:grid;grid-template-columns:1fr 150px;gap:12px}.opcao-ativo{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #493440;border-radius:8px;background:#211a20}.opcao-ativo span{display:flex;flex-direction:column;gap:4px}.opcao-ativo strong{color:#e4d6de;font-size:10px}.opcao-ativo small{color:#8f7d88;font-size:8px}.opcao-ativo input{width:16px;height:16px;accent-color:#b87591}
  .erro-modal{display:flex;align-items:center;gap:7px;margin-top:12px;padding:9px;border:1px solid #75404f;border-radius:7px;background:#351c25;color:#f2aabd;font-size:9px}.modal-acoes{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid #392832}.botao-cancelar{padding:10px 14px;border:1px solid #493440;border-radius:8px;background:transparent;color:#cdbac5;font-size:10px}.botao-cancelar:hover{background:#30232c}.girando{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}
  @media(max-width:800px){.indicadores{grid-template-columns:repeat(2,minmax(0,1fr))}.pagina-topo{align-items:flex-start;flex-direction:column}.pagina-topo>.botao-primario{align-self:flex-end}}
  @media(max-width:560px){.categorias-page{padding:18px 12px 28px}.titulo-principal h1{font-size:19px}.titulo-principal p{font-size:10px}.indicadores{gap:8px}.indicador{padding:11px;gap:8px}.indicador-icone{width:33px;height:33px}.indicador small{font-size:7px}.indicador strong{font-size:19px}.listagem-topo{padding:15px;align-items:flex-start}.filtros{align-items:stretch;flex-direction:column;padding:12px}.busca{width:100%}.filtro-status{width:100%}.filtro-status button{flex:1}.tabela-categorias th,.tabela-categorias td{padding:11px 12px}.campos-duplos{grid-template-columns:1fr}.modal-fundo{padding:10px}.modal-categoria{max-height:calc(100vh - 20px)}}
`;
