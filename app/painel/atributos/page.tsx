"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import conexao from "@/Services/Conexao/Conexao";

type TipoAtributo = "texto" | "select" | "cor" | "numero" | "booleano";

interface Atributo {
  id_atributo: number;
  nome: string;
  codigo: string;
  tipo: TipoAtributo | string;
  valores: string[] | string | null;
  ativo: boolean | number;
  status_id?: number;
  criado_em?: string;
}

interface FormularioAtributo {
  nome: string;
  codigo: string;
  tipo: TipoAtributo;
  valoresTexto: string;
  ativo: boolean;
}

const API = {
  listar: "/painel/atributos",
  cadastrar: "/painel/atributos",
  atualizar: (id: number) => `/painel/atributos/${id}`,
  excluir: (id: number) => `/painel/atributos/${id}`,
};

const FORM_INICIAL: FormularioAtributo = {
  nome: "",
  codigo: "",
  tipo: "texto",
  valoresTexto: "",
  ativo: true,
};

const TIPOS: { value: TipoAtributo; label: string; descricao: string }[] = [
  { value: "texto", label: "Texto", descricao: "Campo de texto livre" },
  { value: "select", label: "Lista de opções", descricao: "Cliente escolhe uma opção" },
  { value: "cor", label: "Cor", descricao: "Opções de cores disponíveis" },
  { value: "numero", label: "Número", descricao: "Valor numérico" },
  { value: "booleano", label: "Sim ou não", descricao: "Opção verdadeira ou falsa" },
];

