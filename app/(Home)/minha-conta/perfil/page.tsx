"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

type Usuario = {
  id?: number | string;
  nome?: string;
  usuario?: string;
  email?: string;
  telefone?: string;
  data_de_nascimento?: string;
  criado_em?: string;
};

function objeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : null;
}

function primeiroTexto(...valores: unknown[]): string {
  for (const valor of valores) {
    if (typeof valor === "string" && valor.trim()) return valor.trim();
    if (typeof valor === "number") return String(valor);
  }
  return "";
}

function extrairUsuario(resposta: unknown): Usuario {
  let atual: unknown = resposta;
  // A API do projeto pode encapsular a resposta em `dados` mais de uma vez.
  for (let i = 0; i < 4; i += 1) {
    const registro = objeto(atual);
    if (!registro) break;
    const candidato = objeto(registro.usuario) ?? objeto(registro.dados) ?? objeto(registro.data);
    if (!candidato) {
      return {
        id: (registro.id_usuario ?? registro.id) as number | string | undefined,
        nome: primeiroTexto(registro.nome, registro.nome_completo),
        usuario: primeiroTexto(registro.usuario),
        email: primeiroTexto(registro.email),
        telefone: primeiroTexto(registro.telefone, registro.celular),
        data_de_nascimento: primeiroTexto(registro.data_de_nascimento, registro.data_nascimento),
        criado_em: primeiroTexto(registro.criado_em, registro.data_cadastro),
      };
    }
    atual = candidato;
  }
  const registro = objeto(atual) ?? {};
  return {
    id: (registro.id_usuario ?? registro.id) as number | string | undefined,
    nome: primeiroTexto(registro.nome, registro.nome_completo),
    usuario: primeiroTexto(registro.usuario, registro.login),
    email: primeiroTexto(registro.email),
    telefone: primeiroTexto(registro.telefone, registro.celular),
    data_de_nascimento: primeiroTexto(registro.data_de_nascimento, registro.data_nascimento),
    criado_em: primeiroTexto(registro.criado_em, registro.data_cadastro),
  };
}

