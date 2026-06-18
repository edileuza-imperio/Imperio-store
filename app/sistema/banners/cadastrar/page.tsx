"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiImage,
  FiLink,
  FiSave,
  FiType,
  FiXCircle,
} from "react-icons/fi";

import "../../../components/styles/sistema/banner-form.css";

export default function CadastrarBannerPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [link, setLink] = useState("");
  const [statusid, setStatusid] = useState("1");
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const podeSalvar = useMemo(() => {
    return titulo.trim() && descricao.trim() && statusid && imagem && !salvando;
  }, [titulo, descricao, statusid, imagem, salvando]);

  function selecionarImagem(file?: File | null) {
    if (!file) return;

    setImagem(file);
    setPreview(URL.createObjectURL(file));
  }

  async function salvarBanner(event: FormEvent) {
    event.preventDefault();

    if (!imagem) {
      setErro("Selecione uma imagem para o banner.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const formData = new FormData();
      formData.append("titulo", titulo.trim());
      formData.append("descricao", descricao.trim());
      formData.append("statusid", statusid);
      formData.append("imagem", imagem);

      if (link.trim()) {
        formData.append("link", link.trim());
      }

      await api.post("/painel/banner", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSucesso("Banner cadastrado com sucesso.");

      setTimeout(() => {
        router.push("/sistema/banners");
      }, 700);
    } catch (error) {
      console.error(error);
      setErro("Erro ao cadastrar banner.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="bannerFormPage">
      <section className="bannerFormHeader">
        <div>
          <span className="label">Novo banner</span>
          <h1>Cadastrar Banner</h1>
          <p>Adicione uma imagem promocional para aparecer no site.</p>
        </div>

        <Link href="/sistema/banners" className="backButton">
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

      <form className="bannerFormGrid" onSubmit={salvarBanner}>
        <section className="formCard">
          <div className="formGroup">
            <label>
              <FiType />
              Título
            </label>

            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Festa Junina"
            />
          </div>

          <div className="formGroup">
            <label>Descrição</label>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite uma descrição curta do banner"
              rows={5}
            />
          </div>

          <div className="formGroup">
            <label>
              <FiLink />
              Link opcional
            </label>

            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="formGroup">
            <label>Status</label>

            <select
              value={statusid}
              onChange={(e) => setStatusid(e.target.value)}
            >
              <option value="1">Ativo</option>
              <option value="2">Inativo</option>
            </select>
          </div>

          <button className="saveButton" disabled={!podeSalvar}>
            <FiSave />
            {salvando ? "Salvando..." : "Cadastrar banner"}
          </button>
        </section>

        <section className="previewCard">
          <span className="label">Imagem do banner</span>

          <label className="uploadBox">
            {preview ? (
              <img src={preview} alt="Preview do banner" />
            ) : (
              <div>
                <FiImage />
                <strong>Selecionar imagem</strong>
                <small>PNG, JPG ou WEBP</small>
              </div>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => selecionarImagem(e.target.files?.[0])}
            />
          </label>

          {imagem && (
            <div className="fileInfo">
              <strong>{imagem.name}</strong>
              <span>{(imagem.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
        </section>
      </form>
    </main>
  );
}