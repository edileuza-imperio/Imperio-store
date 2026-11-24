"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useRef, useState } from "react";

import ROTAS from "@/app/constants/rotas";
import { obterIcone } from "@/components/Icons/Icones";
import Toast from "@/components/Toast/toast";
import conexao from "@/Services/Conexao/Conexao";

type ModoTela = "login" | "cadastro";

export default function AcessoPage() {
  const router = useRouter();
  const redirecionamento = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modo, setModo] = useState<ModoTela>("login");
  const [carregando, setCarregando] = useState(false);

  // Login
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);
  const [lembrarAcesso, setLembrarAcesso] = useState(false);

  // Cadastro
  const [nome, setNome] = useState("");
  const [emailCadastro, setEmailCadastro] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaCadastro, setSenhaCadastro] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [aceitarTermos, setAceitarTermos] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [sucessoCadastro, setSucessoCadastro] = useState("");

  function Icone({ nome, tamanho = 20 }: { nome: string; tamanho?: number }) {
    const ComponenteIcone = obterIcone(nome);
    return <ComponenteIcone size={tamanho} aria-hidden="true" />;
  }

  function trocarModo(novoModo: ModoTela) {
    if (carregando) return;
    setModo(novoModo);
    setErroCadastro("");
    setSucessoCadastro("");
  }

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    if (numeros.length <= 2) return numeros.length ? `(${numeros}` : "";
    if (numeros.length <= 6)
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    }
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  const confirmacaoValida =
    confirmarSenha.length > 0 && senhaCadastro === confirmarSenha;
  const confirmacaoInvalida =
    confirmarSenha.length > 0 && senhaCadastro !== confirmarSenha;

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (carregando) return;

    const emailLimpo = emailLogin.trim();
    if (!emailLimpo || !senhaLogin) {
      Toast.alerta("Informe seu e-mail e sua senha.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      Toast.alerta("Informe um endereço de e-mail válido.");
      return;
    }

    try {
      setCarregando(true);
      const duracaoSegundos = lembrarAcesso ? 30 * 24 * 60 * 60 : undefined;

      const resposta = await conexao.post(ROTAS.AUTH.LOGIN, {
        email: emailLimpo,
        senha: senhaLogin,
        ...(duracaoSegundos !== undefined && { duracaoSegundos }),
      });

      const dados = resposta.data;
      if (dados?.sucesso === false) {
        throw new Error(
          dados?.mensagem || "Não foi possível realizar o login.",
        );
      }

      Toast.sucesso(dados?.mensagem || "Login realizado com sucesso!");
      setSenhaLogin("");

      redirecionamento.current = setTimeout(() => {
        router.replace(ROTAS.HOME);
        router.refresh();
      }, 1800);
    } catch (error: unknown) {
      console.error("Erro ao realizar login:", error);

      if (axios.isAxiosError(error)) {
        const mensagem =
          error.response?.data?.mensagem ||
          error.response?.data?.message ||
          error.response?.data?.erro;

        if (typeof mensagem === "string" && mensagem.trim()) {
          Toast.erro(mensagem);
        } else if (error.response?.status === 401) {
          Toast.erro("E-mail ou senha incorretos.");
        } else if (error.response?.status === 422) {
          Toast.erro("Confira os dados informados.");
        } else if (!error.response) {
          Toast.erro(
            "Não foi possível conectar ao servidor. Verifique sua conexão.",
          );
        } else {
          Toast.erro("Ocorreu um erro ao realizar o login.");
        }
      } else if (error instanceof Error) {
        Toast.erro(error.message);
      } else {
        Toast.erro("Ocorreu um erro inesperado.");
      }
    } finally {
      setCarregando(false);
    }
  }

  async function handleCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErroCadastro("");
    setSucessoCadastro("");

    if (carregando) return;

    const nomeLimpo = nome.trim();
    const emailLimpo = emailCadastro.trim().toLowerCase();
    const telefoneNumeros = telefone.replace(/\D/g, "");

    if (nomeLimpo.length < 3) {
      setErroCadastro("Informe seu nome completo.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setErroCadastro("Informe um endereço de e-mail válido.");
      return;
    }
    if (telefoneNumeros.length !== 10 && telefoneNumeros.length !== 11) {
      setErroCadastro("Informe um telefone válido com DDD.");
      return;
    }
    if (senhaCadastro.length < 8) {
      setErroCadastro("Sua senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senhaCadastro.length > 4096) {
      setErroCadastro("A senha informada é muito longa.");
      return;
    }
    if (senhaCadastro !== confirmarSenha) {
      setErroCadastro("As senhas informadas não são iguais.");
      return;
    }
    if (!aceitarTermos) {
      setErroCadastro("Você precisa aceitar os termos para continuar.");
      return;
    }

    try {
      setCarregando(true);
      const resposta = await conexao.post(ROTAS.AUTH.REGISTRAR, {
        nome: nomeLimpo,
        email: emailLimpo,
        telefone: telefoneNumeros,
        senha: senhaCadastro,
      });

      if (resposta.data?.sucesso === false) {
        throw new Error(
          resposta.data?.mensagem || "Não foi possível realizar o cadastro.",
        );
      }

      setSucessoCadastro(
        resposta.data?.mensagem ||
          "Cadastro realizado com sucesso! Agora você pode entrar na sua conta.",
      );

      // Preenche o e-mail no login e muda a tela sem alterar a URL.
      setEmailLogin(emailLimpo);
      setNome("");
      setEmailCadastro("");
      setTelefone("");
      setSenhaCadastro("");
      setConfirmarSenha("");
      setAceitarTermos(false);

      Toast.sucesso("Cadastro realizado com sucesso!");
      window.setTimeout(() => {
        setModo("login");
        setSucessoCadastro("");
      }, 1400);
    } catch (error: unknown) {
      console.error("Erro ao realizar cadastro:", error);

      if (axios.isAxiosError(error)) {
        const mensagem =
          error.response?.data?.mensagem ||
          error.response?.data?.message ||
          error.response?.data?.erro;

        if (error.response?.status === 409) {
          setErroCadastro(mensagem || "Este e-mail já está cadastrado.");
        } else if (error.response?.status === 422) {
          setErroCadastro(mensagem || "Confira os dados informados.");
        } else if (error.response?.status === 400) {
          setErroCadastro(mensagem || "Os dados enviados são inválidos.");
        } else if (error.response?.status === 500) {
          setErroCadastro(mensagem || "Ocorreu um erro interno no servidor.");
        } else if (!error.response) {
          setErroCadastro(
            "Não foi possível conectar ao servidor. Verifique sua API.",
          );
        } else {
          setErroCadastro(mensagem || "Não foi possível realizar o cadastro.");
        }
      } else if (error instanceof Error) {
        setErroCadastro(error.message);
      } else {
        setErroCadastro("Ocorreu um erro inesperado ao realizar o cadastro.");
      }
    } finally {
      setCarregando(false);
    }
  }

  if (modo === "login") {
    return (
      <main className="login-page">
        <div className="login-page__decoracao login-page__decoracao--um" />
        <div className="login-page__decoracao login-page__decoracao--dois" />

        <section className="login-container">
          <aside className="login-apresentacao">
            <Link href="/" className="login-apresentacao__voltar">
              <Icone nome="arrow-left" tamanho={17} />
              Voltar para a loja
            </Link>

            <div className="login-apresentacao__conteudo">
              <span className="login-apresentacao__legenda">
                SEJA BEM-VINDO AO
              </span>
              <h1>
                Universo<strong>Império</strong>
              </h1>
              <div className="login-apresentacao__linha" />
              <p>
                Um universo de possibilidades, produtos especiais e experiências
                pensadas para você.
              </p>
              <div className="login-apresentacao__destaque">
                <div className="login-apresentacao__destaque-icone">
                  <Icone nome="shield-check" tamanho={23} />
                </div>
                <div>
                  <strong>Um ambiente para você</strong>
                  <span>Entre e aproveite sua experiência.</span>
                </div>
              </div>
            </div>
            <span className="login-apresentacao__rodape">UNIVERSO IMPÉRIO</span>
          </aside>

          <section className="login-formulario">
            <div className="login-formulario__topo">
              <div className="login-formulario__marca">
                <span className="login-formulario__marca-legenda">
                  UNIVERSO
                </span>
                <strong>IMPÉRIO</strong>
              </div>
            </div>

            <div className="login-formulario__conteudo">
              <div className="login-formulario__titulo">
                <span className="login-formulario__boas-vindas">
                  BEM-VINDO DE VOLTA
                </span>
                <h2>Entrar na sua conta</h2>
                <p>Informe seus dados para acessar sua conta.</p>
              </div>

              <form className="login-form" onSubmit={handleLogin} noValidate>
                <div className="login-form__grupo">
                  <label htmlFor="login-email">E-mail</label>
                  <div className="login-form__campo">
                    <span className="login-form__icone">
                      <Icone nome="mail" tamanho={19} />
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      placeholder="Digite seu e-mail"
                      autoComplete="email"
                      value={emailLogin}
                      onChange={(event) => setEmailLogin(event.target.value)}
                      disabled={carregando}
                      required
                    />
                  </div>
                </div>

                <div className="login-form__grupo">
                  <label htmlFor="login-senha">Senha</label>
                  <div className="login-form__campo">
                    <span className="login-form__icone">
                      <Icone nome="lock-keyhole" tamanho={19} />
                    </span>
                    <input
                      id="login-senha"
                      type={mostrarSenhaLogin ? "text" : "password"}
                      name="senha"
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      value={senhaLogin}
                      onChange={(event) => setSenhaLogin(event.target.value)}
                      disabled={carregando}
                      required
                    />
                    <button
                      type="button"
                      className="login-form__mostrar-senha"
                      onClick={() => setMostrarSenhaLogin((valor) => !valor)}
                      aria-label={
                        mostrarSenhaLogin ? "Ocultar senha" : "Mostrar senha"
                      }
                      disabled={carregando}
                    >
                      <Icone
                        nome={mostrarSenhaLogin ? "eye-off" : "eye"}
                        tamanho={19}
                      />
                    </button>
                  </div>
                </div>

                <div className="login-form__opcoes">
                  <label className="login-form__lembrar">
                    <input
                      type="checkbox"
                      checked={lembrarAcesso}
                      onChange={(event) =>
                        setLembrarAcesso(event.target.checked)
                      }
                      disabled={carregando}
                    />
                    <span className="login-form__checkbox-visual" />
                    <span>Lembrar de mim</span>
                  </label>
                  <Link
                    href="/recuperar-senha"
                    className="login-form__recuperar"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="login-form__botao"
                  disabled={carregando}
                >
                  <span>
                    {carregando ? "Autenticando..." : "Entrar na minha conta"}
                  </span>
                  <Icone
                    nome={carregando ? "loader-circle" : "arrow-right"}
                    tamanho={19}
                  />
                </button>
              </form>

              <div className="login-formulario__cadastro">
                <span>Ainda não tem uma conta?</span>
                <button
                  type="button"
                  className="acesso-alternar"
                  onClick={() => trocarModo("cadastro")}
                  disabled={carregando}
                >
                  Criar minha conta
                </button>
              </div>
            </div>

            <footer className="login-formulario__rodape">
              <Icone nome="shield-check" tamanho={15} />
              <span>Universo Império · Acesso à sua conta</span>
            </footer>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="cadastro-page">
      <div className="cadastro-page__decoracao cadastro-page__decoracao--um" />
      <div className="cadastro-page__decoracao cadastro-page__decoracao--dois" />

      <section className="cadastro-container">
        <aside className="cadastro-apresentacao">
          <Link href="/" className="cadastro-apresentacao__voltar">
            <Icone nome="arrow-left" tamanho={17} />
            Voltar para a loja
          </Link>

          <div className="cadastro-apresentacao__conteudo">
            <span className="cadastro-apresentacao__legenda">
              FAÇA PARTE DO
            </span>
            <h1>
              Universo<strong>Império</strong>
            </h1>
            <div className="cadastro-apresentacao__linha" />
            <p>
              Crie sua conta e descubra um universo de possibilidades, produtos
              especiais e experiências pensadas para você.
            </p>

            <div className="cadastro-apresentacao__beneficios">
              <div className="cadastro-apresentacao__beneficio">
                <span className="cadastro-apresentacao__beneficio-icone">
                  <Icone nome="shopping-bag" tamanho={19} />
                </span>
                <div>
                  <strong>Uma experiência especial</strong>
                  <span>Encontre seus produtos favoritos.</span>
                </div>
              </div>
              <div className="cadastro-apresentacao__beneficio">
                <span className="cadastro-apresentacao__beneficio-icone">
                  <Icone nome="package-check" tamanho={19} />
                </span>
                <div>
                  <strong>Acompanhe seus pedidos</strong>
                  <span>Tenha acesso às informações das suas compras.</span>
                </div>
              </div>
              <div className="cadastro-apresentacao__beneficio">
                <span className="cadastro-apresentacao__beneficio-icone">
                  <Icone nome="heart" tamanho={19} />
                </span>
                <div>
                  <strong>Seus favoritos</strong>
                  <span>Guarde produtos que deseja encontrar depois.</span>
                </div>
              </div>
            </div>
          </div>
          <span className="cadastro-apresentacao__rodape">
            UNIVERSO IMPÉRIO
          </span>
        </aside>

        <section className="cadastro-formulario">
          <div className="cadastro-formulario__topo">
            <div className="cadastro-formulario__marca">
              <span>UNIVERSO</span>
              <strong>IMPÉRIO</strong>
            </div>
          </div>

          <div className="cadastro-formulario__conteudo">
            <div className="cadastro-formulario__titulo">
              <span className="cadastro-formulario__boas-vindas">
                CRIE SUA CONTA
              </span>
              <h2>Faça parte do nosso universo.</h2>
              <p>
                Preencha seus dados para começar sua experiência no Universo
                Império.
              </p>
            </div>

            <form className="cadastro-form" onSubmit={handleCadastro}>
              <div className="cadastro-form__grupo cadastro-form__grupo--total">
                <label htmlFor="cadastro-nome">Nome completo</label>
                <div className="cadastro-form__campo">
                  <span className="cadastro-form__icone">
                    <Icone nome="user-round" tamanho={19} />
                  </span>
                  <input
                    id="cadastro-nome"
                    type="text"
                    name="nome"
                    placeholder="Digite seu nome completo"
                    autoComplete="name"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    maxLength={150}
                    required
                    disabled={carregando}
                  />
                </div>
              </div>

              <div className="cadastro-form__grupo">
                <label htmlFor="cadastro-email">E-mail</label>
                <div className="cadastro-form__campo">
                  <span className="cadastro-form__icone">
                    <Icone nome="mail" tamanho={19} />
                  </span>
                  <input
                    id="cadastro-email"
                    type="email"
                    name="email"
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    value={emailCadastro}
                    onChange={(event) => setEmailCadastro(event.target.value)}
                    maxLength={190}
                    required
                    disabled={carregando}
                  />
                </div>
              </div>

              <div className="cadastro-form__grupo">
                <label htmlFor="cadastro-telefone">Telefone</label>
                <div className="cadastro-form__campo">
                  <span className="cadastro-form__icone">
                    <Icone nome="phone" tamanho={19} />
                  </span>
                  <input
                    id="cadastro-telefone"
                    type="tel"
                    name="telefone"
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={15}
                    value={telefone}
                    onChange={(event) =>
                      setTelefone(formatarTelefone(event.target.value))
                    }
                    required
                    disabled={carregando}
                  />
                </div>
              </div>

              <div className="cadastro-form__grupo">
                <label htmlFor="cadastro-senha">Senha</label>
                <div className="cadastro-form__campo">
                  <span className="cadastro-form__icone">
                    <Icone nome="lock-keyhole" tamanho={19} />
                  </span>
                  <input
                    id="cadastro-senha"
                    type={mostrarSenhaCadastro ? "text" : "password"}
                    name="senha"
                    placeholder="Crie uma senha"
                    autoComplete="new-password"
                    value={senhaCadastro}
                    onChange={(event) => setSenhaCadastro(event.target.value)}
                    minLength={8}
                    maxLength={4096}
                    required
                    disabled={carregando}
                  />
                  <button
                    type="button"
                    className="cadastro-form__mostrar-senha"
                    onClick={() => setMostrarSenhaCadastro((valor) => !valor)}
                    aria-label={
                      mostrarSenhaCadastro ? "Ocultar senha" : "Mostrar senha"
                    }
                    disabled={carregando}
                  >
                    <Icone
                      nome={mostrarSenhaCadastro ? "eye-off" : "eye"}
                      tamanho={19}
                    />
                  </button>
                </div>
                <span className="cadastro-form__ajuda">
                  Mínimo de 8 caracteres.
                </span>
              </div>

              <div className="cadastro-form__grupo">
                <label htmlFor="cadastro-confirmar-senha">
                  Confirmar senha
                </label>
                <div
                  className={`cadastro-form__campo ${
                    confirmacaoValida
                      ? "is-valid"
                      : confirmacaoInvalida
                        ? "is-invalid"
                        : ""
                  }`}
                >
                  <span className="cadastro-form__icone">
                    <Icone nome="lock-keyhole" tamanho={19} />
                  </span>
                  <input
                    id="cadastro-confirmar-senha"
                    type={mostrarConfirmacao ? "text" : "password"}
                    name="confirmarSenha"
                    placeholder="Repita sua senha"
                    autoComplete="new-password"
                    value={confirmarSenha}
                    onChange={(event) => setConfirmarSenha(event.target.value)}
                    minLength={8}
                    maxLength={4096}
                    required
                    disabled={carregando}
                  />
                  <button
                    type="button"
                    className="cadastro-form__mostrar-senha"
                    onClick={() => setMostrarConfirmacao((valor) => !valor)}
                    aria-label={
                      mostrarConfirmacao
                        ? "Ocultar confirmação"
                        : "Mostrar confirmação"
                    }
                    disabled={carregando}
                  >
                    <Icone
                      nome={mostrarConfirmacao ? "eye-off" : "eye"}
                      tamanho={19}
                    />
                  </button>
                </div>
                {confirmacaoValida && (
                  <span className="cadastro-form__estado cadastro-form__estado--sucesso">
                    <Icone nome="check-circle" tamanho={14} />
                    Senhas conferem.
                  </span>
                )}
                {confirmacaoInvalida && (
                  <span className="cadastro-form__estado cadastro-form__estado--erro">
                    <Icone nome="alert-circle" tamanho={14} />
                    As senhas não coincidem.
                  </span>
                )}
              </div>

              <label className="cadastro-form__termos">
                <input
                  type="checkbox"
                  checked={aceitarTermos}
                  onChange={(event) => setAceitarTermos(event.target.checked)}
                  required
                  disabled={carregando}
                />
                <span className="cadastro-form__checkbox-visual" />
                <span>
                  Li e aceito os <Link href="/termos">termos de uso</Link> e a{" "}
                  <Link href="/privacidade">política de privacidade</Link>.
                </span>
              </label>

              {erroCadastro && (
                <div className="cadastro-form__erro" role="alert">
                  <Icone nome="alert-circle" tamanho={17} />
                  <span>{erroCadastro}</span>
                </div>
              )}

              {sucessoCadastro && (
                <div
                  className="cadastro-form__estado cadastro-form__estado--sucesso"
                  role="status"
                >
                  <Icone nome="check-circle" tamanho={17} />
                  <span>{sucessoCadastro}</span>
                </div>
              )}

              <button
                type="submit"
                className="cadastro-form__botao"
                disabled={carregando}
              >
                <span>
                  {carregando ? "Criando sua conta..." : "Criar minha conta"}
                </span>
                <Icone
                  nome={carregando ? "loader-circle" : "arrow-right"}
                  tamanho={19}
                />
              </button>
            </form>

            <div className="cadastro-formulario__login">
              <span>Já possui uma conta?</span>
              <button
                type="button"
                className="acesso-alternar"
                onClick={() => trocarModo("login")}
                disabled={carregando}
              >
                Entrar na minha conta
              </button>
            </div>
          </div>

          <footer className="cadastro-formulario__rodape">
            <Icone nome="shield-check" tamanho={15} />
            <span>Universo Império · Criação de conta</span>
          </footer>
        </section>
      </section>
    </main>
  );
}
