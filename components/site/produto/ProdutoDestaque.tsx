"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";


type Produto = {
  id_produto?: number;
  nome?: string;
  slug?: string;
  imagem?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  estoque?: number | string;
  destaque?: number | boolean;
};

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

function normalizeArray(res: any): Produto[] {
  const payload = res?.data?.data ?? res?.data?.dados ?? res?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.itens)) return payload.itens;
  return [];
}

export default function ProdutoDestaque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        // tenta catálogo, se falhar usa listar normal
        let res: any;
        try {
          res = await api.get(rotas.produtos.catalogo, { withCredentials: true });
        } catch {
          res = await api.get(rotas.produtos.listar, { withCredentials: true });
        }

        const lista = normalizeArray(res);

        if (alive) setProdutos(lista);
      } catch (e: any) {
        if (alive) {
          setErro(
            e?.response?.data?.mensagem ||
              e?.message ||
              "Erro ao buscar produtos."
          );
          setProdutos([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ só produtos em destaque
  const destaques = useMemo(() => {
    return (produtos || []).filter((p) => {
      const v = p?.destaque;
      return v === 1 || v === true || String(v) === "1";
    });
  }, [produtos]);

  return (
    <section style={{ padding: 16 }}>
      <h2 style={{ fontWeight: 900, marginBottom: 10 }}>Produtos em destaque</h2>

      {loading && <p>Carregando...</p>}
      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      {!loading && !erro && destaques.length === 0 && (
        <p>Nenhum produto com destaque no momento.</p>
      )}

      {!loading && !erro && destaques.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {destaques.map((p, i) => {
            const id = p?.id_produto ?? i;
            const nome = p?.nome ?? "Produto";
            const slug = p?.slug ?? "";
            const img = getImagemUrl(p?.imagem);
            const precoFinal =
              p?.preco_promocional ?? p?.preco ?? 0;

            return (
              <Link
                key={id}
                href={slug ? rotas.produtos.paginas.produto(slug) : rotas.inicio}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid rgba(0,0,0,.08)",
                  background: "#fffaf2",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    height: 140,
                    borderRadius: 12,
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,.06)",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={nome}
                    style={{ width: "85%", height: "85%", objectFit: "contain" }}
                    loading="lazy"
                  />
                </div>

                <div style={{ marginTop: 10, fontWeight: 900 }}>{nome}</div>

                <div style={{ marginTop: 6, fontWeight: 900 }}>
                  {formatBRL(precoFinal)}
                </div>

                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
                  Estoque: {p?.estoque ?? "-"}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}