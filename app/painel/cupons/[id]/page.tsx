"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import ROTAS from "@/app/constants/rotas";
import { Icone } from "@/components/Icons/Icones";

type Cupom = {
  id_cupom?: number;
  codigo: string;
  tipo: "percentual" | "fixo" | string;
  valor: number | string;
  valor_minimo?: number | string | null;
  limite_usos?: number | null;
  limite_usos_cliente?: number | null;
  inicio_em?: string | null;
  termina_em?: string | null;
  ativo?: boolean | number | string;
  status_id?: number;
};

type Aba = "geral" | "produtos" | "categorias" | "usos";

const API = () => process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

function estaAtivo(valor: Cupom["ativo"]): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  if (typeof valor === "string")
    return ["1", "true", "ativo"].includes(valor.toLowerCase());
  return false;
}

function dataInput(valor?: string | null): string {
  if (!valor) return "";
  const normalizada = valor.includes("T") ? valor : valor.replace(" ", "T");
  return normalizada.slice(0, 16);
}

function formatarData(valor?: string | null): string {
  if (!valor) return "Não definida";
  const data = new Date(valor.includes("T") ? valor : valor.replace(" ", "T"));
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function dinheiro(valor?: number | string | null): string {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero)
    ? numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
}

function extrairLista(valor: any): any[] {
  if (Array.isArray(valor)) return valor;
  if (Array.isArray(valor?.dados)) return valor.dados;
  if (Array.isArray(valor?.data)) return valor.data;
  return [];
}

