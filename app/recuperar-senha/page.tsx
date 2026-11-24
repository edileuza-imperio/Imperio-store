"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import styles from "./recuperar-senha.module.css";

type Modo = "solicitar" | "redefinir";
type Estado = "ocioso" | "enviando" | "sucesso" | "erro";

interface RespostaApi {
  sucesso?: boolean;
  mensagem?: string;
  message?: string;
  dados?: {
    sucesso?: boolean;
    mensagem?: string;
    message?: string;
  };
}

function mensagemDaResposta(resposta?: RespostaApi): string | undefined {
  return (
    resposta?.mensagem ||
    resposta?.message ||
    resposta?.dados?.mensagem ||
    resposta?.dados?.message
  );
}

function erroDaApi(erro: unknown, padrao: string): string {
  const falha = erro as {
    response?: { data?: RespostaApi };
    message?: string;
  };

  return mensagemDaResposta(falha.response?.data) || falha.message || padrao;
}

export default function RecuperarSenhaPage() {
  const [modo, setModo] = useState<Modo>("solicitar");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [estado, setEstado] = useState<Estado>("ocioso");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const tokenUrl = (parametros.get("token") || "").trim();

    if (tokenUrl) {
      setToken(tokenUrl);
      setModo("redefinir");
      // Mantém o token apenas no estado da página, não na barra de endereço.
      window.history.replaceState({}, "", ROTAS.PAGINAS.LOJA.RECUPERAR_SENHA);
    }
  }, []);

  async function solicitarLink(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstado("enviando");
    setMensagem("");

    try {
      const resposta = await conexao.post<RespostaApi>(
        ROTAS.TOKENS_RECUPERACAO.SOLICITAR,
        { payload: { dados: { email: email.trim() } } },
      );

      const payload = resposta.data;
      if (payload?.sucesso === false || payload?.dados?.sucesso === false) {
        throw new Error(
          mensagemDaResposta(payload) ||
            "Não foi possível solicitar a recuperação.",
        );
      }

      setEstado("sucesso");
      setMensagem(
        mensagemDaResposta(payload) ||
          "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.",
      );
    } catch (erro) {
      setEstado("erro");
      setMensagem(
        erroDaApi(
          erro,
          "Não foi possível enviar a solicitação. Tente novamente.",
        ),
      );
    }
  }

  async function redefinirSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (senha.length < 8) {
      setEstado("erro");
      setMensagem("Sua nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setEstado("erro");
      setMensagem("As senhas não conferem. Verifique os dois campos.");
      return;
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      setEstado("erro");
      setMensagem(
        "Este link de recuperação é inválido. Solicite um novo link.",
      );
      return;
    }

    setEstado("enviando");
    setMensagem("");

    try {
      const resposta = await conexao.post<RespostaApi>(
        ROTAS.TOKENS_RECUPERACAO.REDEFINIR,
        {
          payload: {
            dados: {
              token,
              senha,
              confirmar_senha: confirmarSenha,
            },
          },
        },
      );

      const payload = resposta.data;
      if (payload?.sucesso === false || payload?.dados?.sucesso === false) {
        throw new Error(
          mensagemDaResposta(payload) ||
            "Não foi possível redefinir sua senha.",
        );
      }

      setEstado("sucesso");
      setMensagem(
        mensagemDaResposta(payload) ||
          "Sua senha foi redefinida com sucesso. Agora você já pode entrar na sua conta.",
      );
      setSenha("");
      setConfirmarSenha("");
    } catch (erro) {
      setEstado("erro");
      setMensagem(
        erroDaApi(
          erro,
          "Não foi possível redefinir sua senha. O link pode ter expirado.",
        ),
      );
    }
  }

  function voltarParaSolicitacao() {
    setModo("solicitar");
    setToken("");
    setEstado("ocioso");
    setMensagem("");
    window.history.replaceState({}, "", ROTAS.PAGINAS.LOJA.RECUPERAR_SENHA);
  }

  const redefinicaoConcluida = modo === "redefinir" && estado === "sucesso";

  return (
    <main className={styles.pagina}>
      <div className={styles.decoracao} aria-hidden="true" />

      <section className={styles.cartao} aria-labelledby="recuperar-titulo">
        <Link
          className={styles.marca}
          href="/"
          aria-label="Universo Império - página inicial"
        >
          <span className={styles.marcaSimbolo}>U</span>
          <span className={styles.marcaTexto}>
            UNIVERSO <strong>IMPÉRIO</strong>
          </span>
        </Link>

        <div className={styles.icone} aria-hidden="true">
          {modo === "solicitar" ? (
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4.5 6.75h15A1.75 1.75 0 0 1 21.25 8.5v9A1.75 1.75 0 0 1 19.5 19.25h-15A1.75 1.75 0 0 1 2.75 17.5v-9A1.75 1.75 0 0 1 4.5 6.75Z" />
              <path d="m3.5 7.5 8.5 6.25 8.5-6.25" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4.25" y="10" width="15.5" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" />
            </svg>
          )}
        </div>

        {redefinicaoConcluida ? (
          <div className={styles.conteudo}>
            <span className={styles.sobretitulo}>Tudo certo</span>
            <h1 id="recuperar-titulo">Senha atualizada!</h1>
            <p className={styles.descricao}>{mensagem}</p>
            <div className={styles.avisoSucesso} role="status">
              Sua nova senha já pode ser utilizada no acesso à sua conta.
            </div>
            <Link href="/" className={styles.botaoSecundario}>
              Voltar para a loja
            </Link>
          </div>
        ) : estado === "sucesso" && modo === "solicitar" ? (
          <div className={styles.conteudo}>
            <span className={styles.sobretitulo}>Confira seu e-mail</span>
            <h1 id="recuperar-titulo">Verifique sua caixa de entrada</h1>
            <p className={styles.descricao}>{mensagem}</p>
            <div className={styles.avisoSucesso} role="status">
              Não encontrou? Confira também a pasta de spam ou lixo eletrônico.
            </div>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={() => {
                setEstado("ocioso");
                setMensagem("");
              }}
            >
              Tentar outro e-mail
            </button>
          </div>
        ) : modo === "solicitar" ? (
          <div className={styles.conteudo}>
            <span className={styles.sobretitulo}>Acesso à sua conta</span>
            <h1 id="recuperar-titulo">Esqueceu sua senha?</h1>
            <p className={styles.descricao}>
              Informe o e-mail cadastrado. Enviaremos um link seguro para você
              criar uma nova senha.
            </p>

            <form className={styles.formulario} onSubmit={solicitarLink}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                required
                maxLength={190}
              />

              {estado === "erro" && (
                <p className={styles.mensagemErro} role="alert">
                  {mensagem}
                </p>
              )}

              <button
                className={styles.botaoPrimario}
                type="submit"
                disabled={estado === "enviando"}
              >
                {estado === "enviando"
                  ? "Enviando..."
                  : "Enviar link de recuperação"}
              </button>
            </form>

            <Link href="/" className={styles.linkVoltar}>
              Voltar para a loja
            </Link>
          </div>
        ) : (
          <div className={styles.conteudo}>
            <span className={styles.sobretitulo}>Proteja sua conta</span>
            <h1 id="recuperar-titulo">Crie uma nova senha</h1>
            <p className={styles.descricao}>
              Escolha uma senha forte com pelo menos 8 caracteres. Este link é
              válido por tempo limitado.
            </p>

            <form className={styles.formulario} onSubmit={redefinirSenha}>
              <label htmlFor="senha">Nova senha</label>
              <div className={styles.campoSenha}>
                <input
                  id="senha"
                  name="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Digite sua nova senha"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  minLength={8}
                  maxLength={255}
                  required
                />
                <button
                  type="button"
                  className={styles.alternarSenha}
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              <label htmlFor="confirmar-senha">Confirmar nova senha</label>
              <div className={styles.campoSenha}>
                <input
                  id="confirmar-senha"
                  name="confirmar-senha"
                  type={mostrarConfirmacao ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={(evento) => setConfirmarSenha(evento.target.value)}
                  minLength={8}
                  maxLength={255}
                  required
                />
                <button
                  type="button"
                  className={styles.alternarSenha}
                  onClick={() => setMostrarConfirmacao((valor) => !valor)}
                  aria-label={
                    mostrarConfirmacao
                      ? "Ocultar confirmação"
                      : "Mostrar confirmação"
                  }
                >
                  {mostrarConfirmacao ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {estado === "erro" && (
                <p className={styles.mensagemErro} role="alert">
                  {mensagem}
                </p>
              )}

              <button
                className={styles.botaoPrimario}
                type="submit"
                disabled={estado === "enviando"}
              >
                {estado === "enviando"
                  ? "Salvando senha..."
                  : "Redefinir minha senha"}
              </button>
            </form>

            <button
              type="button"
              className={styles.linkVoltarBotao}
              onClick={voltarParaSolicitacao}
            >
              Solicitar outro link de recuperação
            </button>
          </div>
        )}

        <p className={styles.rodape}>
          © {new Date().getFullYear()} Universo Império. Todos os direitos
          reservados.
        </p>
      </section>
    </main>
  );
}
