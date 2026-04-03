"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Menu = {
  id_menu?: number;
  id?: number;
  nome?: string;
  titulo?: string;
  rota?: string;
};

type Nivel = {
  id_nivel?: number;
  nome?: string;
  codigo?: string;
};

type StatusItem = {
  id_status?: number;
  nome?: string;
  codigo?: string;
};

type FormDataType = {
  nome: string;
  rota: string;
  icone: string;
  posicao: string;
  criarPermissao: boolean;
  nivel_id: string;
  status_id: string;
};

const api = axios.create({
  baseURL: "https://lightgrey-cattle-160990.hostingersite.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function getObjeto<T>(payload: any): T | null {
  if (!payload) return null;

  if (payload?.dados && !Array.isArray(payload.dados)) return payload.dados as T;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data as T;
  if (payload?.dados?.dados && !Array.isArray(payload.dados.dados)) {
    return payload.dados.dados as T;
  }

  return payload as T;
}

function getLista<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.data?.dados)) return payload.data.dados;
  return [];
}

export default function CadastrarItemMenuPage({ params }: PageProps) {
  const { id } = use(params);

  const [menu, setMenu] = useState<Menu | null>(null);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState<FormDataType>({
    nome: "",
    rota: "",
    icone: "",
    posicao: "0",
    criarPermissao: true,
    nivel_id: "",
    status_id: "1",
  });

  const menuId = useMemo(() => Number(id), [id]);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [resMenu, resNiveis, resStatus] = await Promise.all([
        api.get(`/menu/${id}`),
        api.get("/painel/niveis"),
        api.get("/painel/status"),
      ]);

      const dadosMenu = getObjeto<Menu>(resMenu.data);
      const dadosNiveis = getLista<Nivel>(resNiveis.data);
      const dadosStatus = getLista<StatusItem>(resStatus.data);

      setMenu(dadosMenu);
      setNiveis(dadosNiveis);
      setStatusList(dadosStatus);

      const nivelSistema = dadosNiveis.find(
        (nivel) => String(nivel.codigo || "").toUpperCase() === "SISTEMA"
      );

      setForm((prev) => ({
        ...prev,
        nivel_id: prev.nivel_id || String(nivelSistema?.id_nivel ?? ""),
      }));
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);

      if (error?.response?.status === 404) {
        setErro("Menu não encontrado.");
      } else if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para acessar esta página.");
      } else {
        setErro("Não foi possível carregar o menu.");
      }

      setMenu(null);
      setNiveis([]);
      setStatusList([]);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const atualizarCampo = useCallback(
    <K extends keyof FormDataType>(campo: K, valor: FormDataType[K]) => {
      setForm((prev) => ({
        ...prev,
        [campo]: valor,
      }));
    },
    []
  );

  const salvar = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      try {
        setErro("");
        setSucesso("");
        setSalvando(true);

        if (!form.nome.trim()) {
          setErro("O nome do item é obrigatório.");
          return;
        }

        if (form.criarPermissao) {
          if (!form.nivel_id) {
            setErro("Selecione o nível da permissão.");
            return;
          }

          if (!form.status_id) {
            setErro("Selecione o status da permissão.");
            return;
          }
        }

        const respostaItem = await api.post("/menu-item", {
          menu_id: menuId,
          nome: form.nome.trim(),
          rota: form.rota.trim() || null,
          icone: form.icone.trim() || null,
          posicao: Number(form.posicao || 0),
        });

        const idItem =
          respostaItem?.data?.id_item ??
          respostaItem?.data?.dados?.id_item ??
          respostaItem?.data?.dados?.dados?.id_item;

        if (form.criarPermissao) {
          if (!idItem) {
            setErro("Item criado, mas não foi possível obter o ID para cadastrar a permissão.");
            return;
          }

          await api.post("/menu-permissao", {
            menu_id: menuId,
            item_id: Number(idItem),
            nivel_id: Number(form.nivel_id),
            status_id: Number(form.status_id),
          });

          setSucesso("Item e permissão cadastrados com sucesso!");
        } else {
          setSucesso("Item do menu cadastrado com sucesso!");
        }

        setForm({
          nome: "",
          rota: "",
          icone: "",
          posicao: "0",
          criarPermissao: true,
          nivel_id: form.nivel_id,
          status_id: "1",
        });
      } catch (error: any) {
        console.error("Erro ao cadastrar item/permissão:", error);
        setErro(
          error?.response?.data?.mensagem ||
            "Não foi possível cadastrar o item do menu."
        );
      } finally {
        setSalvando(false);
      }
    },
    [form, menuId]
  );

  return (
    <div className="cadastro-item-page">
      <div className="cadastro-item-container">
        <section className="hero">
          <div className="hero-top">
            <Link href={`/Admin/menus/${id}`} className="voltar-link">
              ← Voltar para menu
            </Link>

            <span className="hero-tag">Novo item</span>
          </div>

          <h1>Cadastrar item do menu</h1>
          <p>Adicione um novo item e, se quiser, já crie a permissão no mesmo cadastro.</p>
        </section>

        {carregando ? (
          <div className="estado-box">Carregando menu...</div>
        ) : erro && !menu ? (
          <div className="estado-box estado-erro">{erro}</div>
        ) : !menu ? (
          <div className="estado-box">Menu não encontrado.</div>
        ) : (
          <form className="form-card" onSubmit={salvar}>
            <div className="menu-topo">
              <div className="avatar">
                {(menu.nome?.charAt(0) || menu.titulo?.charAt(0) || "M").toUpperCase()}
              </div>

              <div className="menu-info">
                <div className="titulo-linha">
                  <h2>{menu.nome || menu.titulo || "Sem nome"}</h2>
                  <span className="badge-soft">ID #{menu.id_menu ?? menu.id ?? "-"}</span>
                </div>

                <p>{menu.rota || "Sem rota principal"}</p>
              </div>
            </div>

            {erro && <div className="alerta alerta-erro">{erro}</div>}
            {sucesso && <div className="alerta alerta-sucesso">{sucesso}</div>}

            <div className="secao-titulo">
              <h3>Dados do item</h3>
            </div>

            <div className="form-grid">
              <div className="campo">
                <label htmlFor="nome">Nome do item</label>
                <input
                  id="nome"
                  type="text"
                  value={form.nome}
                  onChange={(e) => atualizarCampo("nome", e.target.value)}
                  placeholder="Ex: Login, Sair, Painel..."
                />
              </div>

              <div className="campo">
                <label htmlFor="rota">Rota</label>
                <input
                  id="rota"
                  type="text"
                  value={form.rota}
                  onChange={(e) => atualizarCampo("rota", e.target.value)}
                  placeholder="Ex: /Admin, /login, /sair"
                />
              </div>

              <div className="campo">
                <label htmlFor="icone">Ícone</label>
                <input
                  id="icone"
                  type="text"
                  value={form.icone}
                  onChange={(e) => atualizarCampo("icone", e.target.value)}
                  placeholder="Ex: bi-box-arrow-right"
                />
              </div>

              <div className="campo">
                <label htmlFor="posicao">Posição</label>
                <input
                  id="posicao"
                  type="number"
                  value={form.posicao}
                  onChange={(e) => atualizarCampo("posicao", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="permissao-box">
              <div className="check-linha">
                <input
                  id="criarPermissao"
                  type="checkbox"
                  checked={form.criarPermissao}
                  onChange={(e) => atualizarCampo("criarPermissao", e.target.checked)}
                />
                <label htmlFor="criarPermissao">
                  Cadastrar permissão junto com o item
                </label>
              </div>

              {form.criarPermissao && (
                <>
                  <div className="secao-titulo permissao-titulo">
                    <h3>Permissão do item</h3>
                  </div>

                  <div className="form-grid">
                    <div className="campo">
                      <label htmlFor="nivel_id">Nível</label>
                      <select
                        id="nivel_id"
                        value={form.nivel_id}
                        onChange={(e) => atualizarCampo("nivel_id", e.target.value)}
                      >
                        <option value="">Selecione um nível</option>
                        {niveis.map((nivel) => (
                          <option
                            key={nivel.id_nivel}
                            value={String(nivel.id_nivel ?? "")}
                          >
                            {nivel.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="campo">
                      <label htmlFor="status_id">Status da permissão</label>
                      <select
                        id="status_id"
                        value={form.status_id}
                        onChange={(e) => atualizarCampo("status_id", e.target.value)}
                      >
                        <option value="">Selecione um status</option>
                        {statusList.map((status) => (
                          <option
                            key={status.id_status}
                            value={String(status.id_status ?? "")}
                          >
                            {status.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="acoes-form">
              <Link href={`/Admin/menus/${id}`} className="btn btn-light">
                Cancelar
              </Link>

              <button type="submit" className="btn btn-dark" disabled={salvando}>
                {salvando ? "Salvando..." : "Cadastrar item"}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .cadastro-item-page {
          min-height: 100vh;
          padding: 24px;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
        }

        .cadastro-item-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .hero {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
          margin-bottom: 20px;
        }

        .hero-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .voltar-link {
          text-decoration: none;
          color: #334155;
          font-weight: 800;
          font-size: 14px;
        }

        .hero-tag {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
          font-size: 12px;
          font-weight: 800;
        }

        .hero h1 {
          margin: 0 0 8px;
          font-size: 36px;
          color: #0f172a;
          font-weight: 900;
        }

        .hero p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
        }

        .estado-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 24px;
          text-align: center;
          color: #334155;
          font-weight: 700;
        }

        .estado-erro {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #be123c;
        }

        .form-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
        }

        .menu-topo {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .avatar {
          width: 74px;
          height: 74px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          border: 1px solid #bfdbfe;
        }

        .menu-info {
          flex: 1;
          min-width: 240px;
        }

        .titulo-linha {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .titulo-linha h2 {
          margin: 0;
          font-size: 26px;
          color: #0f172a;
          font-weight: 900;
        }

        .menu-info p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          word-break: break-word;
        }

        .badge-soft {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          font-weight: 800;
        }

        .alerta {
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 700;
        }

        .alerta-erro {
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
        }

        .alerta-sucesso {
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #a7f3d0;
        }

        .secao-titulo {
          margin: 12px 0 14px;
        }

        .secao-titulo h3 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
        }

        .permissao-titulo {
          margin-top: 8px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campo label {
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }

        .campo input,
        .campo select {
          width: 100%;
          min-height: 52px;
          border: 1px solid #dbe3ee;
          border-radius: 16px;
          padding: 0 14px;
          background: #ffffff;
          color: #0f172a;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .campo input:focus,
        .campo select:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .permissao-box {
          margin-top: 22px;
          padding: 18px;
          border: 1px solid #dbe3ee;
          border-radius: 20px;
          background: #f8fafc;
        }

        .check-linha {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .check-linha input {
          width: 18px;
          height: 18px;
        }

        .check-linha label {
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
        }

        .acoes-form {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .btn {
          min-height: 48px;
          padding: 12px 18px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn-dark {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
        }

        .btn-light {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #dbe3ee;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .cadastro-item-page {
            padding: 16px;
          }

          .hero h1 {
            font-size: 28px;
          }

          .titulo-linha h2 {
            font-size: 22px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .acoes-form {
            flex-direction: column;
          }

          .acoes-form .btn {
            width: 100%;
          }

          .check-linha {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}