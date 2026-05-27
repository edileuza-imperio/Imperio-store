"use client";

import api from "@/Api/conectar";
import styles from "./CadastrarCampanha.module.css";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Calendar,
  ImagePlus,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";

export default function CadastrarCampanhaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [imagem, setImagem] = useState<File | null>(null);

  const [preview, setPreview] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    slug: "",
    descricao: "",
    statusid: "1",
    inicio: "",
    fim: "",
  });

  function gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleChange(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((old) => ({
      ...old,
      [name]: value,

      ...(name === "titulo"
        ? {
            slug: gerarSlug(value),
          }
        : {}),
    }));
  }

  function handleImagem(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImagem(file);

    setPreview(URL.createObjectURL(file));
  }

  async function salvar() {
    try {
      setLoading(true);

      const data = new FormData();

      data.append("titulo", form.titulo);
      data.append("slug", form.slug);
      data.append("descricao", form.descricao);
      data.append("statusid", form.statusid);

      if (form.inicio) {
        data.append("inicio", form.inicio);
      }

      if (form.fim) {
        data.append("fim", form.fim);
      }

      if (imagem) {
        data.append("imagem", imagem);
      }

      await api.post(
        "/painel/campanha",
        data,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      alert(
        "Campanha cadastrada com sucesso!"
      );

      router.push(
        "/painel/sistema/campanhas"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao cadastrar campanha."
      );
    } finally {
      setLoading(false);
    }
  }

  const hoje = useMemo(() => {
    return new Date()
      .toISOString()
      .slice(0, 16);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button
          className={styles.backButton}
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <button
          className={styles.saveButton}
          onClick={salvar}
          disabled={loading}
        >
          <Save size={18} />

          {loading
            ? "Salvando..."
            : "Cadastrar Campanha"}
        </button>
      </div>

      <div className={styles.hero}>
        <div>
          <span className={styles.badge}>
            <Sparkles size={14} />
            Marketing
          </span>

          <h1>
            Criar Nova Campanha
          </h1>

          <p>
            Cadastre campanhas
            promocionais com banner,
            datas e descrição
            personalizada.
          </p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* IMAGEM */}
        <section className={styles.bannerCard}>
          <div className={styles.cardHeader}>
            <h2>
              <ImagePlus size={18} />
              Banner da Campanha
            </h2>
          </div>

          <label className={styles.uploadArea}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImagem}
            />

            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className={styles.preview}
              />
            ) : (
              <div
                className={
                  styles.uploadContent
                }
              >
                <Upload size={42} />

                <strong>
                  Clique para enviar
                </strong>

                <span>
                  PNG, JPG ou WEBP
                </span>
              </div>
            )}
          </label>
        </section>

        {/* FORM */}
        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h2>
              <Calendar size={18} />
              Informações
            </h2>
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Título</label>

              <input
                type="text"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                placeholder="Ex: Promoção Dia dos Namorados"
              />
            </div>

            <div className={styles.field}>
              <label>Slug</label>

              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="slug-da-campanha"
              />
            </div>

            <div className={styles.field}>
              <label>Início</label>

              <input
                type="datetime-local"
                name="inicio"
                min={hoje}
                value={form.inicio}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label>Fim</label>

              <input
                type="datetime-local"
                name="fim"
                min={form.inicio || hoje}
                value={form.fim}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label>Status</label>

              <select
                name="statusid"
                value={form.statusid}
                onChange={handleChange}
              >
                <option value="1">
                  Ativo
                </option>

                <option value="2">
                  Inativo
                </option>
              </select>
            </div>
          </div>

          <div
            className={`${styles.field} ${styles.full}`}
          >
            <label>Descrição</label>

            <textarea
              rows={8}
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Digite uma descrição para sua campanha..."
            />
          </div>
        </section>
      </div>
    </div>
  );
}