"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type StatusItem = {
  id_status?: number | string;
  nome?: string;
  codigo?: string;
  descricao?: string;
};

type NivelItem = {
  id_nivel?: number | string;
  id?: number | string;
  nome?: string;
  descricao?: string;
};

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extrairLista(payload: any) {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function CadastrarVitrinePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingNiveis, setLoadingNiveis] = useState(true);

  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [niveisList, setNiveisList] = useState<NivelItem[]>([]);

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditado, setSlugEditado] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [tipo, setTipo] = useState("produto");
  const [statusId, setStatusId] = useState("");
  const [nivelId, setNivelId] = useState("");
  const [ordem, setOrdem] = useState("0");

  const slugAutomatico = useMemo(() => gerarSlug(nome || titulo), [nome, titulo]);

  useEffect(() => {
    if (!slugEditado) {
      setSlug(slugAutomatico);
    }
  }, [slugAutomatico, slugEditado]);

  useEffect(() => {
    async function carregarStatus() {
      try {
        setLoadingStatus(true);

        const response = await api.get("/painel/status", {
          withCredentials: true,
        });

        const lista = extrairLista(response?.data);
        setStatusList(lista);

        if (lista.length > 0) {
          const primeiroId = lista[0]?.id_status ?? "";
          setStatusId(String(primeiroId));
        }
      } catch (error: any) {
        console.error("Erro ao carregar status:", error);
        toast.error(
          error?.response?.data?.mensagem ||
            error?.message ||
            "Não foi possível carregar os status."
        );
      } finally {
        setLoadingStatus(false);
      }
    }

    async function carregarNiveis() {
      try {
        setLoadingNiveis(true);

        const response = await api.get("/painel/niveis", {
          withCredentials: true,
        });

        const lista = extrairLista(response?.data);
        setNiveisList(lista);

        if (lista.length > 0) {
          const primeiroId = lista[0]?.id_nivel ?? lista[0]?.id ?? "";
          setNivelId(String(primeiroId));
        }
      } catch (error: any) {
        console.error("Erro ao carregar níveis:", error);
        toast.error(
          error?.response?.data?.mensagem ||
            error?.message ||
            "Não foi possível carregar os níveis."
        );
      } finally {
        setLoadingNiveis(false);
      }
    }

    carregarStatus();
    carregarNiveis();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      toast.warning("Informe o nome da vitrine.");
      return;
    }

    if (!slug.trim()) {
      toast.warning("Informe o slug da vitrine.");
      return;
    }

    if (!titulo.trim()) {
      toast.warning("Informe o título da vitrine.");
      return;
    }

    if (!tipo.trim()) {
      toast.warning("Selecione o tipo da vitrine.");
      return;
    }

    if (!statusId) {
      toast.warning("Selecione o status.");
      return;
    }

    if (!nivelId) {
      toast.warning("Selecione o nível.");
      return;
    }

    try {
      setLoading(true);

      const body = {
        nome: nome.trim(),
        slug: gerarSlug(slug),
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim() || null,
        tipo: tipo.trim(),
        status_id: Number(statusId),
        nivel_id: Number(nivelId),
        ordem: Number(ordem || 0),
      };

      const response = await api.post("/painel/vitrine", body, {
        withCredentials: true,
      });

      const payload = response?.data;

      const sucesso =
        response?.status === 200 ||
        response?.status === 201 ||
        payload?.status === 200 ||
        payload?.status === 201;

      if (!sucesso) {
        toast.error(payload?.mensagem || "Não foi possível cadastrar a vitrine.");
        return;
      }

      toast.success(payload?.mensagem || "Vitrine cadastrada com sucesso.");

      setTimeout(() => {
        router.push("/Admin/vitrines");
      }, 1200);
    } catch (error: any) {
      console.error("Erro ao cadastrar vitrine:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao cadastrar vitrine."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="pagina">
        <div className="topo">
          <div>
            <span className="badge">Painel Administrativo</span>
            <h1>Cadastrar vitrine</h1>
            <p>
              Crie uma vitrine para controlar seções da tela inicial, campanhas,
              banners ou produtos em destaque.
            </p>
          </div>

          <button
            type="button"
            className="btnSecundario"
            onClick={() => router.push("/Admin/vitrines")}
          >
            Voltar
          </button>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          <div className="grid">
            <div className="campo campoGrande">
              <label htmlFor="nome">Nome *</label>
              <input
                id="nome"
                type="text"
                placeholder="Ex: Home principal"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="campo campoGrande">
              <label htmlFor="slug">Slug *</label>
              <input
                id="slug"
                type="text"
                placeholder="home-principal"
                value={slug}
                onChange={(e) => {
                  setSlugEditado(true);
                  setSlug(gerarSlug(e.target.value));
                }}
              />
              <small>O slug acompanha o nome/título até você editar manualmente.</small>
            </div>

            <div className="campo campoGrande">
              <label htmlFor="titulo">Título *</label>
              <input
                id="titulo"
                type="text"
                placeholder="Ex: Destaques da Semana"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="campo campoGrande">
              <label htmlFor="subtitulo">Subtítulo</label>
              <input
                id="subtitulo"
                type="text"
                placeholder="Ex: Produtos e campanhas em destaque"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="tipo">Tipo *</label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="produto">Produto</option>
                <option value="campanha">Campanha</option>
                <option value="categoria">Categoria</option>
                <option value="banner">Banner</option>
                <option value="misto">Misto</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="ordem">Ordem *</label>
              <input
                id="ordem"
                type="number"
                min="0"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                disabled={loadingStatus}
              >
                {loadingStatus ? (
                  <option value="">Carregando status...</option>
                ) : statusList.length === 0 ? (
                  <option value="">Nenhum status encontrado</option>
                ) : (
                  statusList.map((item) => {
                    const id = String(item.id_status ?? "");
                    return (
                      <option key={id} value={id}>
                        {item.nome || item.codigo || `Status ${id}`}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="nivel">Nível *</label>
              <select
                id="nivel"
                value={nivelId}
                onChange={(e) => setNivelId(e.target.value)}
                disabled={loadingNiveis}
              >
                {loadingNiveis ? (
                  <option value="">Carregando níveis...</option>
                ) : niveisList.length === 0 ? (
                  <option value="">Nenhum nível encontrado</option>
                ) : (
                  niveisList.map((item) => {
                    const id = String(item.id_nivel ?? item.id ?? "");
                    return (
                      <option key={id} value={id}>
                        {item.nome || `Nível ${id}`}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          <div className="acoes">
            <button
              type="button"
              className="btnSecundario"
              onClick={() => router.push("/Admin/vitrines")}
            >
              Cancelar
            </button>

            <button type="submit" className="btnPrimario" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar vitrine"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .pagina {
          min-height: 100%;
          padding: 24px;
          background: #f5f7fa;
        }

        .topo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .badge {
          display: inline-block;
          margin-bottom: 10px;
          background: #eef2f6;
          color: #344054;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .topo h1 {
          margin: 0 0 8px;
          font-size: 32px;
          line-height: 1.1;
          color: #101828;
          font-weight: 800;
        }

        .topo p {
          margin: 0;
          color: #475467;
          font-size: 15px;
          max-width: 760px;
        }

        .card {
          background: #ffffff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid #e4e7ec;
          box-shadow: 0 18px 45px rgba(16, 24, 40, 0.04);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campoGrande {
          grid-column: span 2;
        }

        .campo label {
          font-size: 14px;
          font-weight: 700;
          color: #344054;
        }

        .campo input,
        .campo select {
          width: 100%;
          border: 1px solid #d0d5dd;
          background: #fff;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 15px;
          color: #101828;
          outline: none;
          transition: all 0.2s ease;
        }

        .campo input:focus,
        .campo select:focus {
          border-color: #98a2b3;
          box-shadow: 0 0 0 4px rgba(152, 162, 179, 0.12);
        }

        .campo small {
          color: #667085;
          font-size: 12px;
        }

        .acoes {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .btnPrimario,
        .btnSecundario {
          border: none;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 180px;
        }

        .btnPrimario {
          background: #111827;
          color: #fff;
          box-shadow: 0 12px 24px rgba(17, 24, 39, 0.15);
        }

        .btnSecundario {
          background: #fff;
          color: #344054;
          border: 1px solid #d0d5dd;
        }

        .btnPrimario:disabled,
        .btnSecundario:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .campoGrande {
            grid-column: span 1;
          }

          .pagina {
            padding: 16px;
          }

          .card {
            padding: 18px;
            border-radius: 18px;
          }

          .topo h1 {
            font-size: 26px;
          }

          .acoes {
            flex-direction: column;
          }

          .btnPrimario,
          .btnSecundario {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}