function formatarData(valor?: string): string {
  if (!valor) return "Não informado";
  const data = new Date(`${valor.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleDateString("pt-BR");
}

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarPerfil = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await conexao.get(ROTAS.AUTH.USUARIO_ATUAL);
      const payload = resposta?.data;
      const envelope = objeto(payload);
      if (envelope && Number(envelope.status ?? 200) >= 400) {
        throw new Error(primeiroTexto(envelope.mensagem, "Não foi possível consultar seu perfil."));
      }
      const perfil = extrairUsuario(payload);
      if (!perfil.id && !perfil.nome && !perfil.email) {
        throw new Error("A API não retornou os dados do usuário autenticado.");
      }
      setUsuario(perfil);
    } catch (e: unknown) {
      const mensagem = e instanceof Error ? e.message : "Não foi possível carregar seu perfil.";
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarPerfil();
  }, [carregarPerfil]);

  const iniciais = useMemo(() => {
    const partes = (usuario?.nome || usuario?.usuario || "U").trim().split(/\s+/);
    return partes.slice(0, 2).map((parte) => parte[0]?.toUpperCase() ?? "").join("");
  }, [usuario]);

  return (
    <main className="perfil-page">
      <div className="perfil-shell">
        <nav className="perfil-breadcrumb" aria-label="Navegação estrutural">
          <Link href="/">Início</Link><span>/</span>
          <Link href="/minha-conta">Minha conta</Link><span>/</span>
          <strong>Meu perfil</strong>
        </nav>

        <header className="perfil-heading">
          <div>
            <span className="perfil-eyebrow">UNIVERSO IMPÉRIO · SUA CONTA</span>
            <h1>Meu perfil</h1>
            <p>Consulte os dados associados à sua conta.</p>
          </div>
          <Link className="perfil-back" href="/minha-conta">Voltar para minha conta</Link>
        </header>

        {carregando ? (
          <section className="perfil-state"><span className="perfil-spinner" /><p>Carregando seus dados...</p></section>
        ) : erro ? (
          <section className="perfil-state perfil-error" role="alert">
            <div className="perfil-state-icon">!</div>
            <h2>Não foi possível carregar seu perfil</h2>
            <p>{erro}</p>
            <button type="button" className="perfil-primary" onClick={() => void carregarPerfil()}>Tentar novamente</button>
          </section>
        ) : usuario ? (
          <>
            <section className="perfil-hero">
              <div className="perfil-avatar">{iniciais || "U"}</div>
              <div className="perfil-hero-copy">
                <span className="perfil-eyebrow">BEM-VINDO(A)</span>
                <h2>{usuario.nome || usuario.usuario || "Minha conta"}</h2>
                <p>{usuario.email || "E-mail não informado"}</p>
              </div>
              <span className="perfil-status"><i /> Conta autenticada</span>
            </section>

            <section className="perfil-card">
              <div className="perfil-card-heading">
                <div><span className="perfil-eyebrow">INFORMAÇÕES PESSOAIS</span><h2>Dados da conta</h2></div>
                <span className="perfil-readonly">Consulta</span>
              </div>
              <div className="perfil-grid">
                <div className="perfil-field"><span>Nome completo</span><strong>{usuario.nome || "Não informado"}</strong></div>
                <div className="perfil-field"><span>Nome de usuário</span><strong>{usuario.usuario || "Não informado"}</strong></div>
                <div className="perfil-field"><span>E-mail</span><strong>{usuario.email || "Não informado"}</strong></div>
                <div className="perfil-field"><span>Telefone</span><strong>{usuario.telefone || "Não informado"}</strong></div>
                <div className="perfil-field"><span>Data de nascimento</span><strong>{formatarData(usuario.data_de_nascimento)}</strong></div>
                <div className="perfil-field"><span>Código da conta</span><strong>{usuario.id ? `#${usuario.id}` : "Não informado"}</strong></div>
                <div className="perfil-field"><span>Cadastro realizado em</span><strong>{formatarData(usuario.criado_em)}</strong></div>
              </div>
              <div className="perfil-note"><span>ℹ</span><p>Esta tela consulta os dados da sessão autenticada. A edição dos dados pessoais será habilitada quando houver um endpoint próprio e seguro para atualização pelo titular da conta.</p></div>
            </section>

            <section className="perfil-shortcuts">
              <Link href="/minha-conta/pedidos"><span className="perfil-shortcut-icon">▤</span><span><strong>Meus pedidos</strong><small>Acompanhe suas compras</small></span><b>→</b></Link>
              <Link href="/minha-conta/seguranca"><span className="perfil-shortcut-icon">⌑</span><span><strong>Segurança</strong><small>Consulte as opções de segurança</small></span><b>→</b></Link>
            </section>
          </>
        ) : null}
      </div>

      <style jsx>{`
        .perfil-page{min-height:70vh;padding:28px 20px 64px;background:linear-gradient(135deg,#fff8f6 0%,#fff 58%,#fff9f7 100%);color:#43232b}
        .perfil-shell{width:100%;max-width:1000px;margin:0 auto}
        .perfil-breadcrumb{display:flex;gap:10px;align-items:center;margin-bottom:34px;font-size:12px;color:#9b727a}
        .perfil-breadcrumb a{color:inherit;text-decoration:none}.perfil-breadcrumb a:hover{color:#783b4b}.perfil-breadcrumb strong{color:#542936;font-weight:700}
        .perfil-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:28px}
        .perfil-eyebrow{display:block;color:#c47783;font-size:10px;font-weight:800;letter-spacing:2px}
        .perfil-heading h1{margin:8px 0 5px;font-family:Georgia,serif;font-size:clamp(32px,5vw,43px);font-weight:500;letter-spacing:-1.4px;color:#542936}
        .perfil-heading p{margin:0;color:#986b74;font-size:13px}
        .perfil-back{padding:11px 15px;border:1px solid #ead9dc;border-radius:10px;color:#713c49;text-decoration:none;font-size:12px;font-weight:700;white-space:nowrap;background:#fff}
        .perfil-hero{display:flex;align-items:center;gap:18px;padding:24px 26px;margin-bottom:18px;border:1px solid #efdee1;border-radius:16px;background:#fff;box-shadow:0 10px 30px #6c39400b}
        .perfil-avatar{display:grid;place-items:center;flex:0 0 66px;width:66px;height:66px;border-radius:50%;background:#f6e5e7;color:#793d4d;font-family:Georgia,serif;font-size:25px}
        .perfil-hero-copy{min-width:0;flex:1}.perfil-hero-copy h2{margin:5px 0 4px;color:#542936;font-family:Georgia,serif;font-size:24px;font-weight:500}.perfil-hero-copy p{margin:0;color:#986b74;font-size:13px;overflow-wrap:anywhere}
        .perfil-status{display:flex;align-items:center;gap:7px;padding:8px 11px;border-radius:30px;background:#f0f7f1;color:#39734a;font-size:11px;font-weight:700;white-space:nowrap}.perfil-status i{width:7px;height:7px;border-radius:50%;background:#4e9b61}
        .perfil-card{padding:26px;border:1px solid #efdee1;border-radius:16px;background:#fff;box-shadow:0 10px 30px #6c39400b}
        .perfil-card-heading{display:flex;justify-content:space-between;align-items:center;gap:15px;padding-bottom:19px;border-bottom:1px solid #f0e5e7}.perfil-card-heading h2{margin:5px 0 0;color:#542936;font-family:Georgia,serif;font-size:23px;font-weight:500}
        .perfil-readonly{padding:6px 10px;border-radius:20px;background:#fbf0f0;color:#9a5967;font-size:10px;font-weight:800}
        .perfil-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 28px}.perfil-field{display:flex;flex-direction:column;gap:7px;padding:19px 0;border-bottom:1px solid #f5edef;min-width:0}.perfil-field span{color:#a17b82;font-size:11px}.perfil-field strong{color:#55303a;font-size:13px;font-weight:700;overflow-wrap:anywhere}
        .perfil-note{display:flex;gap:10px;align-items:flex-start;margin-top:20px;padding:13px 15px;border-radius:10px;background:#fff8f5;color:#91656d}.perfil-note span{font-weight:800}.perfil-note p{margin:0;font-size:11px;line-height:1.65}
        .perfil-shortcuts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}.perfil-shortcuts a{display:flex;align-items:center;gap:12px;padding:16px;border:1px solid #efdee1;border-radius:13px;background:#fff;color:#542936;text-decoration:none;transition:transform .18s ease,border-color .18s ease}.perfil-shortcuts a:hover{transform:translateY(-2px);border-color:#d9b6be}.perfil-shortcut-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#f8e9eb;color:#813f50;font-size:19px}.perfil-shortcuts a span:nth-child(2){display:flex;flex:1;flex-direction:column;gap:4px}.perfil-shortcuts strong{font-size:12px}.perfil-shortcuts small{color:#a17b82;font-size:10px}.perfil-shortcuts b{font-size:17px;color:#9a5967}
        .perfil-state{display:flex;min-height:260px;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:30px;border:1px solid #efdee1;border-radius:16px;background:#fff;text-align:center}.perfil-state p{max-width:520px;margin:0;color:#986b74;font-size:13px;line-height:1.6}.perfil-state h2{margin:0;color:#542936;font-family:Georgia,serif;font-size:23px;font-weight:500}.perfil-error .perfil-state-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#fbebeb;color:#a44855;font-size:22px;font-weight:800}.perfil-spinner{width:28px;height:28px;border:3px solid #f1dfe3;border-top-color:#844456;border-radius:50%;animation:perfil-spin .8s linear infinite}.perfil-primary{padding:11px 18px;border:0;border-radius:9px;background:#793d4d;color:#fff;font-size:12px;font-weight:700;cursor:pointer}.perfil-primary:hover{background:#5d2c3a}@keyframes perfil-spin{to{transform:rotate(360deg)}}
        @media(max-width:650px){.perfil-page{padding:20px 14px 44px}.perfil-heading{align-items:flex-start;flex-direction:column}.perfil-back{white-space:normal}.perfil-hero{align-items:flex-start;flex-wrap:wrap;padding:19px}.perfil-status{margin-left:84px}.perfil-card{padding:19px}.perfil-grid{grid-template-columns:1fr}.perfil-field{padding:15px 0}.perfil-shortcuts{grid-template-columns:1fr}.perfil-breadcrumb{margin-bottom:25px}}
      `}</style>
    </main>
  );
}