export default function GerenciarCupomPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");

  const [cupom, setCupom] = useState<Cupom | null>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [usos, setUsos] = useState<any[]>([]);
  const [aba, setAba] = useState<Aba>("geral");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [desativando, setDesativando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [idsProdutos, setIdsProdutos] = useState("[]");
  const [idsCategorias, setIdsCategorias] = useState("[]");
  const [form, setForm] = useState({
    codigo: "",
    tipo: "percentual",
    valor: "",
    valor_minimo: "0",
    limite_usos: "",
    limite_usos_cliente: "1",
    inicio_em: "",
    termina_em: "",
    ativo: true,
  });

  const requisicao = useCallback(
    async (caminho: string, opcoes: RequestInit = {}) => {
      const base = API();
      if (!base)
        throw new Error("Configure NEXT_PUBLIC_API_URL no .env.local.");

      const resposta = await fetch(`${base}${caminho}`, {
        ...opcoes,
        headers: {
          Accept: "application/json",
          ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
          ...opcoes.headers,
        },
        credentials: "include",
        cache: "no-store",
      });

      const texto = await resposta.text();
      let dados: any = null;
      if (texto.trim()) {
        try {
          dados = JSON.parse(texto);
        } catch {
          throw new Error("A API retornou uma resposta que não é JSON válido.");
        }
      }

      if (!resposta.ok || dados?.sucesso === false) {
        throw new Error(
          dados?.mensagem ||
            dados?.message ||
            `Falha na requisição (HTTP ${resposta.status}).`,
        );
      }
      return dados;
    },
    [],
  );

  const carregar = useCallback(async () => {
    if (!id || !/^\d+$/.test(id)) {
      setErro("Identificador do cupom inválido.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");
    try {
      const resposta = await requisicao(`/painel/cupons/${id}`);
      const registro =
        resposta?.dados?.dados ??
        resposta?.dados ??
        resposta?.data?.dados ??
        null;

      if (
        !registro ||
        typeof registro !== "object" ||
        Array.isArray(registro)
      ) {
        throw new Error("A API não retornou os dados do cupom.");
      }

      setCupom(registro);
      setProdutos(
        extrairLista(resposta?.produtos ?? resposta?.dados?.produtos),
      );
      setCategorias(
        extrairLista(resposta?.categorias ?? resposta?.dados?.categorias),
      );
      setUsos(extrairLista(resposta?.usos ?? resposta?.dados?.usos));

      setForm({
        codigo: String(registro.codigo ?? ""),
        tipo: String(registro.tipo ?? "percentual"),
        valor: String(registro.valor ?? ""),
        valor_minimo: String(registro.valor_minimo ?? "0"),
        limite_usos:
          registro.limite_usos == null ? "" : String(registro.limite_usos),
        limite_usos_cliente:
          registro.limite_usos_cliente == null
            ? ""
            : String(registro.limite_usos_cliente),
        inicio_em: dataInput(registro.inicio_em),
        termina_em: dataInput(registro.termina_em),
        ativo: estaAtivo(registro.ativo),
      });

      setIdsProdutos(
        JSON.stringify(
          extrairLista(resposta?.produtos ?? resposta?.dados?.produtos)
            .map((item) =>
              Number(item?.id_produto ?? item?.produto_id ?? item?.id ?? item),
            )
            .filter(Number.isInteger),
          null,
          2,
        ),
      );
      setIdsCategorias(
        JSON.stringify(
          extrairLista(resposta?.categorias ?? resposta?.dados?.categorias)
            .map((item) =>
              Number(
                item?.id_categoria ?? item?.categoria_id ?? item?.id ?? item,
              ),
            )
            .filter(Number.isInteger),
          null,
          2,
        ),
      );
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível carregar o cupom.",
      );
    } finally {
      setCarregando(false);
    }
  }, [id, requisicao]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const ativo = cupom ? estaAtivo(cupom.ativo) : false;
  const desconto = useMemo(() => {
    if (!cupom) return "—";
    return cupom.tipo === "percentual"
      ? `${Number(cupom.valor).toLocaleString("pt-BR")}%`
      : dinheiro(cupom.valor);
  }, [cupom]);

  async function salvarCupom(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");

    const valor = Number(form.valor);
    const minimo = Number(form.valor_minimo || 0);
    const limiteTotal =
      form.limite_usos === "" ? null : Number(form.limite_usos);
    const limiteCliente =
      form.limite_usos_cliente === "" ? null : Number(form.limite_usos_cliente);

    if (!form.codigo.trim()) return setErro("Informe o código do cupom.");
    if (!Number.isFinite(valor) || valor <= 0)
      return setErro("Informe um desconto válido.");
    if (form.tipo === "percentual" && valor > 100) {
      return setErro("O desconto percentual não pode ultrapassar 100%.");
    }
    if (!Number.isFinite(minimo) || minimo < 0)
      return setErro("Valor mínimo inválido.");
    if (
      (limiteTotal !== null &&
        (!Number.isInteger(limiteTotal) || limiteTotal < 1)) ||
      (limiteCliente !== null &&
        (!Number.isInteger(limiteCliente) || limiteCliente < 1))
    ) {
      return setErro("Os limites devem ser números inteiros maiores que zero.");
    }
    if (form.inicio_em && form.termina_em && form.inicio_em > form.termina_em) {
      return setErro("A data inicial não pode ser posterior à data final.");
    }

    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      tipo: form.tipo,
      valor: valor.toFixed(2),
      valor_minimo: minimo.toFixed(2),
      limite_usos: limiteTotal,
      limite_usos_cliente: limiteCliente,
      inicio_em: form.inicio_em
        ? `${form.inicio_em.replace("T", " ")}:00`
        : null,
      termina_em: form.termina_em
        ? `${form.termina_em.replace("T", " ")}:00`
        : null,
      ativo: form.ativo,
    };

    setSalvando(true);
    try {
      await requisicao(`/painel/cupons/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSucesso("Cupom atualizado com sucesso.");
      await carregar();
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível atualizar o cupom.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function salvarVinculos(tipo: "produtos" | "categorias") {
    setErro("");
    setSucesso("");
    const texto = tipo === "produtos" ? idsProdutos : idsCategorias;

    let lista: unknown;
    try {
      lista = JSON.parse(texto);
    } catch {
      setErro(`O JSON de ${tipo} está inválido.`);
      return;
    }
    if (
      !Array.isArray(lista) ||
      !lista.every((item) => Number.isInteger(Number(item)) && Number(item) > 0)
    ) {
      setErro(
        `Informe um array JSON com IDs numéricos positivos para ${tipo}.`,
      );
      return;
    }

    setSalvando(true);
    try {
      await requisicao(`/painel/cupons/${id}/${tipo}`, {
        method: "PUT",
        body: JSON.stringify(
          tipo === "produtos"
            ? { produto_ids: lista.map(Number) }
            : { categoria_ids: lista.map(Number) },
        ),
      });
      setSucesso(
        tipo === "produtos"
          ? "Produtos vinculados ao cupom atualizados."
          : "Categorias vinculadas ao cupom atualizadas.",
      );
      await carregar();
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível salvar os vínculos.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function desativarCupom() {
    if (!window.confirm("Deseja realmente desativar este cupom?")) return;
    setErro("");
    setSucesso("");
    setDesativando(true);
    try {
      await requisicao(`/painel/cupons/${id}/desativar`, { method: "PUT" });
      setSucesso("Cupom desativado com sucesso.");
      await carregar();
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível desativar o cupom.",
      );
    } finally {
      setDesativando(false);
    }
  }

  return (
    <main className="coupon-detail-page">
      <header className="detail-header">
        <div>
          <nav className="breadcrumb">
            <Link href={ROTAS.PAINEL.INICIO}>Painel</Link>
            <Icone nome="chevron-right" tamanho={13} />
            <Link href={ROTAS.PAGINAS.PAINEL.CUPONS.LISTAR}>Cupons</Link>
            <Icone nome="chevron-right" tamanho={13} />
            <span>Gerenciar #{id}</span>
          </nav>
          <div className="heading-row">
            <span className="heading-icon">
              <Icone nome="ticket" tamanho={24} />
            </span>
            <div>
              <h1>
                {cupom?.codigo ||
                  (carregando ? "Carregando cupom..." : "Gerenciar cupom")}
              </h1>
              <p>
                Gerencie as informações, regras, produtos, categorias e
                utilizações desta campanha.
              </p>
            </div>
          </div>
        </div>
        <Link className="back-button" href={ROTAS.PAGINAS.PAINEL.CUPONS.LISTAR}>
          <Icone nome="arrow-left" tamanho={16} /> Voltar para cupons
        </Link>
      </header>

      {erro && (
        <div className="feedback feedback-error" role="alert">
          <Icone nome="alert-circle" tamanho={18} />
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="feedback feedback-success" role="status">
          <Icone nome="check-circle" tamanho={18} />
          {sucesso}
        </div>
      )}

      {carregando ? (
        <div className="loading-card">
          <Icone nome="loader-circle" tamanho={22} /> Carregando informações do
          cupom...
        </div>
      ) : !cupom ? (
        <div className="loading-card empty">
          <Icone nome="ticket" tamanho={25} />
          <strong>Cupom não encontrado</strong>
          <Link href={ROTAS.PAGINAS.PAINEL.CUPONS.LISTAR}>
            Voltar para listagem
          </Link>
        </div>
      ) : (
        <>
          <section className="summary-card">
            <div className="summary-main">
              <span className="summary-ticket">
                <Icone nome="ticket" tamanho={23} />
              </span>
              <div>
                <span className="summary-label">CÓDIGO PROMOCIONAL</span>
                <strong>{cupom.codigo}</strong>
                <small>Identificador #{cupom.id_cupom ?? id}</small>
              </div>
            </div>
            <div className="summary-stat">
              <small>Desconto</small>
              <strong>{desconto}</strong>
            </div>
            <div className="summary-stat">
              <small>Pedido mínimo</small>
              <strong>{dinheiro(cupom.valor_minimo)}</strong>
            </div>
            <span
              className={`status-pill ${ativo ? "is-active" : "is-inactive"}`}
            >
              <span />
              {ativo ? "Ativo" : "Inativo"}
            </span>
          </section>

          <nav className="tabs" aria-label="Seções do cupom">
            {(
              [
                ["geral", "Ajustes gerais", "settings-2"],
                ["produtos", "Produtos", "package"],
                ["categorias", "Categorias", "tags"],
                ["usos", "Histórico de uso", "history"],
              ] as const
            ).map(([valor, titulo, icone]) => (
              <button
                key={valor}
                type="button"
                className={aba === valor ? "tab active" : "tab"}
                onClick={() => setAba(valor)}
              >
                <Icone nome={icone} tamanho={17} />
                {titulo}
                {valor === "produtos" && (
                  <span className="tab-count">{produtos.length}</span>
                )}
                {valor === "categorias" && (
                  <span className="tab-count">{categorias.length}</span>
                )}
                {valor === "usos" && (
                  <span className="tab-count">{usos.length}</span>
                )}
              </button>
            ))}
          </nav>

          {aba === "geral" && (
            <section className="content-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">CONFIGURAÇÃO</span>
                  <h2>Informações do cupom</h2>
                  <p>Altere o desconto, os limites e o período de validade.</p>
                </div>
              </div>
              <form onSubmit={salvarCupom}>
                <div className="form-grid">
                  <label className="field">
                    <span>Código do cupom</span>
                    <input
                      value={form.codigo}
                      maxLength={50}
                      onChange={(e) =>
                        setForm((v) => ({
                          ...v,
                          codigo: e.target.value
                            .toUpperCase()
                            .replace(/\s/g, ""),
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Tipo de desconto</span>
                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        setForm((v) => ({ ...v, tipo: e.target.value }))
                      }
                    >
                      <option value="percentual">Percentual (%)</option>
                      <option value="fixo">Valor fixo (R$)</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Valor do desconto</span>
                    <div className="input-suffix">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={form.tipo === "percentual" ? 100 : undefined}
                        value={form.valor}
                        onChange={(e) =>
                          setForm((v) => ({ ...v, valor: e.target.value }))
                        }
                        required
                      />
                      <b>{form.tipo === "percentual" ? "%" : "R$"}</b>
                    </div>
                  </label>
                  <label className="field">
                    <span>Valor mínimo do pedido</span>
                    <div className="input-suffix">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.valor_minimo}
                        onChange={(e) =>
                          setForm((v) => ({
                            ...v,
                            valor_minimo: e.target.value,
                          }))
                        }
                      />
                      <b>R$</b>
                    </div>
                  </label>
                  <label className="field">
                    <span>Limite total de utilizações</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.limite_usos}
                      placeholder="Ilimitado"
                      onChange={(e) =>
                        setForm((v) => ({ ...v, limite_usos: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Limite por cliente</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.limite_usos_cliente}
                      placeholder="Sem limite"
                      onChange={(e) =>
                        setForm((v) => ({
                          ...v,
                          limite_usos_cliente: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Início da validade</span>
                    <input
                      type="datetime-local"
                      value={form.inicio_em}
                      onChange={(e) =>
                        setForm((v) => ({ ...v, inicio_em: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Término da validade</span>
                    <input
                      type="datetime-local"
                      value={form.termina_em}
                      onChange={(e) =>
                        setForm((v) => ({ ...v, termina_em: e.target.value }))
                      }
                    />
                  </label>
                </div>
                <label className="active-toggle">
                  <span>
                    <strong>Cupom ativo</strong>
                    <small>
                      Quando desativado, o cupom deixa de estar disponível para
                      utilização.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, ativo: e.target.checked }))
                    }
                  />
                  <i />
                </label>
                <div className="form-actions">
                  {ativo && (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => void desativarCupom()}
                      disabled={desativando}
                    >
                      <Icone nome="ban" tamanho={16} />
                      {desativando ? "Desativando..." : "Desativar cupom"}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={salvando}
                  >
                    <Icone
                      nome={salvando ? "loader-circle" : "save"}
                      tamanho={17}
                    />
                    {salvando ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {aba === "produtos" && (
            <section className="content-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">REGRAS DO CUPOM</span>
                  <h2>Produtos permitidos</h2>
                  <p>
                    Informe os IDs dos produtos que poderão utilizar este cupom.
                  </p>
                </div>
                <span className="count-badge">
                  {produtos.length} vinculados
                </span>
              </div>
              <div className="linked-list">
                {produtos.length ? (
                  produtos.map((item, index) => (
                    <div
                      className="linked-item"
                      key={item?.id_produto ?? item?.id ?? index}
                    >
                      <span className="linked-icon">
                        <Icone nome="package" tamanho={17} />
                      </span>
                      <div>
                        <strong>
                          {item?.nome ??
                            item?.nome_produto ??
                            item?.titulo ??
                            `Produto ${item?.id_produto ?? item?.id ?? index + 1}`}
                        </strong>
                        <small>
                          ID:{" "}
                          {item?.id_produto ??
                            item?.produto_id ??
                            item?.id ??
                            "—"}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="subtle-empty">
                    Nenhum produto vinculado a este cupom.
                  </div>
                )}
              </div>
              <label className="field json-field">
                <span>IDs dos produtos (JSON)</span>
                <textarea
                  rows={5}
                  value={idsProdutos}
                  onChange={(e) => setIdsProdutos(e.target.value)}
                  spellCheck={false}
                />
                <small>
                  Envie uma lista JSON de IDs, por exemplo: [12, 18, 25].
                </small>
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void salvarVinculos("produtos")}
                  disabled={salvando}
                >
                  <Icone nome="save" tamanho={17} />
                  Salvar produtos
                </button>
              </div>
            </section>
          )}

          {aba === "categorias" && (
            <section className="content-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">REGRAS DO CUPOM</span>
                  <h2>Categorias permitidas</h2>
                  <p>
                    Informe os IDs das categorias que poderão utilizar este
                    cupom.
                  </p>
                </div>
                <span className="count-badge">
                  {categorias.length} vinculadas
                </span>
              </div>
              <div className="linked-list">
                {categorias.length ? (
                  categorias.map((item, index) => (
                    <div
                      className="linked-item"
                      key={item?.id_categoria ?? item?.id ?? index}
                    >
                      <span className="linked-icon">
                        <Icone nome="tags" tamanho={17} />
                      </span>
                      <div>
                        <strong>
                          {item?.nome ??
                            item?.nome_categoria ??
                            item?.titulo ??
                            `Categoria ${item?.id_categoria ?? item?.id ?? index + 1}`}
                        </strong>
                        <small>
                          ID:{" "}
                          {item?.id_categoria ??
                            item?.categoria_id ??
                            item?.id ??
                            "—"}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="subtle-empty">
                    Nenhuma categoria vinculada a este cupom.
                  </div>
                )}
              </div>
              <label className="field json-field">
                <span>IDs das categorias (JSON)</span>
                <textarea
                  rows={5}
                  value={idsCategorias}
                  onChange={(e) => setIdsCategorias(e.target.value)}
                  spellCheck={false}
                />
                <small>
                  Envie uma lista JSON de IDs, por exemplo: [3, 7, 11].
                </small>
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void salvarVinculos("categorias")}
                  disabled={salvando}
                >
                  <Icone nome="save" tamanho={17} />
                  Salvar categorias
                </button>
              </div>
            </section>
          )}

          {aba === "usos" && (
            <section className="content-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">ACOMPANHAMENTO</span>
                  <h2>Histórico de utilizações</h2>
                  <p>
                    Registros de utilização deste cupom retornados pela API.
                  </p>
                </div>
                <span className="count-badge">{usos.length} registros</span>
              </div>
              {usos.length ? (
                <div className="usage-table-wrap">
                  <table className="usage-table">
                    <thead>
                      <tr>
                        <th>Registro</th>
                        <th>Cliente</th>
                        <th>Desconto aplicado</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usos.map((uso, index) => (
                        <tr key={uso?.id_cupom_uso ?? uso?.id ?? index}>
                          <td>#{uso?.id_cupom_uso ?? uso?.id ?? index + 1}</td>
                          <td>
                            {uso?.cliente_nome ??
                              uso?.nome_cliente ??
                              uso?.cliente_id ??
                              "—"}
                          </td>
                          <td>{dinheiro(uso?.valor_desconto)}</td>
                          <td>
                            {formatarData(
                              uso?.criado_em ??
                                uso?.data_uso ??
                                uso?.created_at,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="subtle-empty">
                  Ainda não há utilizações registradas para este cupom.
                </div>
              )}
            </section>
          )}
        </>
      )}

      <style jsx>{`
        .coupon-detail-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: clamp(20px, 3vw, 36px);
          color: #f7edf3;
        }
        .detail-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8e7c88;
          font-size: 11px;
        }
        .breadcrumb a {
          color: #d99ab8;
          text-decoration: none;
        }
        .heading-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 17px;
        }
        .heading-icon,
        .summary-ticket,
        .linked-icon {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          color: #efa9c6;
          background: rgba(203, 113, 153, 0.13);
          border: 1px solid rgba(224, 147, 180, 0.23);
          border-radius: 12px;
        }
        .heading-icon {
          width: 49px;
          height: 49px;
        }
        h1 {
          margin: 0 0 5px;
          font-size: 27px;
          letter-spacing: -0.6px;
        }
        .heading-row p {
          margin: 0;
          color: #a99aa5;
          font-size: 12px;
          line-height: 1.5;
        }
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 13px;
          border: 1px solid #493744;
          border-radius: 9px;
          color: #ddcbd6;
          background: #251d25;
          text-decoration: none;
          font-size: 11px;
        }
        .back-button:hover {
          border-color: #94617a;
          background: #30232d;
        }
        .feedback {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 15px;
          padding: 12px 14px;
          border: 1px solid;
          border-radius: 9px;
          font-size: 12px;
        }
        .feedback-error {
          color: #ffb4b4;
          background: rgba(180, 50, 50, 0.1);
          border-color: rgba(220, 90, 90, 0.35);
        }
        .feedback-success {
          color: #a8e8bd;
          background: rgba(50, 150, 90, 0.1);
          border-color: rgba(80, 190, 120, 0.3);
        }
        .loading-card {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 180px;
          border: 1px solid #493744;
          border-radius: 14px;
          color: #b9a7b3;
          background: #211922;
          font-size: 12px;
        }
        .loading-card.empty {
          flex-direction: column;
        }
        .loading-card a {
          color: #e5a8c4;
        }
        .summary-card {
          display: flex;
          align-items: center;
          gap: 30px;
          margin-bottom: 17px;
          padding: 20px 23px;
          border: 1px solid rgba(213, 139, 171, 0.38);
          border-radius: 14px;
          background: linear-gradient(
            110deg,
            rgba(67, 39, 55, 0.96),
            rgba(31, 23, 32, 0.98)
          );
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.13);
        }
        .summary-main {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 220px;
          margin-right: auto;
        }
        .summary-ticket {
          width: 46px;
          height: 46px;
        }
        .summary-main div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .summary-label,
        .eyebrow {
          color: #d88eae;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.4px;
        }
        .summary-main strong {
          color: #fff3f8;
          font-size: 17px;
        }
        .summary-main small {
          color: #a994a2;
          font-size: 10px;
        }
        .summary-stat {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .summary-stat small {
          color: #a994a2;
          font-size: 10px;
        }
        .summary-stat strong {
          color: #f5dce8;
          font-size: 14px;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }
        .status-pill span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .is-active {
          color: #a8e8bd;
          background: rgba(50, 150, 90, 0.13);
        }
        .is-inactive {
          color: #d0a6a6;
          background: rgba(180, 70, 70, 0.12);
        }
        .tabs {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          margin-bottom: 14px;
          padding: 5px;
          border: 1px solid #493744;
          border-radius: 12px;
          background: #211922;
        }
        .tab {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 15px;
          border: 0;
          border-radius: 8px;
          color: #a997a3;
          background: transparent;
          font-size: 11px;
          white-space: nowrap;
          cursor: pointer;
          transition: 0.2s;
        }
        .tab:hover {
          color: #f4dce8;
          background: rgba(255, 255, 255, 0.03);
        }
        .tab.active {
          color: #fff;
          background: linear-gradient(135deg, #a96080, #82445f);
          box-shadow: inset 0 1px rgba(255, 255, 255, 0.13);
        }
        .tab-count {
          display: grid;
          place-items: center;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 10px;
          color: inherit;
          background: rgba(0, 0, 0, 0.18);
          font-size: 9px;
        }
        .content-card {
          padding: 23px;
          border: 1px solid #493744;
          border-radius: 15px;
          background: linear-gradient(145deg, #251d25, #1d171e);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
        }
        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 22px;
        }
        .section-heading h2 {
          margin: 5px 0;
          color: #f5eaf0;
          font-size: 17px;
        }
        .section-heading p {
          margin: 0;
          color: #a99ba5;
          font-size: 11px;
        }
        .count-badge {
          padding: 7px 10px;
          border: 1px solid #604456;
          border-radius: 20px;
          color: #dfa9c1;
          background: rgba(203, 113, 153, 0.08);
          font-size: 10px;
          white-space: nowrap;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 19px 22px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .field > span {
          color: #e9dce4;
          font-size: 11px;
          font-weight: 650;
        }
        .field input,
        .field select,
        .field textarea {
          width: 100%;
          min-width: 0;
          min-height: 43px;
          padding: 0 12px;
          border: 1px solid #51404c;
          border-radius: 9px;
          outline: 0;
          color: #f5edf2;
          background: #191419;
          font: inherit;
          font-size: 12px;
          box-sizing: border-box;
          color-scheme: dark;
        }
        .field textarea {
          padding: 12px;
          resize: vertical;
          font-family: ui-monospace, SFMono-Regular, monospace;
          line-height: 1.6;
        }
        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #bd7898;
          box-shadow: 0 0 0 3px rgba(217, 140, 175, 0.09);
        }
        .input-suffix {
          position: relative;
        }
        .input-suffix input {
          padding-right: 48px;
        }
        .input-suffix b {
          position: absolute;
          top: 50%;
          right: 13px;
          transform: translateY(-50%);
          color: #c6a9b9;
          font-size: 11px;
        }
        .active-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 23px;
          padding: 15px;
          border: 1px solid #493744;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.018);
          cursor: pointer;
        }
        .active-toggle span {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .active-toggle strong {
          color: #eee1e9;
          font-size: 11px;
        }
        .active-toggle small,
        .json-field small {
          color: #a99ba5;
          font-size: 10px;
        }
        .active-toggle input {
          width: 17px;
          height: 17px;
          accent-color: #bd6e91;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
        }
        .primary-button,
        .danger-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 41px;
          padding: 0 15px;
          border: 1px solid transparent;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s;
        }
        .primary-button {
          color: #fff;
          border-color: #d58bab;
          background: linear-gradient(135deg, #bd6e91, #96506f);
        }
        .primary-button:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .danger-button {
          margin-right: auto;
          color: #f0aaaa;
          border-color: rgba(204, 103, 103, 0.35);
          background: rgba(160, 55, 55, 0.1);
        }
        .danger-button:hover {
          background: rgba(160, 55, 55, 0.2);
        }
        .primary-button:disabled,
        .danger-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .linked-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
          margin-bottom: 20px;
        }
        .linked-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          border: 1px solid #493744;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.018);
        }
        .linked-icon {
          width: 35px;
          height: 35px;
        }
        .linked-item div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .linked-item strong {
          color: #eee1e9;
          font-size: 11px;
        }
        .linked-item small {
          color: #a99ba5;
          font-size: 9px;
        }
        .subtle-empty {
          padding: 25px 15px;
          border: 1px dashed #604456;
          border-radius: 10px;
          color: #a99ba5;
          text-align: center;
          font-size: 11px;
        }
        .json-field {
          margin-top: 18px;
        }
        .json-field textarea {
          margin-top: 1px;
        }
        .usage-table-wrap {
          overflow-x: auto;
        }
        .usage-table {
          width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .usage-table th {
          padding: 12px;
          text-align: left;
          color: #a995a2;
          background: rgba(17, 13, 18, 0.35);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }
        .usage-table td {
          padding: 13px 12px;
          border-top: 1px solid rgba(77, 57, 71, 0.55);
          color: #e9dce4;
          font-size: 11px;
        }
        @media (max-width: 800px) {
          .detail-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .summary-card {
            flex-wrap: wrap;
            gap: 18px;
          }
          .summary-main {
            width: 100%;
          }
          .summary-stat {
            flex: 1;
          }
          .form-grid,
          .linked-list {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 520px) {
          .coupon-detail-page {
            padding: 18px 13px;
          }
          .heading-row {
            align-items: flex-start;
          }
          .heading-row p {
            max-width: 270px;
          }
          .back-button {
            width: fit-content;
          }
          .summary-card {
            padding: 16px;
          }
          .tabs {
            justify-content: flex-start;
          }
          .tab {
            padding: 0 11px;
          }
          .content-card {
            padding: 17px;
          }
          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }
          .form-actions {
            flex-direction: column-reverse;
          }
          .form-actions button {
            width: 100%;
          }
          .danger-button {
            margin: 0;
          }
        }
      `}</style>
    </main>
  );
}
