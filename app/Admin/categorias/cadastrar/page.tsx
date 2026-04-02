"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import {
    FiArrowLeft,
    FiCheckCircle,
    FiFolder,
    FiInfo,
    FiLayers,
    FiSave,
    FiTag,
    FiType,
    FiAlertCircle,
    FiGrid,
    FiRefreshCw,
} from "react-icons/fi";

type FormDataType = {
    nome: string;
    slug: string;
    descricao: string;
    icone: string;
    ordem: string;
    status_id: string;
};

type StatusItem = {
    id_status?: number;
    id?: number;
    nome?: string;
    titulo?: string;
    descricao?: string;
};

function gerarSlug(texto: string) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-");
}

export default function CadastrarCategoriaPage() {
    const router = useRouter();

    const [form, setForm] = useState<FormDataType>({
        nome: "",
        slug: "",
        descricao: "",
        icone: "",
        ordem: "0",
        status_id: "",
    });

    const [slugEditadoManual, setSlugEditadoManual] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);

    const [statusList, setStatusList] = useState<StatusItem[]>([]);
    const [carregandoAuxiliares, setCarregandoAuxiliares] = useState(true);

    const previewSlug = useMemo(() => {
        return form.slug?.trim() || "slug-da-categoria";
    }, [form.slug]);

    function atualizarCampo(campo: keyof FormDataType, valor: string) {
        setForm((prev) => {
            const novo = { ...prev, [campo]: valor };

            if (campo === "nome" && !slugEditadoManual) {
                novo.slug = gerarSlug(valor);
            }

            return novo;
        });
    }

    function getStatusId(item: StatusItem) {
        return Number(item.id_status ?? item.id ?? 0);
    }

    function getStatusNome(item: StatusItem) {
        return item.nome || item.titulo || item.descricao || `Status ${getStatusId(item)}`;
    }

    async function carregarStatus() {
        try {
            setCarregandoAuxiliares(true);
            setErro(null);

            const response = await api.get("/painel/status");
            const data = response?.data;

            // 🔥 AQUI ESTÁ A CORREÇÃO
            const statusBruto: StatusItem[] =
                data?.dados?.dados || [];

            setStatusList(statusBruto);

            // define padrão como ID 1 (Ativo)
            const statusAtivo = statusBruto.find((s) => getStatusId(s) === 1);

            setForm((prev) => ({
                ...prev,
                status_id: statusAtivo
                    ? String(getStatusId(statusAtivo))
                    : "",
            }));

        } catch (error: any) {
            console.error("Erro ao carregar status:", error?.response?.data || error);

            setStatusList([]);
            setErro(
                error?.response?.data?.mensagem ||
                error?.message ||
                "Erro ao carregar status."
            );
        } finally {
            setCarregandoAuxiliares(false);
        }
    }

    useEffect(() => {
        carregarStatus();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setErro(null);
        setSucesso(null);

        if (!form.nome.trim()) {
            setErro("Informe o nome da categoria.");
            return;
        }

        if (!form.slug.trim()) {
            setErro("Informe o slug da categoria.");
            return;
        }

        if (form.ordem === "" || Number.isNaN(Number(form.ordem))) {
            setErro("Informe uma ordem válida.");
            return;
        }

        if (!form.status_id.trim()) {
            setErro("Selecione o status.");
            return;
        }

        try {
            setSalvando(true);

            const payload = {
                site_config_id: 1,
                nome: form.nome.trim(),
                slug: form.slug.trim(),
                descricao: form.descricao.trim() || null,
                icone: form.icone.trim() || null,
                ordem: Number(form.ordem),
                status_id: Number(form.status_id),
            };

            const response = await api.post("/painel/categoria", payload);

            setSucesso(
                response?.data?.mensagem || "Categoria cadastrada com sucesso."
            );

            setTimeout(() => {
                router.push("/Admin/categorias");
            }, 1200);
        } catch (error: any) {
            console.error(
                "Erro ao cadastrar categoria:",
                error?.response?.data || error
            );

            setErro(
                error?.response?.data?.mensagem ||
                error?.message ||
                "Erro ao cadastrar categoria."
            );
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="categoria-cadastrar-page">
            <div className="page-header">
                <div className="header-left">
                    <div className="header-icon">
                        <FiFolder size={24} />
                    </div>

                    <div>
                        <span className="page-kicker">Painel administrativo</span>
                        <h1>Cadastrar categoria</h1>
                        <p>Preencha os dados para criar uma nova categoria no sistema.</p>
                    </div>
                </div>

                <div className="header-actions">
                    <Link href="/Admin/categorias" className="btn btn-light">
                        <FiArrowLeft size={16} />
                        <span>Voltar</span>
                    </Link>
                </div>
            </div>

            {erro && (
                <div className="feedback error">
                    <FiAlertCircle size={18} />
                    <div>
                        <strong>Não foi possível continuar</strong>
                        <p>{erro}</p>
                    </div>
                </div>
            )}

            {sucesso && (
                <div className="feedback success">
                    <FiCheckCircle size={18} />
                    <div>
                        <strong>Tudo certo</strong>
                        <p>{sucesso}</p>
                    </div>
                </div>
            )}

            {carregandoAuxiliares ? (
                <div className="feedback loading">
                    <FiRefreshCw size={18} className="spin" />
                    <div>
                        <strong>Carregando status</strong>
                        <p>Buscando os status disponíveis...</p>
                    </div>
                </div>
            ) : (
                <form className="form-card" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="field field-full">
                            <label htmlFor="nome">
                                <FiType size={16} />
                                <span>Nome da categoria *</span>
                            </label>
                            <input
                                id="nome"
                                type="text"
                                value={form.nome}
                                onChange={(e) => atualizarCampo("nome", e.target.value)}
                                placeholder="Ex: Decoração"
                            />
                        </div>

                        <div className="field field-full">
                            <label htmlFor="slug">
                                <FiTag size={16} />
                                <span>Slug *</span>
                            </label>
                            <input
                                id="slug"
                                type="text"
                                value={form.slug}
                                onChange={(e) => {
                                    setSlugEditadoManual(true);
                                    atualizarCampo("slug", gerarSlug(e.target.value));
                                }}
                                placeholder="decoracao"
                            />
                            <small>URL prevista: /categoria/{previewSlug}</small>
                        </div>

                        <div className="field field-full">
                            <label htmlFor="descricao">
                                <FiInfo size={16} />
                                <span>Descrição</span>
                            </label>
                            <textarea
                                id="descricao"
                                rows={4}
                                value={form.descricao}
                                onChange={(e) => atualizarCampo("descricao", e.target.value)}
                                placeholder="Descreva a categoria..."
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="icone">
                                <FiGrid size={16} />
                                <span>Ícone</span>
                            </label>
                            <input
                                id="icone"
                                type="text"
                                value={form.icone}
                                onChange={(e) => atualizarCampo("icone", e.target.value)}
                                placeholder="Ex: tags, box, grid..."
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="ordem">
                                <FiLayers size={16} />
                                <span>Ordem *</span>
                            </label>
                            <input
                                id="ordem"
                                type="number"
                                value={form.ordem}
                                onChange={(e) => atualizarCampo("ordem", e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        <div className="field field-full">
                            <label htmlFor="status_id">
                                <FiCheckCircle size={16} />
                                <span>Status *</span>
                            </label>

                            <select
                                id="status_id"
                                value={form.status_id}
                                onChange={(e) => atualizarCampo("status_id", e.target.value)}
                            >
                                <option value="">Selecione um status</option>
                                {statusList.map((status) => {
                                    const id = getStatusId(status);
                                    return (
                                        <option key={id} value={id}>
                                            {getStatusNome(status)}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div className="form-footer">
                        <Link href="/Admin/categorias" className="btn btn-light">
                            Cancelar
                        </Link>

                        <button type="submit" className="btn btn-primary" disabled={salvando}>
                            <FiSave size={16} />
                            <span>{salvando ? "Salvando..." : "Cadastrar categoria"}</span>
                        </button>
                    </div>
                </form>
            )}

            <style jsx>{`
        .categoria-cadastrar-page {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .header-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #d18b72 0%, #b55f53 100%);
          color: #fff;
          box-shadow: 0 16px 28px rgba(181, 95, 83, 0.18);
          flex-shrink: 0;
        }

        .page-kicker {
          display: inline-block;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #b55f53;
          margin-bottom: 6px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.1;
          color: #352720;
          font-weight: 900;
        }

        .page-header p {
          margin: 6px 0 0;
          color: #7d6358;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .feedback {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid transparent;
        }

        .feedback strong {
          display: block;
          font-size: 15px;
        }

        .feedback p {
          margin: 4px 0 0;
          font-size: 13px;
        }

        .feedback.error {
          background: rgba(254, 242, 242, 0.95);
          border-color: rgba(239, 68, 68, 0.16);
          color: #b91c1c;
        }

        .feedback.success {
          background: rgba(240, 253, 244, 0.95);
          border-color: rgba(34, 197, 94, 0.16);
          color: #166534;
        }

        .feedback.loading {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(232, 214, 204, 0.92);
          color: #5b433a;
        }

        .form-card {
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(232, 214, 204, 0.92);
          box-shadow: 0 18px 35px rgba(83, 59, 51, 0.06);
          padding: 22px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-full {
          grid-column: 1 / -1;
        }

        .field label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          color: #5b433a;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          border: 1px solid #ead7cb;
          background: #fff;
          border-radius: 16px;
          outline: none;
          color: #352720;
          font-size: 14px;
          transition: 0.22s ease;
        }

        .field input,
        .field select {
          height: 50px;
          padding: 0 14px;
        }

        .field textarea {
          padding: 14px;
          resize: vertical;
          min-height: 120px;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #d18b72;
          box-shadow: 0 0 0 4px rgba(209, 139, 114, 0.12);
        }

        .field small {
          color: #8a6e63;
          font-size: 12px;
        }

        .form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #f2e6df;
        }

        .btn {
          min-height: 46px;
          padding: 0 16px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 800;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: 0.22s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-light {
          background: #fff;
          color: #4a352e;
          border: 1px solid #ead7cb;
          box-shadow: 0 10px 22px rgba(83, 59, 51, 0.05);
        }

        .btn-primary {
          background: linear-gradient(135deg, #d18b72 0%, #b55f53 100%);
          color: #fff;
          box-shadow: 0 14px 24px rgba(181, 95, 83, 0.2);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions .btn {
            width: 100%;
          }

          .form-footer {
            flex-direction: column-reverse;
          }

          .form-footer .btn {
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
}