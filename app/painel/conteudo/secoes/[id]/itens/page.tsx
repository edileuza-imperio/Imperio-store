"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Vitrine {
  id_vitrine: number;
  nome: string;
  codigo: string;
  titulo: string;
  descricao?: string | null;
  ativo: boolean | number | string;
}

interface VitrineItem {
  status_id: number;
  id_vitrine_item: number;
  vitrine_id: number;
  produto_id: number;
  ordem: number;
  ativo: boolean | number | string;
  criado_em?: string;
}

interface Produto {
  id_produto: number;
  nome: string;
  sku?: string;
  ativo?: boolean | number | string;
  preco?: string | number;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairDados<T>(resposta: unknown): T {
  let payload: unknown = resposta;
  if (ehObjeto(payload) && "data" in payload && !("dados" in payload)) payload = payload.data;
  if (typeof payload === "string") {
    const texto = payload.trim();
    try {
      payload = JSON.parse(texto);
    } catch {
      const inicio = texto.indexOf("{");
      const fim = texto.lastIndexOf("}");
      if (inicio < 0 || fim <= inicio) throw new Error("A API retornou uma resposta inválida.");
      payload = JSON.parse(texto.slice(inicio, fim + 1));
    }
  }
  if (ehObjeto(payload) && "dados" in payload) return payload.dados as T;
  return payload as T;
}

function estaAtivo(valor: unknown): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  return ["1", "true", "sim", "ativo"].includes(String(valor).trim().toLowerCase());
}

