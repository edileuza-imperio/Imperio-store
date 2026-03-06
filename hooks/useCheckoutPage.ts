"use client";

import React from "react";
import { toast } from "react-toastify";

import {
  EnderecoDB,
  Endereco,
  Cupom,
  PixPayload,
} from "@/components/Bibioteca/Bibiotecas";
import { num } from "@/components/Bibioteca/functions";

import {
  type CarrinhoItem,
  carregarEnderecosSalvosState,
  carregarCheckoutInicial,
  mapEnderecoSelecionado,
  validarCupom,
  aplicarEnderecoSalvo,
  normalizarPayloadEndereco,
  salvarEnderecoCarrinho,
  finalizarPedidoPix,
  finalizarPedidoCartao as finalizarPedidoCartaoService,
} from "./checkoutService";

export function useCheckoutPage() {
  const [loading, setLoading] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  const [itens, setItens] = React.useState<CarrinhoItem[]>([]);
  const [endereco, setEndereco] = React.useState<Endereco>({ estado: "SP" });

  const [cupomInput, setCupomInput] = React.useState("");
  const [cupomAplicado, setCupomAplicado] = React.useState<Cupom | null>(null);
  const [cupomLoading, setCupomLoading] = React.useState(false);

  const [metodoPagamento, setMetodoPagamento] = React.useState<"pix" | "cartao">("cartao");
  const [processing, setProcessing] = React.useState(false);

  const [cardName, setCardName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCVV, setCardCVV] = React.useState("");

  const [pixPayload, setPixPayload] = React.useState<PixPayload | null>(null);
  const [pixSolicitado, setPixSolicitado] = React.useState(false);
  const [pixGerandoAutomatico, setPixGerandoAutomatico] = React.useState(false);
  const [pixErro, setPixErro] = React.useState(false);

  const [enderecos, setEnderecos] = React.useState<EnderecoDB[]>([]);
  const [enderecosLoading, setEnderecosLoading] = React.useState(false);

  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = React.useState<number | null>(null);
  const [mostrarFormularioEndereco, setMostrarFormularioEndereco] = React.useState(false);

  const [pedidoConcluido, setPedidoConcluido] = React.useState(false);
  const [pedidoAguardandoPagamento, setPedidoAguardandoPagamento] = React.useState(false);

  const itensArray = Array.isArray(itens) ? itens : [];

  const subtotal = React.useMemo(() => {
    return itensArray.reduce((acc, item) => {
      return acc + num(item.preco_unitario) * (item.quantidade || 1);
    }, 0);
  }, [itensArray]);

  const descontoValor = React.useMemo(() => {
    if (!cupomAplicado) return 0;

    if (cupomAplicado.tipo === "percentual") {
      return subtotal * (cupomAplicado.valor / 100);
    }

    return cupomAplicado.valor || 0;
  }, [cupomAplicado, subtotal]);

  const total = Math.max(subtotal - descontoValor, 0);

  function aplicarEstadoEnderecos(data: {
    enderecos: EnderecoDB[];
    enderecoSelecionadoId: number | null;
    mostrarFormularioEndereco: boolean;
    endereco: Endereco;
  }) {
    console.log("[Checkout] aplicarEstadoEnderecos:", data);

    setEnderecos(data.enderecos);
    setEnderecoSelecionadoId(data.enderecoSelecionadoId);
    setMostrarFormularioEndereco(data.mostrarFormularioEndereco);
    setEndereco(data.endereco);
  }

  function isCardValid(): boolean {
    const digits = cardNumber.replace(/\D/g, "");

    if (digits.length < 13) return false;
    if (!cardName.trim()) return false;
    if (!/^\d{3,4}$/.test(cardCVV)) return false;

    const [mm, yy] = cardExpiry.split("/");
    const m = Number(mm);
    const y = Number(`20${yy}`);

    if (!m || m < 1 || m > 12) return false;
    if (!y || String(yy || "").length !== 2) return false;

    const now = new Date();
    const exp = new Date(y, m - 1, 1);

    if (exp < new Date(now.getFullYear(), now.getMonth(), 1)) return false;

    return true;
  }

  async function recarregarEnderecosSalvos() {
    console.log("[Checkout] recarregarEnderecosSalvos iniciado");
    setEnderecosLoading(true);

    try {
      const enderecoState = await carregarEnderecosSalvosState();
      console.log("[Checkout] recarregarEnderecosSalvos retorno:", enderecoState);
      aplicarEstadoEnderecos(enderecoState);
    } catch (e) {
      console.error("[Checkout] erro ao recarregar endereços:", e);
    } finally {
      setEnderecosLoading(false);
      console.log("[Checkout] recarregarEnderecosSalvos finalizado");
    }
  }

  async function carregarTudo() {
    console.log("[Checkout] carregarTudo iniciado");
    setLoading(true);
    setErro(null);

    try {
      const data = await carregarCheckoutInicial();

      console.log("[Checkout] carregarTudo retorno:", data);

      setItens(data.itens || []);
      aplicarEstadoEnderecos({
        enderecos: data.enderecos,
        enderecoSelecionadoId: data.enderecoSelecionadoId,
        mostrarFormularioEndereco: data.mostrarFormularioEndereco,
        endereco: data.endereco,
      });
    } catch (e: any) {
      console.error("[Checkout] erro ao carregar tudo:", e?.response?.data || e);
      setErro(e?.response?.data?.mensagem || e?.message || "Erro ao carregar checkout.");
    } finally {
      setLoading(false);
      console.log("[Checkout] carregarTudo finalizado");
    }
  }

  React.useEffect(() => {
    carregarTudo();
  }, []);

  React.useEffect(() => {
    if (!enderecoSelecionadoId) return;

    const escolhido = enderecos.find((e) => e.id_endereco === enderecoSelecionadoId);
    if (!escolhido) return;

    console.log("[Checkout] endereço selecionado:", escolhido);
    setEndereco(mapEnderecoSelecionado(escolhido));
  }, [enderecoSelecionadoId, enderecos]);

  React.useEffect(() => {
    async function autoGerarPix() {
      console.log("[Checkout] autoGerarPix verificação", {
        loading,
        metodoPagamento,
        pixSolicitado,
        processing,
        pixGerandoAutomatico,
        pixErro,
        possuiPixPayload: !!(pixPayload?.payload || pixPayload?.qrUrl),
        itens: itensArray.length,
      });

      if (loading) return;
      if (metodoPagamento !== "pix") return;
      if (!pixSolicitado) return;
      if (processing) return;
      if (pixGerandoAutomatico) return;
      if (pixErro) return;
      if (pixPayload?.payload || pixPayload?.qrUrl) return;
      if (itensArray.length === 0) return;

      setPixGerandoAutomatico(true);

      try {
        console.log("[Checkout] autoGerarPix chamando gerarPixCarrinho(true)");
        await gerarPixCarrinho(true);
      } finally {
        setPixGerandoAutomatico(false);
        console.log("[Checkout] autoGerarPix finalizado");
      }
    }

    autoGerarPix();
  }, [
    metodoPagamento,
    pixSolicitado,
    loading,
    processing,
    pixGerandoAutomatico,
    pixErro,
    pixPayload,
    itensArray.length,
  ]);

  async function aplicarCupom() {
    const code = cupomInput.trim();

    console.log("[Checkout] aplicarCupom:", code);

    if (!code) {
      toast.info("Digite um cupom.");
      return;
    }

    setCupomLoading(true);

    try {
      const resp = await validarCupom(code);
      const base = resp.data?.dados ?? resp.data?.data ?? resp.data;

      console.log("[Checkout] validarCupom retorno:", resp.data);

      if (!base || !base.codigo) {
        setCupomAplicado(null);
        toast.error("Cupom não encontrado.");
        return;
      }

      setCupomAplicado(base);
      toast.success("Cupom aplicado!");
    } catch (e) {
      console.error("[Checkout] erro ao validar cupom:", e);
      setCupomAplicado(null);
      toast.error("Erro ao validar cupom.");
    } finally {
      setCupomLoading(false);
    }
  }

  async function salvarEndereco(): Promise<boolean> {
    console.log("[Checkout] salvarEndereco iniciado", {
      mostrarFormularioEndereco,
      enderecoSelecionadoId,
      endereco,
      qtdEnderecos: enderecos.length,
    });

    if (!mostrarFormularioEndereco && enderecoSelecionadoId) {
      const escolhido = enderecos.find((e) => e.id_endereco === enderecoSelecionadoId);

      if (!escolhido) {
        console.error("[Checkout] endereço selecionado não encontrado");
        toast.error("Endereço selecionado não encontrado.");
        return false;
      }

      try {
        const payload = {
          cep: (escolhido.cep ?? "").replace(/\D/g, "").slice(0, 8),
          rua: escolhido.rua ?? "",
          numero: escolhido.numero ?? "",
          complemento: escolhido.complemento ?? "",
          bairro: escolhido.bairro ?? "",
          cidade: escolhido.cidade ?? "",
          estado: escolhido.estado ?? "SP",
        };

        console.log("[Checkout] aplicarEnderecoSalvo payload:", payload);

        await aplicarEnderecoSalvo(payload);

        toast.success("Endereço selecionado!");
        return true;
      } catch (e) {
        console.error("[Checkout] erro ao aplicar endereço selecionado:", e);
        toast.error("Erro ao aplicar endereço selecionado.");
        return false;
      }
    }

    const payload = normalizarPayloadEndereco(endereco);

    console.log("[Checkout] salvarEndereco payload normalizado:", payload);

    if (!payload.cep || payload.cep.length !== 8) {
      toast.error("CEP inválido.");
      return false;
    }

    if (!payload.rua || !payload.numero || !payload.bairro || !payload.cidade) {
      toast.error("Preencha o endereço completo.");
      return false;
    }

    try {
      await salvarEnderecoCarrinho(payload, enderecos.length > 0);

      console.log("[Checkout] endereço salvo com sucesso");

      toast.success("Endereço salvo!");
      await recarregarEnderecosSalvos();
      return true;
    } catch (e) {
      console.error("[Checkout] erro ao salvar endereço:", e);
      toast.error("Erro ao salvar endereço.");
      return false;
    }
  }

  async function gerarPixCarrinho(auto = false) {
    if (processing) {
      console.log("[Checkout] gerarPixCarrinho cancelado: já está processando");
      return;
    }

    try {
      console.log("[Checkout] gerarPixCarrinho iniciado", { auto });

      setProcessing(true);

      if (!auto) {
        setPixErro(false);
      }

      setPixPayload(null);

      const okEnd = await salvarEndereco();
      console.log("[Checkout] resultado salvarEndereco:", okEnd);

      if (!okEnd) {
        setPixErro(true);
        toast.error("Não foi possível salvar o endereço.");
        return;
      }

      console.log("[Checkout] chamando finalizarPedidoPix...");
      const resp = await finalizarPedidoPix();

      console.log("[Checkout] resposta finalizarPedidoPix:", resp?.data);

      const root = resp?.data ?? {};
      const dados = root?.dados ?? root;
      const pagamento = dados?.pagamento ?? null;

      const qrCodeBase64 =
        pagamento?.qr_code_base64 ??
        pagamento?.qrCodeBase64 ??
        null;

      const qrCode =
        pagamento?.qr_code ??
        pagamento?.payload ??
        pagamento?.pix_copia_cola ??
        "";

      const ticketUrl =
        pagamento?.ticket_url ??
        pagamento?.ticketUrl ??
        "";

      console.log("[Checkout] dados pagamento PIX:", {
        pagamento,
        possuiQrCodeBase64: !!qrCodeBase64,
        possuiQrCode: !!qrCode,
        possuiTicketUrl: !!ticketUrl,
      });

      if (!pagamento || (!qrCodeBase64 && !qrCode && !ticketUrl)) {
        console.error("[Checkout] resposta PIX inválida:", resp?.data);
        setPixErro(true);
        toast.error("Não foi possível gerar o PIX.");
        return;
      }

      setPixErro(false);
      setPedidoAguardandoPagamento(true);

      setPixPayload({
        qrUrl: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : undefined,
        payload: qrCode,
        ticketUrl,
      });

      console.log("[Checkout] PIX gerado com sucesso");
      toast.success("Pedido criado e PIX gerado com sucesso!");
    } catch (e: any) {
      console.error("[Checkout] erro PIX completo:", e);
      console.error("[Checkout] erro PIX response:", e?.response?.data || e);

      setPixErro(true);

      const mensagem =
        e?.response?.data?.dados?.mensagem ||
        e?.response?.data?.mensagem ||
        e?.response?.data?.erro ||
        "Erro ao gerar pagamento PIX.";

      toast.error(mensagem);
    } finally {
      setProcessing(false);
      console.log("[Checkout] gerarPixCarrinho finalizado");
    }
  }

  async function finalizarPedidoCartao() {
    console.log("[Checkout] finalizarPedidoCartao iniciado");

    if (itensArray.length === 0) {
      toast.info("Seu carrinho está vazio.");
      return;
    }

    const okEnd = await salvarEndereco();
    console.log("[Checkout] finalizarPedidoCartao salvarEndereco:", okEnd);

    if (!okEnd) return;

    const cardValido = isCardValid();
    console.log("[Checkout] cartão válido:", cardValido);

    if (!cardValido) {
      toast.error("Dados do cartão inválidos.");
      return;
    }

    setProcessing(true);

    try {
      const payload = {
        nome: cardName,
        numero: cardNumber.replace(/\s/g, ""),
        validade: cardExpiry,
        cvv: cardCVV,
      };

      console.log("[Checkout] payload cartão:", payload);

      const resp = await finalizarPedidoCartaoService(payload);

      console.log("[Checkout] resposta finalizarPedidoCartao:", resp?.data);

      setPedidoAguardandoPagamento(false);
      setPedidoConcluido(true);
      toast.success("Pedido finalizado!");
    } catch (e: any) {
      console.error("[Checkout] erro ao finalizar pedido cartão:", e?.response?.data || e);
      toast.error(e?.response?.data?.mensagem || "Erro ao finalizar pedido.");
    } finally {
      setProcessing(false);
      console.log("[Checkout] finalizarPedidoCartao finalizado");
    }
  }

  async function finalizarCompra() {
    console.log("[Checkout] finalizarCompra", {
      metodoPagamento,
      possuiPixPayload: !!(pixPayload?.payload || pixPayload?.qrUrl),
    });

    if (metodoPagamento === "cartao") {
      await finalizarPedidoCartao();
      return;
    }

    if (!pixPayload?.payload && !pixPayload?.qrUrl) {
      setPixSolicitado(true);
      setPixErro(false);
      await gerarPixCarrinho(false);
      return;
    }

    toast.success("Pedido já criado. Faça o pagamento pelo QR Code ou Pix copia e cola.");
  }

  function selecionarPix() {
    console.log("[Checkout] selecionarPix");
    setMetodoPagamento("pix");
    setPixSolicitado(true);
    setPixPayload(null);
    setPixErro(false);
  }

  function selecionarCartao() {
    console.log("[Checkout] selecionarCartao");
    setMetodoPagamento("cartao");
    setPixSolicitado(false);
    setPixErro(false);
    setPedidoAguardandoPagamento(false);
  }

  return {
    loading,
    erro,
    itens,
    itensArray,
    endereco,
    setEndereco,

    cupomInput,
    setCupomInput,
    cupomAplicado,
    setCupomAplicado,
    cupomLoading,

    metodoPagamento,
    processing,

    cardName,
    setCardName,
    cardNumber,
    setCardNumber,
    cardExpiry,
    setCardExpiry,
    cardCVV,
    setCardCVV,

    pixPayload,
    pixSolicitado,
    pixGerandoAutomatico,
    pixErro,

    enderecos,
    enderecosLoading,
    enderecoSelecionadoId,
    setEnderecoSelecionadoId,
    mostrarFormularioEndereco,
    setMostrarFormularioEndereco,

    pedidoConcluido,
    pedidoAguardandoPagamento,

    subtotal,
    descontoValor,
    total,

    isCardValid,
    aplicarCupom,
    salvarEndereco,
    gerarPixCarrinho,
    finalizarPedidoCartao,
    finalizarCompra,
    selecionarPix,
    selecionarCartao,
    carregarTudo,
  };
}