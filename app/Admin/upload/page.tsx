"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import {
  FiFolder,
  FiFile,
  FiImage,
  FiHardDrive,
  FiRefreshCcw,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiTrash2,
} from "react-icons/fi";

type UploadResumo = {
  base_path?: string;
  base_existe?: boolean;
  base_permissao_escrita?: boolean;
  total_arquivos?: number;
  tamanho_total_bytes?: number;
  tamanho_total_formatado?: string;
};

type UploadArquivo = {
  nome?: string;
  caminho?: string;
  caminho_relativo?: string;
  pasta?: string;
  tamanho?: number;
  tamanho_formatado?: string;
  extensao?: string;
  url?: string;
  modificado_em?: string;
  tipo?: "arquivo" | "imagem";
};

type UploadPasta = {
  nome?: string;
  caminho?: string;
  caminho_relativo?: string;
  total_arquivos?: number;
};

type UploadListagem = {
  pastas?: UploadPasta[];
  arquivos?: UploadArquivo[];
};

function formatarBytes(bytes?: number) {
  const valor = Number(bytes || 0);

  if (valor < 1024) return `${valor} B`;
  if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(2)} KB`;
  if (valor < 1024 * 1024 * 1024) return `${(valor / 1024 / 1024).toFixed(2)} MB`;
  return `${(valor / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatarData(data?: string) {
  if (!data) return "-";

  const dt = new Date(String(data).replace(" ", "T"));
  if (Number.isNaN(dt.getTime())) return data;

  return dt.toLocaleString("pt-BR");
}

function extrairResumo(data: any): UploadResumo {
  return data?.dados?.dados || data?.dados || {};
}

function extrairListagem(data: any): UploadListagem {
  const payload = data?.dados?.dados || data?.dados || data || {};

  return {
    pastas: Array.isArray(payload?.pastas) ? payload.pastas : [],
    arquivos: Array.isArray(payload?.arquivos) ? payload.arquivos : [],
  };
}

function detectarTipoArquivo(arquivo: UploadArquivo) {
  const ext = String(arquivo.extensao || "")
    .toLowerCase()
    .replace(".", "");

  const imagens = ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "avif"];

  if (arquivo.tipo === "imagem" || imagens.includes(ext)) {
    return "imagem";
  }

  return "arquivo";
}

function montarUrlArquivo(arquivo: UploadArquivo) {
  if (arquivo.url) return arquivo.url;

  const caminho = String(arquivo.caminho_relativo || "").trim();
  if (!caminho) return "";

  const base = String(api?.defaults?.baseURL || "").replace(/\/+$/, "");

  if (!base) return `/${caminho.replace(/^\/+/, "")}`;

  try {
    const url = new URL(base);
    return `${url.origin}/${caminho.replace(/^\/+/, "")}`;
  } catch {
    return `${base}/${caminho.replace(/^\/+/, "")}`;
  }
}

export default function UploadPage() {
  const [resumo, setResumo] = useState<UploadResumo>({});
  const [pastas, setPastas] = useState<UploadPasta[]>([]);
  const [arquivos, setArquivos] = useState<UploadArquivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroResumo, setErroResumo] = useState("");
  const [erroListagem, setErroListagem] = useState("");
  const [busca, setBusca] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const [removendoCaminho, setRemovendoCaminho] = useState("");

  async function carregarTudo() {
    try {
      setCarregando(true);
      setAtualizando(true);
      setErroResumo("");
      setErroListagem("");

      const [resumoResponse, listagemResponse] = await Promise.allSettled([
        api.get("/painel/upload/resumo", { withCredentials: true }),
        api.get("/painel/upload/listar", { withCredentials: true }),
      ]);

      if (resumoResponse.status === "fulfilled") {
        const resumoData = extrairResumo(resumoResponse.value.data);
        setResumo(resumoData);
      } else {
        setErroResumo("Não foi possível carregar o resumo do upload.");
      }

      if (listagemResponse.status === "fulfilled") {
        const lista = extrairListagem(listagemResponse.value.data);
        setPastas(lista.pastas || []);
        setArquivos(lista.arquivos || []);
      } else {
        setPastas([]);
        setArquivos([]);
        setErroListagem(
          "Não foi possível carregar a listagem de pastas e arquivos."
        );
      }
    } catch (error) {
      console.error("Erro ao carregar upload:", error);
      setErroResumo("Erro inesperado ao carregar os dados.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  async function removerArquivo(caminho?: string) {
    const caminhoSeguro = String(caminho || "").trim();
    if (!caminhoSeguro) return;

    const confirmar = window.confirm("Deseja remover este arquivo?");
    if (!confirmar) return;

    try {
      setRemovendoCaminho(caminhoSeguro);

      await api.delete("/painel/upload/remover", {
        data: { caminho: caminhoSeguro },
        withCredentials: true,
      });

      await carregarTudo();
    } catch (error) {
      console.error("Erro ao remover arquivo:", error);
      alert("Erro ao remover arquivo.");
    } finally {
      setRemovendoCaminho("");
    }
  }

  function verArquivo(arquivo: UploadArquivo) {
    const url = montarUrlArquivo(arquivo);
    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  const arquivosFiltrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    if (!texto) return arquivos;

    return arquivos.filter((arquivo) => {
      const nome = String(arquivo.nome || "").toLowerCase();
      const caminho = String(
        arquivo.caminho_relativo || arquivo.caminho || ""
      ).toLowerCase();
      const pasta = String(arquivo.pasta || "").toLowerCase();

      return (
        nome.includes(texto) ||
        caminho.includes(texto) ||
        pasta.includes(texto)
      );
    });
  }, [arquivos, busca]);

  const pastasFiltradas = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    if (!texto) return pastas;

    return pastas.filter((pasta) => {
      const nome = String(pasta.nome || "").toLowerCase();
      const caminho = String(
        pasta.caminho_relativo || pasta.caminho || ""
      ).toLowerCase();

      return nome.includes(texto) || caminho.includes(texto);
    });
  }, [pastas, busca]);

  return (
    <div className="pagina-upload">
      <div className="upload-container">
        <section className="hero">
          <div className="hero-texto">
            <span className="tag">Gerenciador de Upload</span>
            <h1>Arquivos e pastas do sistema</h1>
            <p>
              Visualize o status da pasta de upload, a quantidade de arquivos,
              o tamanho total e a estrutura armazenada.
            </p>
          </div>

          <button
            type="button"
            className="botao-atualizar"
            onClick={carregarTudo}
            disabled={atualizando}
          >
            <FiRefreshCcw size={16} />
            <span>{atualizando ? "Atualizando..." : "Atualizar"}</span>
          </button>
        </section>

        {carregando ? (
          <div className="estado">Carregando dados do upload...</div>
        ) : (
          <>
            <section className="grid-resumo">
              <div className="card-resumo destaque">
                <div className="icone-box">
                  <FiHardDrive size={18} />
                </div>
                <span>Total de arquivos</span>
                <strong>{Number(resumo.total_arquivos || 0)}</strong>
                <small>Arquivos encontrados na pasta upload</small>
              </div>

              <div className="card-resumo">
                <div className="icone-box">
                  <FiFolder size={18} />
                </div>
                <span>Total de pastas</span>
                <strong>{pastas.length}</strong>
                <small>Pastas carregadas pela listagem</small>
              </div>

              <div className="card-resumo">
                <div className="icone-box">
                  <FiImage size={18} />
                </div>
                <span>Tamanho total</span>
                <strong>
                  {resumo.tamanho_total_formatado ||
                    formatarBytes(resumo.tamanho_total_bytes)}
                </strong>
                <small>Espaço utilizado pela pasta de upload</small>
              </div>

              <div className="card-resumo">
                <div className="icone-box">
                  {resumo.base_existe ? (
                    <FiCheckCircle size={18} />
                  ) : (
                    <FiAlertCircle size={18} />
                  )}
                </div>
                <span>Status da pasta</span>
                <strong>{resumo.base_existe ? "Ativa" : "Inexistente"}</strong>
                <small>
                  {resumo.base_permissao_escrita
                    ? "Com permissão de escrita"
                    : "Sem permissão de escrita"}
                </small>
              </div>
            </section>

            <section className="painel-info">
              <div className="box-info">
                <span className="box-label">Caminho base</span>
                <p title={resumo.base_path || ""}>
                  {resumo.base_path || "Não informado"}
                </p>
              </div>

              <div className="box-busca">
                <label>Buscar arquivo ou pasta</label>
                <input
                  type="text"
                  placeholder="Digite nome, caminho ou pasta..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </section>

            {erroResumo ? (
              <div className="estado estado-erro">{erroResumo}</div>
            ) : null}

            <div className="blocos-grid">
              <section className="bloco">
                <div className="bloco-topo">
                  <h2>Pastas</h2>
                  <span>{pastasFiltradas.length}</span>
                </div>

                {erroListagem ? (
                  <div className="estado-mini estado-erro">{erroListagem}</div>
                ) : pastasFiltradas.length === 0 ? (
                  <div className="estado-mini">Nenhuma pasta encontrada.</div>
                ) : (
                  <div className="lista-scroll">
                    {pastasFiltradas.map((pasta, index) => (
                      <div className="item-lista" key={`${pasta.caminho}-${index}`}>
                        <div className="item-icone pasta">
                          <FiFolder size={16} />
                        </div>

                        <div className="item-texto">
                          <strong title={pasta.nome || ""}>
                            {pasta.nome || "Pasta"}
                          </strong>
                          <small title={pasta.caminho_relativo || pasta.caminho || ""}>
                            {pasta.caminho_relativo || pasta.caminho || "-"}
                          </small>
                        </div>

                        <div className="item-lado">
                          <span>{Number(pasta.total_arquivos || 0)} arq.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bloco bloco-arquivos">
                <div className="bloco-topo">
                  <h2>Arquivos</h2>
                  <span>{arquivosFiltrados.length}</span>
                </div>

                {erroListagem ? (
                  <div className="estado-mini estado-erro">{erroListagem}</div>
                ) : arquivosFiltrados.length === 0 ? (
                  <div className="estado-mini">Nenhum arquivo encontrado.</div>
                ) : (
                  <div className="lista-scroll">
                    {arquivosFiltrados.map((arquivo, index) => {
                      const tipo = detectarTipoArquivo(arquivo);
                      const removendo =
                        removendoCaminho === String(arquivo.caminho_relativo || "");

                      return (
                        <div
                          className="item-lista item-arquivo"
                          key={`${arquivo.caminho}-${index}`}
                        >
                          <div className={`item-icone ${tipo}`}>
                            {tipo === "imagem" ? (
                              <FiImage size={16} />
                            ) : (
                              <FiFile size={16} />
                            )}
                          </div>

                          <div className="item-texto">
                            <strong title={arquivo.nome || ""}>
                              {arquivo.nome || "Arquivo"}
                            </strong>
                            <small
                              title={
                                arquivo.caminho_relativo ||
                                arquivo.caminho ||
                                ""
                              }
                            >
                              {arquivo.caminho_relativo ||
                                arquivo.caminho ||
                                "-"}
                            </small>
                          </div>

                          <div className="item-lado">
                            <span>
                              {arquivo.tamanho_formatado ||
                                formatarBytes(arquivo.tamanho)}
                            </span>
                            <small>{formatarData(arquivo.modificado_em)}</small>

                            <div className="acoes-arquivo">
                              {tipo === "imagem" && (
                                <button
                                  type="button"
                                  className="btn-ver"
                                  onClick={() => verArquivo(arquivo)}
                                >
                                  <FiEye size={13} />
                                  <span>Ver</span>
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn-remover"
                                onClick={() =>
                                  removerArquivo(arquivo.caminho_relativo)
                                }
                                disabled={removendo}
                              >
                                <FiTrash2 size={13} />
                                <span>{removendo ? "Removendo..." : "Remover"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .pagina-upload {
          min-height: 100vh;
          width: 100%;
          padding: 16px;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 24%),
            radial-gradient(circle at bottom right, rgba(79, 70, 229, 0.06), transparent 28%),
            #f6f8fc;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .upload-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          min-width: 0;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border-radius: 24px;
          background: linear-gradient(135deg, #0f172a, #1e293b, #312e81);
          color: #fff;
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.16);
          margin-bottom: 18px;
        }

        .hero-texto {
          min-width: 0;
          flex: 1;
        }

        .tag {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .hero h1 {
          margin: 0 0 10px 0;
          font-size: 2rem;
          line-height: 1.1;
        }

        .hero p {
          margin: 0;
          color: rgba(255, 255, 255, 0.82);
          line-height: 1.6;
          max-width: 680px;
        }

        .botao-atualizar {
          border: none;
          cursor: pointer;
          border-radius: 14px;
          padding: 12px 16px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #ffffff;
          color: #111827;
          flex-shrink: 0;
        }

        .botao-atualizar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .grid-resumo {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        .card-resumo {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #edf2f7;
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
          min-width: 0;
        }

        .card-resumo.destaque {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          border: none;
        }

        .icone-box {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          background: rgba(99, 102, 241, 0.1);
          color: #3730a3;
        }

        .destaque .icone-box {
          background: rgba(255, 255, 255, 0.16);
          color: #fff;
        }

        .card-resumo span {
          display: block;
          font-size: 0.88rem;
          color: inherit;
          opacity: 0.9;
          margin-bottom: 6px;
        }

        .card-resumo strong {
          display: block;
          font-size: 1.5rem;
          margin-bottom: 6px;
        }

        .card-resumo small {
          display: block;
          line-height: 1.5;
          color: inherit;
          opacity: 0.75;
        }

        .painel-info {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }

        .box-info,
        .box-busca,
        .bloco,
        .estado {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #edf2f7;
          border-radius: 20px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
        }

        .box-info,
        .box-busca {
          padding: 18px;
        }

        .box-label {
          display: block;
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .box-info p {
          margin: 0;
          color: #111827;
          line-height: 1.6;
          word-break: break-word;
        }

        .box-busca label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 8px;
        }

        .box-busca input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 13px 14px;
          outline: none;
          font-size: 0.95rem;
          box-sizing: border-box;
        }

        .box-busca input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }

        .blocos-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 14px;
        }

        .bloco {
          min-width: 0;
          overflow: hidden;
        }

        .bloco-topo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 18px 18px 12px;
          border-bottom: 1px solid #eef2f7;
        }

        .bloco-topo h2 {
          margin: 0;
          font-size: 1.05rem;
          color: #111827;
        }

        .bloco-topo span {
          min-width: 28px;
          height: 28px;
          padding: 0 8px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #eef2ff;
          color: #4338ca;
          font-size: 12px;
          font-weight: 700;
        }

        .lista-scroll {
          max-height: 620px;
          overflow: auto;
          padding: 10px;
        }

        .lista-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .lista-scroll::-webkit-scrollbar-thumb {
          background: #dbe1ea;
          border-radius: 999px;
        }

        .item-lista {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 16px;
          transition: 0.2s ease;
        }

        .item-lista + .item-lista {
          margin-top: 6px;
        }

        .item-lista:hover {
          background: #f8fafc;
        }

        .item-icone {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-icone.pasta {
          background: #eef2ff;
          color: #4338ca;
        }

        .item-icone.arquivo {
          background: #f3f4f6;
          color: #374151;
        }

        .item-icone.imagem {
          background: #ecfeff;
          color: #0f766e;
        }

        .item-texto {
          min-width: 0;
          flex: 1;
        }

        .item-texto strong {
          display: block;
          font-size: 0.92rem;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-texto small {
          display: block;
          margin-top: 4px;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-lado {
          text-align: right;
          flex-shrink: 0;
          min-width: 150px;
        }

        .item-lado span {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #111827;
        }

        .item-lado small {
          display: block;
          margin-top: 4px;
          font-size: 0.74rem;
          color: #6b7280;
        }

        .acoes-arquivo {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .btn-ver,
        .btn-remover {
          border: none;
          cursor: pointer;
          border-radius: 10px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: 0.2s ease;
        }

        .btn-ver {
          background: #2563eb;
          color: #fff;
        }

        .btn-ver:hover {
          background: #1d4ed8;
        }

        .btn-remover {
          background: #ef4444;
          color: #fff;
        }

        .btn-remover:hover {
          background: #dc2626;
        }

        .btn-remover:disabled,
        .btn-ver:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .estado {
          padding: 18px;
          text-align: center;
          color: #374151;
        }

        .estado-erro {
          color: #b91c1c;
          border-color: #fecaca;
          background: #fff;
          margin-bottom: 14px;
        }

        .estado-mini {
          margin: 12px;
          padding: 14px;
          border-radius: 14px;
          background: #f8fafc;
          color: #475569;
          text-align: center;
        }

        @media (max-width: 1100px) {
          .grid-resumo {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .blocos-grid {
            grid-template-columns: 1fr;
          }

          .painel-info {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .pagina-upload {
            padding: 12px;
          }

          .hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .botao-atualizar {
            width: 100%;
          }

          .grid-resumo {
            grid-template-columns: 1fr;
          }

          .hero h1 {
            font-size: 1.6rem;
          }

          .item-lista.item-arquivo {
            align-items: flex-start;
            flex-direction: column;
          }

          .item-lado {
            width: 100%;
            min-width: 0;
            text-align: left;
          }

          .acoes-arquivo {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}