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

  const [enderecos, setEnderecos] = React.useState<EnderecoDB[]>([]);
  const [enderecosLoading, setEnderecosLoading] = React.useState(false);

  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = React.useState<number | null>(null);
  const [mostrarFormularioEndereco, setMostrarFormularioEndereco] = React.useState(false);

  const [pedidoConcluido, setPedidoConcluido] = React.useState(false);

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
    setEnderecosLoading(true);

    try {
      const enderecoState = await carregarEnderecosSalvosState();
      aplicarEstadoEnderecos(enderecoState);
    } finally {
      setEnderecosLoading(false);
    }
  }

  async function carregarTudo() {
    setLoading(true);
    setErro(null);

    try {
      const data = await carregarCheckoutInicial();

      setItens(data.itens || []);
      aplicarEstadoEnderecos({
        enderecos: data.enderecos,
        enderecoSelecionadoId: data.enderecoSelecionadoId,
        mostrarFormularioEndereco: data.mostrarFormularioEndereco,
        endereco: data.endereco,
      });
    } catch (e: any) {
      setErro(e?.response?.data?.mensagem || e?.message || "Erro ao carregar checkout.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    carregarTudo();
  }, []);

  React.useEffect(() => {
    if (!enderecoSelecionadoId) return;

    const escolhido = enderecos.find((e) => e.id_endereco === enderecoSelecionadoId);
    if (!escolhido) return;

    setEndereco(mapEnderecoSelecionado(escolhido));
  }, [enderecoSelecionadoId, enderecos]);

  React.useEffect(() => {
    async function autoGerarPix() {
      if (loading) return;
      if (metodoPagamento !== "pix") return;
      if (!pixSolicitado) return;
      if (processing) return;
      if (pixGerandoAutomatico) return;
      if (pixPayload?.payload || pixPayload?.qrUrl) return;
      if (itensArray.length === 0) return;

      setPixGerandoAutomatico(true);

      try {
        await gerarPixCarrinho();
      } finally {
        setPixGerandoAutomatico(false);
      }
    }

    autoGerarPix();
  }, [
    metodoPagamento,
    pixSolicitado,
    loading,
    processing,
    pixGerandoAutomatico,
    pixPayload,
    itensArray.length,
  ]);

  async function aplicarCupom() {
    const code = cupomInput.trim();

    if (!code) {
      toast.info("Digite um cupom.");
      return;
    }

    setCupomLoading(true);

    try {
      const resp = await validarCupom(code);
      const base = resp.data?.dados ?? resp.data?.data ?? resp.data;

      if (!base || !base.codigo) {
        setCupomAplicado(null);
        toast.error("Cupom não encontrado.");
        return;
      }

      setCupomAplicado(base);
      toast.success("Cupom aplicado!");
    } catch {
      setCupomAplicado(null);
      toast.error("Erro ao validar cupom.");
    } finally {
      setCupomLoading(false);
    }
  }

  async function salvarEndereco(): Promise<boolean> {
    if (!mostrarFormularioEndereco && enderecoSelecionadoId) {
      const escolhido = enderecos.find((e) => e.id_endereco === enderecoSelecionadoId);

      if (!escolhido) {
        toast.error("Endereço selecionado não encontrado.");
        return false;
      }

      try {
        await aplicarEnderecoSalvo({
          cep: (escolhido.cep ?? "").replace(/\D/g, "").slice(0, 8),
          rua: escolhido.rua ?? "",
          numero: escolhido.numero ?? "",
          complemento: escolhido.complemento ?? "",
          bairro: escolhido.bairro ?? "",
          cidade: escolhido.cidade ?? "",
          estado: escolhido.estado ?? "SP",
        });

        toast.success("Endereço selecionado!");
        return true;
      } catch {
        toast.error("Erro ao aplicar endereço selecionado.");
        return false;
      }
    }

    const payload = normalizarPayloadEndereco(endereco);

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

      toast.success("Endereço salvo!");
      await recarregarEnderecosSalvos();
      return true;
    } catch {
      toast.error("Erro ao salvar endereço.");
      return false;
    }
  }

  async function gerarPixCarrinho() {
    if (processing) return;

    try {
      setProcessing(true);
      setPixPayload(null);

      const okEnd = await salvarEndereco();
      if (!okEnd) {
        toast.error("Não foi possível salvar o endereço.");
        return;
      }

      const resp = await finalizarPedidoPix();

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

      if (!pagamento || (!qrCodeBase64 && !qrCode && !ticketUrl)) {
        console.error("Resposta PIX inválida:", resp?.data);
        toast.error("Não foi possível gerar o PIX.");
        return;
      }

      setPixPayload({
        qrUrl: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : undefined,
        payload: qrCode,
        ticketUrl,
      });

      toast.success("PIX gerado com sucesso!");
    } catch (e: any) {
      console.error("Erro PIX:", e?.response?.data || e);

      const mensagem =
        e?.response?.data?.mensagem ||
        e?.response?.data?.erro ||
        "Erro ao gerar pagamento PIX.";

      toast.error(mensagem);
    } finally {
      setProcessing(false);
    }
  }

  async function finalizarPedidoCartao() {
    if (itensArray.length === 0) {
      toast.info("Seu carrinho está vazio.");
      return;
    }

    const okEnd = await salvarEndereco();
    if (!okEnd) return;

    if (!isCardValid()) {
      toast.error("Dados do cartão inválidos.");
      return;
    }

    setProcessing(true);

    try {
      await finalizarPedidoCartaoService({
        nome: cardName,
        numero: cardNumber.replace(/\s/g, ""),
        validade: cardExpiry,
        cvv: cardCVV,
      });

      setPedidoConcluido(true);
      toast.success("Pedido finalizado!");
    } catch (e: any) {
      toast.error(e?.response?.data?.mensagem || "Erro ao finalizar pedido.");
    } finally {
      setProcessing(false);
    }
  }

  async function finalizarCompra() {
    if (metodoPagamento === "cartao") {
      await finalizarPedidoCartao();
      return;
    }

    if (!pixPayload?.payload && !pixPayload?.qrUrl) {
      setPixSolicitado(true);
      await gerarPixCarrinho();
      return;
    }

    toast.success("PIX já gerado. Faça o pagamento pelo QR Code ou copia e cola.");
  }

  function selecionarPix() {
    setMetodoPagamento("pix");
    setPixSolicitado(true);
    setPixPayload(null);
  }

  function selecionarCartao() {
    setMetodoPagamento("cartao");
    setPixSolicitado(false);
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

    enderecos,
    enderecosLoading,
    enderecoSelecionadoId,
    setEnderecoSelecionadoId,
    mostrarFormularioEndereco,
    setMostrarFormularioEndereco,

    pedidoConcluido,

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