"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "@/Api/conectar";


export default function CadastroPixPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    pix_ativo: 1,
    pix_tipo_chave: "",
    pix_chave: "",
    pix_nome_recebedor: "",
    pix_cidade: "",
    pix_mensagem: "",
    site_config_id: 1,
  });

  function handleChange(e: any) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!form.pix_tipo_chave || !form.pix_chave) {
      toast.error("Preencha os dados do PIX");
      return;
    }

    try {
      setLoading(true);

      await api.post("/painel/config-pagamento", form);

      toast.success("PIX cadastrado com sucesso!");
      router.push("/Admin/config-pagamento");

    } catch (error: any) {
      toast.error(
        error?.response?.data?.dados?.mensagem ||
        "Erro ao salvar PIX"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Configuração PIX</h1>
        <p>Cadastre a chave PIX que será usada nos pagamentos.</p>

        <form onSubmit={handleSubmit}>

          <div className="campo">
            <label>Tipo da chave</label>
            <select
              name="pix_tipo_chave"
              value={form.pix_tipo_chave}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Aleatória</option>
            </select>
          </div>

          <div className="campo">
            <label>Chave PIX</label>
            <input
              type="text"
              name="pix_chave"
              value={form.pix_chave}
              onChange={handleChange}
              placeholder="Digite a chave PIX"
            />
          </div>

          <div className="campo">
            <label>Nome do recebedor</label>
            <input
              type="text"
              name="pix_nome_recebedor"
              value={form.pix_nome_recebedor}
              onChange={handleChange}
              placeholder="Nome completo"
            />
          </div>

          <div className="campo">
            <label>Cidade</label>
            <input
              type="text"
              name="pix_cidade"
              value={form.pix_cidade}
              onChange={handleChange}
              placeholder="Cidade"
            />
          </div>

          <div className="campo">
            <label>Mensagem (opcional)</label>
            <textarea
              name="pix_mensagem"
              value={form.pix_mensagem}
              onChange={handleChange}
              placeholder="Mensagem para o cliente"
            />
          </div>

          <div className="acoes">
            <button
              type="button"
              className="btn-secundario"
              onClick={() => router.push("/Admin/config-pagamento")}
            >
              Cancelar
            </button>

            <button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar PIX"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #eef2ff, #f8fafc);
          padding: 20px;
        }

        .card {
          width: 100%;
          max-width: 500px;
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
        }

        h1 {
          margin-bottom: 5px;
        }

        p {
          margin-bottom: 20px;
          color: #64748b;
        }

        .campo {
          display: flex;
          flex-direction: column;
          margin-bottom: 15px;
        }

        label {
          font-size: 14px;
          margin-bottom: 5px;
          font-weight: 600;
        }

        input, select, textarea {
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #ddd;
          font-size: 14px;
        }

        textarea {
          resize: none;
          height: 80px;
        }

        .acoes {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }

        button {
          padding: 12px 18px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          background: #2563eb;
          color: white;
        }

        .btn-secundario {
          background: #e2e8f0;
          color: #0f172a;
        }

        button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}