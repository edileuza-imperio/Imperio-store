"use client";

import {
  AlertCircle,
  Check,
  ChevronRight,
  Edit3,
  Image as ImageIcon,
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


type Marca = {
  id_marca: number;
  nome: string;
  slug?: string | null;
  descricao?: string | null;
  logo_url?: string | null;
  imagem_url?: string | null;
  ordem?: number;
  ativo?: boolean | number | string;
  status_id?: number;
};

type FormularioMarca = {
  nome: string;
  slug: string;
  descricao: string;
  logo_url: string;
  ordem: string;
  ativo: boolean;
};

const FORMULARIO_INICIAL: FormularioMarca = {
  nome: "",
  slug: "",
  descricao: "",
  logo_url: "",
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

function extrairMarcas(payload: any): Marca[] {
  const possibilidades = [
    payload?.dados?.marcas,
    payload?.dados?.dados,
    payload?.marcas,
    payload?.data?.marcas,
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

function estaAtiva(marca: Marca): boolean {
  return (
    marca.ativo === undefined ||
    (String(marca.ativo) !== "0" &&
      String(marca.ativo).toLowerCase() !== "false")
  );
}

export default function MarcasPage() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
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
    useState<FormularioMarca>(FORMULARIO_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const carregarMarcas = useCallback(async (silencioso = false) => {
    try {
      if (silencioso) setAtualizando(true);
      else setCarregando(true);
      setErro("");

      const resposta = await conexao.get(ROTAS.MARCAS.PAINEL.LISTAR, {
        withCredentials: true,
      });

      validarResposta(resposta.data);
      setMarcas(extrairMarcas(resposta.data));
    } catch (error: any) {
      console.error("[UNIVERSO IMPÉRIO | MARCAS] Erro ao carregar:", error);
      setErro(erroApi(error, "Não foi possível carregar as marcas."));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregarMarcas();
  }, [carregarMarcas]);

  useEffect(() => {
    if (!sucesso) return;
    const temporizador = window.setTimeout(() => setSucesso(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [sucesso]);

  const marcasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return marcas.filter((marca) => {
      const correspondeBusca =
        !termo ||
        (marca.nome ?? "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (marca.slug ?? "").toLocaleLowerCase("pt-BR").includes(termo);

      const correspondeStatus =
        filtroStatus === "todas" ||
        (filtroStatus === "ativas" && estaAtiva(marca)) ||
        (filtroStatus === "inativas" && !estaAtiva(marca));

      return correspondeBusca && correspondeStatus;
    });
  }, [marcas, busca, filtroStatus]);

  const totalAtivas = marcas.filter(estaAtiva).length;
  const totalInativas = marcas.length - totalAtivas;
  const totalComLogo = marcas.filter(
    (marca) => marca.logo_url || marca.imagem_url,
  ).length;

  function abrirCadastro() {
    setEditando(null);
    setFormulario(FORMULARIO_INICIAL);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(marca: Marca) {
    setEditando(marca.id_marca);
    setFormulario({
      nome: marca.nome ?? "",
      slug: marca.slug ?? "",
      descricao: marca.descricao ?? "",
      logo_url: marca.logo_url ?? marca.imagem_url ?? "",
      ordem: String(marca.ordem ?? 0),
      ativo: estaAtiva(marca),
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

  async function salvarMarca(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (salvando) return;

    if (!formulario.nome.trim()) {
      setErro("Informe o nome da marca.");
      return;
    }
    if (!formulario.slug.trim()) {
      setErro("Informe o slug da marca.");
      return;
    }

    const dados = {
      nome: formulario.nome.trim(),
      slug: formulario.slug.trim(),
      descricao: formulario.descricao.trim() || null,
      logo_url: formulario.logo_url.trim() || null,
      ordem: Number(formulario.ordem) || 0,
      ativo: formulario.ativo,
      status_id: formulario.ativo ? 1 : 0,
    };

    try {
      setSalvando(true);
      setErro("");

      if (editando !== null) {
        const resposta = await conexao.put(
          ROTAS.MARCAS.PAINEL.ATUALIZAR(editando),
          dados,
          { withCredentials: true },
        );
        validarResposta(resposta.data);
        setSucesso("Marca atualizada com sucesso.");
      } else {
        const resposta = await conexao.post(
          ROTAS.MARCAS.PAINEL.CADASTRAR,
          dados,
          { withCredentials: true },
        );
        validarResposta(resposta.data);
        setSucesso("Marca cadastrada com sucesso.");
      }

      setModalAberto(false);
      setFormulario(FORMULARIO_INICIAL);
      await carregarMarcas(true);
    } catch (error: any) {
      console.error("[UNIVERSO IMPÉRIO | MARCAS] Erro ao salvar:", error);
      setErro(erroApi(error, "Não foi possível salvar a marca."));
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMarca(marca: Marca) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a marca "${marca.nome}"? Essa ação não poderá ser desfeita.`,
    );
    if (!confirmar) return;

    try {
      setExcluindo(marca.id_marca);
      setErro("");

      const resposta = await conexao.delete(
        ROTAS.MARCAS.PAINEL.EXCLUIR(marca.id_marca),
        { withCredentials: true },
      );
      validarResposta(resposta.data);
      setSucesso("Marca excluída com sucesso.");
      await carregarMarcas(true);
    } catch (error: any) {
      console.error("[UNIVERSO IMPÉRIO | MARCAS] Erro ao excluir:", error);
      setErro(erroApi(error, "Não foi possível excluir a marca."));
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <main className="marcas-page">
      <header className="pagina-topo">
        <div>
          <div className="breadcrumb">
            <a href="/painel">Painel</a>
            <ChevronRight size={13} />
            <span>Marcas</span>
          </div>
          <div className="titulo-principal">
            <div className="titulo-icone">
              <Tag size={23} />
            </div>
            <div>
              <h1>Gerenciamento de marcas</h1>
              <p>
                Cadastre e organize as marcas disponíveis no catálogo da loja.
              </p>
            </div>
          </div>
        </div>
        <button className="botao-primario" onClick={abrirCadastro}>
          <Plus size={17} /> Nova marca
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
            <small>TOTAL DE MARCAS</small>
            <strong>{marcas.length}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone verde">
            <Check size={19} />
          </span>
          <div>
            <small>MARCAS ATIVAS</small>
            <strong>{totalAtivas}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone neutro">
            <ImageIcon size={19} />
          </span>
          <div>
            <small>COM LOGOTIPO</small>
            <strong>{totalComLogo}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone amarelo">
            <Tag size={19} />
          </span>
          <div>
            <small>MARCAS INATIVAS</small>
            <strong>{totalInativas}</strong>
          </div>
        </article>
      </section>

      <section className="painel-listagem">
        <div className="listagem-topo">
          <div>
            <span className="sobrelinha">CATÁLOGO</span>
            <h2>Marcas cadastradas</h2>
            <p>Visualize, pesquise e gerencie as marcas da loja.</p>
          </div>
          <button
            className="botao-atualizar"
            onClick={() => void carregarMarcas(true)}
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
            <strong>Carregando marcas...</strong>
          </div>
        ) : marcasFiltradas.length === 0 ? (
          <div className="estado-vazio">
            <Tag size={30} />
            <strong>
              {busca ? "Nenhuma marca encontrada" : "Nenhuma marca cadastrada"}
            </strong>
            <span>
              {busca
                ? "Tente pesquisar por outro nome."
                : "Comece cadastrando a primeira marca da loja."}
            </span>
            {!busca && (
              <button className="botao-primario" onClick={abrirCadastro}>
                <Plus size={16} /> Criar marca
              </button>
            )}
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela-marcas">
              <thead>
                <tr>
                  <th>Marca</th>
                  <th>Slug</th>
                  <th>Ordem</th>
                  <th>Status</th>
                  <th className="acoes-coluna">Ações</th>
                </tr>
              </thead>
              <tbody>
                {marcasFiltradas.map((marca) => {
                  const logo = marca.logo_url || marca.imagem_url;
                  return (
                    <tr key={marca.id_marca}>
                      <td>
                        <div className="marca-identidade">
                          <span className="marca-logo">
                            {logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={logo} alt={`Logotipo ${marca.nome}`} />
                            ) : (
                              <Tag size={17} />
                            )}
                          </span>
                          <div>
                            <strong>{marca.nome}</strong>
                            <small>
                              {marca.descricao || "Marca do catálogo"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="slug">{marca.slug || "—"}</span>
                      </td>
                      <td>{marca.ordem ?? 0}</td>
                      <td>
                        <span
                          className={`status ${estaAtiva(marca) ? "ativo" : "inativo"}`}
                        >
                          <i />
                          {estaAtiva(marca) ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        <div className="acoes">
                          <button
                            className="acao-editar"
                            onClick={() => abrirEdicao(marca)}
                            title="Editar marca"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="acao-excluir"
                            onClick={() => void excluirMarca(marca)}
                            disabled={excluindo === marca.id_marca}
                            title="Excluir marca"
                          >
                            {excluindo === marca.id_marca ? (
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
          Exibindo <strong>{marcasFiltradas.length}</strong> de{" "}
          <strong>{marcas.length}</strong> marcas
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
            className="modal-marca"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-titulo"
          >
            <header className="modal-topo">
              <div className="modal-icone">
                <Tag size={20} />
              </div>
              <div>
                <h2 id="modal-titulo">
                  {editando ? "Editar marca" : "Nova marca"}
                </h2>
                <p>Preencha as informações da marca.</p>
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

            <form onSubmit={salvarMarca}>
              <div className="campo">
                <label htmlFor="marca-nome">
                  Nome da marca <b>*</b>
                </label>
                <input
                  id="marca-nome"
                  value={formulario.nome}
                  onChange={(e) => alterarNome(e.target.value)}
                  placeholder="Ex.: Alvarado"
                  maxLength={180}
                  required
                />
              </div>
              <div className="campo">
                <label htmlFor="marca-slug">
                  Slug <b>*</b>
                </label>
                <input
                  id="marca-slug"
                  value={formulario.slug}
                  onChange={(e) =>
                    setFormulario((atual) => ({
                      ...atual,
                      slug: gerarSlug(e.target.value),
                    }))
                  }
                  placeholder="alvarado"
                  maxLength={220}
                  required
                />
                <small>Endereço amigável utilizado no catálogo.</small>
              </div>
              <div className="campo">
                <label htmlFor="marca-descricao">Descrição</label>
                <textarea
                  id="marca-descricao"
                  rows={3}
                  value={formulario.descricao}
                  onChange={(e) =>
                    setFormulario((atual) => ({
                      ...atual,
                      descricao: e.target.value,
                    }))
                  }
                  placeholder="Descreva esta marca..."
                />
              </div>
              <div className="campos-duplos">
                <div className="campo">
                  <label htmlFor="marca-logo">URL do logotipo</label>
                  <input
                    id="marca-logo"
                    type="url"
                    value={formulario.logo_url}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        logo_url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="campo">
                  <label htmlFor="marca-ordem">Ordem de exibição</label>
                  <input
                    id="marca-ordem"
                    type="number"
                    min="0"
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

              {formulario.logo_url && (
                <div className="preview-logo">
                  <span>Pré-visualização do logotipo</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formulario.logo_url}
                    alt="Pré-visualização do logotipo"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </div>
              )}

              <label className="opcao-ativo">
                <span>
                  <strong>Marca ativa</strong>
                  <small>Disponibilizar esta marca no catálogo.</small>
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
                      : "Cadastrar marca"}
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
  .marcas-page{width:100%;max-width:1240px;margin:0 auto;padding:26px clamp(14px,2.5vw,30px) 40px;color:#f5edf1;font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;box-sizing:border-box}
  .marcas-page *{box-sizing:border-box}
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
  .tabela-scroll{width:100%;overflow-x:auto}.tabela-marcas{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}.tabela-marcas th{padding:12px 17px;background:#211a20;color:#8f7c88;font-size:8px;font-weight:800;letter-spacing:.8px;text-transform:uppercase}.tabela-marcas td{padding:12px 17px;border-top:1px solid #342630;color:#cdbdc6;font-size:10px}.tabela-marcas tbody tr:hover{background:#251c23}.tabela-marcas .acoes-coluna{text-align:right}
  .marca-identidade{display:flex;align-items:center;gap:11px;min-width:250px}.marca-logo{width:42px;height:42px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1px solid #694153;border-radius:9px;background:#392630;color:#e9a1ba}.marca-logo img{width:100%;height:100%;object-fit:contain;padding:4px}.marca-identidade div{display:flex;flex-direction:column;gap:4px;max-width:340px}.marca-identidade strong{overflow:hidden;color:#eee2e9;font-size:10px;text-overflow:ellipsis}.marca-identidade small{overflow:hidden;color:#806f7a;font-size:8px;text-overflow:ellipsis}
  .slug{color:#b69eaa;font-family:ui-monospace,SFMono-Regular,monospace;font-size:9px}.status{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid;border-radius:20px;font-size:8px;font-weight:750}.status i{width:6px;height:6px;border-radius:50%;background:currentColor}.status.ativo{border-color:#345d46;background:#1b3025;color:#8fd0a7}.status.inativo{border-color:#65434a;background:#321f25;color:#e4a0ad}
  .acoes{display:flex;justify-content:flex-end;gap:6px}.acoes button{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:1px solid;border-radius:7px;background:transparent;transition:.2s}.acao-editar{border-color:#665044!important;color:#e1bd8a}.acao-editar:hover{background:#3b2b20}.acao-excluir{border-color:#69404a!important;color:#e69aaa}.acao-excluir:hover{background:#3a2028}.acoes button:disabled{opacity:.5;cursor:not-allowed}
  .rodape-tabela{padding:12px 18px;border-top:1px solid #392832;color:#8f7d88;font-size:9px}.rodape-tabela strong{color:#d8c4ce}
  .estado-vazio{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:220px;padding:30px;color:#8d7b87;text-align:center}.estado-vazio strong{color:#d8c7d0;font-size:12px}.estado-vazio span{font-size:10px}.estado-vazio .botao-primario{margin-top:7px}
  .modal-fundo{position:fixed;inset:0;z-index:1500;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:20px;background:rgba(8,5,8,.76);backdrop-filter:blur(5px)}
  .modal-marca{width:min(100%,590px);max-height:calc(100vh - 40px);overflow-y:auto;border:1px solid #60404f;border-radius:14px;background:#1d171c;box-shadow:0 25px 80px #0008}
  .modal-topo{position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:11px;padding:17px 19px;border-bottom:1px solid #392832;background:#211a20}
  .modal-icone{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:1px solid #694153;border-radius:10px;background:#392630;color:#e9a1ba}.modal-topo h2{margin:0 0 4px;color:#f4eaf0;font-size:14px}.modal-topo p{margin:0;color:#988590;font-size:9px}.fechar-modal{display:flex;margin-left:auto;padding:7px;border:0;border-radius:7px;background:transparent;color:#bdaab5}.fechar-modal:hover{background:#392630;color:#fff}
  .modal-marca form{padding:18px 20px 20px}.campo{display:flex;flex-direction:column;gap:7px;margin-bottom:14px}.campo label{color:#d8c8d0;font-size:10px;font-weight:700}.campo label b{color:#ed8fae}.campo input,.campo textarea,.campo select{width:100%;min-width:0;padding:10px 11px;border:1px solid #493440;border-radius:8px;outline:0;background:#151115;color:#f1e9ed;font-family:inherit;font-size:10px}.campo input,.campo select{height:39px}.campo textarea{resize:vertical;line-height:1.5}.campo input:focus,.campo textarea:focus,.campo select:focus{border-color:#b57491;box-shadow:0 0 0 3px #d589a617}.campo small{color:#82717c;font-size:8px}
  .campos-duplos{display:grid;grid-template-columns:1fr 150px;gap:12px}.preview-logo{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:-2px 0 13px;padding:10px 12px;border:1px solid #493440;border-radius:8px;background:#211a20;color:#9c8994;font-size:9px}.preview-logo img{width:70px;height:48px;object-fit:contain}
  .opcao-ativo{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #493440;border-radius:8px;background:#211a20}.opcao-ativo span{display:flex;flex-direction:column;gap:4px}.opcao-ativo strong{color:#e4d6de;font-size:10px}.opcao-ativo small{color:#8f7d88;font-size:8px}.opcao-ativo input{width:16px;height:16px;accent-color:#b87591}
  .erro-modal{display:flex;align-items:center;gap:7px;margin-top:12px;padding:9px;border:1px solid #75404f;border-radius:7px;background:#351c25;color:#f2aabd;font-size:9px}.modal-acoes{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid #392832}.botao-cancelar{padding:10px 14px;border:1px solid #493440;border-radius:8px;background:transparent;color:#cdbac5;font-size:10px}.botao-cancelar:hover{background:#30232c}.girando{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}
  @media(max-width:800px){.indicadores{grid-template-columns:repeat(2,minmax(0,1fr))}.pagina-topo{align-items:flex-start;flex-direction:column}.pagina-topo>.botao-primario{align-self:flex-end}}
  @media(max-width:560px){.marcas-page{padding:18px 12px 28px}.titulo-principal h1{font-size:19px}.titulo-principal p{font-size:10px}.indicadores{gap:8px}.indicador{padding:11px;gap:8px}.indicador-icone{width:33px;height:33px}.indicador small{font-size:7px}.indicador strong{font-size:19px}.listagem-topo{padding:15px;align-items:flex-start}.filtros{align-items:stretch;flex-direction:column;padding:12px}.busca{width:100%}.filtro-status{width:100%}.filtro-status button{flex:1}.tabela-marcas th,.tabela-marcas td{padding:11px 12px}.campos-duplos{grid-template-columns:1fr}.modal-fundo{padding:10px}.modal-marca{max-height:calc(100vh - 20px)}}
`;
