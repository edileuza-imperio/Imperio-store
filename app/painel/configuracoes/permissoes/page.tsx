"use client";

import conexao from "@/Services/Conexao/Conexao";
import { useCallback, useEffect, useMemo, useState } from "react";

type Papel = {
  id: number;
  nome: string;
  codigo: string;
  descricao?: string | null;
  sistema?: boolean;
  status_id?: number;
};

type Permissao = {
  id: number;
  modulo: string;
  nome: string;
  codigo: string;
  descricao?: string | null;
  status_id?: number;
};

const ROTAS = {
  TUDO: "/painel/permissoes/tudo",
  PERMISSOES_DO_PAPEL: (papelId: number) =>
    `/painel/papeis/${papelId}/permissoes`,
  ATRIBUIR: (papelId: number, permissaoId: number) =>
    `/painel/papeis/${papelId}/permissoes/${permissaoId}`,
  REMOVER: (papelId: number, permissaoId: number) =>
    `/painel/papeis/${papelId}/permissoes/${permissaoId}`,
};

function objeto(valor: unknown): Record<string, unknown> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  return valor as Record<string, unknown>;
}

function listaDe(valor: unknown): unknown[] {
  if (Array.isArray(valor)) return valor;
  const raiz = objeto(valor);
  const dados = objeto(raiz?.dados);
  const interno = objeto(dados?.dados);

  const candidatos = [
    raiz?.dados,
    raiz?.resultado,
    dados?.itens,
    dados?.papeis,
    dados?.permissoes,
    interno?.itens,
    interno?.papeis,
    interno?.permissoes,
  ];

  return (candidatos.find(Array.isArray) as unknown[] | undefined) ?? [];
}

function normalizarPapel(valor: unknown): Papel | null {
  const item = objeto(valor);
  if (!item) return null;

  const id = Number(item.id_papel ?? item.id);
  const nome = String(item.nome ?? "").trim();
  const codigo = String(item.codigo ?? item.codigo_papel ?? "").trim();

  if (!Number.isInteger(id) || id <= 0 || !nome || !codigo) return null;

  return {
    id,
    nome,
    codigo,
    descricao: typeof item.descricao === "string" ? item.descricao : null,
    sistema: Boolean(item.sistema),
    status_id: Number(item.status_id ?? 0),
  };
}

function normalizarPermissao(valor: unknown): Permissao | null {
  const item = objeto(valor);
  if (!item) return null;

  const id = Number(item.id_permissao ?? item.id);
  const modulo = String(item.modulo ?? "outros").trim() || "outros";
  const nome = String(item.nome ?? "").trim();
  const codigo = String(item.codigo ?? "").trim();

  if (!Number.isInteger(id) || id <= 0 || !nome || !codigo) return null;

  return {
    id,
    modulo,
    nome,
    codigo,
    descricao: typeof item.descricao === "string" ? item.descricao : null,
    status_id: Number(item.status_id ?? 0),
  };
}

function extrairColecao(
  resposta: unknown,
  chave: "papeis" | "permissoes",
): unknown[] {
  const raiz = objeto(resposta);
  const dados = objeto(raiz?.dados);
  const dadosInternos = objeto(dados?.dados);
  const resultado = objeto(raiz?.resultado);

  const possiveis = [
    raiz?.[chave],
    dados?.[chave],
    dadosInternos?.[chave],
    resultado?.[chave],
  ];

  return (possiveis.find(Array.isArray) as unknown[] | undefined) ?? [];
}

function mensagemErro(error: unknown): string {
  const erro = objeto(error);
  const response = objeto(erro?.response);
  const data = objeto(response?.data);

  return String(
    data?.mensagem ??
      data?.erro ??
      erro?.message ??
      "Não foi possível concluir a operação.",
  );
}

