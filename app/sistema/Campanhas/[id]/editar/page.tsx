"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiImage,
  FiSave,
  FiType,
  FiXCircle,
} from "react-icons/fi";
import "../../../../components/styles/sistema/editar.css";

import { imagemFundo } from "@/components/Bibioteca/imagem";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string | null;
  banner?: string | null;
  statusid: number;
  inicio?: string | null;
  fim?: string | null;
};

function paraInputDateTime(data?: string | null) {
  if (!data) return "";
  return data.replace(" ", "T").slice(0, 16);
}

export default function EditarCampanhaPage() {
  const { id } = useParams();
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");
  const [statusid, setStatusid] = useState("1");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const [bannerAtual, setBannerAtual] = useState("");
  const [bannerNovo, setBannerNovo] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const podeSalvar = useMemo(() => {
    return titulo.trim() && slug.trim() && statusid && !salvando;
  }, [titulo, slug, statusid, salvando]);

  function gerarSlug(valor: string) {
    return valor
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function carregarCampanha() {
    try {
      setLoading(true);
      setErro("");

      const response = await api.get(`/painel/campanha/${id}`);

      const dados = response.data?.dados;
      const campanha: Campanha = dados?.campanha || dados;

      setTitulo(campanha.titulo || "");
      setSlug(campanha.slug || "");
      setDescricao(campanha.descricao || "");
      setStatusid(String(campanha.statusid || 1));
      setInicio(paraInputDateTime(campanha.inicio));
      setFim(paraInputDateTime(campanha.fim));
      setBannerAtual(campanha.banner || "");
      setPreview(campanha.banner ? imagemFundo(campanha.banner) : "");
    } catch (error) {
      console.error(error);
      setErro("Erro ao carregar campanha.");
    } finally {
      setLoading(false);
    }
  }

  function selecionarBanner(file?: File | null) {
    if (!file) return;

    setBannerNovo(file);
    setPreview(URL.createObjectURL(file));
  }

  async function salvarCampanha(event: FormEvent) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const formData = new FormData();

      formData.append("titulo", titulo.trim());
      formData.append("slug", slug.trim());
      formData.append("descricao", descricao.trim());
      formData.append("statusid", statusid);

      if (inicio) {
        formData.append("inicio", inicio.replace("T", " ") + ":00");
      }

      if (fim) {
        formData.append("fim", fim.replace("T", " ") + ":00");
      }

      if (bannerNovo) {
        formData.append("banner", bannerNovo);
        formData.append("imagem", bannerNovo);
      }

      await api.post(`/painel/campanha/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSucesso("Campanha atualizada com sucesso.");

      setTimeout(() => {
        router.push(`/sistema/campanhas/${id}`);
      }, 700);
    } catch (error) {
      console.error(error);
      setErro("Erro ao atualizar campanha.");
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    carregarCampanha();
  }, [id]);

  if (loading) {
    return (
      <main className="campanhaFormPage">
        <div className="loading">
          <span />
          <p>Carregando campanha...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="campanhaFormPage">
      <section className="campanhaFormHeader">
        <div>
          <span className="label">Editar campanha #{id}</span>
          <h1>Editar Campanha</h1>
          <p>Atualize título, descrição, banner e período da campanha.</p>
        </div>

        <Link href={`/sistema/campanhas/${id}`} className="backButton">
          <FiArrowLeft />
          Voltar
        </Link>
      </section>

      {erro && (
        <div className="formAlert error">
          <FiXCircle />
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="formAlert success">
          <FiCheckCircle />
          {sucesso}
        </div>
      )}

      <form className="campanhaFormGrid" onSubmit={salvarCampanha}>
        <section className="formCard">
          <div className="formGroup">
            <label>
              <FiType />
              Título
            </label>

            <input
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                setSlug(gerarSlug(e.target.value));
              }}
              placeholder="Ex: Arraiá do Hexa"
            />
          </div>

          <div className="formGroup">
            <label>Slug</label>

            <input
              value={slug}
              onChange={(e) => setSlug(gerarSlug(e.target.value))}
              placeholder="arraia-do-hexa"
            />
          </div>

          <div className="formGroup">
            <label>Descrição</label>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição da campanha"
              rows={5}
            />
          </div>

          <div className="formRow">
            <div className="formGroup">
              <label>
                <FiCalendar />
                Início
              </label>

              <input
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="formGroup">
              <label>
                <FiCalendar />
                Fim
              </label>

              <input
                type="datetime-local"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>
          </div>

          <div className="formGroup">
            <label>Status</label>

            <select
              value={statusid}
              onChange={(e) => setStatusid(e.target.value)}
            >
              <option value="1">Ativa</option>
              <option value="2">Inativa</option>
            </select>
          </div>

          <button className="saveButton" disabled={!podeSalvar}>
            <FiSave />
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </section>

        <section className="previewCard">
          <span className="label">Banner da campanha</span>

          <label className="uploadBox">
            {preview ? (
              <img src={preview} alt="Preview da campanha" />
            ) : (
              <div>
                <FiImage />
                <strong>Selecionar banner</strong>
                <small>PNG, JPG ou WEBP</small>
              </div>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => selecionarBanner(e.target.files?.[0])}
            />
          </label>

          <div className="fileInfo">
            <strong>
              {bannerNovo
                ? bannerNovo.name
                : bannerAtual
                  ? "Banner atual carregado"
                  : "Nenhum banner"}
            </strong>

            <span>{bannerNovo ? "Novo arquivo" : "Atual"}</span>
          </div>
        </section>
      </form>
    </main>
  );
}