function mensagemErro(erro: unknown, padrao: string): string {
  if (ehObjeto(erro) && ehObjeto(erro.response)) {
    const resposta = erro.response.data;
    if (ehObjeto(resposta) && typeof resposta.mensagem === "string") return resposta.mensagem;
  }
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

export default function ItensDaVitrinePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vitrineId = Number(params.id);

  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [itens, setItens] = useState<VitrineItem[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState<number | null>(null);

  const carregarDados = useCallback(async () => {
    if (!Number.isInteger(vitrineId) || vitrineId <= 0) {
      setErro("Identificador da vitrine inválido.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");
    try {
      const [respostaVitrine, respostaItens, respostaProdutos] = await Promise.all([
        conexao.get(ROTAS.VITRINES.PAINEL.BUSCAR_POR_ID(vitrineId)),
        conexao.get(ROTAS.VITRINES.PAINEL.ITENS.LISTAR(vitrineId)),
        conexao.get(ROTAS.PRODUTOS.PAINEL.LISTAR),
      ]);

      const dadosVitrine = extrairDados<{ vitrine?: Vitrine }>(respostaVitrine);
      const dadosItens = extrairDados<{ itens?: VitrineItem[] }>(respostaItens);
      const dadosProdutos = extrairDados<{ produtos?: Produto[] }>(respostaProdutos);

      if (!dadosVitrine?.vitrine) throw new Error("Vitrine não encontrada.");
      setVitrine(dadosVitrine.vitrine);
      setItens(Array.isArray(dadosItens?.itens) ? dadosItens.itens : []);
      setProdutos(Array.isArray(dadosProdutos?.produtos) ? dadosProdutos.produtos : []);
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível carregar os dados da vitrine."));
      setVitrine(null);
      setItens([]);
      setProdutos([]);
    } finally {
      setCarregando(false);
    }
  }, [vitrineId]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const itensOrdenados = useMemo(
    () => [...itens].sort((a, b) => Number(a.ordem) - Number(b.ordem)),
    [itens],
  );

  const produtosDisponiveis = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    return produtos.filter((produto) => {
      const jaAssociado = itens.some((item) => item.produto_id === produto.id_produto);
      const corresponde = !termo ||
        produto.nome?.toLowerCase().includes(termo) ||
        produto.sku?.toLowerCase().includes(termo);
      return !jaAssociado && estaAtivo(produto.ativo ?? true) && corresponde;
    });
  }, [produtos, itens, buscaProduto]);

  function nomeProduto(produtoId: number): string {
    return produtos.find((produto) => produto.id_produto === produtoId)?.nome || `Produto #${produtoId}`;
  }

  async function adicionarProduto() {
    if (!produtoSelecionado) {
      setErro("Selecione um produto para adicionar.");
      return;
    }

    const produtoId = Number(produtoSelecionado);
    if (itens.some((item) => item.produto_id === produtoId)) {
      setErro("Este produto já está associado a esta seção.");
      return;
    }

    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      const proximaOrdem = itens.length
        ? Math.max(...itens.map((item) => Number(item.ordem) || 0)) + 1
        : 1;

      await conexao.post(
        ROTAS.VITRINES.PAINEL.ITENS.CADASTRAR(vitrineId),
        { status_id: 1, produto_id: produtoId, ordem: proximaOrdem, ativo: true },
      );
      setProdutoSelecionado("");
      setBuscaProduto("");
      setAviso("Produto associado à seção com sucesso.");
      await carregarDados();
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível adicionar o produto."));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(item: VitrineItem) {
    setErro("");
    try {
      await conexao.put(
        ROTAS.VITRINES.PAINEL.ITENS.ALTERAR_ATIVO(item.id_vitrine_item),
        { ativo: !estaAtivo(item.ativo) },
      );
      setAviso(estaAtivo(item.ativo) ? "Produto ocultado nesta seção." : "Produto publicado nesta seção.");
      await carregarDados();
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível alterar o item."));
    }
  }

  async function removerProduto(item: VitrineItem) {
    setErro("");
    try {
      await conexao.delete(ROTAS.VITRINES.PAINEL.ITENS.EXCLUIR(item.id_vitrine_item));
      setConfirmandoRemocao(null);
      setAviso("Produto removido da seção.");
      await carregarDados();
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível remover o produto."));
    }
  }

  async function alterarOrdem(item: VitrineItem, direcao: -1 | 1) {
    const indice = itensOrdenados.findIndex((atual) => atual.id_vitrine_item === item.id_vitrine_item);
    const destino = indice + direcao;
    if (indice < 0 || destino < 0 || destino >= itensOrdenados.length) return;

    const vizinho = itensOrdenados[destino];
    try {
      await conexao.put(ROTAS.VITRINES.PAINEL.ITENS.ALTERAR_ORDEM(item.id_vitrine_item), { ordem: vizinho.ordem });
      await conexao.put(ROTAS.VITRINES.PAINEL.ITENS.ALTERAR_ORDEM(vizinho.id_vitrine_item), { ordem: item.ordem });
      await carregarDados();
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível alterar a ordem dos produtos."));
    }
  }

  return (
    <main className="items-page">
      <div className="items-shell">
        <nav className="breadcrumb"><span>Painel</span><span>/</span><span>Conteúdo</span><span>/</span><button type="button" onClick={() => router.push(ROTAS.PAGINAS.PAINEL.SECOES.LISTAR)}>Seções</button><span>/</span><strong>Produtos da seção</strong></nav>

        <header className="page-heading">
          <div><span className="eyebrow"><i /> GERENCIAMENTO DE CONTEÚDO</span><h1>Produtos da seção</h1><p>{vitrine?.titulo || vitrine?.nome || "Gerencie os produtos associados a esta vitrine."}</p></div>
          <div className="heading-actions">
            <button type="button" className="secondary-button" onClick={() => router.push(ROTAS.PAGINAS.PAINEL.SECOES.LISTAR)}>← Voltar para seções</button>
            {vitrine && <button type="button" className="secondary-button" onClick={() => router.push(ROTAS.PAGINAS.PAINEL.SECOES.EDITAR(vitrineId))}>Editar seção</button>}
          </div>
        </header>

        {aviso && <div className="alert success" role="status">{aviso}<button type="button" onClick={() => setAviso("")}>×</button></div>}
        {erro && <div className="alert error" role="alert">{erro}<button type="button" onClick={() => setErro("")}>×</button></div>}

        {carregando ? (
          <div className="state-box"><span className="loader" /><strong>Carregando produtos...</strong></div>
        ) : !vitrine ? (
          <section className="panel state-box"><strong>Não foi possível localizar esta vitrine.</strong><button className="primary-button" type="button" onClick={() => router.push(ROTAS.PAGINAS.PAINEL.SECOES.LISTAR)}>Voltar para seções</button></section>
        ) : (
          <>
            <section className="summary-grid">
              <article className="summary-card"><span className="summary-icon">▤</span><div><small>Seção selecionada</small><strong>{vitrine.titulo || vitrine.nome}</strong><span>/{vitrine.codigo}</span></div></article>
              <article className="summary-card"><span className="summary-icon green">▦</span><div><small>Produtos associados</small><strong>{itens.length}</strong><span>Itens cadastrados nesta seção</span></div></article>
              <article className="summary-card"><span className="summary-icon gold">◉</span><div><small>Produtos publicados</small><strong>{itens.filter((item) => estaAtivo(item.ativo)).length}</strong><span>Visíveis nesta vitrine</span></div></article>
            </section>

            <section className="panel add-panel">
              <div className="panel-heading"><span className="panel-icon">+</span><div><h2>Adicionar produto</h2><p>Selecione um produto já cadastrado no catálogo para incluí-lo nesta seção.</p></div></div>
              <div className="add-grid">
                <label className="field">Pesquisar produto<input value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} placeholder="Digite o nome ou SKU do produto..." /></label>
                <label className="field">Produto disponível<select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)}><option value="">Selecione um produto</option>{produtosDisponiveis.map((produto) => <option key={produto.id_produto} value={produto.id_produto}>{produto.nome}{produto.sku ? ` · ${produto.sku}` : ""}</option>)}</select><small>{produtosDisponiveis.length} produto(s) disponível(is) para adicionar.</small></label>
                <button type="button" className="primary-button add-button" onClick={() => void adicionarProduto()} disabled={!produtoSelecionado || salvando}>{salvando ? "Adicionando..." : "+ Adicionar produto"}</button>
              </div>
            </section>

            <section className="panel list-panel">
              <div className="panel-heading list-heading"><div><h2>Produtos associados</h2><p>Organize a sequência e controle quais produtos aparecem na seção.</p></div><span className="count-pill">{itens.length} item(ns)</span></div>

              {itensOrdenados.length === 0 ? (
                <div className="state-box empty"><span className="empty-icon">▦</span><strong>Nenhum produto nesta seção</strong><small>Use o formulário acima para adicionar o primeiro produto.</small></div>
              ) : (
                <div className="items-list">
                  {itensOrdenados.map((item, indice) => {
                    const itemAtivo = estaAtivo(item.ativo);
                    return (
                      <article className={`item-card ${!itemAtivo ? "item-inactive" : ""}`} key={item.id_vitrine_item}>
                        <div className="order-control"><button type="button" onClick={() => void alterarOrdem(item, -1)} disabled={indice === 0} aria-label="Mover produto para cima">⌃</button><strong>{String(item.ordem).padStart(2, "0")}</strong><button type="button" onClick={() => void alterarOrdem(item, 1)} disabled={indice === itensOrdenados.length - 1} aria-label="Mover produto para baixo">⌄</button></div>
                        <div className="product-icon">▣</div>
                        <div className="product-info"><strong>{nomeProduto(item.produto_id)}</strong><small>ID do produto: {item.produto_id} · ID do vínculo: {item.id_vitrine_item}</small></div>
                        <span className={`status-pill ${itemAtivo ? "active" : "inactive"}`}><i />{itemAtivo ? "Publicado" : "Oculto"}</span>
                        <div className="item-actions">
                          {confirmandoRemocao === item.id_vitrine_item ? (
                            <><span className="remove-question">Remover este produto?</span><button type="button" className="secondary-button small-button" onClick={() => setConfirmandoRemocao(null)}>Cancelar</button><button type="button" className="remove-confirm" onClick={() => void removerProduto(item)}>Confirmar</button></>
                          ) : (
                            <><button type="button" className="secondary-button small-button" onClick={() => void alternarAtivo(item)}>{itemAtivo ? "Ocultar" : "Publicar"}</button><button type="button" className="icon-button danger" title="Remover produto" aria-label="Remover produto" onClick={() => setConfirmandoRemocao(item.id_vitrine_item)}>⌫</button></>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .items-page{min-height:100vh;padding:34px 28px 60px;box-sizing:border-box;background:#0f0e0f;color:#f5edf3;color-scheme:dark}.items-shell{max-width:1300px;margin:0 auto}.breadcrumb{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:24px;color:#8f7e8b;font-size:12px}.breadcrumb strong{color:#eadde7}.breadcrumb button{border:0;padding:0;background:none;color:#c99ab8;font:inherit;cursor:pointer}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:25px}.eyebrow{display:flex;align-items:center;gap:8px;color:#df8bb5;font-size:10px;font-weight:800;letter-spacing:1.7px}.eyebrow i{width:7px;height:7px;border-radius:50%;background:#df8bb5}.page-heading h1{margin:9px 0 0;color:#fff8fc;font-size:clamp(25px,3vw,34px)}.page-heading p{margin:9px 0 0;color:#a18e9e;font-size:13px}.heading-actions{display:flex;flex-wrap:wrap;gap:8px}.secondary-button,.primary-button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;font-size:11px;font-weight:750;cursor:pointer}.secondary-button{border:1px solid #554052;background:#29202a;color:#d8c4d4}.secondary-button:hover{border-color:#a36a91;background:#382638}.primary-button{border:1px solid #c46f98;background:linear-gradient(135deg,#d77da6,#a95782);color:#21131b}.primary-button:disabled{opacity:.55;cursor:not-allowed}.alert{display:flex;justify-content:space-between;gap:12px;margin-bottom:15px;padding:12px 14px;border-radius:8px;font-size:12px}.alert button{border:0;background:none;color:inherit;font-size:19px;cursor:pointer}.alert.success{border:1px solid #31563f;background:#17251c;color:#9bd5aa}.alert.error{border:1px solid #653747;background:#2a171e;color:#f0a4b3}
        .summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:18px}.summary-card{display:flex;align-items:center;gap:13px;min-width:0;padding:17px;border:1px solid #3d2b38;border-radius:12px;background:linear-gradient(135deg,#261b22,#1d171c)}.summary-icon{display:grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border:1px solid #594052;border-radius:11px;background:#382437;color:#e18bb6;font-size:18px}.summary-icon.green{background:#20382d;color:#83c99e;border-color:#365543}.summary-icon.gold{background:#392b23;color:#e2ad73;border-color:#624832}.summary-card div{display:flex;min-width:0;flex-direction:column;gap:4px}.summary-card small{color:#b49eaf;font-size:10px}.summary-card strong{overflow:hidden;color:#fff8fc;font-size:16px;text-overflow:ellipsis;white-space:nowrap}.summary-card span:last-child{color:#897988;font-size:9px;overflow-wrap:anywhere}
        .panel{margin-bottom:17px;border:1px solid #3d2b38;border-radius:13px;background:linear-gradient(145deg,#21181e,#191419);box-shadow:0 8px 24px #0002}.add-panel,.list-panel{padding:22px}.panel-heading{display:flex;align-items:center;gap:12px;margin-bottom:18px}.panel-icon{display:grid;place-items:center;width:40px;height:40px;border:1px solid #594052;border-radius:11px;background:#302231;color:#e08bb5;font-size:21px}.panel-heading h2{margin:0;color:#f7eaf2;font-size:15px}.panel-heading p{margin:5px 0 0;color:#a18e9e;font-size:11px;line-height:1.5}.add-grid{display:grid;grid-template-columns:1fr 1.2fr auto;align-items:end;gap:12px}.field{display:flex;flex-direction:column;gap:8px;color:#d8c3d3;font-size:11px;font-weight:750}.field input,.field select{width:100%;min-height:42px;box-sizing:border-box;padding:9px 11px;border:1px solid #493545;border-radius:8px;outline:0;background:#171217;color:#f1e6ef;font:inherit;font-size:12px;color-scheme:dark}.field input:focus,.field select:focus{border-color:#b978a0;box-shadow:0 0 0 3px #ab6f9d24}.field input::placeholder{color:#806f7e}.field small{color:#988797;font-size:10px;font-weight:400}.add-button{min-height:42px;white-space:nowrap}
        .list-heading{justify-content:space-between;padding-bottom:16px;border-bottom:1px solid #392833}.count-pill{padding:7px 10px;border:1px solid #594052;border-radius:20px;background:#302231;color:#e3a9ca;font-size:10px;font-weight:750}.items-list{display:flex;flex-direction:column;gap:9px}.item-card{display:grid;grid-template-columns:35px 40px minmax(150px,1fr) auto auto;align-items:center;gap:12px;padding:13px;border:1px solid #40303d;border-radius:10px;background:linear-gradient(120deg,#261c23,#1c171d)}.item-inactive{opacity:.72}.order-control{display:flex;flex-direction:column;align-items:center;gap:1px}.order-control button{width:23px;height:17px;padding:0;border:0;border-radius:4px;background:none;color:#b294aa;font-size:15px;cursor:pointer}.order-control button:disabled{opacity:.25;cursor:not-allowed}.order-control strong{color:#d5bdcf;font-size:10px}.product-icon{display:grid;place-items:center;width:39px;height:39px;border:1px solid #594052;border-radius:11px;background:#302231;color:#e08bb5;font-size:18px}.product-info{display:flex;min-width:0;flex-direction:column;gap:5px}.product-info strong{overflow:hidden;color:#eee1eb;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.product-info small{color:#988797;font-size:9px}.status-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:20px;font-size:10px;font-weight:700}.status-pill i{width:6px;height:6px;border-radius:50%;background:currentColor}.status-pill.active{background:#1c3528;color:#85c99b}.status-pill.inactive{background:#302932;color:#b0a1b0}.item-actions{display:flex;align-items:center;gap:7px}.small-button{min-height:32px;padding:0 10px}.icon-button{display:grid;place-items:center;width:32px;height:32px;border:1px solid #493744;border-radius:7px;background:#251c24;color:#c6a7bd;font-size:15px;cursor:pointer}.icon-button.danger:hover{border-color:#98505e;background:#3a2028;color:#f0a1ac}.remove-question{color:#e8c1cb;font-size:10px}.remove-confirm{min-height:32px;padding:0 11px;border:1px solid #98505e;border-radius:7px;background:#713849;color:#fff0f4;font-size:10px;font-weight:700;cursor:pointer}
        .state-box{display:flex;min-height:220px;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:25px;color:#f0e4ed;text-align:center}.state-box small{color:#a18f9e;font-size:11px}.empty-icon{color:#d77da6;font-size:28px}.loader{width:28px;height:28px;border:3px solid #3c2c3a;border-top-color:#d77da6;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:900px){.add-grid{grid-template-columns:1fr 1fr}.add-button{grid-column:1/-1;justify-self:start}.item-card{grid-template-columns:30px 38px minmax(120px,1fr) auto}.item-actions{grid-column:3/5;justify-self:start}}
        @media(max-width:650px){.items-page{padding:24px 15px 45px}.page-heading{align-items:flex-start;flex-direction:column}.summary-grid{grid-template-columns:1fr}.add-panel,.list-panel{padding:16px}.add-grid{grid-template-columns:1fr}.add-button{grid-column:auto;width:100%}.item-card{grid-template-columns:26px 35px minmax(0,1fr)}.status-pill{grid-column:3;justify-self:start}.item-actions{grid-column:2/4}.heading-actions{width:100%}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>
    </main>
  );
}
