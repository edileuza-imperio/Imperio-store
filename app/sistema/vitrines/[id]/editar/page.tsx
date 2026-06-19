"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiHash,
  FiInfo,
  FiLayers,
  FiSave,
  FiTag,
  FiType,
  FiXCircle,
} from "react-icons/fi";

import "../../../../../components/styles/sistema/vitrine-editar.css";


type Vitrine = {
  id_vitrine: number;
  nome: string;
  slug: string;
  titulo?: string | null;
  subtitulo?: string | null;
  tipo?: string | null;
  status_id: number;
  nivel_id?: number;
  ordem?: number;
  criado_em?: string | null;
};

type Status = {
  id_status: number;
  nome: string;
  codigo?: string;
};

type Estado = "carregando" | "idle" | "salvando" | "sucesso" | "erro";

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EditarVitrinePage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params?.id || "");

  const [estado, setEstado] = useState<Estado>("carregando");
  const [mensagem, setMensagem] = useState("");
  const [statusLista, setStatusLista] = useState<Status[]>([]);

  const [form, setForm] = useState<Vitrine>({
    id_vitrine: Number(id),
    nome: "",
    slug: "",
    titulo: "",
    subtitulo: "",
    tipo: "produto",
    status_id: 1,
    nivel_id: 1,
    ordem: 0,
    criado_em: null,
  });

  const tituloPagina = useMemo(() => {
    return form.nome ? `Editar ${form.nome}` : "Editar vitrine";
  }, [form.nome]);

  useEffect(() => {
    async function carregar() {
      try {
        setEstado("carregando");

        const [vitrineResp, statusResp] = await Promise.all([
          api.get(`/painel/vitrine/${id}`),
          api.get("/painel/status"),
        ]);

        const vitrineDados = vitrineResp.data?.dados ?? vitrineResp.data;
        const statusDados = statusResp.data?.dados ?? statusResp.data ?? [];

        setForm({
          id_vitrine: Number(vitrineDados.id_vitrine ?? id),
          nome: vitrineDados.nome ?? "",
          slug: vitrineDados.slug ?? "",
          titulo: vitrineDados.titulo ?? "",
          subtitulo: vitrineDados.subtitulo ?? "",
          tipo: vitrineDados.tipo ?? "produto",
          status_id: Number(vitrineDados.status_id ?? vitrineDados.statusid ?? 1),
          nivel_id: Number(vitrineDados.nivel_id ?? vitrineDados.nivelid ?? 1),
          ordem: Number(vitrineDados.ordem ?? 0),
          criado_em: vitrineDados.criado_em ?? vitrineDados.criado ?? null,
        });

        setStatusLista(Array.isArray(statusDados) ? statusDados : []);
        setEstado("idle");
      } catch {
        setMensagem("Não foi possível carregar a vitrine.");
        setEstado("erro");
      }
    }

    if (id) carregar();
  }, [id]);

  function alterar(campo: keyof Vitrine, valor: string | number) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function alterarNome(valor: string) {
    setForm((atual) => ({
      ...atual,
      nome: valor,
      slug: gerarSlug(valor),
    }));
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();

    try {
      setEstado("salvando");
      setMensagem("");

      await api.put(`/painel/vitrine/${id}`, {
        nome: form.nome,
        slug: form.slug,
        titulo: form.titulo,
        subtitulo: form.subtitulo,
        tipo: form.tipo,
        status_id: Number(form.status_id),
        nivel_id: Number(form.nivel_id ?? 1),
        ordem: Number(form.ordem ?? 0),
        criado_em: form.criado_em,
      });

      setEstado("sucesso");
      setMensagem("Vitrine atualizada com sucesso.");

      setTimeout(() => {
        router.push(`/sistema/vitrines/${id}`);
      }, 700);
    } catch {
      setEstado("erro");
      setMensagem("Erro ao atualizar vitrine.");
    }
  }

  if (estado === "carregando") {
    return (
      <main className="vitrineEditPage">
        <div className="loading">
          <span />
          <p>Carregando vitrine...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="vitrineEditPage">
      <section className="editHero card">
        <div>
          <span className="label">Vitrine</span>
          <h1>{tituloPagina}</h1>
          <p>Atualize os dados principais da vitrine no painel.</p>
        </div>

        <Link href={`/sistema/vitrines/${id}`} className="backButton">
          <FiArrowLeft />
          Voltar
        </Link>
      </section>

      {mensagem && (
        <div className={`alert ${estado === "erro" ? "erro" : "sucesso"}`}>
          {estado === "erro" ? <FiXCircle /> : <FiCheckCircle />}
          {mensagem}
        </div>
      )}

      <form className="editForm card" onSubmit={salvar}>
        <div className="formGrid">
          <label className="field">
            <span>
              <FiTag />
              Nome
            </span>
            <input
              value={form.nome}
              onChange={(e) => alterarNome(e.target.value)}
              placeholder="Nome da vitrine"
              required
            />
          </label>

          <label className="field">
            <span>
              <FiHash />
              Slug
            </span>
            <input
              value={form.slug}
              onChange={(e) => alterar("slug", gerarSlug(e.target.value))}
              placeholder="slug-da-vitrine"
              required
            />
          </label>

          <label className="field">
            <span>
              <FiType />
              Título público
            </span>
            <input
              value={form.titulo ?? ""}
              onChange={(e) => alterar("titulo", e.target.value)}
              placeholder="Título que aparece no site"
            />
          </label>

          <label className="field">
            <span>
              <FiInfo />
              Subtítulo
            </span>
            <input
              value={form.subtitulo ?? ""}
              onChange={(e) => alterar("subtitulo", e.target.value)}
              placeholder="Descrição curta da vitrine"
            />
          </label>

          <label className="field">
            <span>
              <FiLayers />
              Tipo
            </span>
            <select
              value={form.tipo ?? "produto"}
              onChange={(e) => alterar("tipo", e.target.value)}
            >
              <option value="produto">Produto</option>
              <option value="campanha">Campanha</option>
              <option value="categoria">Categoria</option>
            </select>
          </label>

          <label className="field">
            <span>
              <FiCheckCircle />
              Status
            </span>
            <select
              value={form.status_id}
              onChange={(e) => alterar("status_id", Number(e.target.value))}
            >
              {statusLista.length === 0 && <option value={1}>Ativo</option>}

              {statusLista.map((status) => (
                <option key={status.id_status} value={status.id_status}>
                  {status.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>
              <FiLayers />
              Nível
            </span>
            <input
              type="number"
              value={form.nivel_id ?? 1}
              onChange={(e) => alterar("nivel_id", Number(e.target.value))}
              min={1}
            />
          </label>

          <label className="field">
            <span>
              <FiHash />
              Ordem
            </span>
            <input
              type="number"
              value={form.ordem ?? 0}
              onChange={(e) => alterar("ordem", Number(e.target.value))}
              min={0}
            />
          </label>
        </div>

        <div className="actions">
          <Link href={`/sistema/vitrines/${id}`} className="cancelButton">
            Cancelar
          </Link>

          <button disabled={estado === "salvando"} className="saveButton">
            <FiSave />
            {estado === "salvando" ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </main>
  );
}