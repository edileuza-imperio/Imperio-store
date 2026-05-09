"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-toastify";

import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import { InicioApi } from "@/services/api/api";

import {
  FiCopy,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiRefreshCw,
  FiCreditCard,
  FiSmartphone,
  FiUser,
  FiPackage,
  FiTruck,
  FiTag,
  FiShield,
} from "react-icons/fi";

import {
  ApiPedidoResponse,
  ApiPixResponse,
  ApiVerificarPagamentoResponse,
  formatarMoeda,
  normalizarNumero,
  Pedido,
  Usuario,
} from "@/components/Bibioteca/carrinho";

function isStatusFinalizado(status: string) {
  const s = status.toLowerCase();
  return (
    s.includes("approved") ||
    s.includes("aprovado") ||
    s.includes("paid") ||
    s.includes("pago") ||
    s.includes("pedidos") ||
    s.includes("finalizado") ||
    s.includes("complete")
  );
}

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();
  const redirectedRef = useRef(false);

  const pedidoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [loadingPix, setLoadingPix] = useState(false);
  const [loadingCartao, setLoadingCartao] = useState(false);

  const [cartao, setCartao] = useState({
    numero: "",
    nome: "",
    mes: "",
    ano: "",
    cvv: "",
    parcelas: "1",
  });

  const statusPagamento = useMemo(() => {
    const status = String(
      pedido?.status_pagamento ?? pedido?.status ?? ""
    ).toLowerCase();

    if (isStatusFinalizado(status)) return "approved";
    return "pending";
  }, [pedido]);

  useEffect(() => {
    if (!pedidoId) {
      toast.error("Pedido inválido.");
      router.replace("/Carrinho");
      return;
    }

    carregarPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  useEffect(() => {
    if (statusPagamento === "approved" && !redirectedRef.current) {
      redirectedRef.current = true;
      toast.info("Pedido já está finalizado.");
      router.replace("/Pedidos");
    }
  }, [statusPagamento, router]);

  async function carregarPedido() {
    try {
      setLoading(true);

      const [pedidoRes, meRes] = await Promise.all([
        InicioApi.get<ApiPedidoResponse>(`/pedido/${pedidoId}`, {
          withCredentials: true,
        }),
        InicioApi.get<ApiPedidoResponse>("/me", {
          withCredentials: true,
        }),
      ]);

      const pedidoData =
        pedidoRes.data?.dados?.pedido ??
        pedidoRes.data?.pedido ??
        null;

      const usuarioData =
        meRes.data?.dados?.usuario ??
        meRes.data?.usuario ??
        null;

      setPedido(pedidoData);
      setUsuario(usuarioData);

      const status = String(
        pedidoData?.status_pagamento ?? pedidoData?.status ?? ""
      ).toLowerCase();

      if (isStatusFinalizado(status)) {
        redirectedRef.current = true;
        router.replace("/Pedidos");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar pedido.");
    } finally {
      setLoading(false);
    }
  }

  async function gerarPix() {
    try {
      if (statusPagamento === "approved") {
        toast.info("Este pedido já está pago.");
        router.replace("/Pedidos");
        return;
      }

      if (!pedido || !usuario) {
        toast.warning("Os dados do pedido ainda não carregaram.");
        return;
      }

      if (!pedido.id_pedido) {
        toast.error("Pedido inválido.");
        return;
      }

      if (!usuario.email || !usuario.nome) {
        toast.error("Dados do usuário incompletos.");
        return;
      }

      setLoadingPix(true);

      const payload = {
        id_pedido: Number(pedido.id_pedido),
        usuario_id: Number(usuario.id_usuario),
        valor: Number(normalizarNumero(pedido.valor_total ?? 0)),
        email: usuario.email,
        nome: usuario.nome,
        cpf: (usuario.cpf ?? "").replace(/\D/g, ""),
      };

      const res = await InicioApi.post<ApiPixResponse>(
        "/mercado/pagamento/pix",
        payload,
        {
          withCredentials: true,
        }
      );

      const qr =
        res.data?.dados?.pix?.qr_code ??
        res.data?.pix?.qr_code ??
        "";

      if (!qr) {
        toast.error("O PIX não retornou um código válido.");
        return;
      }

      setPixCode(qr);
      toast.success("PIX gerado com sucesso.");
    } catch (err: any) {
      console.error("Erro ao gerar PIX:", err);

      const status = err?.response?.status;
      const msg = String(err?.response?.data?.message ?? "").toLowerCase();

      if (
        status === 400 &&
        (msg.includes("pedido") ||
          msg.includes("pago") ||
          msg.includes("finalizado") ||
          msg.includes("pedido já"))
      ) {
        toast.info("Esse pedido já foi finalizado.");
        router.replace("/Pedidos");
        return;
      }

      toast.error(
        err?.response?.data?.message || "Erro ao gerar PIX."
      );
    } finally {
      setLoadingPix(false);
    }
  }

  async function copiarPix() {
    if (!pixCode) return;

    try {
      await navigator.clipboard.writeText(pixCode);
      setCopiado(true);
      toast.success("Código PIX copiado.");
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  }

  async function verificarPagamento() {
    try {
      if (!pedidoId) {
        toast.error("Pedido inválido.");
        return;
      }

      const res = await InicioApi.post<ApiVerificarPagamentoResponse>(
        "/mercado/pagamento/verificar",
        {
          id_pedido: Number(pedidoId),
        },
        {
          withCredentials: true,
        }
      );

      const pedidoAtualizado =
        res.data?.dados?.pedido ??
        res.data?.pedido ??
        null;

      if (pedidoAtualizado) {
        setPedido(pedidoAtualizado);
      }

      const status = String(
        pedidoAtualizado?.status_pagamento ??
          pedidoAtualizado?.status ??
          ""
      ).toLowerCase();

      if (isStatusFinalizado(status)) {
        toast.success("Pagamento aprovado.");
        setTimeout(() => {
          router.replace("/Pedidos");
        }, 900);
      } else {
        toast.info("Pagamento ainda pendente.");
      }
    } catch (err: any) {
      console.error(err);

      const status = err?.response?.status;
      const msg = String(err?.response?.data?.message ?? "").toLowerCase();

      if (
        status === 400 &&
        (msg.includes("pedido") ||
          msg.includes("pago") ||
          msg.includes("finalizado"))
      ) {
        toast.info("Este pedido já está finalizado.");
        router.replace("/Pedidos");
        return;
      }

      toast.error(
        err?.response?.data?.message || "Erro ao verificar pagamento."
      );
    }
  }

  async function pagarCartao() {
    try {
      if (statusPagamento === "approved") {
        toast.info("Este pedido já está pago.");
        router.replace("/Pedidos");
        return;
      }

      if (
        !cartao.numero ||
        !cartao.nome ||
        !cartao.mes ||
        !cartao.ano ||
        !cartao.cvv
      ) {
        toast.warning("Preencha todos os campos do cartão.");
        return;
      }

      toast.info("Integração do cartão ainda não foi ativada neste fluxo.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar cartão.");
    } finally {
      setLoadingCartao(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="loadingPage">
          <div className="loadingCard">
            <FiClock size={40} />
            <h2>Carregando pagamento</h2>
            <p>Aguarde um instante...</p>
          </div>
        </main>

        <Footer />

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: linear-gradient(135deg, #f7e6e4 0%, #f5efee 50%, #f7e7e8 100%);
            font-family: Inter, sans-serif;
          }

          .loadingPage {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 120px 20px;
          }

          .loadingCard {
            width: 100%;
            max-width: 420px;
            padding: 42px;
            border-radius: 34px;
            text-align: center;
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(20px);
            color: #6b3944;
            box-shadow: 0 25px 80px rgba(108, 42, 55, 0.12);
          }

          .loadingCard h2 {
            margin: 18px 0 8px;
          }

          .loadingCard p {
            margin: 0;
            color: #7b5960;
          }
        `}</style>
      </>
    );
  }

  const nomeUsuario = usuario?.nome?.trim() || "Cliente";
  const inicial = nomeUsuario.charAt(0).toUpperCase();

  return (
    <>
      <Navbar />

      <main className="checkout">
        <div className="bgBlur blur1" />
        <div className="bgBlur blur2" />

        <div className="topHero">
          <div className="heroTag">
            <FiShield />
            Ambiente seguro
          </div>

          <h1>Finalizar pagamento</h1>
          <p>
            Experiência premium, rápida e elegante para concluir seu pedido.
          </p>
        </div>

        <div className={`statusBadge ${statusPagamento === "approved" ? "ok" : "pending"}`}>
          {statusPagamento === "approved" ? "Pagamento aprovado" : "Aguardando pagamento"}
        </div>

        <div className="layout">
          <aside className="glass leftSide">
            <div className="cardTitle">
              <FiUser />
              Cliente
            </div>

            <div className="userBox">
              <div className="avatar">
                <span>{inicial}</span>
              </div>

              <div className="userData">
                <strong>{usuario?.nome || "Carregando..."}</strong>
                <span>{usuario?.email || " "}</span>
              </div>
            </div>

            <div className="infoList">
              <div className="infoItem">
                <div className="infoLeft">
                  <FiPackage />
                  <span>Pedido</span>
                </div>

                <strong>#{pedido?.id_pedido ?? "-"}</strong>
              </div>

              <div className="infoItem">
                <div className="infoLeft">
                  <FiTruck />
                  <span>Frete</span>
                </div>

                <strong>{formatarMoeda(pedido?.valor_frete)}</strong>
              </div>

              <div className="infoItem">
                <div className="infoLeft">
                  <FiTag />
                  <span>Desconto</span>
                </div>

                <strong>- {formatarMoeda(pedido?.valor_desconto)}</strong>
              </div>
            </div>

            <div className="totalBox">
              <span>Total</span>
              <strong>{formatarMoeda(pedido?.valor_total)}</strong>
            </div>

            <Link href="/Carrinho" className="backBtn">
              <FiArrowLeft />
              Voltar ao carrinho
            </Link>
          </aside>

          <section className="glass centerSide">
            <div className="pixHeader">
              <div className="pixIcon">
                <FiSmartphone />
              </div>

              <div>
                <h2>PIX</h2>
                <p>Escaneie o QR Code ou copie o código.</p>
              </div>
            </div>

            {!pixCode ? (
              <button
                className="primaryBtn"
                onClick={gerarPix}
                disabled={loadingPix || statusPagamento === "approved"}
              >
                {loadingPix ? "Gerando..." : "Gerar PIX"}
                <FiRefreshCw />
              </button>
            ) : (
              <>
                <div className="qrWrapper">
                  <div className="qrCard">
                    <QRCodeCanvas value={pixCode} size={250} />
                  </div>
                </div>

                <textarea value={pixCode} readOnly />

                <div className="pixActions">
                  <button className="softBtn" onClick={copiarPix}>
                    <FiCopy />
                    {copiado ? "Copiado" : "Copiar"}
                  </button>

                  <button className="successBtn" onClick={verificarPagamento}>
                    <FiCheckCircle />
                    Já paguei
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="glass rightSide">
            <div className="cardTitle">
              <FiCreditCard />
              Cartão
            </div>

            <div className="field">
              <span>Número do cartão</span>
              <input
                placeholder="0000 0000 0000 0000"
                value={cartao.numero}
                onChange={(e) =>
                  setCartao((prev) => ({
                    ...prev,
                    numero: e.target.value,
                  }))
                }
              />
            </div>

            <div className="field">
              <span>Nome no cartão</span>
              <input
                placeholder="Nome completo"
                value={cartao.nome}
                onChange={(e) =>
                  setCartao((prev) => ({
                    ...prev,
                    nome: e.target.value,
                  }))
                }
              />
            </div>

            <div className="triple">
              <div className="field">
                <span>Mês</span>
                <input
                  placeholder="MM"
                  value={cartao.mes}
                  onChange={(e) =>
                    setCartao((prev) => ({
                      ...prev,
                      mes: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field">
                <span>Ano</span>
                <input
                  placeholder="AA"
                  value={cartao.ano}
                  onChange={(e) =>
                    setCartao((prev) => ({
                      ...prev,
                      ano: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field">
                <span>CVV</span>
                <input
                  placeholder="123"
                  value={cartao.cvv}
                  onChange={(e) =>
                    setCartao((prev) => ({
                      ...prev,
                      cvv: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="field">
              <span>Parcelas</span>
              <select
                value={cartao.parcelas}
                onChange={(e) =>
                  setCartao((prev) => ({
                    ...prev,
                    parcelas: e.target.value,
                  }))
                }
              >
                <option value="1">1x sem juros</option>
                <option value="2">2x</option>
                <option value="3">3x</option>
                <option value="4">4x</option>
              </select>
            </div>

            <button
              className="primaryBtn"
              onClick={pagarCartao}
              disabled={loadingCartao || statusPagamento === "approved"}
            >
              {loadingCartao ? "Processando..." : "Pagar agora"}
              <FiCreditCard />
            </button>
          </aside>
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: linear-gradient(135deg, #f7e6e4 0%, #f5efee 50%, #f7e7e8 100%);
            font-family: Inter, sans-serif;
          }

          .checkout {
            position: relative;
            min-height: 100vh;
            padding: 120px 24px 80px;
            overflow: hidden;
          }

          .bgBlur {
            position: absolute;
            border-radius: 999px;
            filter: blur(120px);
            opacity: 0.4;
            pointer-events: none;
          }

          .blur1 {
            width: 400px;
            height: 400px;
            background: #d98695;
            top: -120px;
            left: -120px;
          }

          .blur2 {
            width: 400px;
            height: 400px;
            background: #f0b8c1;
            bottom: -120px;
            right: -120px;
          }

          .topHero {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
            z-index: 2;
          }

          .heroTag {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 18px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.55);
            backdrop-filter: blur(12px);
            color: #8b4b56;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 255, 255, 0.4);
          }

          .topHero h1 {
            margin: 0;
            font-size: 64px;
            line-height: 1;
            letter-spacing: -4px;
            color: #4f2630;
          }

          .topHero p {
            margin: 18px auto 0;
            max-width: 720px;
            color: #7b5960;
            font-size: 17px;
          }

          .statusBadge {
            width: fit-content;
            margin: 0 auto 40px;
            padding: 14px 22px;
            border-radius: 999px;
            font-weight: 700;
            backdrop-filter: blur(12px);
          }

          .pending {
            background: rgba(255, 240, 240, 0.75);
            color: #a14f5a;
          }

          .ok {
            background: rgba(236, 253, 243, 0.85);
            color: #027a48;
          }

          .layout {
            position: relative;
            z-index: 2;
            max-width: 1500px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1.15fr 1fr;
            gap: 24px;
            align-items: start;
          }

          .glass {
            background: rgba(255, 255, 255, 0.58);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.45);
            border-radius: 36px;
            padding: 30px;
            box-shadow: 0 25px 80px rgba(108, 42, 55, 0.12);
          }

          .cardTitle {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #6c2a37;
            font-weight: 800;
            font-size: 17px;
            margin-bottom: 24px;
          }

          .userBox {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 18px;
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.55);
            margin-bottom: 24px;
          }

          .avatar {
            width: 70px;
            height: 70px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #8d4a52, #c77785);
            color: #fff;
            font-size: 28px;
            font-weight: 900;
            flex-shrink: 0;
          }

          .userData {
            display: flex;
            flex-direction: column;
            gap: 5px;
            min-width: 0;
          }

          .userData strong {
            color: #442128;
            font-size: 18px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .userData span {
            color: #7d666b;
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .infoList {
            display: grid;
            gap: 14px;
          }

          .infoItem {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 18px;
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.55);
          }

          .infoLeft {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #6b4850;
          }

          .infoItem strong {
            color: #4f2630;
          }

          .totalBox {
            margin-top: 26px;
            padding-top: 24px;
            border-top: 1px solid rgba(108, 42, 55, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .totalBox span {
            color: #6f5b5f;
            font-weight: 600;
          }

          .totalBox strong {
            color: #8d4a52;
            font-size: 36px;
            letter-spacing: -2px;
          }

          .backBtn {
            margin-top: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            text-decoration: none;
            height: 58px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.7);
            color: #7c4450;
            font-weight: 700;
            transition: 0.2s ease;
          }

          .centerSide {
            text-align: center;
          }

          .pixHeader {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 24px;
          }

          .pixIcon {
            width: 78px;
            height: 78px;
            border-radius: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 16px;
            color: #8b4b56;
            background: linear-gradient(135deg, #fff, #ffe7eb);
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8);
          }

          .pixHeader h2 {
            margin: 0;
            font-size: 34px;
            color: #4f2630;
          }

          .pixHeader p {
            margin-top: 8px;
            color: #7b5960;
          }

          .qrWrapper {
            display: flex;
            justify-content: center;
          }

          .qrCard {
            width: fit-content;
            padding: 28px;
            border-radius: 34px;
            background: #fff;
            box-shadow: 0 20px 50px rgba(109, 44, 55, 0.1);
          }

          textarea {
            width: 100%;
            min-height: 140px;
            margin-top: 22px;
            border-radius: 24px;
            border: none;
            padding: 18px;
            resize: none;
            background: rgba(255, 255, 255, 0.75);
            color: #573138;
            outline: none;
          }

          .pixActions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 18px;
          }

          .field {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 18px;
          }

          .field span {
            font-size: 14px;
            font-weight: 700;
            color: #6f4450;
          }

          .field input,
          .field select {
            height: 58px;
            border-radius: 20px;
            border: none;
            padding: 0 18px;
            background: rgba(255, 255, 255, 0.75);
            outline: none;
            color: #4b232a;
            font-size: 15px;
          }

          .triple {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
          }

          .primaryBtn,
          .softBtn,
          .successBtn {
            height: 60px;
            border: none;
            border-radius: 22px;
            cursor: pointer;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: 0.2s ease;
          }

          .primaryBtn:hover,
          .softBtn:hover,
          .successBtn:hover,
          .backBtn:hover {
            transform: translateY(-2px);
          }

          .primaryBtn {
            background: linear-gradient(135deg, #8d4a52, #c77785);
            color: white;
            box-shadow: 0 16px 40px rgba(141, 74, 82, 0.35);
          }

          .primaryBtn:disabled {
            opacity: 0.75;
            cursor: not-allowed;
            transform: none;
          }

          .softBtn {
            background: rgba(255, 255, 255, 0.7);
            color: #7f4a54;
          }

          .successBtn {
            background: linear-gradient(135deg, #0d7a50, #17a56c);
            color: white;
          }

          .loadingPage {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 120px 20px;
          }

          .loadingCard {
            width: 100%;
            max-width: 420px;
            padding: 42px;
            border-radius: 34px;
            text-align: center;
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(20px);
            color: #6b3944;
            box-shadow: 0 25px 80px rgba(108, 42, 55, 0.12);
          }

          @media (max-width: 1200px) {
            .layout {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .checkout {
              padding: 100px 16px 60px;
            }

            .topHero h1 {
              font-size: 42px;
              letter-spacing: -2px;
            }

            .glass {
              padding: 22px;
            }

            .pixActions,
            .triple {
              grid-template-columns: 1fr;
            }

            .totalBox strong {
              font-size: 28px;
            }

            .infoItem {
              gap: 14px;
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}