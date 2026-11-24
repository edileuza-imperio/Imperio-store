"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import ROTAS from "@/app/constants/rotas";
import { Icone } from "@/components/Icons/Icones";

type Cupom = {
  id_cupom?: number;
  id?: number;
  codigo?: string;
  tipo?: string;
  valor?: number | string;
  valor_minimo?: number | string | null;
  limite_usos?: number | null;
  limite_usos_cliente?: number | null;
  usos?: number;
  total_usos?: number;
  inicio_em?: string | null;
  termina_em?: string | null;
  ativo?: boolean | number | string;
  status_id?: number;
};

type FiltroStatus = "todos" | "ativos" | "inativos";

function extrairCupons(resposta: any): Cupom[] {
  const caminhos = [
    resposta?.dados?.dados,
    resposta?.dados,
    resposta?.data?.dados?.dados,
    resposta?.data?.dados,
    resposta?.cupons,
    resposta,
  ];
  return caminhos.find(Array.isArray) ?? [];
}

function cupomEstaAtivo(cupom: Cupom): boolean {
  if (typeof cupom.ativo === "boolean") return cupom.ativo;
  if (typeof cupom.ativo === "number") return cupom.ativo === 1;
  if (typeof cupom.ativo === "string") {
    return ["1", "true", "ativo"].includes(cupom.ativo.toLowerCase());
  }
  return false;
}

