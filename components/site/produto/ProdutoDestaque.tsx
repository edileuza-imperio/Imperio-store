"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";


export default function ProdutoDestaque() {
  const [destaques, setDestaques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        // ✅ pega do banco (use "ativos" ou "listar")
        const res = await api.get(rotas.produtos.destaques.ativos, {
          withCredentials: true,
        });

        const payload = res?.data?.data ?? res?.data?.dados ?? res?.data;
        const lista =
          Array.isArray(payload) ? payload :
          Array.isArray(payload?.data) ? payload.data :
          Array.isArray(payload?.dados) ? payload.dados :
          Array.isArray(payload?.itens) ? payload.itens :
          [];

        if (alive) setDestaques(lista);
      } catch (e: any) {
        if (alive)
          setErro(
            e?.response?.data?.mensagem ||
              e?.message ||
              "Erro ao buscar produtos em destaque."
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <h2>Produto Destaque</h2>

      {loading && <p>Carregando...</p>}
      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      {!loading && !erro && (
        <ul>
          {destaques.map((p: any, i: number) => (
            <li key={p?.id_destaque ?? p?.produto_id ?? p?.id ?? i}>
              {p?.produto_nome ?? p?.nome ?? "Produto"} —{" "}
              {p?.produto_preco ?? p?.preco ?? "-"}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}