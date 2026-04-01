"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/Api/conectar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Vitrine = {
  id_vitrine?: number | string;
  nome?: string;
  slug?: string;
  titulo?: string;
  subtitulo?: string | null;
  tipo?: string;
  status_id?: number | string;
  nivel_id?: number | string;
};

type Opcao = {
  id?: number | string;
  id_produto?: number | string;
  id_campanha?: number | string;
  id_categoria?: number | string;
  nome?: string;
  titulo?: string;
  slug?: string;
};

function extrairLista(payload: any): any[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload)) return payload;
  return [];
}

function obterTextoOpcao(item: Opcao) {
  return item?.nome || item?.titulo || item?.slug || "Sem nome";
}

function obterIdOpcao(item: Opcao) {
  return (
    item?.id_produto ??
    item?.id_campanha ??
    item?.id_categoria ??
    item?.id ??
    ""
  );
}

function tipoLabel(tipo?: string) {
  switch ((tipo || "").toLowerCase()) {
    case "produto":
      return "Produto";
    case "campanha":
      return "Campanha";
    case "categoria":
      return "Categoria";
    case "banner":
      return "Banner";
    case "misto":
      return "Misto";
    default:
      return tipo || "Não informado";
  }
}

export default function NovoItemVitrinePage() {
  const router = useRouter();
  const params = useParams();

  const vitrineId = useMemo(() => String(params?.id ?? ""), [params]);

  const [vitrine, setVitrine] = useState<Vitrine | null>(null);

  const [produtos, setProdutos] = useState<Opcao[]>([]);
  const [campanhas, setCampanhas] = useState<Opcao[]>([]);
  const [categorias, setCategorias] = useState<Opcao[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOpcoes, setLoadingOpcoes] = useState(true);

  const [produtoId, setProdutoId] = useState("");
  const [campanhaId, setCampanhaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  const [bannerTexto, setBannerTexto] = useState("");
  const [tituloPersonalizado, setTituloPersonalizado] = useState("");
  const [subtituloPersonalizado, setSubtituloPersonalizado] = useState("");
  const [imagemPersonalizada, setImagemPersonalizada] = useState("");
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  const tipo = (vitrine?.tipo || "").toLowerCase();
  const isBanner = tipo === "banner";
  const isProduto = tipo === "produto";
  const isCampanha = tipo === "campanha";
  const isCategoria = tipo === "categoria";
  const isMisto = tipo === "misto";

  const carregarVitrine = useCallback(async () => {
    const response = await api.get(`/painel/vitrine/${vitrineId}`, {
      withCredentials: true,
    });

    const payload = response?.data;
    const dados = payload?.dados?.dados ?? payload?.dados ?? payload;

    setVitrine(dados || null);
    return dados || null;
  }, [vitrineId]);

  const carregarOpcoes = useCallback(async (tipoRecebido: string) => {
    const tipoNormalizado = (tipoRecebido || "").toLowerCase();

    if (tipoNormalizado === "banner") {
      setProdutos([]);
      setCampanhas([]);
      setCategorias([]);
      setLoadingOpcoes(false);
      return;
    }

    setLoadingOpcoes(true);

    try {
      if (tipoNormalizado === "produto") {
        const response = await api.get("/produtos", {
          withCredentials: true,
        });

        const lista = extrairLista(response?.data) as Opcao[];
        setProdutos(lista);
        setCampanhas([]);
        setCategorias([]);

        if (lista.length > 0) {
          setProdutoId(String(obterIdOpcao(lista[0])));
        }
      }

      if (tipoNormalizado === "campanha") {
        const response = await api.get("/painel/campanhas", {
          withCredentials: true,
        });

        const lista = extrairLista(response?.data) as Opcao[];
        setCampanhas(lista);
        setProdutos([]);
        setCategorias([]);

        if (lista.length > 0) {
          setCampanhaId(String(obterIdOpcao(lista[0])));
        }
      }

      if (tipoNormalizado === "categoria") {
        const response = await api.get("/painel/categorias", {
          withCredentials: true,
        });

        const lista = extrairLista(response?.data) as Opcao[];
        setCategorias(lista);
        setProdutos([]);
        setCampanhas([]);

        if (lista.length > 0) {
          setCategoriaId(String(obterIdOpcao(lista[0])));
        }
      }

      if (tipoNormalizado === "misto") {
        const [produtosRes, campanhasRes, categoriasRes] = await Promise.all([
          api.get("/produtos", { withCredentials: true }),
          api.get("/painel/campanhas", { withCredentials: true }),
          api.get("/painel/categorias", { withCredentials: true }),
        ]);

        const listaProdutos = extrairLista(produtosRes?.data) as Opcao[];
        const listaCampanhas = extrairLista(campanhasRes?.data) as Opcao[];
        const listaCategorias = extrairLista(categoriasRes?.data) as Opcao[];

        setProdutos(listaProdutos);
        setCampanhas(listaCampanhas);
        setCategorias(listaCategorias);

        if (listaProdutos.length > 0) {
          setProdutoId(String(obterIdOpcao(listaProdutos[0])));
        }

        if (listaCampanhas.length > 0) {
          setCampanhaId(String(obterIdOpcao(listaCampanhas[0])));
        }

        if (listaCategorias.length > 0) {
          setCategoriaId(String(obterIdOpcao(listaCategorias[0])));
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar opções:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível carregar os itens disponíveis."
      );
      setProdutos([]);
      setCampanhas([]);
      setCategorias([]);
      setProdutoId("");
      setCampanhaId("");
      setCategoriaId("");
    } finally {
      setLoadingOpcoes(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const vitrineAtual = await carregarVitrine();

        if (vitrineAtual?.tipo) {
          await carregarOpcoes(vitrineAtual.tipo);
        }
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.mensagem ||
            error?.message ||
            "Não foi possível carregar os dados da vitrine."
        );
      } finally {
        setLoading(false);
      }
    }

    if (vitrineId) {
      init();
    }
  }, [vitrineId, carregarVitrine, carregarOpcoes]);

  useEffect(() => {
    return () => {
      if (previewImagem) {
        URL.revokeObjectURL(previewImagem);
      }
    };
  }, [previewImagem]);

  function onSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;

    if (previewImagem) {
      URL.revokeObjectURL(previewImagem);
    }

    setArquivoImagem(file);

    if (!file) {
      setPreviewImagem("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewImagem(url);
  }

  async function uploadImagem(): Promise<string | null> {
    if (!arquivoImagem) return null;

    try {
      setEnviandoImagem(true);

      const formData = new FormData();
      formData.append("imagem", arquivoImagem);

      const response = await api.post("/painel/vitrine/upload-imagem", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const payload = response?.data;

      const caminho =
        payload?.dados?.dados?.caminho ||
        payload?.dados?.caminho ||
        payload?.dados?.dados?.imagem ||
        payload?.dados?.imagem ||
        payload?.caminho ||
        payload?.imagem ||
        null;

      if (!caminho) {
        console.error("Retorno do upload sem caminho:", payload);
        toast.error("Upload concluído, mas o caminho da imagem não foi retornado.");
        return null;
      }

      return caminho;
    } catch (error: any) {
      console.error("Erro ao subir imagem:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Não foi possível enviar a imagem."
      );
      return null;
    } finally {
      setEnviandoImagem(false);
    }
  }

  async function adicionarItem() {
    if (!vitrine) {
      toast.warning("Vitrine não carregada.");
      return;
    }

    if (isBanner) {
      if (!bannerTexto.trim() && !arquivoImagem) {
        toast.warning("Escreva o banner ou envie uma imagem.");
        return;
      }
    }

    if (isProduto && !produtoId) {
      toast.warning("Selecione um produto.");
      return;
    }

    if (isCampanha && !campanhaId) {
      toast.warning("Selecione uma campanha.");
      return;
    }

    if (isCategoria && !categoriaId) {
      toast.warning("Selecione uma categoria.");
      return;
    }

    if (isMisto && !produtoId && !campanhaId && !categoriaId) {
      toast.warning("Selecione ao menos produto, campanha ou categoria.");
      return;
    }

    let caminhoImagem: string | null = null;

    if (arquivoImagem) {
      caminhoImagem = await uploadImagem();
      if (!caminhoImagem) return;
    }

    const body: Record<string, any> = {
      titulo_personalizado: tituloPersonalizado.trim() || null,
      subtitulo_personalizado: subtituloPersonalizado.trim() || null,
      imagem_personalizada:
        caminhoImagem ||
        (isBanner
          ? bannerTexto.trim() || null
          : imagemPersonalizada.trim() || null),
      status_id: Number(vitrine.status_id || 1),
      nivel_id: Number(vitrine.nivel_id || 1),
    };

    if (produtoId) body.produto_id = Number(produtoId);
    if (campanhaId) body.campanha_id = Number(campanhaId);
    if (categoriaId) body.categoria_id = Number(categoriaId);

    try {
      setAdicionando(true);

      const response = await api.post(`/painel/vitrine/${vitrineId}/item`, body, {
        withCredentials: true,
      });

      const payload = response?.data;
      const sucesso =
        response?.status === 200 ||
        response?.status === 201 ||
        payload?.status === 200 ||
        payload?.status === 201;

      if (!sucesso) {
        toast.error(payload?.mensagem || "Não foi possível adicionar o item.");
        return;
      }

      toast.success(payload?.mensagem || "Item adicionado com sucesso.");

      setTimeout(() => {
        router.push(`/Admin/vitrines/${vitrineId}/itens`);
      }, 800);
    } catch (error: any) {
      console.error("Erro ao adicionar item:", error);
      toast.error(
        error?.response?.data?.mensagem ||
          error?.message ||
          "Erro ao adicionar item."
      );
    } finally {
      setAdicionando(false);
    }
  }

  if (loading) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="pagina">
          <div className="estado">
            <div className="loader" />
            <p>Carregando formulário...</p>
          </div>

          <style jsx>{`
            .pagina {
              min-height: 100%;
              padding: 24px;
              background: linear-gradient(180deg, #fffaf7 0%, #fff3ec 100%);
            }

            .estado {
              max-width: 780px;
              margin: 0 auto;
              background: #fffdfb;
              border-radius: 24px;
              padding: 40px 24px;
              text-align: center;
              border: 1px solid #f0dfd7;
              box-shadow: 0 18px 45px rgba(128, 86, 78, 0.06);
            }

            .loader {
              width: 42px;
              height: 42px;
              border-radius: 50%;
              border: 4px solid #f2dfd7;
              border-top-color: #b76e79;
              margin: 0 auto 14px;
              animation: girar 0.9s linear infinite;
            }

            @keyframes girar {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="pagina">
        <div className="container">
          <div className="topo">
            <div>
              <span className="badge">Nova adição</span>
              <h1>Adicionar item</h1>
              <p>
                {vitrine
                  ? `Vitrine ${vitrine.titulo || vitrine.nome} do tipo ${tipoLabel(
                      vitrine.tipo
                    )}.`
                  : "Adicionar item à vitrine."}
              </p>
            </div>

            <div className="topoAcoes">
              <button
                type="button"
                className="btnSecundario"
                onClick={() => router.push(`/Admin/vitrines/${vitrineId}/itens`)}
              >
                Voltar
              </button>
            </div>
          </div>

          <div className="card">
            <div className="formGrid">
              {isBanner && (
                <div className="campo campoGrande">
                  <label>Banner</label>
                  <input
                    type="text"
                    placeholder="Escreva o banner, caminho ou texto"
                    value={bannerTexto}
                    onChange={(e) => setBannerTexto(e.target.value)}
                  />
                  <small>
                    Para vitrine do tipo banner, você pode escrever o banner ou enviar uma imagem.
                  </small>
                </div>
              )}

              {isProduto && (
                <div className="campo campoGrande">
                  <label>Selecionar produto *</label>
                  <select
                    value={produtoId}
                    onChange={(e) => setProdutoId(e.target.value)}
                    disabled={loadingOpcoes}
                  >
                    {loadingOpcoes ? (
                      <option value="">Carregando produtos...</option>
                    ) : produtos.length === 0 ? (
                      <option value="">Nenhum produto encontrado</option>
                    ) : (
                      produtos.map((item) => {
                        const id = obterIdOpcao(item);
                        return (
                          <option key={String(id)} value={String(id)}>
                            {obterTextoOpcao(item)} — ID {String(id)}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              )}

              {isCampanha && (
                <div className="campo campoGrande">
                  <label>Selecionar campanha *</label>
                  <select
                    value={campanhaId}
                    onChange={(e) => setCampanhaId(e.target.value)}
                    disabled={loadingOpcoes}
                  >
                    {loadingOpcoes ? (
                      <option value="">Carregando campanhas...</option>
                    ) : campanhas.length === 0 ? (
                      <option value="">Nenhuma campanha encontrada</option>
                    ) : (
                      campanhas.map((item) => {
                        const id = obterIdOpcao(item);
                        return (
                          <option key={String(id)} value={String(id)}>
                            {obterTextoOpcao(item)} — ID {String(id)}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              )}

              {isCategoria && (
                <div className="campo campoGrande">
                  <label>Selecionar categoria *</label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    disabled={loadingOpcoes}
                  >
                    {loadingOpcoes ? (
                      <option value="">Carregando categorias...</option>
                    ) : categorias.length === 0 ? (
                      <option value="">Nenhuma categoria encontrada</option>
                    ) : (
                      categorias.map((item) => {
                        const id = obterIdOpcao(item);
                        return (
                          <option key={String(id)} value={String(id)}>
                            {obterTextoOpcao(item)} — ID {String(id)}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              )}

              {isMisto && (
                <>
                  <div className="campo">
                    <label>Produto</label>
                    <select
                      value={produtoId}
                      onChange={(e) => setProdutoId(e.target.value)}
                      disabled={loadingOpcoes}
                    >
                      <option value="">Selecione um produto</option>
                      {produtos.map((item) => {
                        const id = obterIdOpcao(item);
                        return (
                          <option key={String(id)} value={String(id)}>
                            {obterTextoOpcao(item)} — ID {String(id)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="campo">
                    <label>Campanha</label>
                    <select
                      value={campanhaId}
                      onChange={(e) => setCampanhaId(e.target.value)}
                      disabled={loadingOpcoes}
                    >
                      <option value="">Selecione uma campanha</option>
                      {campanhas.map((item) => {
                        const id = obterIdOpcao(item);
                        return (
                          <option key={String(id)} value={String(id)}>
                            {obterTextoOpcao(item)} — ID {String(id)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="campo campoGrande">
                    <label>Categoria</label>
                    <select
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      disabled={loadingOpcoes}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((item) => {
                        const id = obterIdOpcao(item);
                        return (
                          <option key={String(id)} value={String(id)}>
                            {obterTextoOpcao(item)} — ID {String(id)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}

              <div className="campo campoGrande">
                <label>Título personalizado</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={tituloPersonalizado}
                  onChange={(e) => setTituloPersonalizado(e.target.value)}
                />
              </div>

              <div className="campo campoGrande">
                <label>Subtítulo personalizado</label>
                <input
                  type="text"
                  placeholder="Opcional"
                  value={subtituloPersonalizado}
                  onChange={(e) => setSubtituloPersonalizado(e.target.value)}
                />
              </div>

              <div className="campo campoGrande">
                <label>Upload de imagem</label>
                <input type="file" accept="image/*" onChange={onSelecionarArquivo} />
                <small>
                  Você pode enviar uma imagem. O sistema salva o caminho no campo da vitrine.
                </small>
              </div>

              {previewImagem && (
                <div className="campo campoGrande">
                  <label>Prévia da imagem</label>
                  <div className="previewBox">
                    <img src={previewImagem} alt="Prévia" className="previewImg" />
                  </div>
                </div>
              )}

              {!isBanner && (
                <div className="campo campoGrande">
                  <label>Imagem personalizada</label>
                  <input
                    type="text"
                    placeholder="URL, caminho ou texto"
                    value={imagemPersonalizada}
                    onChange={(e) => setImagemPersonalizada(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="acoes">
              <button
                type="button"
                className="btnSecundario"
                onClick={() => router.push(`/Admin/vitrines/${vitrineId}/itens`)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btnPrimario"
                disabled={adicionando || enviandoImagem}
                onClick={adicionarItem}
              >
                {enviandoImagem
                  ? "Enviando imagem..."
                  : adicionando
                  ? "Salvando..."
                  : "Salvar item"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pagina {
          min-height: 100%;
          padding: 24px;
          background: linear-gradient(180deg, #fffaf7 0%, #fff3ec 100%);
        }

        .container {
          max-width: 980px;
          margin: 0 auto;
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
          background: #f8e5df;
          color: #8b5e5a;
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
          color: #5c3a36;
          font-weight: 800;
        }

        .topo p {
          margin: 0;
          color: #7a5c57;
          font-size: 15px;
          max-width: 760px;
        }

        .card {
          background: #fffdfb;
          border-radius: 24px;
          border: 1px solid #f0dfd7;
          box-shadow: 0 18px 45px rgba(128, 86, 78, 0.06);
          padding: 24px;
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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
          color: #6d4c47;
        }

        .campo input,
        .campo select {
          width: 100%;
          border: 1px solid #ead7cf;
          background: #fff;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 15px;
          color: #5c3a36;
          outline: none;
          transition: all 0.2s ease;
        }

        .campo input:focus,
        .campo select:focus {
          border-color: #d49aa5;
          box-shadow: 0 0 0 4px rgba(183, 110, 121, 0.12);
        }

        .campo small {
          color: #8e6f68;
          font-size: 12px;
        }

        .previewBox {
          width: 100%;
          border: 1px solid #f0dfd7;
          border-radius: 16px;
          padding: 12px;
          background: #fff8f4;
        }

        .previewImg {
          width: 100%;
          max-height: 260px;
          object-fit: contain;
          display: block;
          border-radius: 12px;
        }

        .acoes {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 22px;
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
        }

        .btnPrimario {
          background: #b76e79;
          color: #fff;
          box-shadow: 0 12px 24px rgba(183, 110, 121, 0.24);
        }

        .btnPrimario:hover:not(:disabled) {
          background: #a85f6a;
        }

        .btnPrimario:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btnSecundario {
          background: #fffdfb;
          color: #6d4c47;
          border: 1px solid #ead7cf;
        }

        .btnSecundario:hover {
          background: #fff6f1;
        }

        @media (max-width: 700px) {
          .pagina {
            padding: 16px;
          }

          .topo h1 {
            font-size: 26px;
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .campoGrande {
            grid-column: span 1;
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