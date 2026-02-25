"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

type Produto = {
  id_produto?: number;
  id?: number;
  nome?: string;
  preco?: number | string | null;
  preco_promocional?: number | string | null;
  catalogo?: number | string | null;
  statusid?: number | string | null;
};

type CatalogoPayload = {
  produtos?: Produto[];
  data?: any;
  dados?: any;
};

type ApiResponse<T> = {
  message?: string;
  status?: number;
  data?: T;
  dados?: T;
};

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  return payload as T;
}

export default function CatalogoPage() {
  const [raw, setRaw] = useState<any>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        // ✅ chama o endpoint do catálogo
        const res = await api.get<ApiResponse<CatalogoPayload>>(rotas.produtos.catalogo);

        if (!alive) return;

        // guarda resposta crua
        setRaw(res.data);

        // tenta extrair a lista de produtos
        const payload = resolveApi<CatalogoPayload>(res.data);

        // alguns backends retornam array direto, outros {produtos: []}
        const lista =
          Array.isArray(payload) ? payload :
          Array.isArray(payload?.produtos) ? payload.produtos :
          Array.isArray((payload as any)?.data) ? (payload as any).data :
          Array.isArray((payload as any)?.dados) ? (payload as any).dados :
          [];

        setProdutos(lista as Produto[]);
      } catch (e: any) {
        console.error("❌ Erro catálogo:", e);
        if (!alive) return;

        setErro(
          e?.response?.data?.message ||
          e?.message ||
          "Erro ao buscar catálogo"
        );
        setRaw(e?.response?.data ?? null);
        setProdutos([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1>TESTE CATÁLOGO</h1>

      {loading ? <p>Carregando...</p> : null}
      {erro ? <p style={{ color: "crimson" }}>Erro: {erro}</p> : null}

      <p><b>Endpoint:</b> {rotas.produtos.catalogo}</p>
      <p><b>Quantidade:</b> {produtos.length}</p>

      <hr />

      <h2>Resposta RAW da API</h2>
      <pre style={{ background: "#111", color: "#0f0", padding: 12, overflow: "auto" }}>
        {raw ? JSON.stringify(raw, null, 2) : "—"}
      </pre>

      <hr />

      <h2>Lista simples</h2>
      {produtos.length === 0 ? (
        <p>Nenhum produto retornado pelo endpoint.</p>
      ) : (
        <ul>
          {produtos.map((p, i) => {
            const id = p.id_produto ?? p.id ?? i;
            return (
              <li key={id}>
                <b>{p.nome ?? "(sem nome)"}</b> — id: {id} — preço:{" "}
                {p.preco_promocional ?? p.preco ?? "—"} — status: {String(p.statusid ?? "—")} — catálogo: {String(p.catalogo ?? "—")}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}