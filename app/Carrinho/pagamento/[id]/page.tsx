"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import { InicioApi } from "@/services/api/api";

import {
  FiLock,
  FiCopy,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiRefreshCw,
  FiCreditCard,
  FiSmartphone,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";

import styles from "./pagamento.module.css";

type Pedido = {
  id_pedido?: number;
  carrinho_id?: number;
  usuario_id?: number;
  status_id?: number;
  valor_produtos?: number | string;
  valor_desconto?: number | string;
  valor_frete?: number | string;
  valor_total?: number | string;
  status_pagamento?: string;
  payment_id?: string | null;
  external_reference?: string | null;
};

type Usuario = {
  id_usuario?: number;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
};

type ApiPedidoResponse = {
  status?: number;
  mensagem?: string;
  dados?: {
    pedido?: Pedido;
    usuario?: Usuario;
  };
  pedido?: Pedido;
  usuario?: Usuario;
};

type ApiPixResponse = {
  status?: number;
  mensagem?: string;
  dados?: {
    pagamento_id?: number | string;
    status?: string;
    pix?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  pagamento_id?: number | string;
  pix?: {
    qr_code?: string;
    qr_code_base64?: string;
    ticket_url?: string;
  };
};

function normalizarNumero(valor: unknown): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === "string") {
    const limpo = valor.replace(/\./g, "").replace(",", ".");
    const numero = Number(limpo);
    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

function formatarMoeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizarNumero(valor));
}

function getRespostaPedido(data: ApiPedidoResponse): Pedido | null {
  return data?.dados?.pedido ?? data?.pedido ?? null;
}

function getRespostaUsuario(data: ApiPedidoResponse): Usuario | null {
  return data?.dados?.usuario ?? data?.usuario ?? null;
}

function getQrCodePix(data: ApiPixResponse): string {
  return data?.dados?.pix?.qr_code ?? data?.pix?.qr_code ?? "";
}

