"use client";

import api from "@/Api/conectar";
import styles from "./CampanhasPage.module.css";

import Link from "next/link";

import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  Calendar,
  BadgeCheck,
  Pencil,
  Trash2,
  Megaphone,
  PackagePlus,
  X,
} from "lucide-react";

interface Campanha {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao: string;
  banner: string;
  statusid: number;
  inicio: string;
  fim: string;
  criado: string;
  atualizado: string;
}

export default function CampanhasPage() {
  const [loading, setLoading] =
    useState(true);

  const [campanhas, setCampanhas] =
    useState<Campanha[]>([]);

  const [busca, setBusca] =
    useState("");

  const [modalProdutos, setModalProdutos] =
    useState(false);

  useEffect(() => {
    carregarCampanhas();
  }, []);

  async function carregarCampanhas() {
    try {
      setLoading(true);

      const response =
        await api.get(
          "/painel/campanhas"
        );

      console.log(
        "CAMPANHAS:",
        response.data
      );

      const lista =
        response.data?.dados?.dados ||
        response.data?.dados ||
        [];

      setCampanhas(
        Array.isArray(lista)
          ? lista
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar campanhas:",
        error
      );

      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }

  async function excluirCampanha(
    id: number
  ) {
    const confirmar = confirm(
      "Deseja excluir esta campanha?"
    );

    if (!confirmar) return;

    try {
      await api.delete(
        `/painel/campanha/${id}`
      );

      setCampanhas((old) =>
        old.filter(
          (item) =>
            item.id_campanha !== id
        )
      );

      alert(
        "Campanha removida com sucesso!"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao remover campanha."
      );
    }
  }

  function formatarData(
    data: string
  ) {
    if (!data) return "-";

    return new Date(
      data
    ).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  function formatarImagem(
    imagem: string
  ) {
    if (!imagem) {
      return "/sem-imagem.png";
    }

    return `${api.defaults.baseURL}/${imagem}`;
  }

  const campanhasFiltradas =
    campanhas.filter(
      (campanha) =>
        campanha.titulo
          ?.toLowerCase()
          .includes(
            busca.toLowerCase()
          )
    );

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>
            <Megaphone size={30} />
            Campanhas
          </h1>

          <p>
            Gerencie campanhas e
            produtos promocionais
          </p>
        </div>

        <div
          className={
            styles.searchBox
          }
        >
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar campanha..."
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
          />
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className={styles.loading}>
          Carregando campanhas...
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        campanhasFiltradas.length ===
          0 && (
          <div
            className={
              styles.empty
            }
          >
            <Megaphone size={60} />

            <h2>
              Nenhuma campanha
              encontrada
            </h2>

            <p>
              Cadastre sua primeira
              campanha promocional.
            </p>
          </div>
        )}

      {/* GRID */}
      {!loading &&
        campanhasFiltradas.length >
          0 && (
          <div
            className={
              styles.grid
            }
          >
            {campanhasFiltradas.map(
              (campanha) => (
                <div
                  key={
                    campanha.id_campanha
                  }
                  className={
                    styles.card
                  }
                >
                  {/* IMAGEM */}
                  <div
                    className={
                      styles.banner
                    }
                  >
                    <img
                      src={formatarImagem(
                        campanha.banner
                      )}
                      alt={
                        campanha.titulo
                      }
                      className={
                        styles.bannerImg
                      }
                    />

                    <div
                      className={
                        styles.overlay
                      }
                    />

                    <div
                      className={
                        styles.status
                      }
                    >
                      <BadgeCheck
                        size={14}
                      />

                      {campanha.statusid ===
                      1
                        ? "Ativa"
                        : "Inativa"}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div
                    className={
                      styles.content
                    }
                  >
                    <h2>
                      {
                        campanha.titulo
                      }
                    </h2>

                    <p>
                      {campanha.descricao ||
                        "Sem descrição"}
                    </p>

                    <div
                      className={
                        styles.periodo
                      }
                    >
                      <Calendar
                        size={16}
                      />

                      <span>
                        {formatarData(
                          campanha.inicio
                        )}
                        {" - "}
                        {formatarData(
                          campanha.fim
                        )}
                      </span>
                    </div>

                    <div
                      className={
                        styles.actions
                      }
                    >
                      <Link
                        href={`/painel/sistema/Campanhas/${campanha.id_campanha}`}
                        className={
                          styles.editButton
                        }
                      >
                        <Pencil
                          size={16}
                        />
                        Editar
                      </Link>

                      <button
                        className={
                          styles.deleteButton
                        }
                        onClick={() =>
                          excluirCampanha(
                            campanha.id_campanha
                          )
                        }
                      >
                        <Trash2
                          size={16}
                        />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

      {/* MODAL */}
      {modalProdutos && (
        <div
          className={
            styles.modalOverlay
          }
        >
          <div
            className={
              styles.modal
            }
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <h2>
                Selecionar Campanha
              </h2>

              <button
                onClick={() =>
                  setModalProdutos(
                    false
                  )
                }
              >
                <X size={22} />
              </button>
            </div>

            <div
              className={
                styles.modalList
              }
            >
              {campanhas.map(
                (campanha) => (
                  <Link
                    key={
                      campanha.id_campanha
                    }
                    href={`/painel/sistema/campanhas/${campanha.id_campanha}/produtos`}
                    className={
                      styles.modalItem
                    }
                  >
                    <div>
                      <h3>
                        {
                          campanha.titulo
                        }
                      </h3>

                      <span>
                        {formatarData(
                          campanha.inicio
                        )}
                        {" - "}
                        {formatarData(
                          campanha.fim
                        )}
                      </span>
                    </div>

                    <PackagePlus
                      size={22}
                    />
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTÃO NOVA CAMPANHA */}
      <Link
        href="/painel/sistema/campanhas/cadastrar"
        className={
          styles.floatingButton
        }
      >
        <Plus size={28} />
      </Link>

      {/* BOTÃO ADICIONAR PRODUTO */}
      <button
        className={
          styles.floatingButtonSecondary
        }
        onClick={() =>
          setModalProdutos(true)
        }
      >
        <PackagePlus size={24} />
      </button>
    </div>
  );
}