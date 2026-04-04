"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "@/Api/conectar";


type FormState = {
  pix_ativo: number;
  pix_tipo_chave: string;
  pix_chave: string;
  pix_nome_recebedor: string;
  pix_cidade: string;
  pix_mensagem: string;
  mercado_pago_ativo: number;
  boleto_ativo: number;
  cartao_ativo: number;
  site_config_id: number;
};

export default function CadastrarConfigPagamentoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    pix_ativo: 1,
    pix_tipo_chave: "",
    pix_chave: "",
    pix_nome_recebedor: "",
    pix_cidade: "",
    pix_mensagem: "",
    mercado_pago_ativo: 0,
    boleto_ativo: 0,
    cartao_ativo: 0,
    site_config_id: 1,
  });

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        [name]: checked ? 1 : 0,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "site_config_id"
          ? Number(value)
          : value,
    }));
  }

  function validarFormulario() {
    if (!form.site_config_id || Number(form.site_config_id) <= 0) {
      toast.error("Informe um site_config_id válido.");
      return false;
    }

    if (form.pix_ativo === 1) {
      if (!form.pix_tipo_chave.trim()) {
        toast.error("Selecione o tipo de chave PIX.");
        return false;
      }

      if (!form.pix_chave.trim()) {
        toast.error("Informe a chave PIX.");
        return false;
      }

      if (!form.pix_nome_recebedor.trim()) {
        toast.error("Informe o nome do recebedor.");
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      await api.post("/painel/config-pagamento", form);

      toast.success("Configuração de pagamento cadastrada com sucesso!");
      router.push("/Admin/config-pagamento");
    } catch (error: any) {
      console.error("Erro ao cadastrar configuração:", error);

      const mensagem =
        error?.response?.data?.dados?.mensagem ||
        error?.response?.data?.dados?.erro ||
        "Erro ao salvar configuração de pagamento.";

      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pagina-config-pagamento">
      <div className="topo">
        <div>
          <span className="badge">Painel administrativo</span>
          <h1>Nova Configuração de Pagamento</h1>
          <p>
            Configure PIX, boleto, cartão e Mercado Pago de forma organizada
            para o seu site.
          </p>
        </div>

        <div className="topo-acoes">
          <button
            type="button"
            className="botao-secundario"
            onClick={() => router.push("/Admin/config-pagamento")}
          >
            Voltar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="formulario">
        <div className="grid-principal">
          <section className="card card-destaque">
            <div className="card-header">
              <div>
                <h2>Resumo da Configuração</h2>
                <p>Ative os métodos de pagamento que deseja exibir.</p>
              </div>
            </div>

            <div className="resumo-grid">
              <div className="resumo-item">
                <span className="resumo-label">PIX</span>
                <strong>{form.pix_ativo ? "Ativo" : "Inativo"}</strong>
              </div>

              <div className="resumo-item">
                <span className="resumo-label">Mercado Pago</span>
                <strong>{form.mercado_pago_ativo ? "Ativo" : "Inativo"}</strong>
              </div>

              <div className="resumo-item">
                <span className="resumo-label">Boleto</span>
                <strong>{form.boleto_ativo ? "Ativo" : "Inativo"}</strong>
              </div>

              <div className="resumo-item">
                <span className="resumo-label">Cartão</span>
                <strong>{form.cartao_ativo ? "Ativo" : "Inativo"}</strong>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2>Informações Gerais</h2>
                <p>Defina a configuração base ligada ao site.</p>
              </div>
            </div>

            <div className="campo">
              <label htmlFor="site_config_id">Site Config ID</label>
              <input
                id="site_config_id"
                name="site_config_id"
                type="number"
                min="1"
                value={form.site_config_id}
                onChange={handleChange}
                placeholder="Ex: 1"
              />
            </div>
          </section>
        </div>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Configuração PIX</h2>
              <p>Preencha os dados que serão usados para pagamento via PIX.</p>
            </div>
          </div>

          <div className="toggle-grid">
            <label className="toggle-card">
              <div>
                <span className="toggle-title">Ativar PIX</span>
                <small className="toggle-desc">
                  Exibe o PIX como opção de pagamento.
                </small>
              </div>

              <span className="switch">
                <input
                  type="checkbox"
                  name="pix_ativo"
                  checked={form.pix_ativo === 1}
                  onChange={handleChange}
                />
                <span className="slider" />
              </span>
            </label>
          </div>

          <div className="grid-duplo">
            <div className="campo">
              <label htmlFor="pix_tipo_chave">Tipo da chave PIX</label>
              <select
                id="pix_tipo_chave"
                name="pix_tipo_chave"
                value={form.pix_tipo_chave}
                onChange={handleChange}
              >
                <option value="">Selecione</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave aleatória</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="pix_chave">Chave PIX</label>
              <input
                id="pix_chave"
                name="pix_chave"
                type="text"
                value={form.pix_chave}
                onChange={handleChange}
                placeholder="Digite a chave PIX"
              />
            </div>
          </div>

          <div className="grid-duplo">
            <div className="campo">
              <label htmlFor="pix_nome_recebedor">Nome do recebedor</label>
              <input
                id="pix_nome_recebedor"
                name="pix_nome_recebedor"
                type="text"
                value={form.pix_nome_recebedor}
                onChange={handleChange}
                placeholder="Nome do favorecido"
              />
            </div>

            <div className="campo">
              <label htmlFor="pix_cidade">Cidade</label>
              <input
                id="pix_cidade"
                name="pix_cidade"
                type="text"
                value={form.pix_cidade}
                onChange={handleChange}
                placeholder="Cidade do recebedor"
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="pix_mensagem">Mensagem PIX</label>
            <textarea
              id="pix_mensagem"
              name="pix_mensagem"
              value={form.pix_mensagem}
              onChange={handleChange}
              placeholder="Ex: Após o pagamento, envie o comprovante."
              rows={4}
            />
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Outros Métodos</h2>
              <p>Ative ou desative os métodos adicionais disponíveis.</p>
            </div>
          </div>

          <div className="toggle-grid toggle-grid-3">
            <label className="toggle-card">
              <div>
                <span className="toggle-title">Mercado Pago</span>
                <small className="toggle-desc">
                  Habilita pagamentos via Mercado Pago.
                </small>
              </div>

              <span className="switch">
                <input
                  type="checkbox"
                  name="mercado_pago_ativo"
                  checked={form.mercado_pago_ativo === 1}
                  onChange={handleChange}
                />
                <span className="slider" />
              </span>
            </label>

            <label className="toggle-card">
              <div>
                <span className="toggle-title">Boleto</span>
                <small className="toggle-desc">
                  Permite pagamentos por boleto bancário.
                </small>
              </div>

              <span className="switch">
                <input
                  type="checkbox"
                  name="boleto_ativo"
                  checked={form.boleto_ativo === 1}
                  onChange={handleChange}
                />
                <span className="slider" />
              </span>
            </label>

            <label className="toggle-card">
              <div>
                <span className="toggle-title">Cartão</span>
                <small className="toggle-desc">
                  Libera pagamento com cartão no sistema.
                </small>
              </div>

              <span className="switch">
                <input
                  type="checkbox"
                  name="cartao_ativo"
                  checked={form.cartao_ativo === 1}
                  onChange={handleChange}
                />
                <span className="slider" />
              </span>
            </label>
          </div>
        </section>

        <div className="rodape-acoes">
          <button
            type="button"
            className="botao-secundario"
            onClick={() => router.push("/Admin/config-pagamento")}
            disabled={loading}
          >
            Cancelar
          </button>

          <button type="submit" className="botao-primario" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Configuração"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .pagina-config-pagamento {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 25%),
            radial-gradient(circle at top right, rgba(168, 85, 247, 0.12), transparent 25%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        }

        .topo {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          padding: 28px;
          border-radius: 24px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%);
          color: #fff;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .topo h1 {
          margin: 0 0 10px;
          font-size: 2rem;
          line-height: 1.15;
        }

        .topo p {
          margin: 0;
          max-width: 760px;
          color: rgba(255, 255, 255, 0.82);
          font-size: 0.98rem;
        }

        .topo-acoes {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }

        .formulario {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .grid-principal {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 20px;
        }

        .grid-duplo {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 22px;
          padding: 24px;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.07);
        }

        .card-destaque {
          background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .card-header h2 {
          margin: 0 0 6px;
          font-size: 1.15rem;
          color: #0f172a;
        }

        .card-header p {
          margin: 0;
          color: #64748b;
          font-size: 0.95rem;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 18px;
        }

        .campo:last-child {
          margin-bottom: 0;
        }

        .campo label {
          font-size: 0.92rem;
          font-weight: 700;
          color: #334155;
        }

        .campo input,
        .campo select,
        .campo textarea {
          width: 100%;
          border: 1px solid #dbe4f0;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 0.96rem;
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: all 0.2s ease;
        }

        .campo input:focus,
        .campo select:focus,
        .campo textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .campo textarea {
          resize: vertical;
          min-height: 110px;
        }

        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .resumo-item {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 18px;
          background: #fff;
        }

        .resumo-label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.82rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .resumo-item strong {
          font-size: 1.05rem;
          color: #0f172a;
        }

        .toggle-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .toggle-grid-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .toggle-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .toggle-title {
          display: block;
          font-size: 0.98rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .toggle-desc {
          color: #64748b;
          font-size: 0.88rem;
          line-height: 1.4;
        }

        .switch {
          position: relative;
          width: 58px;
          height: 32px;
          flex-shrink: 0;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: #cbd5e1;
          border-radius: 999px;
          transition: 0.25s ease;
        }

        .slider::before {
          content: "";
          position: absolute;
          width: 24px;
          height: 24px;
          left: 4px;
          top: 4px;
          background: #fff;
          border-radius: 50%;
          transition: 0.25s ease;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
        }

        .switch input:checked + .slider {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
        }

        .switch input:checked + .slider::before {
          transform: translateX(26px);
        }

        .rodape-acoes {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 4px;
        }

        .botao-primario,
        .botao-secundario {
          border: none;
          border-radius: 14px;
          padding: 14px 20px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .botao-primario {
          color: #fff;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          box-shadow: 0 12px 30px rgba(79, 70, 229, 0.24);
        }

        .botao-primario:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.03);
        }

        .botao-secundario {
          color: #0f172a;
          background: #fff;
          border: 1px solid #dbe4f0;
        }

        .botao-secundario:hover:not(:disabled) {
          background: #f8fafc;
        }

        .botao-primario:disabled,
        .botao-secundario:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .grid-principal {
            grid-template-columns: 1fr;
          }

          .toggle-grid-3 {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .pagina-config-pagamento {
            padding: 14px;
          }

          .topo {
            flex-direction: column;
            padding: 22px;
          }

          .topo h1 {
            font-size: 1.55rem;
          }

          .grid-duplo,
          .resumo-grid {
            grid-template-columns: 1fr;
          }

          .rodape-acoes {
            flex-direction: column-reverse;
          }

          .botao-primario,
          .botao-secundario {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}