"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";
import {
  getImagemUrl,
  isValidCardLuhn,
  maskCardNumber,
  maskExpiry,
} from "@/hooks/useCarrinhoCheckout";

/* ===================== TYPES ===================== */
interface CarrinhoItem {
  id_item: number;
  nome_produto: string;
  imagem?: string;
  quantidade: number;
  preco_unitario: string | number;
}

type CupomApi = {
  codigo: string;
  tipo: "percentual" | "fixo";
  valor: number;
  descricao?: string;
};

/* ===================== HOOK ===================== */
export function useCarrinhoCheckout() {
  const [itens, setItens] = useState<CarrinhoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(1);

  // cupom
  const [cupomInput, setCupomInput] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<CupomApi | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // endereço
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("SP");
  const [cepLoading, setCepLoading] = useState(false);

  // pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "cartao">(
    "pix"
  );
  const [pixPayload, setPixPayload] = useState<{ qrUrl?: string; payload?: string } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardNumberRaw, setCardNumberRaw] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");

  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  /* ===================== LOAD CART ===================== */
  useEffect(() => {
    async function carregar() {
      try {
        const userResp = await api.get("/me");
        const id = userResp.data?.dados?.usuario?.id;
        if (!id) {
          toast.error("Usuário não logado");
          setLoading(false);
          return;
        }
        setUsuarioId(id);

        const resp = await api.get(`/carrinho/${id}`);
        setItens(resp.data?.dados || []);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar carrinho");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  /* ===================== CART ACTIONS ===================== */
  const alterarQuantidade = async (id: number, qtd: number) => {
    if (qtd < 1) return;
    try {
      await api.put(`/carrinho/atualizar/${id}`, { quantidade: qtd });
      setItens((prev) =>
        prev.map((i) => (i.id_item === id ? { ...i, quantidade: qtd } : i))
      );
    } catch {
      toast.error("Erro ao atualizar quantidade");
    }
  };

  const removerItem = async (id: number) => {
    try {
      await api.delete(`/carrinho/remover/${id}`);
      setItens((prev) => prev.filter((i) => i.id_item !== id));
    } catch {
      toast.error("Erro ao remover item");
    }
  };

  /* ===================== CUPOM ===================== */
  const aplicarCupom = async () => {
    if (!cupomInput.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }
    setApplyingCoupon(true);
    try {
      const resp = await api.get(`/cupom/${encodeURIComponent(cupomInput.trim())}`);
      const c: CupomApi = resp.data?.dados;
      if (!c) {
        toast.error("Cupom não encontrado");
        setCupomAplicado(null);
      } else {
        setCupomAplicado(c);
        toast.success(`Cupom ${c.codigo} aplicado`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao validar cupom");
      setCupomAplicado(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  /* ===================== CEP ===================== */
  const buscarCepAuto = async (cepRaw: string) => {
    const digits = cepRaw.replace(/\D/g, "");
    setCep(digits);
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data && !data.erro) {
        setRua(data.logradouro || "");
        setBairro(data.bairro || "");
        setCidade(data.localidade || "");
        setEstado(data.uf || "SP");
        toast.success("Endereço preenchido automaticamente");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  /* ===================== PAYMENT HELPERS ===================== */
  const subtotal = (itens || []).reduce(
    (acc, i) => acc + Number(i.preco_unitario || 0) * (i.quantidade || 1),
    0
  );

  const descontoValor = cupomAplicado
    ? cupomAplicado.tipo === "percentual"
      ? subtotal * (cupomAplicado.valor / 100)
      : cupomAplicado.valor || 0
    : 0;

  const total = Math.max(subtotal - descontoValor, 0);

  const isCardValid = () => {
    const digits = cardNumberRaw.replace(/\D/g, "");
    if (!isValidCardLuhn(digits)) return false;
    const [mm, yy] = cardExpiry.split("/");
    if (!mm || !yy) return false;
    const month = Number(mm);
    const year = Number("20" + yy);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const exp = new Date(year, month - 1, 1);
    if (exp < new Date(now.getFullYear(), now.getMonth(), 1)) return false;
    if (!/^\d{3,4}$/.test(cardCVV)) return false;
    if (!cardName.trim()) return false;
    return true;
  };

  /* ===================== SAVE ADDRESS ===================== */
  const salvarEndereco = async () => {
    if (!usuarioId) return false;
    try {
      const payload = {
        usuarioId,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      };
      await api.post("/carrinho/endereco", payload);
      toast.success("Endereço salvo com sucesso");
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar endereço");
      return false;
    }
  };

  /* ===================== FINALIZE ORDER ===================== */
  const finalizarPedido = async () => {
    if ((itens || []).length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    if (!rua.trim() || !numero.trim() || !cidade.trim() || !bairro.trim() || !cep.trim()) {
      toast.error("Preencha o endereço completo");
      setEtapa(2);
      return;
    }

    if (metodoPagamento === "cartao" && !isCardValid()) {
      toast.error("Dados do cartão inválidos");
      setEtapa(3);
      return;
    }

    setProcessingPayment(true);

    try {
      // salva endereço primeiro
      const enderecoSalvo = await salvarEndereco();
      if (!enderecoSalvo) return;

      const enderecoFinal = `${rua}, ${numero}${complemento ? " - " + complemento : ""} | ${bairro} | ${cidade} - ${estado} | CEP: ${cep}`;

      const payload: any = {
        usuario_id: usuarioId,
        total,
        frete: 0,
        endereco: enderecoFinal,
        metodo_pagamento: metodoPagamento,
        pagamento_info: "",
      };

      if (metodoPagamento === "cartao") {
        payload.pagamento_info = {
          nome: cardName,
          numero: cardNumberRaw.replace(/\s/g, ""),
          validade: cardExpiry,
          cvv: cardCVV,
        };
      }

      const resp = await api.post("/pedido/finalizar", payload);
      const dados = resp.data?.dados || resp.data;

      if (metodoPagamento === "pix") {
        const pagamentoInfo = dados?.pagamento_info;
        if (pagamentoInfo) {
          setPixPayload({
            qrUrl: pagamentoInfo.qrUrl,
            payload: pagamentoInfo.payload,
          });
        } else {
          setPixPayload({ payload: "000201...exemplo-pix-copia-cola" });
        }
      }

      toast.success("Pedido criado com sucesso");
      setEtapa(4);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao finalizar pedido");
    } finally {
      setProcessingPayment(false);
    }
  };

  /* ===================== CARD MASK HANDLERS ===================== */
  const onCardNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 19);
    setCardNumberRaw(digits);
    setCardNumber(maskCardNumber(digits));
  };

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copiado para área de transferência"))
      .catch(() => toast.error("Falha ao copiar"));
  };

  return {
    itens,
    loading,
    etapa,
    setEtapa,

    cupomInput,
    setCupomInput,
    cupomAplicado,
    applyingCoupon,
    aplicarCupom,

    alterarQuantidade,
    removerItem,

    cep,
    setCep,
    rua,
    setRua,
    numero,
    setNumero,
    complemento,
    setComplemento,
    bairro,
    setBairro,
    cidade,
    setCidade,
    estado,
    setEstado,
    cepLoading,
    buscarCepAuto,

    metodoPagamento,
    setMetodoPagamento,
    pixPayload,
    setPixPayload,
    processingPayment,
    setProcessingPayment,

    cardName,
    setCardName,
    cardNumberRaw,
    cardNumber,
    cardExpiry,
    setCardExpiry,
    cardCVV,
    setCardCVV,

    subtotal,
    descontoValor,
    total,

    isCardValid,
    finalizarPedido,
    salvarEndereco,
    onCardNumberChange,
    copyToClipboard,

    getImagemUrl,
    maskExpiry,
    maskCardNumber,
  };
}
