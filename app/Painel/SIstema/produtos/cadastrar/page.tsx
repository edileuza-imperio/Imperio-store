"use client";

import api from "@/Api/conectar";
import styles from "./CadastrarProduto.module.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Save,
  ArrowLeft,
  Package,
  ImagePlus,
  Truck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";

interface Categoria {
  id_categoria: number;
  nome: string;
}

interface StatusItem {
  id_status: number;
  nome: string;
  codigo: string;
}

export default function CadastrarProdutoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState(1);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusList, setStatusList] = useState<StatusItem[]>([]);

  const [imagens, setImagens] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [form, setForm] = useState({
    nome: "",
    slug: "",
    descricao: "",
    preco: "",
    sku: "",
    marca: "",
    categoria_id: "",
    status_id: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const urls = imagens.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [imagens]);

  async function carregarDados() {
    try {
      const [
        categoriasRes,
        statusRes,
      ] = await Promise.all([
        api.get("/painel/categorias"),
        api.get("/painel/status"),
      ]);

      console.log(
        "Categorias:",
        categoriasRes.data
      );

      console.log(
        "Status:",
        statusRes.data
      );

      setCategorias(
        Array.isArray(
          categoriasRes.data?.dados
        )
          ? categoriasRes.data.dados
          : []
      );

      /* ARRUMADO STATUS */
      setStatusList(
        Array.isArray(
          statusRes.data?.dados?.dados
        )
          ? statusRes.data.dados.dados
          : []
      );

      /* PEGA AUTOMATICAMENTE O STATUS ATIVO */
      const statusAtivo =
        statusRes.data?.dados?.dados?.find(
          (item: StatusItem) =>
            item.codigo === "ATIVO"
        );

      if (statusAtivo) {
        setForm((old) => ({
          ...old,
          status_id: String(
            statusAtivo.id_status
          ),
        }));
      }
    } catch (error) {
      console.error(
        "Erro ao carregar dados:",
        error
      );

      setCategorias([]);
      setStatusList([]);
    }
  }

  function gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(
        /[^a-z0-9\s-]/g,
        ""
      )
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  /* SKU AUTOMÁTICO */
  function gerarSKU(nome: string) {
    const prefixo = nome
      .trim()
      .substring(0, 3)
      .toUpperCase()
      .replace(/\s/g, "");

    const numero = Math.floor(
      100000 + Math.random() * 900000
    );

    return `${prefixo}-${numero}`;
  }

  function handleChange(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((old) => {
      const updated = {
        ...old,
        [name]: value,
      };

      /* GERA AUTOMATICAMENTE */
      if (name === "nome") {
        updated.slug =
          gerarSlug(value);

        updated.sku =
          gerarSKU(value);
      }

      return updated;
    });
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivos = e.target.files;

    if (!arquivos) {
      setImagens([]);
      return;
    }

    setImagens(Array.from(arquivos));
  }

  function removerImagem(index: number) {
    setImagens((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  function proximaEtapa() {
    setEtapa((current) =>
      Math.min(current + 1, 3)
    );
  }

  function etapaAnterior() {
    setEtapa((current) =>
      Math.max(current - 1, 1)
    );
  }

  async function salvar() {
    try {
      setLoading(true);

      const data = new FormData();

      data.append(
        "nome",
        form.nome
      );

      data.append(
        "slug",
        form.slug
      );

      data.append(
        "descricao",
        form.descricao
      );

      data.append(
        "preco",
        form.preco
      );

      data.append(
        "sku",
        form.sku
      );

      data.append(
        "marca",
        form.marca
      );

      data.append(
        "categoria_id",
        form.categoria_id
      );

      data.append(
        "status_id",
        form.status_id
      );

      imagens.forEach((arquivo) => {
        data.append(
          "imagens[]",
          arquivo
        );
      });

      console.log(
        "ENVIANDO:",
        Object.fromEntries(
          data.entries()
        )
      );

      await api.post(
        "/painel/produto",
        data,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      alert(
        "Produto cadastrado com sucesso!"
      );

      router.push(
        "/painel/sistema/produtos"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao cadastrar produto."
      );
    } finally {
      setLoading(false);
    }
  }

  const progresso = useMemo(() => {
    return ((etapa - 1) / 2) * 100;
  }, [etapa]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button
            className={
              styles.backButton
            }
            onClick={() =>
              router.back()
            }
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div
            className={
              styles.titleBlock
            }
          >
            <div
              className={
                styles.badge
              }
            >
              <Sparkles size={16} />
              Cadastro de produto
            </div>

            <h1>
              <Package size={28} />
              Cadastrar Produto
            </h1>

            <p>
              Sistema moderno de
              cadastro em etapas.
            </p>
          </div>
        </div>

        <div
          className={styles.stepper}
        >
          <div
            className={
              styles.stepperTop
            }
          >
            <span
              className={
                etapa >= 1
                  ? styles.stepActive
                  : ""
              }
            >
              1
            </span>

            <div
              className={
                styles.stepLine
              }
            />

            <span
              className={
                etapa >= 2
                  ? styles.stepActive
                  : ""
              }
            >
              2
            </span>

            <div
              className={
                styles.stepLine
              }
            />

            <span
              className={
                etapa >= 3
                  ? styles.stepActive
                  : ""
              }
            >
              3
            </span>
          </div>

          <div
            className={
              styles.progressBar
            }
          >
            <div
              className={
                styles.progressFill
              }
              style={{
                width: `${progresso}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div
        className={styles.formCard}
      >
        {/* ETAPA 1 */}
        {etapa === 1 && (
          <section
            className={
              styles.stepCard
            }
          >
            <div
              className={
                styles.stepHeader
              }
            >
              <div
                className={
                  styles.stepIcon
                }
              >
                <ImagePlus size={22} />
              </div>

              <div>
                <h2>
                  Imagens do produto
                </h2>

                <p>
                  Faça upload das
                  imagens.
                </p>
              </div>
            </div>

            <div
              className={
                styles.uploadArea
              }
            >
              <input
                id="imagens"
                type="file"
                multiple
                accept="image/*"
                onChange={
                  handleFileChange
                }
                className={
                  styles.uploadInput
                }
              />

              <label
                htmlFor="imagens"
                className={
                  styles.uploadLabel
                }
              >
                <div
                  className={
                    styles.uploadIconWrap
                  }
                >
                  <ImagePlus
                    size={30}
                  />
                </div>

                <strong>
                  Clique para enviar
                  imagens
                </strong>

                <span>
                  PNG, JPG, JPEG,
                  WEBP
                </span>
              </label>
            </div>

            {previewUrls.length >
              0 && (
              <div
                className={
                  styles.previewGrid
                }
              >
                {previewUrls.map(
                  (
                    url,
                    index
                  ) => (
                    <div
                      key={url}
                      className={
                        styles.previewCard
                      }
                    >
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                      />

                      <button
                        type="button"
                        className={
                          styles.removeImage
                        }
                        onClick={() =>
                          removerImagem(
                            index
                          )
                        }
                      >
                        <X
                          size={16}
                        />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            <div
              className={
                styles.actions
              }
            >
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  proximaEtapa
                }
                disabled={
                  imagens.length ===
                  0
                }
              >
                Próxima etapa
                <ChevronRight
                  size={18}
                />
              </button>
            </div>
          </section>
        )}

        {/* ETAPA 2 */}
        {etapa === 2 && (
          <section
            className={
              styles.stepCard
            }
          >
            <div
              className={
                styles.stepHeader
              }
            >
              <div
                className={
                  styles.stepIcon
                }
              >
                <Truck size={22} />
              </div>

              <div>
                <h2>
                  Dados principais
                </h2>

                <p>
                  Informações do
                  produto.
                </p>
              </div>
            </div>

            <div
              className={styles.grid}
            >
              <div
                className={
                  styles.field
                }
              >
                <label>Nome</label>

                <input
                  type="text"
                  name="nome"
                  placeholder="Nome do produto"
                  value={
                    form.nome
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>Slug</label>

                <input
                  type="text"
                  name="slug"
                  value={
                    form.slug
                  }
                  readOnly
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>SKU</label>

                <input
                  type="text"
                  name="sku"
                  value={
                    form.sku
                  }
                  readOnly
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>Preço</label>

                <input
                  type="number"
                  step="0.01"
                  name="preco"
                  value={
                    form.preco
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>Marca</label>

                <input
                  type="text"
                  name="marca"
                  value={
                    form.marca
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>
                  Categoria
                </label>

                <select
                  name="categoria_id"
                  value={
                    form.categoria_id
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="">
                    Selecione
                  </option>

                  {categorias.map(
                    (
                      categoria
                    ) => (
                      <option
                        key={
                          categoria.id_categoria
                        }
                        value={
                          categoria.id_categoria
                        }
                      >
                        {
                          categoria.nome
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>Status</label>

                <select
                  name="status_id"
                  value={
                    form.status_id
                  }
                  onChange={
                    handleChange
                  }
                >
                  {statusList.map(
                    (status) => (
                      <option
                        key={
                          status.id_status
                        }
                        value={
                          status.id_status
                        }
                      >
                        {
                          status.nome
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div
              className={
                styles.actions
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={
                  etapaAnterior
                }
              >
                <ChevronLeft
                  size={18}
                />
                Voltar
              </button>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  proximaEtapa
                }
              >
                Próxima etapa
                <ChevronRight
                  size={18}
                />
              </button>
            </div>
          </section>
        )}

        {/* ETAPA 3 */}
        {etapa === 3 && (
          <section
            className={
              styles.stepCard
            }
          >
            <div
              className={
                styles.stepHeader
              }
            >
              <div
                className={
                  styles.stepIcon
                }
              >
                <FileText size={22} />
              </div>

              <div>
                <h2>
                  Descrição
                </h2>

                <p>
                  Finalize o cadastro
                </p>
              </div>
            </div>

            <div
              className={
                styles.descricao
              }
            >
              <label>
                Descrição
              </label>

              <textarea
                rows={8}
                name="descricao"
                placeholder="Digite a descrição..."
                value={
                  form.descricao
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div
              className={
                styles.actions
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={
                  etapaAnterior
                }
              >
                <ChevronLeft
                  size={18}
                />
                Voltar
              </button>

              <button
                className={
                  styles.primaryButton
                }
                onClick={salvar}
                disabled={loading}
                type="button"
              >
                <Save size={18} />

                {loading
                  ? "Salvando..."
                  : "Cadastrar Produto"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}