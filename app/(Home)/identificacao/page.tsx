"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import CarrinhoService, {
  type ItemCarrinhoApi,
  type ResumoCarrinho,
} from "@/Services/Carrinho/CarrinhoService";
import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";
import ROTAS from "@/app/constants/rotas";

type Obj = Record<string, unknown>;
type Formulario = {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia: string;
};
type Endereco = {
  id: number;
  apelido: string;
  destinatario: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  referencia: string;
  principal: boolean;
};
type Cliente = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
};
type Item = {
  id: number;
  nome: string;
  imagem: string | null;
  quantidade: number;
  preco: number | null;
};

const STORAGE = "universo-imperio:checkout:identificacao:v1";
const CHAVE_CUPOM_APLICADO = "universo-imperio:cupom-aplicado:v1";

type CupomCheckout = {
  codigo: string;
  tipo: "percentual" | "fixo" | "frete_gratis";
  valor: number;
  desconto: number;
  subtotalBase: number;
};

const FORM_VAZIO: Formulario = {
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  referencia: "",
};
const ESTADOS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

function objeto(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function txt(...v: unknown[]) {
  for (const x of v)
    if (
      (typeof x === "string" && x.trim()) ||
      (typeof x === "number" && Number.isFinite(x))
    )
      return String(x).trim();
  return "";
}
function num(v: unknown): number | null {
  const n =
    typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function dig(v: string) {
  return v.replace(/\D/g, "");
}
function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function mascaraCep(v: string) {
  return dig(v)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}
function mascaraCpf(v: string) {
  return dig(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function resposta(v: unknown): Obj {
  let data: unknown = objeto(v) && "data" in v ? v.data : v;
  if (typeof data === "string")
    data = JSON.parse(data.replace(/\s*null\s*$/, "").trim());
  if (!objeto(data)) throw new Error("Resposta inválida da API.");
  if (data.sucesso === false)
    throw new Error(
      txt(data.mensagem) || "Não foi possível concluir a operação.",
    );
  return data;
}
function interno(v: Obj): Obj {
  const a = objeto(v.dados) ? v.dados : v;
  return objeto(a.dados) ? a.dados : a;
}
function sessao(): string {
  const cookie = document.cookie
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("ui_carrinho_sessao="));
  if (!cookie)
    throw new Error(
      "Não encontramos sua sessão de compra. Atualize a página e tente novamente.",
    );
  const id = decodeURIComponent(cookie.slice("ui_carrinho_sessao=".length));
  if (!id || id.length > 128)
    throw new Error("Identificação da sessão inválida.");
  return id;
}
function enderecoDe(v: unknown): Endereco | null {
  if (!objeto(v)) return null;
  const id = num(v.id_endereco ?? v.id);
  if (!id) return null;
  return {
    id,
    apelido: txt(v.apelido, "Endereço"),
    destinatario: txt(v.destinatario),
    cep: txt(v.cep),
    logradouro: txt(v.logradouro),
    numero: txt(v.numero),
    complemento: txt(v.complemento),
    bairro: txt(v.bairro),
    cidade: txt(v.cidade),
    estado: txt(v.estado).toUpperCase(),
    pais: txt(v.pais, "BR"),
    referencia: txt(v.referencia),
    principal: v.principal === true || v.principal === 1 || v.principal === "1",
  };
}
function enderecoLinha(e: Endereco) {
  return `${e.logradouro}, ${e.numero}${e.complemento ? `, ${e.complemento}` : ""} — ${e.bairro}, ${e.cidade}/${e.estado} · CEP ${e.cep}`;
}

export default function IdentificacaoPage() {
  const router = useRouter();
  const [form, setForm] = useState<Formulario>(FORM_VAZIO);
  const [itens, setItens] = useState<Item[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [enderecoId, setEnderecoId] = useState<number | "novo" | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [cupomCheckout, setCupomCheckout] = useState<CupomCheckout | null>(
    null,
  );

  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_CUPOM_APLICADO);
      if (!salvo) return;

      const d: unknown = JSON.parse(salvo);
      if (!objeto(d)) return;

      const codigo = txt(d.codigo);
      const tipo = txt(d.tipo).toLowerCase();
      const valor = num(d.valor);
      const desconto = num(d.desconto) ?? 0;
      const subtotalBase = num(d.subtotalBase);

      if (
        !codigo ||
        !["percentual", "fixo", "frete_gratis"].includes(tipo) ||
        valor === null ||
        subtotalBase === null
      ) {
        sessionStorage.removeItem(CHAVE_CUPOM_APLICADO);
        return;
      }

      setCupomCheckout({
        codigo,
        tipo: tipo as CupomCheckout["tipo"],
        valor,
        desconto,
        subtotalBase,
      });
    } catch (e) {
      console.warn("[IDENTIFICACAO] Não foi possível recuperar o cupom:", e);
      sessionStorage.removeItem(CHAVE_CUPOM_APLICADO);
    }
  }, []);

  const subtotal = useMemo(
    () => itens.reduce((s, i) => s + (i.preco ?? 0) * i.quantidade, 0),
    [itens],
  );
  const quantidade = useMemo(
    () => itens.reduce((s, i) => s + i.quantidade, 0),
    [itens],
  );
  const enderecoSelecionado =
    enderecos.find((e) => e.id === enderecoId) ?? null;
  const precisaNovoEndereco =
    !cliente || enderecos.length === 0 || enderecoId === "novo";

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resumo = (await CarrinhoService.buscar()) as ResumoCarrinho;
      const lista = (resumo.itens ?? []).map(
        (i: ItemCarrinhoApi, idx: number) => {
          const imagem = txt(i.imagem, i.url_imagem, i.imagem_url);
          return {
            id: num(i.id_item) ?? idx + 1,
            nome: txt(i.nome, i.nome_produto, "Produto"),
            imagem: imagem ? ImagemService.produto(imagem) : null,
            quantidade: Math.max(1, num(i.quantidade) ?? 1),
            preco: num(i.preco_unitario),
          };
        },
      );
      setItens(lista);
      if (!lista.length)
        throw new Error(
          "Seu carrinho está vazio. Adicione produtos para continuar.",
        );
      const r = resposta(
        await conexao.post(ROTAS.CHECKOUT.BUSCAR_CLIENTE, {
          identificador_sessao: sessao(),
        }),
      );
      const d = interno(r);
      const c = objeto(d.cliente) ? d.cliente : null;
      const rawAddresses = Array.isArray(d.enderecos) ? d.enderecos : [];
      const mapped = rawAddresses
        .map(enderecoDe)
        .filter((e): e is Endereco => Boolean(e));
      if (c) {
        const current: Cliente = {
          id: num(c.id_cliente ?? c.id) ?? 0,
          nome: txt(c.nome),
          email: txt(c.email),
          telefone: txt(c.telefone),
          documento: txt(c.documento),
        };
        if (!current.id)
          throw new Error(
            "O cadastro vinculado ao carrinho não possui um identificador válido.",
          );
        setCliente(current);
        setEnderecos(mapped);
        const principal = mapped.find((e) => e.principal) ?? mapped[0];
        setEnderecoId(principal?.id ?? "novo");
        setForm((f) => ({
          ...f,
          nome: current.nome,
          cpf: mascaraCpf(current.documento),
          email: current.email,
          telefone: current.telefone,
        }));
        if (!mapped.length)
          setAviso(
            "Encontramos seu cadastro, mas ele ainda não possui endereço. Preencha um novo endereço para continuar.",
          );
      } else {
        setCliente(null);
        setEnderecos([]);
        setEnderecoId("novo");
      }
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar seus dados.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function alterar(campo: keyof Formulario, valor: string) {
    if (campo === "cep") valor = mascaraCep(valor);
    if (campo === "cpf") valor = mascaraCpf(valor);
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErro("");
  }

  async function buscarCep() {
    const cep = dig(form.cep);
    if (cep.length !== 8) {
      setErro("Informe um CEP válido com 8 números.");
      return;
    }
    setConsultandoCep(true);
    setErro("");
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!r.ok) throw new Error("Não foi possível consultar o CEP.");
      const d: unknown = await r.json();
      if (!objeto(d) || d.erro)
        throw new Error("CEP não encontrado. Confira os números.");
      setForm((f) => ({
        ...f,
        cep: mascaraCep(cep),
        logradouro: txt(d.logradouro, f.logradouro),
        bairro: txt(d.bairro, f.bairro),
        cidade: txt(d.localidade, f.cidade),
        estado: txt(d.uf, f.estado).toUpperCase(),
      }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao consultar CEP.");
    } finally {
      setConsultandoCep(false);
    }
  }

  function validar(): string {
    if (precisaNovoEndereco) {
      if (!form.nome.trim() || form.nome.trim().length < 3)
        return "Informe seu nome completo.";
      if (dig(form.cpf).length !== 11) return "Informe um CPF com 11 números.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        return "Informe um e-mail válido.";
      if (![10, 11].includes(dig(form.telefone).length))
        return "Informe um telefone com DDD.";
      if (dig(form.cep).length !== 8) return "Informe um CEP válido.";
      if (
        !form.logradouro.trim() ||
        !form.numero.trim() ||
        !form.bairro.trim() ||
        !form.cidade.trim() ||
        !form.estado
      )
        return "Preencha todos os campos obrigatórios do endereço.";
    }
    if (cliente && !enderecoSelecionado && enderecoId !== "novo")
      return "Selecione um endereço de entrega.";
    return "";
  }

  async function continuar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }
    if (!itens.length || salvando) return;
    setSalvando(true);
    setErro("");
    try {
      const identificador_sessao = sessao();
      const payload: Obj = {
        identificador_sessao,
        ...(cliente ? { cliente_id: cliente.id } : {}),
        cliente:
          cliente && !precisaNovoEndereco
            ? {
                cliente_id: cliente.id,
                nome: cliente.nome,
                documento: cliente.documento,
                email: cliente.email,
                telefone: cliente.telefone,
              }
            : {
                ...(cliente ? { cliente_id: cliente.id } : {}),
                nome: form.nome.trim(),
                documento: dig(form.cpf),
                email: form.email.trim().toLowerCase(),
                telefone: dig(form.telefone),
              },
        endereco:
          enderecoSelecionado && !precisaNovoEndereco
            ? {
                endereco_id: enderecoSelecionado.id,
                tipo: "entrega",
                destinatario:
                  enderecoSelecionado.destinatario || cliente?.nome || "",
                cep: dig(enderecoSelecionado.cep),
                logradouro: enderecoSelecionado.logradouro,
                numero: enderecoSelecionado.numero,
                complemento: enderecoSelecionado.complemento,
                bairro: enderecoSelecionado.bairro,
                cidade: enderecoSelecionado.cidade,
                estado: enderecoSelecionado.estado,
                pais: enderecoSelecionado.pais,
                referencia: enderecoSelecionado.referencia,
              }
            : {
                tipo: "entrega",
                destinatario: form.nome.trim(),
                apelido: "Entrega",
                cep: dig(form.cep),
                logradouro: form.logradouro.trim(),
                numero: form.numero.trim(),
                complemento: form.complemento.trim() || null,
                bairro: form.bairro.trim(),
                cidade: form.cidade.trim(),
                estado: form.estado,
                pais: "BR",
                referencia: form.referencia.trim() || null,
                principal: true,
              },
      };
      const retorno = resposta(
        await conexao.post(ROTAS.CHECKOUT.IDENTIFICACAO, payload),
      );
      const dados = interno(retorno);
      const checkout = {
        identificador_sessao,
        cliente: {
          nome: cliente?.nome ?? form.nome.trim(),
          cpf: cliente?.documento ?? dig(form.cpf),
          documento: cliente?.documento ?? dig(form.cpf),
          email: cliente?.email ?? form.email.trim().toLowerCase(),
          telefone: cliente?.telefone ?? dig(form.telefone),
          cliente_id: num(dados.cliente_id) ?? cliente?.id ?? null,
        },
        endereco: payload.endereco,
        cupom_aplicado: cupomCheckout
          ? {
              codigo: cupomCheckout.codigo,
              tipo: cupomCheckout.tipo,
              valor: cupomCheckout.valor,
              desconto: cupomCheckout.desconto,
              subtotalBase: cupomCheckout.subtotalBase,
            }
          : null,
        checkout_backend: {
          cliente_id: num(dados.cliente_id) ?? cliente?.id ?? null,
          endereco_id:
            num(dados.endereco_id) ?? enderecoSelecionado?.id ?? null,
          carrinho_id: num(dados.carrinho_id) ?? null,
        },
        atualizado_em: new Date().toISOString(),
      };
      sessionStorage.setItem(STORAGE, JSON.stringify(checkout));
      router.push(ROTAS.PAGINAS.LOJA.PAGAMENTO);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível salvar sua identificação.",
      );
    } finally {
      setSalvando(false);
    }
  }

  const campos = (keys: (keyof Formulario)[]) =>
    keys.map((key) => {
      const labels: Record<keyof Formulario, string> = {
        nome: "Nome completo",
        cpf: "CPF",
        email: "E-mail",
        telefone: "Telefone",
        cep: "CEP",
        logradouro: "Endereço",
        numero: "Número",
        complemento: "Complemento",
        bairro: "Bairro",
        cidade: "Cidade",
        estado: "Estado",
        referencia: "Ponto de referência",
      };
      const required = [
        "nome",
        "cpf",
        "email",
        "telefone",
        "cep",
        "logradouro",
        "numero",
        "bairro",
        "cidade",
        "estado",
      ].includes(key);
      return (
        <label className="ident-field" key={key}>
          <span>
            {labels[key]}
            {required && <i> *</i>}
          </span>
          {key === "estado" ? (
            <select
              value={form.estado}
              onChange={(e) => alterar(key, e.target.value)}
              required={required}
            >
              <option value="">Selecione</option>
              {ESTADOS.map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
            </select>
          ) : (
            <input
              value={form[key]}
              onChange={(e) => alterar(key, e.target.value)}
              required={required}
              type={key === "email" ? "email" : "text"}
              inputMode={
                ["cpf", "cep", "telefone"].includes(key) ? "numeric" : "text"
              }
              autoComplete={
                (
                  {
                    nome: "name",
                    cpf: "off",
                    email: "email",
                    telefone: "tel",
                    cep: "postal-code",
                    logradouro: "address-line1",
                    numero: "address-line2",
                    complemento: "address-line2",
                    bairro: "address-level3",
                    cidade: "address-level2",
                    estado: "address-level1",
                    referencia: "off",
                  } as Record<string, string>
                )[key]
              }
              placeholder={
                key === "cep"
                  ? "00000-000"
                  : key === "numero"
                    ? "Número ou S/N"
                    : labels[key]
              }
            />
          )}
        </label>
      );
    });

  return (
    <main className="ident-page">
      <div className="ident-container">
        <nav className="ident-breadcrumb">
          <Link href={ROTAS.PAGINAS.LOJA.CARRINHO}>Carrinho</Link>
          <span>/</span>
          <strong>Identificação e entrega</strong>
        </nav>
        <header className="ident-header">
          <div>
            <span className="ident-kicker">QUASE LÁ</span>
            <h1>Para onde enviamos?</h1>
            <p>
              Confirme seus dados e escolha o endereço de entrega para
              continuar.
            </p>
          </div>
          <div className="ident-steps">
            <span className="done">
              <Check size={14} /> Carrinho
            </span>
            <i />
            <span className="active">02 · Identificação</span>
            <i />
            <span>03 · Pagamento</span>
          </div>
        </header>

        {carregando ? (
          <div className="ident-loading">
            <LoaderCircle className="spin" size={25} /> Consultando seu carrinho
            e seus endereços...
          </div>
        ) : (
          <div className="ident-grid">
            <form className="ident-main" onSubmit={continuar}>
              <section className="ident-card">
                <div className="ident-card-title">
                  <span>
                    <UserRound size={19} />
                  </span>
                  <div>
                    <small>SEUS DADOS</small>
                    <h2>Identificação do comprador</h2>
                  </div>
                </div>
                {cliente ? (
                  <div className="ident-customer">
                    <div>
                      <strong>{cliente.nome}</strong>
                      <p>
                        {cliente.email} ·{" "}
                        {cliente.telefone || "Telefone não informado"}
                      </p>
                      <small>
                        CPF{" "}
                        {cliente.documento
                          ? `•••.•••.•••-${cliente.documento.slice(-2)}`
                          : "não informado"}
                      </small>
                    </div>
                    <span>
                      <Check size={15} /> Cadastro localizado
                    </span>
                  </div>
                ) : (
                  <div className="ident-fields">
                    {campos(["nome", "cpf", "email", "telefone"])}
                  </div>
                )}
              </section>

              <section className="ident-card">
                <div className="ident-card-title">
                  <span>
                    <MapPin size={19} />
                  </span>
                  <div>
                    <small>ENTREGA</small>
                    <h2>Endereço de entrega</h2>
                  </div>
                </div>
                {cliente && enderecos.length > 0 && (
                  <div className="ident-address-list">
                    {enderecos.map((e) => (
                      <button
                        type="button"
                        key={e.id}
                        className={`ident-address ${enderecoId === e.id ? "selected" : ""}`}
                        onClick={() => {
                          setEnderecoId(e.id);
                          setErro("");
                        }}
                      >
                        <span className="ident-radio">
                          {enderecoId === e.id && <i />}
                        </span>
                        <span className="ident-address-copy">
                          <strong>{e.apelido || "Endereço"}</strong>
                          <small>{enderecoLinha(e)}</small>
                          {e.destinatario && (
                            <small>Destinatário: {e.destinatario}</small>
                          )}
                        </span>
                        {e.principal && <em>Principal</em>}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`ident-new-address ${enderecoId === "novo" ? "selected" : ""}`}
                      onClick={() => {
                        setEnderecoId("novo");
                        setAviso("");
                        setErro("");
                      }}
                    >
                      <Plus size={16} /> Cadastrar outro endereço
                    </button>
                  </div>
                )}
                {precisaNovoEndereco && (
                  <div className="ident-new-form">
                    {cliente && (
                      <p className="ident-inline-note">
                        O endereço será cadastrado no seu cliente existente.
                      </p>
                    )}
                    <div className="ident-fields">
                      {!cliente && campos(["cep"])}
                      {cliente && campos(["cep"])}
                      <div className="ident-cep-action">
                        <button
                          type="button"
                          onClick={() => void buscarCep()}
                          disabled={consultandoCep}
                        >
                          {consultandoCep ? (
                            <LoaderCircle size={15} className="spin" />
                          ) : (
                            <MapPin size={15} />
                          )}{" "}
                          Buscar CEP
                        </button>
                      </div>
                      {campos([
                        "logradouro",
                        "numero",
                        "complemento",
                        "bairro",
                        "cidade",
                        "estado",
                        "referencia",
                      ])}
                    </div>
                  </div>
                )}
              </section>

              {aviso && (
                <p className="ident-notice">
                  <AlertCircle size={16} />
                  {aviso}
                </p>
              )}
              {erro && (
                <p className="ident-error" role="alert">
                  <AlertCircle size={17} />
                  {erro}
                </p>
              )}
              <div className="ident-actions">
                <Link href={ROTAS.PAGINAS.LOJA.CARRINHO}>
                  <ArrowLeft size={16} /> Voltar ao carrinho
                </Link>
                <button type="submit" disabled={salvando || !itens.length}>
                  {salvando ? (
                    <>
                      <LoaderCircle size={17} className="spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      Continuar para pagamento <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
              <p className="ident-privacy">
                <ShieldCheck size={15} /> Seus dados são utilizados somente para
                processar e entregar seu pedido.
              </p>
            </form>

            <aside className="ident-aside">
              <section className="ident-summary">
                <div className="ident-summary-heading">
                  <div>
                    <small>SUA ESCOLHA</small>
                    <h2>Resumo da compra</h2>
                  </div>
                  <span>
                    {quantidade} {quantidade === 1 ? "item" : "itens"}
                  </span>
                </div>
                <div className="ident-products">
                  {itens.map((i) => (
                    <div className="ident-product" key={i.id}>
                      <div className="ident-thumb">
                        {i.imagem ? (
                          <img src={i.imagem} alt={i.nome} />
                        ) : (
                          <ShoppingBag size={20} />
                        )}
                        <b>{i.quantidade}</b>
                      </div>
                      <div>
                        <strong>{i.nome}</strong>
                        <small>
                          {i.preco === null
                            ? "Preço indisponível"
                            : brl(i.preco)}
                        </small>
                      </div>
                      <b>
                        {i.preco === null ? "—" : brl(i.preco * i.quantidade)}
                      </b>
                    </div>
                  ))}
                </div>
                <div className="ident-total-line">
                  <span>Subtotal</span>
                  <strong>{brl(subtotal)}</strong>
                </div>
                {cupomCheckout && (
                  <div className="ident-total-line">
                    <span>Cupom aplicado</span>
                    <strong>{cupomCheckout.codigo}</strong>
                  </div>
                )}
                {cupomCheckout && cupomCheckout.desconto > 0 && (
                  <div className="ident-total-line">
                    <span>Desconto</span>
                    <strong>- {brl(cupomCheckout.desconto)}</strong>
                  </div>
                )}
                <div className="ident-total-line">
                  <span>Frete</span>
                  <strong>
                    {cupomCheckout?.tipo === "frete_gratis"
                      ? "Grátis*"
                      : "A calcular"}
                  </strong>
                </div>
                <div className="ident-grand-total">
                  <span>Total parcial</span>
                  <strong>
                    {brl(
                      Math.max(0, subtotal - (cupomCheckout?.desconto ?? 0)),
                    )}
                  </strong>
                </div>
                <p className="ident-freight-note">
                  <Truck size={15} />{" "}
                  {cupomCheckout?.tipo === "frete_gratis"
                    ? "Cupom de frete grátis recebido. O benefício será confirmado no cálculo da entrega."
                    : "O frete será calculado após confirmar o endereço."}
                </p>
              </section>
              <div className="ident-safe">
                <ShieldCheck size={18} />
                <div>
                  <strong>Compra protegida</strong>
                  <small>Seus dados são tratados com segurança.</small>
                </div>
              </div>
            </aside>
          </div>
        )}
        <footer className="ident-footer">
          UNIVERSO IMPÉRIO <span /> Presentes & decoração · Detalhes que
          encantam
        </footer>
      </div>
    </main>
  );
}
