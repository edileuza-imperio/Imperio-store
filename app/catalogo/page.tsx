"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";

type Produto = {
  id_produto?: number;
  id?: number;
  nome?: string;
  preco?: number | string | null;
  preco_promocional?: number | string | null;
  catalogo?: number | string | null;
  statusid?: number | string | null;
};

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  return payload as T;
}

// pega produtos se vier array direto ou {produtos:[...]}
function extractProdutos(payload: any): Produto[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.produtos)) return payload.produtos;
  return [];
}

export default function CatalogoPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [raw, setRaw] = useState<any>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        // ✅ endpoint do seu ProdutoController@listarCatalogo
        const res = await api.get("/produtos/catalogo");

        if (!alive) return;

        // salva raw pra você enxergar o formato real
        setRaw(res.data);

        // resolve data/dados e extrai lista
        const payload = resolveApi<any>(res.data);
        const lista = extractProdutos(payload);

        setProdutos(lista);
      } catch (e: any) {
        console.error("❌ Erro no teste do catálogo:", e);
        if (!alive) return;
        setErro(e?.response?.data?.message || e?.message || "Erro ao buscar catálogo");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Carregando…</div>;

  if (erro)
    return (
      <div style={{ padding: 16 }}>
        <h2>Erro</h2>
        <pre>{erro}</pre>
      </div>
    );

  return (
    <div style={{ padding: 16 }}>
      <h1>TESTE CATÁLOGO</h1>

      <h3>Quantidade: {produtos.length}</h3>

      <details style={{ marginBottom: 16 }}>
        <summary>Ver resposta RAW da API</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(raw, null, 2)}
        </pre>
      </details>

      {produtos.length === 0 ? (
        <div>Nenhum produto retornado pelo endpoint.</div>
      ) : (
        <ul>
          {produtos.map((p, i) => {
            const id = p.id_produto ?? p.id ?? i;
            return (
              <li key={id} style={{ marginBottom: 10 }}>
                <b>{p.nome || "(sem nome)"}</b>
                <div>ID: {id}</div>
                <div>preco: {String(p.preco ?? "-")}</div>
                <div>promo: {String(p.preco_promocional ?? "-")}</div>
                <div>statusid: {String(p.statusid ?? "-")}</div>
                <div>catalogo: {String(p.catalogo ?? "-")}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}