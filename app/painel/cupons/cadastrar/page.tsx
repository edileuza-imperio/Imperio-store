"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import ROTAS from "@/app/constants/rotas";
import { Icone } from "@/components/Icons/Icones";

type TipoCupom = "percentual" | "fixo" | "frete_gratis";

interface CupomForm {
  codigo: string;
  tipo: TipoCupom;
  valor: string;
  valor_minimo: string;
  limite_usos: string;
  limite_usos_cliente: string;
  inicio_em: string;
  termina_em: string;
  ativo: boolean;
}

const formularioInicial: CupomForm = {
  codigo: "",
  tipo: "percentual",
  valor: "",
  valor_minimo: "",
  limite_usos: "",
  limite_usos_cliente: "1",
  inicio_em: "",
  termina_em: "",
  ativo: true,
};

function dataParaApi(valor: string): string | null {
  if (!valor) return null;
  // datetime-local já representa horário local sem fuso; o backend deve
  // interpretar no fuso configurado para a loja.
  return valor.replace("T", " ") + ":00";
}

export default function CadastrarCupomPage() {
  const [formulario, setFormulario] = useState<CupomForm>(formularioInicial);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [modoCadastro, setModoCadastro] = useState<"formulario" | "json">(
    "formulario",
  );
  const [jsonCupom, setJsonCupom] = useState("");

  function atualizarCampo<K extends keyof CupomForm>(
    campo: K,
    valor: CupomForm[K],
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function alterarTipoCupom(tipo: TipoCupom) {
    setFormulario((atual) => ({
      ...atual,
      tipo,
      // Frete grátis não representa desconto monetário: seu valor deve ser zero.
      valor:
        tipo === "frete_gratis"
          ? "0"
          : atual.tipo === "frete_gratis"
            ? ""
            : atual.valor,
    }));
  }

  function montarPayloadFormulario() {
    const codigo = formulario.codigo.trim().toUpperCase();
    const valor = Number(formulario.valor);
    const freteGratis = formulario.tipo === "frete_gratis";
    const valorMinimo =
      formulario.valor_minimo === "" ? 0 : Number(formulario.valor_minimo);

    if (!codigo) throw new Error("Informe o código do cupom.");
    if (!Number.isFinite(valor))
      throw new Error("Informe um valor de desconto válido.");
    if (freteGratis && valor !== 0)
      throw new Error("O cupom de frete grátis deve ter valor igual a zero.");
    if (!freteGratis && valor <= 0)
      throw new Error("Informe um desconto maior que zero.");
    if (formulario.tipo === "percentual" && valor > 100)
      throw new Error("O desconto percentual não pode ultrapassar 100%.");
    if (!Number.isFinite(valorMinimo) || valorMinimo < 0)
      throw new Error("Informe um valor mínimo válido.");
    if (
      formulario.inicio_em &&
      formulario.termina_em &&
      formulario.inicio_em > formulario.termina_em
    ) {
      throw new Error("A data inicial não pode ser posterior à data final.");
    }

    const limiteUsos =
      formulario.limite_usos === "" ? null : Number(formulario.limite_usos);
    const limiteCliente =
      formulario.limite_usos_cliente === ""
        ? null
        : Number(formulario.limite_usos_cliente);

    if (
      (limiteUsos !== null &&
        (!Number.isInteger(limiteUsos) || limiteUsos < 1)) ||
      (limiteCliente !== null &&
        (!Number.isInteger(limiteCliente) || limiteCliente < 1))
    ) {
      throw new Error(
        "Os limites de utilização devem ser números inteiros maiores que zero.",
      );
    }

    return {
      codigo,
      tipo: formulario.tipo,
      valor: freteGratis ? "0.00" : valor.toFixed(2),
      valor_minimo: valorMinimo.toFixed(2),
      limite_usos: limiteUsos,
      limite_usos_cliente: limiteCliente,
      inicio_em: dataParaApi(formulario.inicio_em),
      termina_em: dataParaApi(formulario.termina_em),
      ativo: formulario.ativo,
    };
  }

  function prepararModoJson() {
    try {
      setJsonCupom(JSON.stringify(montarPayloadFormulario(), null, 2));
    } catch {
      setJsonCupom(
        JSON.stringify(
          {
            codigo: "",
            tipo: "percentual",
            valor: "10.00",
            valor_minimo: "0.00",
            limite_usos: null,
            limite_usos_cliente: 1,
            inicio_em: null,
            termina_em: null,
            ativo: true,
          },
          null,
          2,
        ),
      );
    }
    setModoCadastro("json");
    setErro("");
  }

  async function cadastrarCupom(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");

    let payload: Record<string, unknown>;

    try {
      if (modoCadastro === "json") {
        const dados: unknown = JSON.parse(jsonCupom);
        if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
          throw new Error("O JSON deve ser um objeto válido.");
        }

        payload = dados as Record<string, unknown>;
        const tipo = String(payload.tipo);
        const valor = Number(payload.valor);
        const tipoValido = ["percentual", "fixo", "frete_gratis"].includes(
          tipo,
        );
        const freteGratis = tipo === "frete_gratis";

        if (
          typeof payload.codigo !== "string" ||
          !payload.codigo.trim() ||
          !tipoValido ||
          payload.valor == null ||
          (typeof payload.valor === "string" && !payload.valor.trim()) ||
          !Number.isFinite(valor) ||
          (freteGratis ? valor !== 0 : valor <= 0)
        ) {
          throw new Error(
            "Informe codigo, um tipo válido (percentual, fixo ou frete_gratis) e valor compatível com o tipo.",
          );
        }

        if (tipo === "percentual" && valor > 100) {
          throw new Error("O desconto percentual não pode ultrapassar 100%.");
        }

        if (
          payload.valor_minimo != null &&
          (!Number.isFinite(Number(payload.valor_minimo)) ||
            Number(payload.valor_minimo) < 0)
        ) {
          throw new Error("O valor mínimo informado é inválido.");
        }

        for (const campo of ["limite_usos", "limite_usos_cliente"]) {
          const limite = payload[campo];
          if (
            limite != null &&
            (!Number.isInteger(Number(limite)) || Number(limite) < 1)
          ) {
            throw new Error(
              `${campo} deve ser um inteiro maior que zero ou null.`,
            );
          }
        }

        payload = { ...payload, codigo: payload.codigo.trim().toUpperCase() };
      } else {
        payload = montarPayloadFormulario();
      }
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "JSON inválido.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setErro("Configure NEXT_PUBLIC_API_URL no .env.local.");
      return;
    }

    try {
      setCarregando(true);
      const resposta = await fetch(
        `${apiUrl.replace(/\/$/, "")}${ROTAS.CUPONS.PAINEL.CADASTRAR}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      const respostaTexto = await resposta.text();
      let dados: {
        sucesso?: boolean;
        mensagem?: string;
        message?: string;
        erro?: string;
      } | null = null;

      if (respostaTexto.trim()) {
        try {
          dados = JSON.parse(respostaTexto);
        } catch {
          dados = { mensagem: respostaTexto };
        }
      }

      if (!resposta.ok || dados?.sucesso === false) {
        throw new Error(
          dados?.mensagem ||
            dados?.message ||
            dados?.erro ||
            `Não foi possível cadastrar o cupom. HTTP ${resposta.status}.`,
        );
      }

      setSucesso(dados?.mensagem || "Cupom cadastrado com sucesso.");
      setFormulario({ ...formularioInicial });
      setJsonCupom("");
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Erro inesperado ao cadastrar o cupom.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="cupom-page">
      <div className="cupom-heading">
        <div>
          <nav className="cupom-breadcrumb" aria-label="Caminho de navegação">
            <Link href={ROTAS.PAINEL.INICIO}>Painel</Link>
            <span>/</span>
            <Link href={ROTAS.PAGINAS.PAINEL.CUPONS.LISTAR}>Cupons</Link>
            <span>/</span>
            <span>Cadastrar</span>
          </nav>
          <h1>Cadastrar cupom</h1>
          <p>
            Crie um código promocional para oferecer descontos aos clientes da
            loja.
          </p>
        </div>
        <Link className="cupom-back" href={ROTAS.PAGINAS.PAINEL.CUPONS.LISTAR}>
          <Icone nome="arrow-left" tamanho={17} /> Voltar
        </Link>
      </div>

      {erro && (
        <div className="cupom-alert cupom-error" role="alert">
          <Icone nome="alert-circle" tamanho={18} />
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="cupom-alert cupom-success" role="status">
          <Icone nome="check-circle" tamanho={18} />
          {sucesso}
        </div>
      )}

      <div className="cupom-mode">
        <span>Forma de cadastro</span>
        <div className="cupom-mode-options">
          <button
            type="button"
            className={`cupom-mode-button ${modoCadastro === "formulario" ? "active" : ""}`}
            onClick={() => setModoCadastro("formulario")}
            disabled={carregando}
          >
            Formulário
          </button>
          <button
            type="button"
            className={`cupom-mode-button ${modoCadastro === "json" ? "active" : ""}`}
            onClick={prepararModoJson}
            disabled={carregando}
          >
            JSON
          </button>
        </div>
      </div>

      <form onSubmit={cadastrarCupom} className="cupom-form">
        {modoCadastro === "json" ? (
          <section className="cupom-card">
            <header className="cupom-card-heading">
              <span className="cupom-card-icon">
                <Icone nome="code" tamanho={21} />
              </span>
              <div>
                <h2>Cadastrar por JSON</h2>
                <p>
                  Edite o objeto JSON abaixo. Ele será enviado diretamente para
                  a API.
                </p>
              </div>
            </header>
            <label className="cupom-field">
              <span>
                Dados do cupom (JSON) <b>*</b>
              </span>
              <textarea
                className="cupom-json-editor"
                value={jsonCupom}
                onChange={(evento) => setJsonCupom(evento.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder={
                  '{\n  "codigo": "BEMVINDO10",\n  "tipo": "percentual",\n  "valor": "10.00"\n}'
                }
                rows={18}
                required
              />
              <small>
                Campos: codigo, tipo, valor, valor_minimo, limite_usos,
                limite_usos_cliente, inicio_em, termina_em e ativo. Tipos na
                tela: percentual, fixo e frete_gratis (este último também
                precisa ser aceito pelo backend).
              </small>
            </label>
          </section>
        ) : (
          <>
            <section className="cupom-card">
              <header className="cupom-card-heading">
                <span className="cupom-card-icon">
                  <Icone nome="ticket" tamanho={21} />
                </span>
                <div>
                  <h2>Informações do cupom</h2>
                  <p>Defina o código e o tipo de desconto.</p>
                </div>
              </header>
              <div className="cupom-grid">
                <label className="cupom-field">
                  <span>
                    Código do cupom <b>*</b>
                  </span>
                  <input
                    value={formulario.codigo}
                    onChange={(e) =>
                      atualizarCampo(
                        "codigo",
                        e.target.value.toUpperCase().replace(/\s/g, ""),
                      )
                    }
                    placeholder="EX: BEMVINDO10"
                    maxLength={50}
                    required
                  />
                  <small>O cliente utilizará este código no carrinho.</small>
                </label>
                <label className="cupom-field">
                  <span>
                    Tipo de desconto <b>*</b>
                  </span>
                  <select
                    value={formulario.tipo}
                    onChange={(e) =>
                      alterarTipoCupom(e.target.value as TipoCupom)
                    }
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor fixo (R$)</option>
                    <option value="frete_gratis">Frete grátis</option>
                  </select>
                  <small>
                    Confirme se esses valores correspondem ao ENUM da coluna
                    cupons.tipo.
                  </small>
                </label>
                <label className="cupom-field">
                  <span>
                    Valor do desconto <b>*</b>
                  </span>
                  <div className="cupom-input-suffix">
                    <input
                      type="number"
                      min={formulario.tipo === "frete_gratis" ? 0 : 0.01}
                      max={formulario.tipo === "percentual" ? 100 : undefined}
                      step="0.01"
                      value={formulario.valor}
                      onChange={(e) => atualizarCampo("valor", e.target.value)}
                      placeholder={
                        formulario.tipo === "percentual"
                          ? "10"
                          : formulario.tipo === "frete_gratis"
                            ? "0"
                            : "15.00"
                      }
                      disabled={formulario.tipo === "frete_gratis"}
                      required
                    />
                    <span>
                      {formulario.tipo === "percentual"
                        ? "%"
                        : formulario.tipo === "frete_gratis"
                          ? "Grátis"
                          : "R$"}
                    </span>
                  </div>
                  {formulario.tipo === "frete_gratis" && (
                    <small>
                      O valor será enviado como 0.00; o benefício deve zerar
                      apenas o frete no cálculo do pedido.
                    </small>
                  )}
                </label>
                <label className="cupom-field">
                  <span>Valor mínimo do pedido</span>
                  <div className="cupom-input-suffix">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formulario.valor_minimo}
                      onChange={(e) =>
                        atualizarCampo("valor_minimo", e.target.value)
                      }
                      placeholder="0,00"
                    />
                    <span>R$</span>
                  </div>
                  <small>Use zero para não exigir valor mínimo.</small>
                </label>
              </div>
            </section>

            <section className="cupom-card">
              <header className="cupom-card-heading">
                <span className="cupom-card-icon">
                  <Icone nome="chart-no-axes-column-increasing" tamanho={21} />
                </span>
                <div>
                  <h2>Limites de utilização</h2>
                  <p>Controle quantas vezes o cupom poderá ser usado.</p>
                </div>
              </header>
              <div className="cupom-grid">
                <label className="cupom-field">
                  <span>Limite total de utilizações</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formulario.limite_usos}
                    onChange={(e) =>
                      atualizarCampo("limite_usos", e.target.value)
                    }
                    placeholder="Ilimitado"
                  />
                  <small>Deixe vazio para não definir limite global.</small>
                </label>
                <label className="cupom-field">
                  <span>Limite por cliente</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formulario.limite_usos_cliente}
                    onChange={(e) =>
                      atualizarCampo("limite_usos_cliente", e.target.value)
                    }
                    placeholder="1"
                  />
                  <small>Quantidade máxima de utilizações por cliente.</small>
                </label>
              </div>
            </section>

            <section className="cupom-card">
              <header className="cupom-card-heading">
                <span className="cupom-card-icon">
                  <Icone nome="calendar-days" tamanho={21} />
                </span>
                <div>
                  <h2>Período de validade</h2>
                  <p>Determine quando o cupom poderá ser utilizado.</p>
                </div>
              </header>
              <div className="cupom-grid">
                <label className="cupom-field">
                  <span>Início da validade</span>
                  <input
                    type="datetime-local"
                    value={formulario.inicio_em}
                    onChange={(e) =>
                      atualizarCampo("inicio_em", e.target.value)
                    }
                  />
                </label>
                <label className="cupom-field">
                  <span>Término da validade</span>
                  <input
                    type="datetime-local"
                    value={formulario.termina_em}
                    onChange={(e) =>
                      atualizarCampo("termina_em", e.target.value)
                    }
                  />
                </label>
              </div>
            </section>

            <section className="cupom-card">
              <header className="cupom-card-heading">
                <span className="cupom-card-icon">
                  <Icone nome="settings-2" tamanho={21} />
                </span>
                <div>
                  <h2>Configurações</h2>
                  <p>Defina a disponibilidade do cupom.</p>
                </div>
              </header>
              <label className="cupom-switch">
                <span>
                  <strong>Cupom ativo</strong>
                  <small>Permite que o cupom seja utilizado na loja.</small>
                </span>
                <input
                  type="checkbox"
                  checked={formulario.ativo}
                  onChange={(e) => atualizarCampo("ativo", e.target.checked)}
                />
                <span className="cupom-switch-track" aria-hidden="true" />
              </label>
            </section>
          </>
        )}

        <div className="cupom-actions">
          <Link
            className="cupom-button cupom-button-secondary"
            href={ROTAS.PAGINAS.PAINEL.CUPONS.LISTAR}
          >
            Cancelar
          </Link>
          <button
            className="cupom-button cupom-button-primary"
            type="submit"
            disabled={carregando}
          >
            <Icone nome={carregando ? "loader-circle" : "save"} tamanho={18} />
            {carregando ? "Salvando..." : "Cadastrar cupom"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .cupom-page {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px;
          color: #f5edf2;
        }
        .cupom-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 26px;
        }
        .cupom-heading h1 {
          margin: 14px 0 7px;
          font-size: 27px;
          font-weight: 700;
          letter-spacing: -0.4px;
        }
        .cupom-heading p,
        .cupom-card-heading p {
          margin: 0;
          color: #aa9ba5;
          font-size: 13px;
          line-height: 1.6;
        }
        .cupom-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px;
          color: #a99ba5;
          font-size: 12px;
        }
        .cupom-breadcrumb a {
          color: #d98caf;
          text-decoration: none;
        }
        .cupom-breadcrumb a:hover {
          color: #f2b3d0;
        }
        .cupom-back,
        .cupom-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cupom-back,
        .cupom-button-secondary {
          color: #eadce5;
          background: #251d25;
          border: 1px solid #4b3946;
        }
        .cupom-back:hover,
        .cupom-button-secondary:hover {
          background: #352632;
        }
        .cupom-form {
          display: grid;
          gap: 17px;
        }
        .cupom-card {
          padding: 23px;
          border: 1px solid #493744;
          border-radius: 15px;
          background: linear-gradient(145deg, #251d25, #1d171e);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .cupom-card-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 23px;
        }
        .cupom-card-heading h2 {
          margin: 0 0 5px;
          font-size: 16px;
          font-weight: 650;
          color: #f5eaf0;
        }
        .cupom-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          border-radius: 12px;
          color: #efa5c5;
          background: rgba(214, 128, 166, 0.14);
        }
        .cupom-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 21px 23px;
        }
        .cupom-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .cupom-field > span {
          color: #e9dce4;
          font-size: 13px;
          font-weight: 600;
        }
        .cupom-field b {
          color: #ed9fbe;
        }
        .cupom-field input,
        .cupom-field select {
          width: 100%;
          min-width: 0;
          height: 45px;
          padding: 0 13px;
          border: 1px solid #51404c;
          border-radius: 9px;
          outline: none;
          color: #f5edf2;
          background: #191419;
          font: inherit;
          font-size: 13px;
          color-scheme: dark;
          box-sizing: border-box;
        }
        .cupom-field input:focus,
        .cupom-field select:focus {
          border-color: #d98caf;
          box-shadow: 0 0 0 3px rgba(217, 140, 175, 0.12);
        }
        .cupom-field input::placeholder {
          color: #82737d;
        }
        .cupom-field small,
        .cupom-switch small {
          color: #a99ba5;
          font-size: 11px;
          line-height: 1.5;
        }
        .cupom-input-suffix {
          position: relative;
        }
        .cupom-input-suffix input {
          padding-right: 52px;
        }
        .cupom-input-suffix > span {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #c6a9b9;
          font-size: 12px;
          font-weight: 600;
        }
        .cupom-switch {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          cursor: pointer;
        }
        .cupom-switch > span:first-child {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .cupom-switch strong {
          color: #eee1e9;
          font-size: 13px;
        }
        .cupom-switch input {
          position: absolute;
          right: 0;
          width: 46px;
          height: 25px;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }
        .cupom-switch-track {
          position: relative;
          width: 46px;
          height: 25px;
          flex-shrink: 0;
          border-radius: 20px;
          background: #554651;
          transition: 0.2s;
        }
        .cupom-switch-track:after {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: #fff;
          content: "";
          transition: 0.2s;
        }
        .cupom-switch input:checked + .cupom-switch-track {
          background: #c8759b;
        }
        .cupom-switch input:checked + .cupom-switch-track:after {
          transform: translateX(21px);
        }
        .cupom-switch input:focus-visible + .cupom-switch-track {
          outline: 2px solid #f0a8c8;
          outline-offset: 3px;
        }
        .cupom-actions {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 12px;
          padding: 5px 0 28px;
        }
        .cupom-button-primary {
          color: #fff;
          background: linear-gradient(135deg, #bd6e91, #96506f);
          border: 1px solid #d58bab;
        }
        .cupom-button-primary:hover:not(:disabled) {
          filter: brightness(1.12);
          transform: translateY(-1px);
        }
        .cupom-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cupom-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 17px;
          padding: 13px 15px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 13px;
        }
        .cupom-error {
          color: #ffb4b4;
          background: rgba(180, 50, 50, 0.1);
          border-color: rgba(220, 90, 90, 0.35);
        }
        .cupom-success {
          color: #a8e8bd;
          background: rgba(50, 150, 90, 0.1);
          border-color: rgba(80, 190, 120, 0.35);
        }
        .cupom-mode {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 17px;
          color: #e9dce4;
          font-size: 13px;
          font-weight: 600;
        }
        .cupom-mode-options {
          display: flex;
          gap: 5px;
          padding: 4px;
          border: 1px solid #493744;
          border-radius: 10px;
          background: #1d171e;
        }
        .cupom-mode-button {
          min-height: 34px;
          padding: 0 15px;
          border: 0;
          border-radius: 7px;
          color: #b9a8b3;
          background: transparent;
          font: inherit;
          cursor: pointer;
        }
        .cupom-mode-button.active {
          color: #fff;
          background: #96506f;
        }
        .cupom-mode-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .cupom-json-editor {
          width: 100%;
          min-height: 360px;
          padding: 15px;
          border: 1px solid #51404c;
          border-radius: 9px;
          outline: none;
          resize: vertical;
          color: #f5edf2;
          background: #191419;
          font-family: "SFMono-Regular", Consolas, monospace;
          font-size: 13px;
          line-height: 1.65;
          tab-size: 2;
          box-sizing: border-box;
        }
        .cupom-json-editor:focus {
          border-color: #d98caf;
          box-shadow: 0 0 0 3px rgba(217, 140, 175, 0.12);
        }
        @media (max-width: 700px) {
          .cupom-page {
            padding: 18px 14px;
          }
          .cupom-heading {
            flex-direction: column;
          }
          .cupom-mode {
            align-items: flex-start;
            flex-direction: column;
          }
          .cupom-mode-options {
            width: 100%;
          }
          .cupom-mode-button {
            flex: 1;
          }
          .cupom-grid {
            grid-template-columns: 1fr;
          }
          .cupom-card {
            padding: 18px;
          }
          .cupom-actions {
            flex-direction: column-reverse;
          }
          .cupom-actions .cupom-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