export default function PagamentoPage() {
  const params = useParams();
  const pedidoId = params?.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingPix, setLoadingPix] = useState(false);
  const [loadingCartao, setLoadingCartao] = useState(false);

  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);

  const [metodo, setMetodo] = useState<"pix" | "cartao">("pix");

  const [cartao, setCartao] = useState({
    numero: "",
    nome: "",
    mes: "",
    ano: "",
    cvv: "",
    parcelas: "1",
  });

  const valorTotal = useMemo(() => {
    return normalizarNumero(pedido?.valor_total ?? 0);
  }, [pedido]);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);

        const [pedidoRes, meRes] = await Promise.all([
          InicioApi.get(`/pedido/${pedidoId}`, { withCredentials: true }),
          InicioApi.get("/me", { withCredentials: true }),
        ]);

        const pedidoData = getRespostaPedido(pedidoRes.data as ApiPedidoResponse);
        const usuarioData = getRespostaUsuario(meRes.data as ApiPedidoResponse);

        console.log("📥 PEDIDO:", pedidoData);
        console.log("👤 USUÁRIO:", usuarioData);

        setPedido(pedidoData);
        setUsuario(usuarioData);
      } catch (error) {
        console.error("Erro ao carregar pagamento:", error);
      } finally {
        setLoading(false);
      }
    }

    if (pedidoId) carregar();
  }, [pedidoId]);

  async function gerarPix() {
    try {
      setLoadingPix(true);
      setCopiado(false);

      if (!pedido || !usuario) {
        alert("Pedido ou usuário não carregado.");
        return;
      }

      const payload = {
        id_pedido: pedido.id_pedido,
        usuario_id: usuario.id_usuario,
        valor: valorTotal,
        email: usuario.email,
        nome: usuario.nome,
        sobrenome: "Checkout",
        cpf: (usuario.cpf ?? "").replace(/\D/g, ""),
      };

      console.log("📤 PIX PAYLOAD FINAL:", payload);

      const res = await InicioApi.post<ApiPixResponse>(
        "/mercado/pagamento/pix",
        payload,
        { withCredentials: true }
      );

      console.log("✅ PIX RESPONSE:", res.data);

      const qr = getQrCodePix(res.data);

      if (!qr) {
        alert("Não foi possível gerar o código PIX.");
        return;
      }

      setPixCode(qr);
    } catch (error: any) {
      console.error("❌ ERRO PIX:", error?.response?.data);
      alert(error?.response?.data?.dados?.erro || "Erro ao gerar PIX");
    } finally {
      setLoadingPix(false);
    }
  }

  async function pagarCartao() {
    try {
      setLoadingCartao(true);

      if (!pedido || !usuario) {
        alert("Pedido ou usuário não carregado.");
        return;
      }

      const payload = {
        id_pedido: pedido.id_pedido,
        usuario_id: usuario.id_usuario,
        valor: valorTotal,
        payment_method_id: "visa",
        token: "TOKEN_GERADO_PELO_BRICK_AQUI",
        parcelas: Number(cartao.parcelas || 1),
      };

      console.log("📤 CARTÃO PAYLOAD:", payload);

      const res = await InicioApi.post("/mercado/pagamento/cartao", payload, {
        withCredentials: true,
      });

      console.log("✅ CARTÃO RESPONSE:", res.data);

      alert("Pagamento com cartão enviado.");
    } catch (error: any) {
      console.error("❌ ERRO CARTÃO:", error?.response?.data);
      alert(error?.response?.data?.dados?.erro || "Erro ao processar cartão");
    } finally {
      setLoadingCartao(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;
    await navigator.clipboard.writeText(pixCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <div className={styles.shell}>
            <div className={`${styles.card} ${styles.centerCard}`}>
              <FiClock size={28} />
              <p>Carregando pagamento...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!pedido) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <div className={styles.shell}>
            <div className={`${styles.card} ${styles.centerCard}`}>
              <h1>Pedido não encontrado</h1>
              <p>Não conseguimos localizar o pedido para pagamento.</p>
              <Link href="/Carrinho" className={styles.secondaryBtn}>
                <FiArrowLeft /> Voltar ao carrinho
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={`${styles.hero} ${styles.card}`}>
            <div>
              <div className={styles.eyebrow}>
                <FiLock />
                <span>Pagamento seguro</span>
              </div>

              <h1>Finalize seu pedido</h1>
              <p>Escolha PIX ou cartão e conclua sua compra com segurança.</p>
            </div>

            <div className={styles.badge}>Pedido #{pedido.id_pedido}</div>
          </header>

          <div className={styles.grid}>
            <section className={styles.mainCol}>
              <div className={`${styles.card} ${styles.payCard}`}>
                <div className={styles.cardHeader}>
                  <h2>Resumo do pagamento</h2>
                  <p>Confirme os dados antes de pagar.</p>
                </div>

                <div className={styles.buyerBox}>
                  <div className={styles.avatar}>
                    <Image
                      src="/images/sem-imagem.png"
                      alt="Usuário"
                      width={56}
                      height={56}
                    />
                  </div>

                  <div className={styles.buyerInfo}>
                    <strong>{usuario?.nome || "Usuário"}</strong>
                    <span>{usuario?.email || "-"}</span>
                    <span>CPF: {(usuario?.cpf || "-").toString()}</span>
                  </div>
                </div>

                <div className={styles.summaryMini}>
                  <div className={styles.row}>
                    <span>Produtos</span>
                    <strong>{formatarMoeda(pedido.valor_produtos)}</strong>
                  </div>

                  <div className={styles.row}>
                    <span>Frete</span>
                    <strong>{formatarMoeda(pedido.valor_frete ?? 0)}</strong>
                  </div>

                  <div className={styles.row}>
                    <span>Desconto</span>
                    <strong>- {formatarMoeda(pedido.valor_desconto ?? 0)}</strong>
                  </div>

                  <div className={styles.totalRow}>
                    <span>Total</span>
                    <strong>{formatarMoeda(pedido.valor_total)}</strong>
                  </div>
                </div>

                <div className={styles.methods}>
                  <button
                    type="button"
                    className={`${styles.methodBtn} ${
                      metodo === "pix" ? styles.active : ""
                    }`}
                    onClick={() => setMetodo("pix")}
                  >
                    <FiSmartphone />
                    PIX
                  </button>

                  <button
                    type="button"
                    className={`${styles.methodBtn} ${
                      metodo === "cartao" ? styles.active : ""
                    }`}
                    onClick={() => setMetodo("cartao")}
                  >
                    <FiCreditCard />
                    Cartão
                  </button>
                </div>

                <div className={styles.panel}>
                  {metodo === "pix" ? (
                    <div className={styles.methodBox}>
                      <div className={styles.actions}>
                        <Link href="/Carrinho" className={styles.secondaryBtn}>
                          <FiArrowLeft />
                          Voltar ao carrinho
                        </Link>

                        <button
                          className={styles.primaryBtn}
                          onClick={gerarPix}
                          disabled={loadingPix}
                        >
                          {loadingPix ? "Gerando PIX..." : "Gerar PIX"}
                          <FiRefreshCw />
                        </button>
                      </div>

                      <div className={styles.note}>
                        <FiShield />
                        <span>Seu pagamento por PIX é processado com segurança.</span>
                      </div>

                      {pixCode ? (
                        <div className={styles.pixResult}>
                          <div className={styles.qrBox}>
                            <QRCodeCanvas value={pixCode} size={220} />
                          </div>

                          <textarea
                            className={styles.pixTextarea}
                            value={pixCode}
                            readOnly
                          />

                          <button className={styles.copyBtn} onClick={copiarPix}>
                            <FiCopy />
                            {copiado ? "Copiado" : "Copiar código PIX"}
                          </button>
                        </div>
                      ) : (
                        <div className={styles.placeholder}>
                          <FiCheckCircle size={30} />
                          <p>O QR Code vai aparecer aqui após gerar o PIX.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.methodBox}>
                      <div className={styles.formGrid}>
                        <label className={styles.field}>
                          <span>Número do cartão</span>
                          <input
                            value={cartao.numero}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, numero: e.target.value }))
                            }
                            placeholder="0000 0000 0000 0000"
                          />
                        </label>

                        <label className={styles.field}>
                          <span>Nome no cartão</span>
                          <input
                            value={cartao.nome}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, nome: e.target.value }))
                            }
                            placeholder="Como aparece no cartão"
                          />
                        </label>
                      </div>

                      <div className={`${styles.formGrid} ${styles.formGrid3}`}>
                        <label className={styles.field}>
                          <span>Mês</span>
                          <input
                            value={cartao.mes}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, mes: e.target.value }))
                            }
                            placeholder="MM"
                          />
                        </label>

                        <label className={styles.field}>
                          <span>Ano</span>
                          <input
                            value={cartao.ano}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, ano: e.target.value }))
                            }
                            placeholder="AA"
                          />
                        </label>

                        <label className={styles.field}>
                          <span>CVV</span>
                          <input
                            value={cartao.cvv}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, cvv: e.target.value }))
                            }
                            placeholder="123"
                          />
                        </label>
                      </div>

                      <div className={styles.formGrid}>
                        <label className={styles.field}>
                          <span>Parcelas</span>
                          <select
                            value={cartao.parcelas}
                            onChange={(e) =>
                              setCartao((prev) => ({ ...prev, parcelas: e.target.value }))
                            }
                          >
                            <option value="1">1x sem juros</option>
                            <option value="2">2x sem juros</option>
                            <option value="3">3x sem juros</option>
                          </select>
                        </label>

                        <div className={`${styles.field} ${styles.staticField}`}>
                          <span>Total</span>
                          <strong>{formatarMoeda(pedido.valor_total)}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`${styles.primaryBtn} ${styles.full}`}
                        onClick={pagarCartao}
                        disabled={loadingCartao}
                      >
                        {loadingCartao ? "Processando cartão..." : "Pagar com cartão"}
                        <FiCreditCard />
                      </button>

                      <p className={styles.warning}>
                        O cartão em produção precisa de token gerado no front pelo Mercado Pago.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className={styles.sideCol}>
              <div className={`${styles.card} ${styles.noticeCard}`}>
                <FiClock />
                <div>
                  <strong>Aguardando pagamento</strong>
                  <p>
                    Depois de pagar, o status do pedido pode ser atualizado pelo webhook.
                  </p>
                </div>
              </div>

              <div className={`${styles.card} ${styles.noticeCard}`}>
                <FiAlertCircle />
                <div>
                  <strong>Dica importante</strong>
                  <p>
                    O cartão em produção precisa de tokenização via Mercado Pago Brick.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}