function moeda(valor?: number | string | null): string {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero)) return "—";
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataHora(valor?: string | null): string {
  if (!valor) return "Não definida";
  const data = new Date(valor.includes("T") ? valor : valor.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function ListarCuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  const carregarCupons = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setErro("Configure NEXT_PUBLIC_API_URL no arquivo .env.local.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const resposta = await fetch(
        `${apiUrl.replace(/\/$/, "")}/painel/cupons`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
        },
      );

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
            `Não foi possível carregar os cupons (HTTP ${resposta.status}).`,
        );
      }

      setCupons(extrairCupons(dados));
      setAtualizadoEm(new Date());
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Ocorreu um erro ao carregar os cupons.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarCupons();
  }, [carregarCupons]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return cupons.filter((cupom) => {
      const ativo = cupomEstaAtivo(cupom);
      const statusOk =
        filtro === "todos" ||
        (filtro === "ativos" && ativo) ||
        (filtro === "inativos" && !ativo);
      const buscaOk =
        !termo ||
        String(cupom.codigo ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(termo);
      return statusOk && buscaOk;
    });
  }, [cupons, busca, filtro]);

  const ativos = cupons.filter(cupomEstaAtivo).length;
  const inativos = cupons.length - ativos;

  return (
    <main className="coupon-page">
      <div className="page-glow page-glow-one" />
      <div className="page-glow page-glow-two" />

      <header className="page-header">
        <div className="page-heading">
          <nav className="breadcrumb" aria-label="Caminho de navegação">
            <Link href={ROTAS.PAINEL.INICIO}>Painel</Link>
            <Icone nome="chevron-right" tamanho={13} />
            <span>Cupons</span>
          </nav>
          <div className="title-line">
            <span className="title-icon">
              <Icone nome="tag" tamanho={24} />
            </span>
            <div>
              <h1>Central de cupons</h1>
              <p>
                Crie campanhas, acompanhe descontos e gerencie as regras de
                utilização.
              </p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="button button-quiet"
            onClick={() => void carregarCupons()}
            disabled={carregando}
          >
            <Icone nome="refresh-cw" tamanho={16} />
            Atualizar
          </button>
        </div>
      </header>

      {erro && (
        <div className="alert-error" role="alert">
          <Icone nome="alert-circle" tamanho={18} />
          <span>{erro}</span>
          <button type="button" onClick={() => void carregarCupons()}>
            Tentar novamente
          </button>
        </div>
      )}

      <section className="metrics-grid" aria-label="Resumo dos cupons">
        <article className="metric-card metric-featured">
          <div className="metric-top">
            <span className="metric-icon">
              <Icone nome="tag" tamanho={20} />
            </span>
            <span className="metric-caption">Visão geral</span>
          </div>
          <div className="metric-value">{carregando ? "—" : cupons.length}</div>
          <div className="metric-label">Cupons cadastrados</div>
          <div className="metric-bottom">
            <span className="metric-dot" /> Base promocional da loja
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-icon">
              <Icone nome="check-circle" tamanho={20} />
            </span>
            <span className="metric-caption">Disponíveis</span>
          </div>
          <div className="metric-value">{carregando ? "—" : ativos}</div>
          <div className="metric-label">Cupons ativos</div>
          <div className="metric-bottom">Liberados para utilização</div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span className="metric-icon muted-icon">
              <Icone nome="pause" tamanho={20} />
            </span>
            <span className="metric-caption">Pausados</span>
          </div>
          <div className="metric-value">{carregando ? "—" : inativos}</div>
          <div className="metric-label">Cupons inativos</div>
          <div className="metric-bottom">Indisponíveis para clientes</div>
        </article>
      </section>

      <section className="list-panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Gerenciamento</div>
            <h2>Seus cupons</h2>
            <p>
              {atualizadoEm
                ? `Última atualização às ${atualizadoEm.toLocaleTimeString("pt-BR")}`
                : "Acompanhe os códigos promocionais cadastrados."}
            </p>
          </div>
          <div className="result-counter">{filtrados.length} resultado(s)</div>
        </div>

        <div className="toolbar">
          <label className="search-box">
            <Icone nome="search" tamanho={17} />
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar por código..."
              aria-label="Pesquisar por código do cupom"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
              >
                <Icone nome="x" tamanho={15} />
              </button>
            )}
          </label>

          <div className="filter-group" aria-label="Filtrar cupons">
            {(["todos", "ativos", "inativos"] as FiltroStatus[]).map((item) => (
              <button
                key={item}
                type="button"
                className={filtro === item ? "selected" : ""}
                onClick={() => setFiltro(item)}
              >
                {item === "todos"
                  ? "Todos"
                  : item === "ativos"
                    ? "Ativos"
                    : "Inativos"}
                {item === "todos" && <span>{cupons.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <div className="cards-state">
            <Icone nome="loader-circle" tamanho={22} />
            <span>Carregando seus cupons...</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="cards-state empty-state">
            <span className="empty-icon">
              <Icone nome="tag" tamanho={25} />
            </span>
            <strong>
              {cupons.length === 0
                ? "Sua primeira campanha começa aqui"
                : "Nenhum cupom encontrado"}
            </strong>
            <span>
              {cupons.length === 0
                ? "Crie um cupom promocional para oferecer vantagens aos seus clientes."
                : "Experimente mudar o termo da busca ou o filtro."}
            </span>
          </div>
        ) : (
          <div className="coupon-cards-grid">
            {filtrados.map((cupom, indice) => {
              const ativo = cupomEstaAtivo(cupom);
              const id = cupom.id_cupom ?? cupom.id;
              const desconto =
                cupom.tipo === "percentual"
                  ? `${Number(cupom.valor).toLocaleString("pt-BR")}%`
                  : moeda(cupom.valor);
              const limite =
                cupom.limite_usos == null
                  ? "Ilimitado"
                  : `${cupom.limite_usos} usos`;

              const conteudoCard = (
                <>
                  <div className="coupon-card-top">
                    <span className="coupon-card-icon">
                      <Icone nome="tag" tamanho={19} />
                    </span>
                    <span
                      className={`status-pill ${ativo ? "is-active" : "is-inactive"}`}
                    >
                      <span />
                      {ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="coupon-card-code">
                    <span>CÓDIGO PROMOCIONAL</span>
                    <strong>{cupom.codigo || "Cupom sem código"}</strong>
                    <small>Identificador #{id ?? "—"}</small>
                  </div>

                  <div className="coupon-card-discount">
                    <div>
                      <span>Desconto oferecido</span>
                      <strong>{desconto}</strong>
                      <small>
                        {cupom.tipo === "percentual"
                          ? "Desconto percentual"
                          : "Desconto em valor fixo"}
                      </small>
                    </div>
                    <div className="discount-decoration">
                      <Icone nome="percent" tamanho={25} />
                    </div>
                  </div>

                  <div className="coupon-card-details">
                    <div className="coupon-detail-item">
                      <span className="detail-icon">
                        <Icone nome="shopping-bag" tamanho={15} />
                      </span>
                      <div>
                        <small>Pedido mínimo</small>
                        <strong>{moeda(cupom.valor_minimo)}</strong>
                      </div>
                    </div>
                    <div className="coupon-detail-item">
                      <span className="detail-icon">
                        <Icone nome="users" tamanho={15} />
                      </span>
                      <div>
                        <small>Limite de uso</small>
                        <strong>{limite}</strong>
                        <small>
                          {cupom.limite_usos_cliente == null
                            ? "Sem limite por cliente"
                            : `${cupom.limite_usos_cliente} por cliente`}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="coupon-card-validity">
                    <span className="detail-icon">
                      <Icone nome="calendar" tamanho={15} />
                    </span>
                    <div>
                      <small>Período da campanha</small>
                      <strong>{dataHora(cupom.inicio_em)}</strong>
                      <small>Até {dataHora(cupom.termina_em)}</small>
                    </div>
                  </div>
                </>
              );

              return id ? (
                <Link
                  className="coupon-card"
                  key={id}
                  href={`/painel/cupons/${id}`}
                  aria-label={`Gerenciar cupom ${cupom.codigo ?? id}`}
                  title={`Abrir detalhes do cupom ${cupom.codigo ?? id}`}
                >
                  {conteudoCard}
                </Link>
              ) : (
                <article
                  className="coupon-card"
                  key={`${cupom.codigo}-${indice}`}
                >
                  {conteudoCard}
                </article>
              );
            })}
          </div>
        )}

        <footer className="panel-footer">
          <span>
            Exibindo <strong>{filtrados.length}</strong> de{" "}
            <strong>{cupons.length}</strong> cupons
          </span>
          <span className="secure-note">
            <Icone nome="shield" tamanho={14} /> Universo Império · Painel
            administrativo
          </span>
        </footer>
      </section>

      <section className="management-hint">
        <div className="hint-symbol">
          <Icone nome="layers" tamanho={21} />
        </div>
        <div>
          <strong>Gerencie as regras de cada cupom em um só lugar</strong>
          <p>
            Na página individual do cupom, a ideia é organizar produtos
            permitidos, categorias vinculadas e histórico de utilizações em abas
            separadas.
          </p>
        </div>
        <span className="hint-tag">Detalhes do cupom</span>
      </section>

      <style jsx>{`
        .coupon-page {
          position: relative;
          isolation: isolate;
          width: 100%;
          max-width: 1480px;
          min-height: 100%;
          margin: 0 auto;
          padding: clamp(20px, 3vw, 38px);
          overflow: hidden;
          color: #f8edf3;
        }
        .page-glow {
          position: absolute;
          z-index: -1;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.09;
          pointer-events: none;
        }
        .page-glow-one {
          top: -230px;
          right: 8%;
          background: #d77da5;
        }
        .page-glow-two {
          top: 360px;
          left: -320px;
          background: #9a5576;
        }
        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8e7c88;
          font-size: 12px;
        }
        .breadcrumb a {
          color: #d99ab8;
          text-decoration: none;
        }
        .breadcrumb a:hover {
          color: #f3bfd5;
        }
        .title-line {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 18px;
        }
        .title-icon {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          flex: 0 0 auto;
          border: 1px solid rgba(231, 157, 190, 0.34);
          border-radius: 15px;
          color: #f0a9c7;
          background: linear-gradient(
            145deg,
            rgba(202, 112, 153, 0.23),
            rgba(91, 49, 69, 0.2)
          );
          box-shadow:
            inset 0 1px rgba(255, 255, 255, 0.06),
            0 8px 25px rgba(0, 0, 0, 0.15);
        }
        h1 {
          margin: 0 0 5px;
          font-size: clamp(25px, 2.4vw, 31px);
          line-height: 1.15;
          letter-spacing: -0.7px;
        }
        .page-heading p {
          margin: 0;
          color: #a99aa5;
          font-size: 13px;
          line-height: 1.6;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 43px;
          padding: 0 16px;
          border: 1px solid transparent;
          border-radius: 10px;
          color: #f8edf3;
          font-size: 12px;
          font-weight: 650;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s ease;
        }
        .button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .button-primary {
          border-color: #d58bab;
          background: linear-gradient(135deg, #c77a9c, #99516f);
          box-shadow:
            0 7px 18px rgba(156, 76, 112, 0.22),
            inset 0 1px rgba(255, 255, 255, 0.16);
        }
        .button-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .button-quiet {
          color: #d8c7d1;
          border-color: #493744;
          background: rgba(37, 29, 37, 0.8);
        }
        .button-quiet:hover {
          border-color: #80536a;
          background: #30232d;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .metric-card {
          position: relative;
          min-height: 150px;
          padding: 19px 21px;
          overflow: hidden;
          border: 1px solid #493744;
          border-radius: 15px;
          background: linear-gradient(
            145deg,
            rgba(42, 31, 41, 0.97),
            rgba(27, 21, 28, 0.98)
          );
          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.13),
            inset 0 1px rgba(255, 255, 255, 0.025);
        }
        .metric-card:after {
          content: "";
          position: absolute;
          width: 115px;
          height: 115px;
          right: -40px;
          bottom: -65px;
          border-radius: 50%;
          background: rgba(213, 139, 171, 0.07);
        }
        .metric-featured {
          border-color: rgba(213, 139, 171, 0.46);
          background: linear-gradient(
            130deg,
            rgba(67, 39, 55, 0.96),
            rgba(31, 23, 32, 0.98)
          );
        }
        .metric-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .metric-icon {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border: 1px solid rgba(224, 147, 180, 0.22);
          border-radius: 11px;
          color: #efa9c6;
          background: rgba(203, 113, 153, 0.13);
        }
        .muted-icon {
          color: #c3a6b5;
          background: rgba(170, 140, 157, 0.1);
        }
        .metric-caption {
          color: #a994a2;
          font-size: 11px;
        }
        .metric-value {
          margin-top: 11px;
          color: #fff5fa;
          font-size: 29px;
          font-weight: 750;
          line-height: 1;
          letter-spacing: -0.8px;
        }
        .metric-label {
          margin-top: 5px;
          color: #d9c9d3;
          font-size: 12px;
        }
        .metric-bottom {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 12px;
          color: #93828d;
          font-size: 10px;
        }
        .metric-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8bd6ad;
          box-shadow: 0 0 9px rgba(139, 214, 173, 0.5);
        }
        .list-panel {
          overflow: hidden;
          border: 1px solid #493744;
          border-radius: 16px;
          background: linear-gradient(
            145deg,
            rgba(37, 28, 37, 0.98),
            rgba(25, 20, 26, 0.99)
          );
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
        }
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 22px 24px 19px;
          border-bottom: 1px solid rgba(91, 66, 83, 0.55);
        }
        .eyebrow {
          margin-bottom: 6px;
          color: #d88eae;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.7px;
          text-transform: uppercase;
        }
        .panel-header h2 {
          margin: 0 0 5px;
          color: #f8edf3;
          font-size: 17px;
          letter-spacing: -0.2px;
        }
        .panel-header p {
          margin: 0;
          color: #988894;
          font-size: 11px;
        }
        .result-counter {
          padding: 7px 10px;
          border: 1px solid #4c3947;
          border-radius: 20px;
          color: #d8b5c7;
          background: rgba(206, 127, 163, 0.07);
          font-size: 10px;
          white-space: nowrap;
        }
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 15px 24px;
          border-bottom: 1px solid rgba(91, 66, 83, 0.42);
          background: rgba(255, 255, 255, 0.012);
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          width: min(100%, 360px);
          min-height: 41px;
          padding: 0 12px;
          border: 1px solid #51404c;
          border-radius: 9px;
          color: #c99ab2;
          background: #191419;
          transition: 0.2s;
        }
        .search-box:focus-within {
          border-color: #bd7898;
          box-shadow: 0 0 0 3px rgba(217, 140, 175, 0.09);
        }
        .search-box input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          color: #f5edf2;
          background: transparent;
          font: inherit;
          font-size: 11px;
        }
        .search-box input::placeholder {
          color: #80717b;
        }
        .search-box button {
          display: grid;
          place-items: center;
          border: 0;
          color: #bba7b3;
          background: transparent;
          cursor: pointer;
        }
        .filter-group {
          display: flex;
          gap: 4px;
          padding: 4px;
          border: 1px solid #493744;
          border-radius: 10px;
          background: #191419;
        }
        .filter-group button {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border: 0;
          border-radius: 7px;
          color: #a997a3;
          background: transparent;
          font-size: 11px;
          cursor: pointer;
          transition: 0.18s;
        }
        .filter-group button:hover {
          color: #f4dce8;
        }
        .filter-group button.selected {
          color: #fff;
          background: linear-gradient(135deg, #ad6685, #8d4c68);
          box-shadow: inset 0 1px rgba(255, 255, 255, 0.12);
        }
        .filter-group button span {
          color: inherit;
          opacity: 0.7;
          font-size: 9px;
        }
        .table-scroll {
          width: 100%;
          overflow-x: auto;
        }
        .coupon-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }
        .coupon-table th {
          padding: 13px 17px;
          color: #a995a2;
          background: rgba(17, 13, 18, 0.35);
          font-size: 9px;
          font-weight: 750;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .coupon-table td {
          padding: 15px 17px;
          border-top: 1px solid rgba(77, 57, 71, 0.55);
          color: #e9dce4;
          font-size: 11px;
          vertical-align: middle;
        }
        .coupon-table tbody tr {
          transition: background 0.18s;
        }
        .coupon-table tbody tr:hover {
          background: rgba(213, 139, 171, 0.045);
        }
        .coupon-identity {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 165px;
        }
        .coupon-mini-icon {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          flex: 0 0 auto;
          border: 1px solid rgba(221, 143, 177, 0.22);
          border-radius: 10px;
          color: #efa9c6;
          background: rgba(203, 113, 153, 0.12);
        }
        .coupon-identity strong {
          display: block;
          color: #fff0f7;
          font-size: 11px;
          letter-spacing: 0.2px;
        }
        .coupon-identity small,
        .cell-subtitle {
          display: block;
          margin-top: 4px;
          color: #8f7e8a;
          font-size: 9px;
        }
        .discount-value {
          color: #f0a8c8;
          font-size: 13px;
          font-weight: 750;
        }
        .cell-main {
          color: #e8dce4;
          font-size: 11px;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px;
          border: 1px solid transparent;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
        }
        .status-pill > span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 7px currentColor;
        }
        .is-active {
          border-color: rgba(116, 202, 151, 0.16);
          color: #a8e8bd;
          background: rgba(50, 150, 90, 0.11);
        }
        .is-inactive {
          border-color: rgba(208, 166, 166, 0.14);
          color: #d0a6a6;
          background: rgba(180, 70, 70, 0.1);
        }
        .action-cell {
          text-align: right;
        }
        .manage-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 9px;
          border: 1px solid #5b4051;
          border-radius: 8px;
          color: #e9b4cc;
          background: rgba(203, 113, 153, 0.07);
          font-size: 10px;
          text-decoration: none;
          white-space: nowrap;
        }
        .manage-link:hover {
          border-color: #c17b9c;
          color: #fff;
          background: rgba(203, 113, 153, 0.14);
        }
        .table-state {
          height: 190px;
          color: #a995a2 !important;
          text-align: center;
        }
        .table-state > svg {
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }
        .empty-state > * {
          display: block;
          margin: 8px auto;
        }
        .empty-state strong {
          color: #f5eaf0;
          font-size: 13px;
        }
        .empty-state > span:not(.empty-icon) {
          max-width: 390px;
          color: #9e8d99;
          font-size: 11px;
        }
        .empty-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border: 1px solid #614455;
          border-radius: 14px;
          color: #efa5c5;
          background: rgba(214, 128, 166, 0.12);
        }
        .empty-state .button {
          width: fit-content;
          margin-top: 13px;
        }
        .coupon-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(320px, 1fr));
          align-items: stretch;
          gap: 20px;
          padding: 24px;
        }
        .coupon-card {
          color: inherit;
          text-decoration: none;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          position: relative;
          min-width: 0;
          display: flex;
          flex-direction: column;
          min-height: 360px;
          padding: 22px;
          overflow: hidden;
          border: 1px solid rgba(190, 126, 157, 0.34);
          border-radius: 18px;
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(205, 119, 159, 0.13),
              transparent 34%
            ),
            linear-gradient(150deg, #302330 0%, #211923 58%, #1b151d 100%);
          box-shadow:
            0 14px 34px rgba(0, 0, 0, 0.2),
            inset 0 1px rgba(255, 255, 255, 0.035);
          transition:
            transform 0.22s ease,
            border-color 0.22s ease,
            box-shadow 0.22s ease;
        }
        .coupon-card:focus-visible {
          outline: 2px solid #e5a1bf;
          outline-offset: 4px;
        }
        .coupon-card:hover {
          transform: translateY(-3px);
          border-color: rgba(213, 139, 171, 0.62);
          box-shadow:
            0 20px 42px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(213, 139, 171, 0.08);
        }
        .coupon-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .coupon-card-icon {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border: 1px solid rgba(221, 143, 177, 0.24);
          border-radius: 11px;
          color: #efa9c6;
          background: rgba(203, 113, 153, 0.13);
        }
        .coupon-card-code {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 20px;
        }
        .coupon-card-code > span {
          color: #c29caf;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.5px;
        }
        .coupon-card-code strong {
          overflow: hidden;
          color: #fff4f8;
          font-size: 20px;
          font-weight: 750;
          letter-spacing: 0.6px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .coupon-card-code small {
          color: #a18d9b;
          font-size: 10px;
        }
        .coupon-card-discount {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 19px;
          padding: 16px;
          border: 1px solid rgba(213, 139, 171, 0.24);
          border-radius: 12px;
          background: linear-gradient(
            110deg,
            rgba(171, 91, 126, 0.16),
            rgba(203, 113, 153, 0.045)
          );
        }
        .coupon-card-discount > div:first-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .coupon-card-discount span {
          color: #c4aebc;
          font-size: 10px;
        }
        .coupon-card-discount strong {
          color: #f3b1cd;
          font-size: 30px;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.8px;
        }
        .coupon-card-discount small {
          color: #a995a2;
          font-size: 10px;
        }
        .discount-decoration {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          color: #e5a1bf;
          background: rgba(203, 113, 153, 0.12);
        }
        .coupon-card-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 19px;
        }
        .coupon-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          min-width: 0;
        }
        .detail-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          border: 1px solid #493744;
          border-radius: 8px;
          color: #d99ab8;
          background: rgba(255, 255, 255, 0.025);
        }
        .coupon-detail-item > div,
        .coupon-card-validity > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .coupon-detail-item small,
        .coupon-card-validity small {
          color: #a995a2;
          font-size: 10px;
          line-height: 1.45;
        }
        .coupon-detail-item strong,
        .coupon-card-validity strong {
          overflow-wrap: anywhere;
          color: #f0e3eb;
          font-size: 12px;
          font-weight: 650;
        }
        .coupon-card-validity {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 18px;
          padding-top: 15px;
          border-top: 1px solid rgba(77, 57, 71, 0.55);
        }
        .coupon-card-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-height: 44px;
          margin-top: auto;
          padding: 0 14px;
          border: 1px solid #67465a;
          border-radius: 9px;
          color: #edbad0;
          background: rgba(203, 113, 153, 0.09);
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          transition: 0.18s ease;
        }
        .coupon-card-action:hover {
          border-color: #c17b9c;
          color: #fff;
          background: rgba(203, 113, 153, 0.17);
        }
        .coupon-card-action.disabled {
          color: #82727d;
          border-color: #493744;
          cursor: not-allowed;
        }
        .cards-state {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
          min-height: 210px;
          padding: 25px;
          color: #a995a2;
          text-align: center;
          font-size: 11px;
        }
        .cards-state.empty-state > * {
          display: block;
          margin: 8px auto;
        }
        .cards-state.empty-state strong {
          color: #f5eaf0;
          font-size: 13px;
        }
        .cards-state.empty-state > span:not(.empty-icon) {
          max-width: 390px;
          color: #9e8d99;
          font-size: 11px;
        }
        .cards-state .empty-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border: 1px solid #614455;
          border-radius: 14px;
          color: #efa5c5;
          background: rgba(214, 128, 166, 0.12);
        }
        .cards-state .button {
          width: fit-content;
          margin-top: 13px;
        }
        .panel-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 14px 22px;
          border-top: 1px solid rgba(91, 66, 83, 0.5);
          color: #8e7e89;
          font-size: 10px;
        }
        .panel-footer strong {
          color: #d8bdcb;
        }
        .secure-note {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #8d9e91;
        }
        .management-hint {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 17px;
          padding: 16px 19px;
          border: 1px solid rgba(172, 111, 142, 0.28);
          border-radius: 13px;
          background: linear-gradient(
            110deg,
            rgba(67, 40, 55, 0.48),
            rgba(31, 24, 32, 0.65)
          );
        }
        .hint-symbol {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          flex: 0 0 auto;
          border: 1px solid rgba(221, 143, 177, 0.22);
          border-radius: 11px;
          color: #efa9c6;
          background: rgba(203, 113, 153, 0.12);
        }
        .management-hint strong {
          color: #f1dce7;
          font-size: 11px;
        }
        .management-hint p {
          margin: 4px 0 0;
          color: #a18f9b;
          font-size: 10px;
          line-height: 1.5;
        }
        .hint-tag {
          margin-left: auto;
          padding: 6px 9px;
          border: 1px solid #604456;
          border-radius: 7px;
          color: #dba6bf;
          font-size: 9px;
          white-space: nowrap;
        }
        .alert-error {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 17px;
          padding: 13px 15px;
          border: 1px solid rgba(220, 90, 90, 0.35);
          border-radius: 10px;
          color: #ffb4b4;
          background: rgba(180, 50, 50, 0.1);
          font-size: 12px;
        }
        .alert-error button {
          margin-left: auto;
          border: 0;
          color: #f0a8c8;
          background: transparent;
          cursor: pointer;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @media (max-width: 900px) {
          .coupon-cards-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        @media (max-width: 850px) {
          .coupon-page {
            padding: 20px 15px;
          }
          .page-header {
            align-items: stretch;
            flex-direction: column;
          }
          .header-actions {
            justify-content: flex-end;
          }
          .metrics-grid {
            gap: 10px;
          }
          .metric-card {
            padding: 15px;
          }
          .toolbar {
            align-items: stretch;
            flex-direction: column;
          }
          .search-box {
            width: auto;
          }
        }
        @media (max-width: 580px) {
          .coupon-cards-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 14px;
            padding: 16px;
          }
          .coupon-card {
            min-height: 0;
            padding: 19px;
          }
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          .metric-card {
            min-height: 125px;
          }
          .header-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
          .header-actions .button {
            padding: 0 9px;
          }
          .panel-header {
            align-items: flex-start;
            flex-direction: column;
            padding: 18px;
          }
          .toolbar {
            padding: 14px 18px;
          }
          .filter-group {
            width: 100%;
          }
          .filter-group button {
            flex: 1;
            justify-content: center;
            padding: 8px 5px;
          }
          .panel-footer {
            align-items: flex-start;
            flex-direction: column;
            padding: 13px 18px;
          }
          .management-hint {
            align-items: flex-start;
          }
          .hint-tag {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
