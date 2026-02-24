"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";


const getImagemUrl = (caminho?: string) => {
  if (!caminho) return "/placeholder.png";
  const base = api.defaults.baseURL || "";
  return `${base.replace(/\/+$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
};

function formatBRL(v: any) {
  const n = Number(v);
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProdutoDestaque() {
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        // ✅ usa o que já existe no seu backend
        const res = await api.get(rotas.produtos.destaques.ativos, {
          withCredentials: true,
        });

        const payload = res?.data?.data ?? res?.data?.dados ?? res?.data;

        const lista =
          Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.dados)
            ? payload.dados
            : Array.isArray(payload?.itens)
            ? payload.itens
            : [];

        if (alive) setItens(lista);
      } catch (e: any) {
        if (alive) {
          setErro(
            e?.response?.data?.mensagem ||
              e?.message ||
              "Erro ao buscar destaques."
          );
          setItens([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section style={{ padding: 16 }}>
      <h2 style={{ fontWeight: 900, marginBottom: 10 }}>Produto Destaque</h2>

      {loading && <p>Carregando...</p>}
      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      {!loading && !erro && itens.length === 0 && (
        <p>Nenhum produto em destaque.</p>
      )}

      {!loading && !erro && itens.length > 0 && (
        <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0 }}>
          {itens.map((p: any, i: number) => {
            // ✅ mapeia tanto retorno "produto_*" quanto "nome/preco/slug"
            const id = p?.produto_id ?? p?.id_produto ?? p?.id ?? i;
            const nome = p?.produto_nome ?? p?.nome ?? "Produto";
            const preco = p?.produto_preco ?? p?.preco ?? 0;
            const slug = p?.produto_slug ?? p?.slug ?? "";
            const imagem = p?.produto_imagem ?? p?.imagem ?? "";

            const href = slug
              ? rotas.produtos.paginas.produto(slug)
              : rotas.produtos.paginas.destaques;

            return (
              <li key={id}>
                <Link
                  href={href}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr",
                    gap: 12,
                    alignItems: "center",
                    padding: 12,
                    borderRadius: 14,
                    background: "#fffaf2",
                    border: "1px solid rgba(0,0,0,.08)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <img
                    src={getImagemUrl(imagem)}
                    alt={nome}
                    width={64}
                    height={64}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "cover",
                      borderRadius: 12,
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,.06)",
                    }}
                  />

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 900 }}>{nome}</div>
                    <div style={{ fontWeight: 900, color: "#7a2941" }}>
                      {formatBRL(preco)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}