function normalizarLista(valor: Atributo["valores"]): string[] {
  if (Array.isArray(valor)) return valor.map(String).filter(Boolean);
  if (!valor) return [];
  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      return [];
    } catch {
      return valor.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function extrairAtributos(payload: any): Atributo[] {
  const candidatos = [
    payload?.dados?.atributos,
    payload?.dados?.dados,
    payload?.atributos,
    payload?.data?.atributos,
    payload?.data?.dados,
    payload?.data,
    payload?.dados,
    payload,
  ];
  const lista = candidatos.find(Array.isArray);
  return (lista || []).map((item: any) => ({
    ...item,
    id_atributo: Number(item.id_atributo ?? item.id),
    nome: String(item.nome ?? ""),
    codigo: String(item.codigo ?? ""),
    tipo: String(item.tipo ?? "texto"),
    valores: item.valores ?? null,
    ativo: item.ativo === true || item.ativo === 1 || item.ativo === "1" || item.status_id === 1,
  }));
}

function gerarCodigo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function AtributosPage() {
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "ativos" | "inativos">("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<FormularioAtributo>(FORM_INICIAL);

  const carregarAtributos = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await conexao.get(API.listar, { withCredentials: true });
      setAtributos(extrairAtributos(resposta.data));
    } catch (error: any) {
      setErro(error?.response?.data?.mensagem || error?.response?.data?.message || "Não foi possível carregar os atributos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarAtributos();
  }, [carregarAtributos]);

  const filtrados = useMemo(() => {
    return atributos.filter((atributo) => {
      const termo = busca.toLowerCase();
      const correspondeBusca =
        atributo.nome.toLowerCase().includes(termo) ||
        atributo.codigo.toLowerCase().includes(termo) ||
        String(atributo.tipo).toLowerCase().includes(termo);
      const correspondeFiltro =
        filtro === "todos" ||
        (filtro === "ativos" && atributo.ativo) ||
        (filtro === "inativos" && !atributo.ativo);
      return correspondeBusca && correspondeFiltro;
    });
  }, [atributos, busca, filtro]);

  const totalAtivos = atributos.filter((item) => item.ativo).length;
  const totalInativos = atributos.length - totalAtivos;
  const totalComOpcoes = atributos.filter((item) => normalizarLista(item.valores).length > 0).length;

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirEdicao(atributo: Atributo) {
    setEditando(atributo.id_atributo);
    setForm({
      nome: atributo.nome,
      codigo: atributo.codigo,
      tipo: (TIPOS.some((tipo) => tipo.value === atributo.tipo) ? atributo.tipo : "texto") as TipoAtributo,
      valoresTexto: normalizarLista(atributo.valores).join("\n"),
      ativo: Boolean(atributo.ativo),
    });
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function atualizarCampo<K extends keyof FormularioAtributo>(campo: K, valor: FormularioAtributo[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!form.nome.trim()) {
      setErro("Informe o nome do atributo.");
      return;
    }
    const codigo = form.codigo.trim() || gerarCodigo(form.nome);
    if (!codigo) {
      setErro("Informe um código válido para o atributo.");
      return;
    }

    const valores = ["select", "cor"].includes(form.tipo)
      ? form.valoresTexto.split(/\n|,/).map((item) => item.trim()).filter(Boolean)
      : [];

    if (["select", "cor"].includes(form.tipo) && valores.length === 0) {
      setErro("Adicione pelo menos uma opção para este tipo de atributo.");
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      codigo,
      tipo: form.tipo,
      valores: valores.length ? valores : null,
      ativo: form.ativo,
      status_id: form.ativo ? 1 : 0,
    };

    setSalvando(true);
    try {
      if (editando !== null) {
        await conexao.put(API.atualizar(editando), payload, { withCredentials: true });
        setSucesso("Atributo atualizado com sucesso.");
      } else {
        await conexao.post(API.cadastrar, payload, { withCredentials: true });
        setSucesso("Atributo cadastrado com sucesso.");
      }
      setModalAberto(false);
      await carregarAtributos();
    } catch (error: any) {
      setErro(error?.response?.data?.mensagem || error?.response?.data?.message || "Não foi possível salvar o atributo.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(atributo: Atributo) {
    const confirmar = window.confirm(`Deseja realmente excluir o atributo "${atributo.nome}"?`);
    if (!confirmar) return;
    setErro("");
    setSucesso("");
    try {
      await conexao.delete(API.excluir(atributo.id_atributo), { withCredentials: true });
      setSucesso("Atributo excluído com sucesso.");
      await carregarAtributos();
    } catch (error: any) {
      setErro(error?.response?.data?.mensagem || error?.response?.data?.message || "Não foi possível excluir o atributo.");
    }
  }

  const tipoLabel = (tipo: string) => TIPOS.find((item) => item.value === tipo)?.label || tipo;

  return (
    <main className="atributos-page">
      <div className="page-glow page-glow-one" />
      <div className="page-glow page-glow-two" />

      <div className="page-content">
        <header className="page-header">
          <div>
            <span className="eyebrow"><span className="eyebrow-dot" /> CATÁLOGO / CONFIGURAÇÕES</span>
            <h1>Atributos</h1>
            <p>Configure características que podem ser associadas aos produtos, como cor, tamanho e material.</p>
          </div>
          <button className="primary-button" onClick={abrirNovo}>
            <span className="button-plus">＋</span> Novo atributo
          </button>
        </header>

        {erro && !modalAberto && <div className="alert alert-error">{erro}</div>}
        {sucesso && <div className="alert alert-success">{sucesso}</div>}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon purple">◈</div>
            <div><span>Total de atributos</span><strong>{atributos.length}</strong><small>Cadastrados no catálogo</small></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon green">✓</div>
            <div><span>Atributos ativos</span><strong>{totalAtivos}</strong><small>Disponíveis para utilização</small></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon amber">☷</div>
            <div><span>Com opções</span><strong>{totalComOpcoes}</strong><small>Listas e variações definidas</small></div>
          </article>
          <article className="stat-card">
            <div className="stat-icon red">⊘</div>
            <div><span>Inativos</span><strong>{totalInativos}</strong><small>Não disponíveis no catálogo</small></div>
          </article>
        </section>

        <section className="content-card">
          <div className="toolbar">
            <div>
              <h2>Gerenciamento de atributos</h2>
              <p>Pesquise, edite e organize as características dos produtos.</p>
            </div>
            <div className="toolbar-controls">
              <div className="search-box"><span>⌕</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar atributo..." /></div>
              <div className="filter-tabs">
                <button className={filtro === "todos" ? "selected" : ""} onClick={() => setFiltro("todos")}>Todos</button>
                <button className={filtro === "ativos" ? "selected" : ""} onClick={() => setFiltro("ativos")}>Ativos</button>
                <button className={filtro === "inativos" ? "selected" : ""} onClick={() => setFiltro("inativos")}>Inativos</button>
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>ATRIBUTO</th><th>CÓDIGO</th><th>TIPO</th><th>OPÇÕES</th><th>STATUS</th><th className="actions-heading">AÇÕES</th></tr></thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={6} className="empty-state"><span className="loader" />Carregando atributos...</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state"><div className="empty-icon">◇</div><strong>Nenhum atributo encontrado</strong><span>Cadastre um novo atributo ou altere os filtros da busca.</span></td></tr>
                ) : filtrados.map((atributo) => {
                  const opcoes = normalizarLista(atributo.valores);
                  return (
                    <tr key={atributo.id_atributo}>
                      <td><div className="attribute-name"><span className="attribute-symbol">◇</span><div><strong>{atributo.nome}</strong><small>ID #{atributo.id_atributo}</small></div></div></td>
                      <td><code>{atributo.codigo}</code></td>
                      <td><span className="type-pill">{tipoLabel(atributo.tipo)}</span></td>
                      <td>{opcoes.length ? <div className="option-list">{opcoes.slice(0, 3).map((opcao) => <span key={opcao}>{opcao}</span>)}{opcoes.length > 3 && <small>+{opcoes.length - 3}</small>}</div> : <span className="muted">—</span>}</td>
                      <td><span className={`status-pill ${atributo.ativo ? "status-active" : "status-inactive"}`}><i />{atributo.ativo ? "Ativo" : "Inativo"}</span></td>
                      <td><div className="row-actions"><button title="Editar atributo" onClick={() => abrirEdicao(atributo)}>✎</button><button title="Excluir atributo" className="delete-action" onClick={() => excluir(atributo)}>⌫</button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <footer className="table-footer"><span>Exibindo <strong>{filtrados.length}</strong> de <strong>{atributos.length}</strong> atributos</span><button onClick={carregarAtributos} disabled={carregando}>↻ Atualizar lista</button></footer>
        </section>

        <section className="help-card">
          <div className="help-icon">✦</div>
          <div><strong>Como funcionam os atributos?</strong><p>Atributos descrevem características dos produtos. Por exemplo, um produto pode ter o atributo <b>Cor</b> com opções Preto, Branco e Vermelho, ou <b>Tamanho</b> com opções P, M e G. Eles podem ser usados para organizar filtros e configurar variações, conforme a integração do produto.</p></div>
        </section>
      </div>

      {modalAberto && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalAberto(false); }}>
          <section className="modal">
            <header className="modal-header">
              <div><span className="eyebrow">CATÁLOGO / ATRIBUTOS</span><h2>{editando !== null ? "Editar atributo" : "Novo atributo"}</h2><p>Defina uma característica para utilizar nos produtos.</p></div>
              <button className="close-button" onClick={() => setModalAberto(false)}>×</button>
            </header>
            <form onSubmit={salvar}>
              {erro && <div className="alert alert-error">{erro}</div>}
              <div className="form-grid">
                <label className="field full"><span>Nome do atributo <b>*</b></span><input value={form.nome} onChange={(e) => { atualizarCampo("nome", e.target.value); if (!editando && !form.codigo) atualizarCampo("codigo", gerarCodigo(e.target.value)); }} placeholder="Ex.: Cor, Tamanho, Material" required /></label>
                <label className="field"><span>Código <b>*</b></span><input value={form.codigo} onChange={(e) => atualizarCampo("codigo", gerarCodigo(e.target.value))} placeholder="Ex.: cor, tamanho" required /><small>Identificador único, sem espaços ou acentos.</small></label>
                <label className="field"><span>Tipo de atributo <b>*</b></span><select value={form.tipo} onChange={(e) => atualizarCampo("tipo", e.target.value as TipoAtributo)}>{TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}</select><small>{TIPOS.find((tipo) => tipo.value === form.tipo)?.descricao}</small></label>
                {["select", "cor"].includes(form.tipo) && <label className="field full"><span>Opções disponíveis <b>*</b></span><textarea value={form.valoresTexto} onChange={(e) => atualizarCampo("valoresTexto", e.target.value)} placeholder={"Uma opção por linha\nPreto\nBranco\nVermelho"} rows={5} /><small>Digite uma opção por linha. Também é possível separar por vírgulas.</small></label>}
                <label className="switch-field full"><span><strong>Atributo ativo</strong><small>Permite que este atributo seja utilizado no catálogo.</small></span><button type="button" className={`switch ${form.ativo ? "on" : ""}`} onClick={() => atualizarCampo("ativo", !form.ativo)} aria-pressed={form.ativo}><i /></button></label>
              </div>
              <footer className="modal-footer"><button type="button" className="secondary-button" onClick={() => setModalAberto(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={salvando}>{salvando ? "Salvando..." : editando !== null ? "Salvar alterações" : "Cadastrar atributo"}</button></footer>
            </form>
          </section>
        </div>
      )}

      <style jsx>{`
        .atributos-page{min-height:100vh;background:#100d13;color:#f5edf4;padding:34px 30px 55px;position:relative;overflow:hidden}
        .page-glow{position:absolute;pointer-events:none;filter:blur(90px);opacity:.13;border-radius:50%;width:360px;height:360px}
        .page-glow-one{background:#a13d79;top:-170px;right:8%}.page-glow-two{background:#592c78;bottom:8%;left:-230px}
        .page-content{max-width:1500px;margin:0 auto;position:relative;z-index:1}
        .page-header{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:30px}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;color:#c18bad;font-size:10px;font-weight:800;letter-spacing:1.8px}
        .eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#d477ad;box-shadow:0 0 12px #d477ad}
        h1{font-size:32px;letter-spacing:-1px;margin:9px 0 5px;font-weight:750}.page-header p,.toolbar p{margin:0;color:#948895;font-size:13px}
        button{font:inherit;cursor:pointer}.primary-button{border:1px solid #b45c91;background:linear-gradient(135deg,#a94d83,#77345f);color:white;border-radius:9px;padding:12px 17px;font-size:12px;font-weight:700;box-shadow:0 7px 22px #8d35652b;transition:.2s}.primary-button:hover{filter:brightness(1.13);transform:translateY(-1px)}.primary-button:disabled{opacity:.6;cursor:wait}
        .button-plus{font-size:17px;vertical-align:-1px;margin-right:5px}
        .stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:22px}
        .stat-card{display:flex;align-items:center;gap:14px;padding:19px;background:linear-gradient(145deg,#1c1720,#17131a);border:1px solid #302431;border-radius:12px;min-height:108px}
        .stat-icon{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;font-size:21px;flex-shrink:0}.purple{background:#693b7040;color:#d39bd7}.green{background:#277d5630;color:#70d7a1}.amber{background:#a4772d30;color:#e9bd70}.red{background:#9d3d5230;color:#e88b9b}
        .stat-card span,.stat-card small{display:block;color:#a99daa;font-size:11px}.stat-card strong{display:block;font-size:25px;margin:2px 0;letter-spacing:-.5px}.stat-card small{font-size:10px;color:#746b78}
        .content-card{background:#17131b;border:1px solid #302431;border-radius:13px;overflow:hidden}
        .toolbar{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:22px 23px;border-bottom:1px solid #302431}.toolbar h2{font-size:15px;margin:0 0 5px}.toolbar p{font-size:11px}
        .toolbar-controls{display:flex;align-items:center;gap:12px}.search-box{height:37px;width:220px;border:1px solid #3b3040;background:#100d13;border-radius:7px;display:flex;align-items:center;padding:0 10px;gap:8px;color:#b878a2}.search-box span{font-size:22px}.search-box input{background:transparent;border:0;outline:0;color:#f4eaf2;width:100%;font-size:11px}.search-box input::placeholder{color:#706675}
        .filter-tabs{display:flex;padding:3px;background:#100d13;border:1px solid #302431;border-radius:7px}.filter-tabs button{border:0;background:transparent;color:#928694;padding:7px 10px;font-size:10px;border-radius:5px}.filter-tabs button.selected{background:#633451;color:#fff}
        .table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:760px}th{text-align:left;color:#817483;font-size:9px;letter-spacing:1px;font-weight:800;padding:14px 19px;background:#1b1620}td{padding:14px 19px;border-top:1px solid #2b222f;font-size:11px;color:#d8cbd7}tbody tr:hover{background:#211923}
        .attribute-name{display:flex;align-items:center;gap:11px}.attribute-symbol{width:32px;height:32px;border-radius:8px;background:#713d6238;color:#d58db7;display:grid;place-items:center;font-size:18px}.attribute-name strong{display:block;color:#f3eaf1;font-size:11px}.attribute-name small{display:block;color:#766b7a;font-size:9px;margin-top:4px}td code{font-size:10px;color:#d7a3c4;background:#392538;padding:5px 7px;border-radius:5px}
        .type-pill{display:inline-block;padding:5px 8px;border-radius:5px;background:#30263a;color:#cbb4dc;font-size:10px}.option-list{display:flex;gap:4px;align-items:center;flex-wrap:wrap}.option-list span{background:#29222d;border:1px solid #3b303e;color:#bcb0bf;padding:4px 6px;border-radius:4px;font-size:9px}.option-list small{color:#c18bad}.muted{color:#716875}
        .status-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:20px;font-size:10px}.status-pill i{width:6px;height:6px;border-radius:50%}.status-active{color:#7cdaa8;background:#1c50362c}.status-active i{background:#61d493}.status-inactive{color:#d78c9b;background:#7c35422b}.status-inactive i{background:#d9798b}
        .row-actions{display:flex;gap:6px}.row-actions button{width:29px;height:29px;border:1px solid #403143;background:#211a25;color:#cba8c0;border-radius:6px}.row-actions button:hover{background:#58314c;color:#fff}.row-actions .delete-action{color:#d88796}.actions-heading{text-align:right}.row-actions{justify-content:flex-end}
        .empty-state{text-align:center!important;padding:42px 15px!important;color:#928694!important}.empty-state strong,.empty-state span{display:block}.empty-state strong{color:#d9cbd8;margin:8px 0 5px}.empty-state span{font-size:11px}.empty-icon{font-size:25px;color:#b878a2}.loader{display:inline-block;width:15px;height:15px;border:2px solid #5b4357;border-top-color:#d17eae;border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle;margin-right:9px}@keyframes spin{to{transform:rotate(360deg)}}
        .table-footer{padding:13px 20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #302431;color:#827786;font-size:10px}.table-footer strong{color:#d8cbd7}.table-footer button{background:transparent;border:0;color:#c78db0;font-size:10px}.table-footer button:disabled{opacity:.5}
        .help-card{display:flex;gap:13px;margin-top:17px;padding:17px 19px;border:1px solid #493044;background:#241a25;border-radius:10px}.help-icon{width:32px;height:32px;border-radius:8px;background:#773d623d;color:#e1a2c7;display:grid;place-items:center;flex-shrink:0}.help-card strong{font-size:12px}.help-card p{font-size:11px;line-height:1.7;color:#a99baa;margin:5px 0 0}.help-card b{color:#e3c0d6}
        .alert{padding:11px 14px;border-radius:7px;font-size:11px;margin-bottom:15px}.alert-error{background:#6f29352d;border:1px solid #9d4b5a;color:#f0a4b0}.alert-success{background:#23563b30;border:1px solid #397c56;color:#8ce0ae}
        .modal-backdrop{position:fixed;inset:0;background:#08060bbd;backdrop-filter:blur(5px);z-index:50;display:grid;place-items:center;padding:20px;overflow-y:auto}.modal{width:min(590px,100%);background:#1b1620;border:1px solid #493447;border-radius:14px;box-shadow:0 25px 90px #0009;padding:23px}.modal-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}.modal-header h2{font-size:21px;margin:7px 0 4px}.modal-header p{font-size:11px;color:#948895;margin:0}.close-button{width:30px;height:30px;border:1px solid #443344;border-radius:7px;background:#251c29;color:#cdb9ca;font-size:21px;line-height:1}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px}.field{display:flex;flex-direction:column;gap:7px}.field.full,.switch-field.full{grid-column:1/-1}.field>span{font-size:11px;color:#d9cbd8;font-weight:650}.field>span b{color:#e38db7}.field input,.field select,.field textarea{width:100%;background:#100d13;border:1px solid #403343;border-radius:7px;padding:11px;color:#f3eaf1;outline:0;font:inherit;font-size:11px}.field input:focus,.field select:focus,.field textarea:focus{border-color:#b56a98;box-shadow:0 0 0 2px #b56a9820}.field input::placeholder,.field textarea::placeholder{color:#6f6572}.field small,.switch-field small{color:#827786;font-size:9px;line-height:1.5}.field textarea{resize:vertical;min-height:100px}
        .switch-field{display:flex;align-items:center;justify-content:space-between;padding:13px;background:#151018;border:1px solid #352a39;border-radius:8px}.switch-field strong,.switch-field small{display:block}.switch-field strong{font-size:11px;color:#e6d9e5;margin-bottom:4px}.switch{width:39px;height:22px;border:0;border-radius:20px;background:#514653;padding:3px;transition:.2s}.switch i{display:block;width:16px;height:16px;background:#fff;border-radius:50%;transition:.2s}.switch.on{background:#a84e83}.switch.on i{transform:translateX(17px)}
        .modal-footer{display:flex;justify-content:flex-end;gap:9px;margin-top:24px;padding-top:17px;border-top:1px solid #352a39}.secondary-button{background:#29212e;border:1px solid #49384b;color:#cbbdca;border-radius:8px;padding:11px 15px;font-size:11px}
        @media(max-width:1000px){.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.toolbar{align-items:flex-start;flex-direction:column}.toolbar-controls{width:100%;justify-content:space-between}}
        @media(max-width:650px){.atributos-page{padding:23px 14px 40px}.page-header{align-items:flex-start;flex-direction:column}.page-header .primary-button{width:100%}.stats-grid{gap:9px}.stat-card{padding:13px;gap:9px;min-height:92px}.stat-icon{width:34px;height:34px}.stat-card strong{font-size:21px}.stat-card span{font-size:10px}.toolbar-controls{align-items:stretch;flex-direction:column}.search-box{width:100%}.filter-tabs{width:100%}.filter-tabs button{flex:1}.form-grid{grid-template-columns:1fr}.field.full,.switch-field.full{grid-column:auto}.modal{padding:18px}.modal-footer{flex-direction:column-reverse}.modal-footer button{width:100%}}
      `}</style>
    </main>
  );
}
