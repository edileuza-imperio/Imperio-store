"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

type Endereco = {
  id_endereco: number;
  cep?: string;
  logradouro?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  uf?: string;
  tipo?: string;
  principal?: boolean | number | string;
  is_principal?: boolean | number | string;
};

type Formulario = {
  cep: string; logradouro: string; numero: string; complemento: string;
  bairro: string; cidade: string; estado: string; tipo: string;
};

const FORM_VAZIO: Formulario = {
  cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", cidade: "", estado: "", tipo: "Residencial",
};

function obj(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function texto(...values: unknown[]): string {
  for (const value of values) if (typeof value === "string" || typeof value === "number") {
    const result = String(value).trim(); if (result) return result;
  }
  return "";
}
function extrairClienteId(value: unknown): number | null {
  let current: unknown = value;
  for (let i = 0; i < 5; i++) {
    const data = obj(current); if (!data) break;
    const id = Number(data.id_cliente ?? data.cliente_id);
    if (Number.isInteger(id) && id > 0) return id;
    current = data.dados ?? data.usuario ?? data.cliente ?? data.data;
  }
  return null;
}
function extrairEnderecos(value: unknown): Endereco[] {
  let current: unknown = value;
  for (let i = 0; i < 6; i++) {
    if (Array.isArray(current)) return current as Endereco[];
    const data = obj(current); if (!data) break;
    if (Number(data.status ?? 200) >= 400 || data.sucesso === false) {
      throw new Error(texto(data.mensagem, "A API não conseguiu consultar os endereços."));
    }
    current = data.enderecos ?? data.lista ?? data.dados ?? data.data;
  }
  throw new Error("A resposta da API não contém uma lista de endereços no formato esperado.");
}
function mensagemErro(error: unknown): string {
  const response = obj(obj(error)?.response);
  const data = obj(response?.data);
  return texto(data?.mensagem, obj(error)?.message, "Ocorreu um erro ao realizar a operação.");
}
function principal(endereco: Endereco): boolean {
  return endereco.principal === true || endereco.principal === 1 || endereco.principal === "1" ||
    endereco.is_principal === true || endereco.is_principal === 1 || endereco.is_principal === "1";
}

export default function EnderecosPage() {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [form, setForm] = useState<Formulario>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try {
      const perfil = await conexao.get(ROTAS.AUTH.USUARIO_ATUAL);
      const id = extrairClienteId(perfil.data);
      if (!id) {
        setClienteId(null); setEnderecos([]);
        throw new Error("A API /auth/me não retornou id_cliente ou cliente_id. Para proteger seus dados, não vou usar o ID do usuário como ID do cliente. É necessário disponibilizar o vínculo do cliente autenticado no backend.");
      }
      setClienteId(id);
      const resposta = await conexao.get(ROTAS.CLIENTES.ENDERECOS.LISTAR(id));
      setEnderecos(extrairEnderecos(resposta.data));
    } catch (error: unknown) { setErro(mensagemErro(error)); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const abrirNovo = () => { setEditando(null); setForm(FORM_VAZIO); setAviso(""); setModal(true); };
  const abrirEdicao = (item: Endereco) => {
    setEditando(item.id_endereco);
    setForm({ cep: item.cep ?? "", logradouro: item.logradouro ?? item.endereco ?? "", numero: item.numero ?? "", complemento: item.complemento ?? "", bairro: item.bairro ?? "", cidade: item.cidade ?? "", estado: item.estado ?? item.uf ?? "", tipo: item.tipo ?? "Residencial" });
    setAviso(""); setModal(true);
  };

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!clienteId) return;
    setSalvando(true); setAviso("");
    try {
      if (editando) await conexao.put(ROTAS.CLIENTES.ENDERECOS.ATUALIZAR(clienteId, editando), form);
      else await conexao.post(ROTAS.CLIENTES.ENDERECOS.CADASTRAR(clienteId), form);
      setModal(false); await carregar();
    } catch (error: unknown) { setAviso(mensagemErro(error)); }
    finally { setSalvando(false); }
  }

  async function definirPrincipal(id: number) {
    if (!clienteId) return;
    try { await conexao.put(ROTAS.CLIENTES.ENDERECOS.DEFINIR_PRINCIPAL(clienteId, id)); await carregar(); }
    catch (error: unknown) { setErro(mensagemErro(error)); }
  }
  async function excluir(id: number) {
    if (!clienteId || !window.confirm("Deseja realmente excluir este endereço?")) return;
    try { await conexao.delete(ROTAS.CLIENTES.ENDERECOS.EXCLUIR(clienteId, id)); await carregar(); }
    catch (error: unknown) { setErro(mensagemErro(error)); }
  }

  const quantidade = useMemo(() => enderecos.length, [enderecos]);
  return (
    <main className="enderecos-page">
      <style jsx>{`
        .enderecos-page{min-height:100vh;background:linear-gradient(135deg,#fff8f6 0%,#fff 55%,#fbf4f1 100%);padding:30px 20px 70px;color:#49232d}
        .enderecos-shell{max-width:1050px;margin:0 auto}.breadcrumb{display:flex;gap:9px;font-size:12px;color:#9a7279;margin-bottom:34px}.breadcrumb a{color:#8b4657;text-decoration:none}
        .heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:25px}.eyebrow{font-size:10px;letter-spacing:2px;color:#c17b87;font-weight:800}.heading h1{font:42px Georgia,serif;margin:8px 0;color:#542735}.heading p{color:#986d75;font-size:14px;margin:0}
        .btn{border:1px solid #ead8d9;background:white;color:#743b4b;border-radius:10px;padding:12px 17px;font-weight:700;cursor:pointer;text-decoration:none;font-size:13px}.primary{background:#793e50;color:white;border-color:#793e50;box-shadow:0 7px 18px #793e5026}.summary{display:flex;align-items:center;gap:15px;background:#fff;border:1px solid #efdfdf;border-radius:15px;padding:18px 20px;margin-bottom:18px;box-shadow:0 8px 24px #5b25300a}.summary-icon{width:44px;height:44px;border-radius:12px;background:#f8e9e8;display:grid;place-items:center;font-size:21px}.summary small{display:block;color:#a77880;font-size:11px}.summary strong{display:block;margin-top:4px;font-size:15px}.card{background:white;border:1px solid #efdfdf;border-radius:16px;overflow:hidden;box-shadow:0 12px 35px #5b25300b}.card-head{padding:22px 24px;border-bottom:1px solid #f0e2e2;display:flex;justify-content:space-between;align-items:center}.card-head h2{font:25px Georgia,serif;margin:6px 0 0}.list{padding:20px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.address{border:1px solid #eedede;border-radius:13px;padding:19px;position:relative}.address-top{display:flex;justify-content:space-between;gap:10px;align-items:center}.tag{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#8c5260;background:#fbefee;border-radius:30px;padding:6px 9px;font-weight:800}.tag.main{background:#eaf5ee;color:#35704c}.address h3{font-size:16px;margin:15px 0 7px}.address p{color:#86666c;font-size:13px;line-height:1.7;margin:0}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:17px}.actions button{border:0;background:transparent;color:#8b4657;font-weight:700;font-size:12px;cursor:pointer;padding:5px 0;margin-right:12px}.empty,.state{padding:55px 20px;text-align:center;color:#916f75}.empty-icon{margin:0 auto 15px;width:58px;height:58px;border-radius:17px;background:#fbefee;display:grid;place-items:center;font-size:25px}.empty h3,.state h2{font:23px Georgia,serif;color:#542735;margin:0 0 8px}.empty p,.state p{font-size:13px;line-height:1.6;max-width:470px;margin:0 auto 18px}.state{padding:80px 20px}.error{color:#a43f4d}.help{margin-top:18px;border:1px solid #efdfdf;border-radius:13px;padding:16px 18px;color:#956e75;font-size:12px;display:flex;justify-content:space-between;gap:15px}.modal-backdrop{position:fixed;inset:0;background:#26141bb3;display:grid;place-items:center;padding:18px;z-index:50}.modal{width:min(620px,100%);max-height:90vh;overflow:auto;background:white;border-radius:17px;padding:24px;box-shadow:0 25px 80px #0003}.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.modal h2{font:26px Georgia,serif;margin:5px 0}.close{border:0;background:#f8eeee;border-radius:9px;width:35px;height:35px;cursor:pointer;color:#743b4b}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.field{display:flex;flex-direction:column;gap:6px}.field.full{grid-column:1/-1}.field label{font-size:11px;color:#865e66;font-weight:700}.field input,.field select{width:100%;box-sizing:border-box;border:1px solid #ead9da;border-radius:9px;padding:12px;font:14px Arial;color:#4b2931;background:#fff}.form-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px}.notice{background:#fff3f1;border:1px solid #f0d4d2;color:#9b4750;border-radius:9px;padding:11px;font-size:12px;margin:12px 0}
        @media(max-width:680px){.enderecos-page{padding:22px 14px 50px}.heading{align-items:flex-start;flex-direction:column}.heading h1{font-size:35px}.list{grid-template-columns:1fr;padding:13px}.card-head{padding:18px}.help{flex-direction:column}.form-grid{grid-template-columns:1fr}.field.full{grid-column:auto}}
      `}</style>
      <div className="enderecos-shell">
        <nav className="breadcrumb"><Link href="/">Início</Link><span>/</span><Link href="/minha-conta">Minha conta</Link><span>/</span><strong>Meus endereços</strong></nav>
        <header className="heading"><div><span className="eyebrow">UNIVERSO IMPÉRIO · SUA CONTA</span><h1>Meus endereços</h1><p>Gerencie os locais de entrega das suas compras.</p></div><Link className="btn" href="/minha-conta">Voltar para minha conta</Link></header>
        <section className="summary"><div className="summary-icon">⌖</div><div><small>ENDEREÇOS CADASTRADOS</small><strong>{quantidade} {quantidade === 1 ? "endereço" : "endereços"}</strong></div></section>
        <section className="card">
          <div className="card-head"><div><span className="eyebrow">ENTREGA</span><h2>Seus endereços</h2></div><button className="btn primary" onClick={abrirNovo} disabled={!clienteId}>＋ Adicionar endereço</button></div>
          {carregando ? <div className="state"><p>Carregando seus endereços...</p></div> : erro ? <div className="state error" role="alert"><h2>Não foi possível carregar</h2><p>{erro}</p><button className="btn" onClick={() => void carregar()}>Tentar novamente</button></div> : enderecos.length === 0 ? <div className="empty"><div className="empty-icon">⌖</div><h3>Nenhum endereço cadastrado</h3><p>Quando houver endereços vinculados à sua conta, eles aparecerão aqui.</p><button className="btn primary" onClick={abrirNovo}>Adicionar primeiro endereço</button></div> : <div className="list">{enderecos.map((item) => <article className="address" key={item.id_endereco}><div className="address-top"><span className="tag">{item.tipo || "Endereço"}</span>{principal(item) && <span className="tag main">Principal</span>}</div><h3>{texto(item.logradouro, item.endereco)}{item.numero ? `, ${item.numero}` : ""}</h3><p>{[item.complemento, item.bairro, item.cidade, item.estado || item.uf].filter(Boolean).join(" · ")}<br/>CEP: {item.cep || "Não informado"}</p><div className="actions"><button onClick={() => abrirEdicao(item)}>Editar</button>{!principal(item) && <button onClick={() => void definirPrincipal(item.id_endereco)}>Definir como principal</button>}<button onClick={() => void excluir(item.id_endereco)}>Excluir</button></div></article>)}</div>}
        </section>
        <div className="help"><span>Precisa de ajuda com um endereço? Entre em contato com nossa equipe de atendimento.</span><Link href="/contato" style={{color:"#793e50",fontWeight:700,textDecoration:"none"}}>Falar com a loja →</Link></div>
      </div>
      {modal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="eyebrow">DADOS DE ENTREGA</span><h2 id="modal-title">{editando ? "Editar endereço" : "Novo endereço"}</h2></div><button className="close" onClick={() => setModal(false)} aria-label="Fechar">×</button></div><form onSubmit={salvar}><div className="form-grid">
        {([ ["cep","CEP"],["logradouro","Rua / Avenida"],["numero","Número"],["complemento","Complemento"],["bairro","Bairro"],["cidade","Cidade"],["estado","Estado / UF"] ] as [keyof Formulario,string][]).map(([key,label]) => <div className={`field ${key === "logradouro" || key === "complemento" ? "full" : ""}`} key={key}><label htmlFor={key}>{label}{["cep","logradouro","numero","bairro","cidade","estado"].includes(key) ? " *" : ""}</label><input id={key} value={form[key]} onChange={(e) => setForm((old) => ({...old,[key]:e.target.value}))} required={["cep","logradouro","numero","bairro","cidade","estado"].includes(key)} maxLength={key === "cep" ? 9 : 120}/></div>)}
        <div className="field"><label htmlFor="tipo">Tipo</label><select id="tipo" value={form.tipo} onChange={(e) => setForm((old) => ({...old,tipo:e.target.value}))}><option>Residencial</option><option>Comercial</option><option>Outro</option></select></div>
        </div>{aviso && <div className="notice" role="alert">{aviso}</div>}<div className="form-actions"><button type="button" className="btn" onClick={() => setModal(false)}>Cancelar</button><button type="submit" className="btn primary" disabled={salvando}>{salvando ? "Salvando..." : "Salvar endereço"}</button></div></form></section></div>}
    </main>
  );
}
