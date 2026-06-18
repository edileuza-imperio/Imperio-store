"use client";

import api from "@/Api/conectar";
import { useEffect, useState } from "react";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao: string;
  banner: string;
  statusid: number;
  inicio: string;
  fim: string;
};

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCampanhas();
  }, []);

  async function carregarCampanhas() {
    try {
      const response = await api.get("/painel/campanhas");

      console.log("RESPOSTA API:", response.data);

      const lista = response.data?.dados?.campanhas || [];

      setCampanhas(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error(error);
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }

  function imagemUrl(caminho: string) {
    if (!caminho) return "";

    const baseUrl = String(api.defaults.baseURL || "")
      .replace("/api/v1", "")
      .replace(/\/$/, "");

    return `${baseUrl}/${caminho.replace(/^\//, "")}`;
  }

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Campanhas</h1>

      {campanhas.length === 0 ? (
        <p>Nenhuma campanha encontrada.</p>
      ) : (
        campanhas.map((campanha) => (
          <div
            key={campanha.id_campanha}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "10px",
            }}
          >
            <h2>{campanha.titulo}</h2>

            <p>
              <strong>Slug:</strong> {campanha.slug}
            </p>

            <p>
              <strong>Descrição:</strong> {campanha.descricao}
            </p>

            <p>
              <strong>Status:</strong> {campanha.statusid}
            </p>

            <p>
              <strong>Início:</strong> {campanha.inicio}
            </p>

            <p>
              <strong>Fim:</strong> {campanha.fim}
            </p>

            {campanha.banner && (
              <img
                src={imagemUrl(campanha.banner)}
                alt={campanha.titulo}
                style={{
                  maxWidth: "300px",
                  display: "block",
                  marginTop: "10px",
                }}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}