function nomeModulo(modulo: string): string {
  return modulo
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export default function PermissoesPage() {
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [permissoesDoPapel, setPermissoesDoPapel] = useState<number[]>([]);
  const [papelSelecionado, setPapelSelecionado] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [moduloSelecionado, setModuloSelecionado] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [carregandoPapel, setCarregandoPapel] = useState(false);
  const [alterando, setAlterando] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const papelAtual =
    papeis.find((papel) => papel.id === papelSelecionado) ?? null;

  const carregarBase = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await conexao.get(ROTAS.TUDO);
      const papeisRecebidos = extrairColecao(resposta.data, "papeis")
        .map(normalizarPapel)
        .filter((item): item is Papel => item !== null);

      const permissoesRecebidas = extrairColecao(resposta.data, "permissoes")
        .map(normalizarPermissao)
        .filter((item): item is Permissao => item !== null);

      setPapeis(papeisRecebidos);
      setPermissoes(permissoesRecebidas);

      setPapelSelecionado((atual) => {
        if (atual && papeisRecebidos.some((papel) => papel.id === atual)) {
          return atual;
        }
        return papeisRecebidos[0]?.id ?? null;
      });
    } catch (error) {
      setErro(mensagemErro(error));
      setPapeis([]);
      setPermissoes([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarPermissoesDoPapel = useCallback(async (papelId: number) => {
    setCarregandoPapel(true);
    setErro("");
    setSucesso("");

    try {
      const resposta = await conexao.get(ROTAS.PERMISSOES_DO_PAPEL(papelId));
      const recebidas = listaDe(resposta.data)
        .map(normalizarPermissao)
        .filter((item): item is Permissao => item !== null);

      setPermissoesDoPapel(recebidas.map((item) => item.id));
    } catch (error) {
      setPermissoesDoPapel([]);
      setErro(mensagemErro(error));
    } finally {
      setCarregandoPapel(false);
    }
  }, []);

  useEffect(() => {
    void carregarBase();
  }, [carregarBase]);

  useEffect(() => {
    if (papelSelecionado !== null) {
      void carregarPermissoesDoPapel(papelSelecionado);
    } else {
      setPermissoesDoPapel([]);
    }
  }, [papelSelecionado, carregarPermissoesDoPapel]);

  const modulos = useMemo(
    () => [
      "todos",
      ...Array.from(new Set(permissoes.map((item) => item.modulo))).sort(),
    ],
    [permissoes],
  );

  const permissoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return permissoes.filter((permissao) => {
      const correspondeModulo =
        moduloSelecionado === "todos" || permissao.modulo === moduloSelecionado;

      const correspondeBusca =
        !termo ||
        permissao.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        permissao.codigo.toLocaleLowerCase("pt-BR").includes(termo) ||
        permissao.modulo.toLocaleLowerCase("pt-BR").includes(termo);

      return correspondeModulo && correspondeBusca;
    });
  }, [permissoes, busca, moduloSelecionado]);

  const grupos = useMemo(() => {
    return permissoesFiltradas.reduce<Record<string, Permissao[]>>(
      (acc, permissao) => {
        (acc[permissao.modulo] ??= []).push(permissao);
        return acc;
      },
      {},
    );
  }, [permissoesFiltradas]);

  const quantidadeAtivas = permissoesDoPapel.length;
  const quantidadeTotal = permissoes.length;
  const progresso =
    quantidadeTotal > 0
      ? Math.round((quantidadeAtivas / quantidadeTotal) * 100)
      : 0;

  const papelPrincipalProtegido =
    papelAtual?.codigo?.trim().toUpperCase() === "ADMIN_PRINCIPAL";

  async function alternarPermissao(permissao: Permissao) {
    if (!papelAtual || alterando !== null) return;

    // O ADMIN_PRINCIPAL não pode alterar as permissões do próprio perfil.
    // Como as permissões são vinculadas ao papel, e não a uma conta isolada,
    // todo o papel precisa ficar somente para leitura nesta tela.
    if (papelPrincipalProtegido) {
      setErro(
        "O perfil ADMIN_PRINCIPAL é protegido. Para evitar bloquear a própria conta, suas permissões não podem ser ativadas ou desativadas por esta tela. Selecione outro papel para gerenciá-lo.",
      );
      return;
    }

    const estaAtiva = permissoesDoPapel.includes(permissao.id);

    setAlterando(permissao.id);
    setErro("");
    setSucesso("");

    try {
      if (estaAtiva) {
        await conexao.delete(ROTAS.REMOVER(papelAtual.id, permissao.id));
        setPermissoesDoPapel((atual) =>
          atual.filter((id) => id !== permissao.id),
        );
        setSucesso(`Permissão "${permissao.nome}" removida do papel.`);
      } else {
        await conexao.post(ROTAS.ATRIBUIR(papelAtual.id, permissao.id));
        setPermissoesDoPapel((atual) =>
          atual.includes(permissao.id) ? atual : [...atual, permissao.id],
        );
        setSucesso(`Permissão "${permissao.nome}" atribuída ao papel.`);
      }
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setAlterando(null);
    }
  }

  return (
    <main className="permissoes-page">
      <header className="pagina-header">
        <div>
          <div className="breadcrumb">
            <span className="breadcrumb-ponto" />
            <span>PAINEL ADMINISTRATIVO</span>
            <span className="separador">/</span>
            <span>CONFIGURAÇÕES</span>
            <span className="separador">/</span>
            <span>PERMISSÕES</span>
          </div>
          <h1>Gerenciar permissões</h1>
          <p>
            Defina quais recursos cada papel poderá acessar dentro do painel
            administrativo.
          </p>
        </div>

        <button
          type="button"
          className="botao-atualizar"
          onClick={() =>
            void carregarBase().then(() => {
              if (papelSelecionado !== null) {
                void carregarPermissoesDoPapel(papelSelecionado);
              }
            })
          }
          disabled={carregando || carregandoPapel}
        >
          <span aria-hidden="true">↻</span>
          Atualizar
        </button>
      </header>

      <section className="resumo-grid" aria-label="Resumo das permissões">
        <article className="resumo-card">
          <span className="resumo-rotulo">Papéis cadastrados</span>
          <strong>{carregando ? "—" : papeis.length}</strong>
          <span className="resumo-descricao">Perfis de acesso do sistema</span>
        </article>
        <article className="resumo-card">
          <span className="resumo-rotulo">Permissões disponíveis</span>
          <strong>{carregando ? "—" : quantidadeTotal}</strong>
          <span className="resumo-descricao">
            Recursos que podem ser atribuídos
          </span>
        </article>
        <article className="resumo-card resumo-card-destaque">
          <span className="resumo-rotulo">Permissões do papel</span>
          <strong>{carregandoPapel ? "—" : quantidadeAtivas}</strong>
          <span className="resumo-descricao">
            {papelAtual ? papelAtual.nome : "Selecione um papel"}
          </span>
        </article>
      </section>

      {(erro || sucesso) && (
        <div
          className={`mensagem ${erro ? "mensagem-erro" : "mensagem-sucesso"}`}
          role="status"
        >
          <span>{erro || sucesso}</span>
          <button
            type="button"
            aria-label="Fechar mensagem"
            onClick={() => {
              setErro("");
              setSucesso("");
            }}
          >
            ×
          </button>
        </div>
      )}

      <section className="gerenciador">
        <aside className="painel-papeis">
          <div className="painel-titulo">
            <span className="eyebrow">CONTROLE DE ACESSO</span>
            <h2>Papéis</h2>
            <p>Selecione um perfil para visualizar suas permissões.</p>
          </div>

          {carregando ? (
            <div className="estado-vazio">Carregando papéis...</div>
          ) : papeis.length === 0 ? (
            <div className="estado-vazio">Nenhum papel encontrado.</div>
          ) : (
            <div className="lista-papeis">
              {papeis.map((papel) => (
                <button
                  type="button"
                  key={papel.id}
                  className={`papel-item ${
                    papelSelecionado === papel.id ? "papel-item-ativo" : ""
                  }`}
                  onClick={() => setPapelSelecionado(papel.id)}
                >
                  <span className="papel-avatar" aria-hidden="true">
                    {papel.codigo === "ADMIN_PRINCIPAL" ? "★" : "◇"}
                  </span>
                  <span className="papel-info">
                    <strong>{papel.nome}</strong>
                    <small>{papel.codigo}</small>
                  </span>
                  <span className="papel-seta" aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </div>
          )}

          {papelAtual && (
            <div className="papel-selecionado-info">
              <span className="eyebrow">PERFIL SELECIONADO</span>
              <strong>{papelAtual.nome}</strong>
              <small>{papelAtual.descricao || papelAtual.codigo}</small>
              {papelAtual.sistema && (
                <span className="selo-sistema">Papel do sistema</span>
              )}
            </div>
          )}
        </aside>

        <div className="painel-permissoes">
          <div className="painel-permissoes-header">
            <div>
              <span className="eyebrow">MATRIZ DE ACESSO</span>
              <h2>
                {papelAtual ? `Permissões de ${papelAtual.nome}` : "Permissões"}
              </h2>
              <p>Ative ou desative os recursos disponíveis para este papel.</p>
            </div>
            <div className="progresso-wrap">
              <strong>{progresso}%</strong>
              <span>concedidas</span>
              <div className="progresso-trilho">
                <span style={{ width: `${progresso}%` }} />
              </div>
            </div>
          </div>

          {papelPrincipalProtegido && (
            <div className="aviso-protecao" role="note">
              <span aria-hidden="true">🔒</span>
              <div>
                <strong>Perfil protegido — somente leitura</strong>
                <p>
                  O ADMIN_PRINCIPAL não pode alterar as próprias permissões.
                  Você pode selecionar outro papel para administrar os acessos.
                </p>
              </div>
            </div>
          )}

          <div className="filtros">
            <label className="campo-busca">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Buscar por nome, módulo ou código..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </label>

            <select
              aria-label="Filtrar por módulo"
              value={moduloSelecionado}
              onChange={(event) => setModuloSelecionado(event.target.value)}
            >
              {modulos.map((modulo) => (
                <option value={modulo} key={modulo}>
                  {modulo === "todos" ? "Todos os módulos" : nomeModulo(modulo)}
                </option>
              ))}
            </select>
          </div>

          {carregandoPapel ? (
            <div className="estado-central">
              <span className="spinner" />
              Carregando permissões do papel...
            </div>
          ) : !papelAtual ? (
            <div className="estado-central">
              Selecione um papel para começar.
            </div>
          ) : Object.keys(grupos).length === 0 ? (
            <div className="estado-central">
              Nenhuma permissão corresponde à sua pesquisa.
            </div>
          ) : (
            <div className="grupos-permissoes">
              {Object.entries(grupos).map(([modulo, itens]) => {
                const concedidas = itens.filter((item) =>
                  permissoesDoPapel.includes(item.id),
                ).length;

                return (
                  <section className="grupo-modulo" key={modulo}>
                    <header className="grupo-modulo-header">
                      <div>
                        <span className="modulo-indicador" />
                        <h3>{nomeModulo(modulo)}</h3>
                      </div>
                      <span className="contador-grupo">
                        {concedidas}/{itens.length} ativas
                      </span>
                    </header>

                    <div className="lista-permissoes">
                      {itens.map((permissao) => {
                        const ativa = permissoesDoPapel.includes(permissao.id);
                        const ocupada = alterando === permissao.id;
                        const protegida = papelPrincipalProtegido;

                        return (
                          <article
                            className={`permissao-item ${
                              ativa ? "permissao-item-ativa" : ""
                            }`}
                            key={permissao.id}
                          >
                            <div className="permissao-detalhe">
                              <strong>{permissao.nome}</strong>
                              <code>{permissao.codigo}</code>
                              {permissao.descricao && (
                                <p>{permissao.descricao}</p>
                              )}
                            </div>

                            <label
                              className={`switch ${
                                ocupada || protegida ? "switch-bloqueado" : ""
                              }`}
                              title={
                                protegida
                                  ? "O perfil ADMIN_PRINCIPAL é somente leitura"
                                  : ativa
                                    ? "Remover permissão"
                                    : "Conceder permissão"
                              }
                            >
                              <input
                                type="checkbox"
                                checked={ativa}
                                disabled={
                                  ocupada ||
                                  protegida ||
                                  alterando !== null ||
                                  papelPrincipalProtegido
                                }
                                onChange={() =>
                                  void alternarPermissao(permissao)
                                }
                              />
                              <span className="switch-trilho" />
                            </label>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <footer className="rodape-painel">
            <span>
              As alterações são aplicadas ao papel selecionado e afetam os
              usuários vinculados a ele.
            </span>
            <span className="status-salvamento">
              <i />
              Salvamento automático
            </span>
          </footer>
        </div>
      </section>

      <style jsx>{`
        .permissoes-page {
          width: 100%;
          min-height: 100%;
          padding: 30px clamp(16px, 3.5vw, 46px) 48px;
          color: #f5edf2;
          background: transparent;
          box-sizing: border-box;
        }

        .pagina-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 27px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          margin-bottom: 14px;
          color: #d78caf;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.2px;
        }

        .breadcrumb-ponto {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e58db8;
          box-shadow: 0 0 12px rgba(229, 141, 184, 0.5);
        }

        .separador {
          color: #766572;
        }

        .pagina-header h1 {
          margin: 0 0 8px;
          color: #fff7fb;
          font-size: clamp(26px, 3vw, 35px);
          font-weight: 750;
          letter-spacing: -1.1px;
        }

        .pagina-header p {
          max-width: 680px;
          margin: 0;
          color: #b9aab5;
          font-size: 13px;
          line-height: 1.65;
        }

        .botao-atualizar {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          min-height: 39px;
          padding: 0 14px;
          color: #f8eaf1;
          background: rgba(42, 29, 41, 0.78);
          border: 1px solid #624457;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          transition: 160ms ease;
        }

        .botao-atualizar:hover:not(:disabled) {
          border-color: #bd789c;
          background: rgba(68, 42, 61, 0.8);
        }

        .botao-atualizar:disabled {
          opacity: 0.55;
          cursor: wait;
        }
        .botao-atualizar span {
          font-size: 18px;
          line-height: 1;
        }

        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .resumo-card {
          position: relative;
          min-height: 112px;
          padding: 18px 19px;
          overflow: hidden;
          background: rgba(31, 23, 31, 0.7);
          border: 1px solid #493344;
          border-radius: 12px;
        }

        .resumo-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 19px;
          width: 38px;
          height: 2px;
          background: #d78caf;
          border-radius: 0 0 3px 3px;
        }

        .resumo-rotulo,
        .resumo-descricao {
          display: block;
        }
        .resumo-rotulo {
          color: #bdaeba;
          font-size: 11px;
        }
        .resumo-card strong {
          display: block;
          margin: 8px 0 4px;
          color: #fff7fb;
          font-size: 27px;
          line-height: 1.1;
        }
        .resumo-descricao {
          color: #8f7e8b;
          font-size: 10px;
        }
        .resumo-card-destaque {
          border-color: #77506a;
        }

        .mensagem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 17px;
          padding: 12px 15px;
          border: 1px solid;
          border-radius: 9px;
          font-size: 12px;
          line-height: 1.5;
        }
        .mensagem-erro {
          color: #ffc0c8;
          background: rgba(125, 43, 62, 0.18);
          border-color: rgba(209, 104, 126, 0.4);
        }
        .mensagem-sucesso {
          color: #b9e8cf;
          background: rgba(41, 112, 77, 0.16);
          border-color: rgba(91, 177, 128, 0.35);
        }
        .mensagem button {
          color: inherit;
          background: none;
          border: 0;
          font-size: 20px;
          cursor: pointer;
        }

        .gerenciador {
          display: grid;
          grid-template-columns: minmax(230px, 285px) minmax(0, 1fr);
          min-height: 550px;
          overflow: hidden;
          background: rgba(24, 18, 25, 0.62);
          border: 1px solid #493344;
          border-radius: 14px;
        }

        .painel-papeis {
          display: flex;
          flex-direction: column;
          padding: 21px 15px;
          background: rgba(31, 23, 31, 0.55);
          border-right: 1px solid #493344;
        }

        .painel-titulo {
          padding: 0 5px 17px;
        }
        .eyebrow {
          color: #d78caf;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.2px;
        }
        .painel-titulo h2,
        .painel-permissoes-header h2 {
          margin: 6px 0 5px;
          color: #fff5fa;
          font-size: 17px;
          font-weight: 700;
        }
        .painel-titulo p,
        .painel-permissoes-header p {
          margin: 0;
          color: #a998a5;
          font-size: 11px;
          line-height: 1.6;
        }

        .lista-papeis {
          display: grid;
          gap: 7px;
        }
        .papel-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          min-width: 0;
          padding: 11px 9px;
          text-align: left;
          color: #d7c8d2;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 9px;
          cursor: pointer;
          transition: 150ms ease;
        }
        .papel-item:hover {
          background: rgba(190, 103, 151, 0.07);
          border-color: rgba(190, 103, 151, 0.2);
        }
        .papel-item-ativo {
          color: #fff4fa;
          background: rgba(190, 103, 151, 0.13);
          border-color: rgba(213, 133, 175, 0.38);
        }
        .papel-avatar {
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          color: #e5a0c0;
          background: rgba(190, 103, 151, 0.12);
          border: 1px solid rgba(213, 133, 175, 0.22);
          border-radius: 9px;
          font-size: 17px;
        }
        .papel-info {
          display: grid;
          min-width: 0;
          gap: 4px;
          flex: 1;
        }
        .papel-info strong {
          overflow: hidden;
          color: inherit;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .papel-info small {
          overflow: hidden;
          color: #927f8d;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .papel-seta {
          color: #a87994;
          font-size: 21px;
        }
        .papel-selecionado-info {
          display: grid;
          gap: 7px;
          margin-top: auto;
          padding: 15px 10px 0;
          border-top: 1px solid #493344;
        }
        .papel-selecionado-info strong {
          color: #f9edf4;
          font-size: 12px;
        }
        .papel-selecionado-info small {
          color: #a998a5;
          font-size: 10px;
          line-height: 1.5;
        }
        .selo-sistema {
          justify-self: start;
          padding: 4px 7px;
          color: #e5a0c0;
          background: rgba(190, 103, 151, 0.12);
          border-radius: 5px;
          font-size: 9px;
        }

        .painel-permissoes {
          min-width: 0;
          padding: 22px;
        }
        .painel-permissoes-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 18px;
          border-bottom: 1px solid #3d2d3a;
        }
        .progresso-wrap {
          display: grid;
          grid-template-columns: auto auto;
          align-items: baseline;
          gap: 0 6px;
          min-width: 95px;
          text-align: right;
        }
        .progresso-wrap strong {
          color: #e8a1c2;
          font-size: 21px;
        }
        .progresso-wrap > span {
          color: #9d8a98;
          font-size: 9px;
        }
        .progresso-trilho {
          grid-column: 1 / -1;
          height: 4px;
          margin-top: 7px;
          overflow: hidden;
          background: #382a36;
          border-radius: 10px;
        }
        .progresso-trilho span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #a64f7d, #e49cbd);
          border-radius: inherit;
          transition: width 200ms ease;
        }

        .aviso-protecao {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin: 16px 0 0;
          padding: 13px 14px;
          color: #f2d8a7;
          background: rgba(133, 93, 35, 0.14);
          border: 1px solid rgba(199, 153, 82, 0.38);
          border-radius: 9px;
          font-size: 11px;
          line-height: 1.55;
        }
        .aviso-protecao > span {
          font-size: 16px;
        }
        .aviso-protecao strong {
          display: block;
          margin-bottom: 3px;
        }
        .aviso-protecao p {
          margin: 0;
          color: #c7b18d;
        }

        .filtros {
          display: flex;
          gap: 10px;
          margin: 17px 0;
        }
        .campo-busca {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          gap: 9px;
          padding: 0 12px;
          background: rgba(13, 10, 15, 0.65);
          border: 1px solid #4c3948;
          border-radius: 8px;
        }
        .campo-busca span {
          color: #d78caf;
          font-size: 19px;
        }
        .campo-busca input {
          width: 100%;
          min-width: 0;
          height: 39px;
          color: #f8eff5;
          background: transparent;
          border: 0;
          outline: 0;
          font-size: 11px;
        }
        .campo-busca input::placeholder {
          color: #82727f;
        }
        .filtros select {
          max-width: 190px;
          min-width: 140px;
          padding: 0 10px;
          color: #d9cbd5;
          background: #211923;
          border: 1px solid #4c3948;
          border-radius: 8px;
          font-size: 10px;
          outline: 0;
        }

        .grupos-permissoes {
          display: grid;
          gap: 15px;
        }
        .grupo-modulo {
          overflow: hidden;
          border: 1px solid #453342;
          border-radius: 10px;
          background: rgba(31, 23, 31, 0.43);
        }
        .grupo-modulo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(190, 103, 151, 0.055);
          border-bottom: 1px solid #453342;
        }
        .grupo-modulo-header > div {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .modulo-indicador {
          width: 6px;
          height: 6px;
          background: #d78caf;
          border-radius: 50%;
        }
        .grupo-modulo-header h3 {
          margin: 0;
          color: #f2e5ed;
          font-size: 11px;
          font-weight: 700;
        }
        .contador-grupo {
          color: #a895a3;
          font-size: 9px;
        }
        .lista-permissoes {
          display: grid;
        }
        .permissao-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 13px 14px;
          border-bottom: 1px solid rgba(73, 51, 68, 0.58);
          transition: background 150ms ease;
        }
        .permissao-item:last-child {
          border-bottom: 0;
        }
        .permissao-item:hover {
          background: rgba(190, 103, 151, 0.045);
        }
        .permissao-item-ativa {
          background: rgba(190, 103, 151, 0.035);
        }
        .permissao-detalhe {
          display: grid;
          min-width: 0;
          gap: 4px;
        }
        .permissao-detalhe strong {
          color: #e9dce5;
          font-size: 11px;
          font-weight: 650;
        }
        .permissao-detalhe code {
          color: #a98b9e;
          font-size: 9px;
          overflow-wrap: anywhere;
        }
        .permissao-detalhe p {
          margin: 2px 0 0;
          color: #948391;
          font-size: 10px;
          line-height: 1.5;
        }

        .switch {
          position: relative;
          flex: 0 0 39px;
          width: 39px;
          height: 22px;
        }
        .switch input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
        }
        .switch-trilho {
          position: absolute;
          inset: 0;
          background: #493a47;
          border: 1px solid #66505f;
          border-radius: 20px;
          cursor: pointer;
          transition: 160ms ease;
        }
        .switch-trilho::before {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          background: #c7b7c2;
          border-radius: 50%;
          transition: 160ms ease;
        }
        .switch input:checked + .switch-trilho {
          background: #9d4e78;
          border-color: #cf82a7;
        }
        .switch input:checked + .switch-trilho::before {
          background: #fff4fa;
          transform: translateX(17px);
        }
        .switch input:focus-visible + .switch-trilho {
          outline: 2px solid #f0a9cb;
          outline-offset: 3px;
        }
        .switch-bloqueado {
          opacity: 0.55;
        }
        .switch-bloqueado .switch-trilho {
          cursor: not-allowed;
        }

        .estado-vazio {
          padding: 15px 7px;
          color: #9d8b98;
          font-size: 11px;
        }
        .estado-central {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 190px;
          color: #a998a5;
          font-size: 12px;
          text-align: center;
        }
        .spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(226, 139, 183, 0.2);
          border-top-color: #e28bb7;
          border-radius: 50%;
          animation: girar 0.8s linear infinite;
        }
        @keyframes girar {
          to {
            transform: rotate(360deg);
          }
        }

        .rodape-painel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #3d2d3a;
          color: #8f7e8b;
          font-size: 9px;
          line-height: 1.5;
        }
        .status-salvamento {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          gap: 6px;
          color: #a9cbb6;
        }
        .status-salvamento i {
          width: 6px;
          height: 6px;
          background: #76bd91;
          border-radius: 50%;
        }

        @media (max-width: 900px) {
          .gerenciador {
            grid-template-columns: 220px minmax(0, 1fr);
          }
          .painel-permissoes {
            padding: 17px;
          }
        }
        @media (max-width: 700px) {
          .pagina-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .resumo-grid {
            grid-template-columns: 1fr 1fr;
          }
          .resumo-card:last-child {
            grid-column: 1 / -1;
          }
          .gerenciador {
            grid-template-columns: 1fr;
          }
          .painel-papeis {
            border-right: 0;
            border-bottom: 1px solid #493344;
          }
          .lista-papeis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .papel-selecionado-info {
            margin-top: 17px;
          }
        }
        @media (max-width: 480px) {
          .permissoes-page {
            padding: 21px 13px 32px;
          }
          .resumo-grid {
            gap: 9px;
          }
          .resumo-card {
            min-height: 100px;
            padding: 14px;
          }
          .painel-permissoes {
            padding: 14px 11px;
          }
          .filtros {
            flex-direction: column;
          }
          .filtros select {
            max-width: none;
            min-height: 38px;
          }
          .painel-permissoes-header {
            flex-direction: column;
          }
          .progresso-wrap {
            text-align: left;
          }
          .progresso-trilho {
            width: 150px;
          }
          .lista-papeis {
            grid-template-columns: 1fr;
          }
          .rodape-painel {
            align-items: flex-start;
            flex-direction: column;
          }
          .permissao-item {
            gap: 10px;
            padding: 12px 10px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
