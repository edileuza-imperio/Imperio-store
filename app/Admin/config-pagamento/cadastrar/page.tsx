"use client";

import api from "@/Api/conectar";
import { useState } from "react";

import { toast } from "react-toastify";

export default function CadastrarConfigPagamento() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    pix_ativo: 1,
    pix_tipo_chave: "",
    pix_chave: "",
    pix_nome_recebedor: "",
    pix_cidade: "",
    pix_mensagem: "",
    mercado_pago_ativo: 0,
    boleto_ativo: 0,
    cartao_ativo: 0,
    site_config_id: 1, // ⚠️ depois pode vir dinâmico
  });

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await api.post("/painel/config-pagamento", form);

      toast.success("Configuração salva com sucesso!");

      console.log(response.data);

    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.dados?.mensagem ||
        "Erro ao salvar configuração"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Configuração de Pagamento</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>

        {/* PIX */}
        <h3>PIX</h3>

        <label>
          Ativar PIX:
          <input
            type="checkbox"
            name="pix_ativo"
            checked={form.pix_ativo === 1}
            onChange={handleChange}
          />
        </label>

        <br />

        <input
          type="text"
          name="pix_tipo_chave"
          placeholder="Tipo da chave (CPF, EMAIL, etc)"
          value={form.pix_tipo_chave}
          onChange={handleChange}
        />

        <br />

        <input
          type="text"
          name="pix_chave"
          placeholder="Chave PIX"
          value={form.pix_chave}
          onChange={handleChange}
        />

        <br />

        <input
          type="text"
          name="pix_nome_recebedor"
          placeholder="Nome do recebedor"
          value={form.pix_nome_recebedor}
          onChange={handleChange}
        />

        <br />

        <input
          type="text"
          name="pix_cidade"
          placeholder="Cidade"
          value={form.pix_cidade}
          onChange={handleChange}
        />

        <br />

        <textarea
          name="pix_mensagem"
          placeholder="Mensagem PIX"
          value={form.pix_mensagem}
          onChange={handleChange}
        />

        {/* OUTROS PAGAMENTOS */}
        <h3 style={{ marginTop: 20 }}>Outros Pagamentos</h3>

        <label>
          Mercado Pago:
          <input
            type="checkbox"
            name="mercado_pago_ativo"
            checked={form.mercado_pago_ativo === 1}
            onChange={handleChange}
          />
        </label>

        <br />

        <label>
          Boleto:
          <input
            type="checkbox"
            name="boleto_ativo"
            checked={form.boleto_ativo === 1}
            onChange={handleChange}
          />
        </label>

        <br />

        <label>
          Cartão:
          <input
            type="checkbox"
            name="cartao_ativo"
            checked={form.cartao_ativo === 1}
            onChange={handleChange}
          />
        </label>

        {/* BOTÃO */}
        <div style={{ marginTop: 20 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Configuração"}
          </button>
        </div>
      </form>
    </div>
  );
}