// ProdutoDestaque.tsx
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { useEffect, useMemo, useState } from "react";


type ProdutoDestaqueApi = {
  id?: number;
  id_produto_destaque?: number;
  produto_id: number;
  ordem?: number;
  statusid: number;

  produto_nome: string;
  produto_slug: string;
  produto_imagem: string | null;
  produto_preco: number | string | null;
  produto_descricao: string | null;
};

// se sua API retorna algo tipo { message, status, data }, usamos isso:
type ApiResponse<T> = {
  message?: string;
  status?: number;
  data?: T;
  dados?: T; // caso seu backend use "dados"
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function resolveApiData<T>(payload: any): T {
  // suporta resposta direta array, ou {data: ...}, ou {dados: ...}
  if (Array.isArray(payload)) return payload as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.dados != null) return payload.dados as T;
  return payload as T;
}

export default function ProdutoDestaque() {
  const [itens, setItens] = useState<ProdutoDestaqueApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function carregar() {
      setLoading(true);
      setErro(null);

      try {
        const res = await api.get<ApiResponse<ProdutoDestaqueApi[]>>(
          rotas.produtos.destaques.ativos
        );

        const data = resolveApiData<ProdutoDestaqueApi[]>(res.data);

        if (!alive) return;
        setItens(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setErro(
          e?.response?.data?.message ||
            e?.message ||
            "Erro ao carregar produtos em destaque"
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    carregar();

    return () => {
      alive = false;
    };
  }, []);

  const hasItens = itens.length > 0;

  const cards = useMemo(() => {
    return itens.map((item) => {
      const precoNum =
        item.produto_preco == null
          ? null
          : typeof item.produto_preco === "string"
          ? Number(item.produto_preco)
          : item.produto_preco;

      // Se o backend retorna só o caminho "produtos/xxx.jpg", monta a URL completa:
      const imagemUrl =
        item.produto_imagem && item.produto_imagem.startsWith("http")
          ? item.produto_imagem
          : item.produto_imagem
          ? `${api.defaults.baseURL}${item.produto_imagem.startsWith("/") ? "" : "/"}${item.produto_imagem}`
          : null;

      const href = rotas.produtos.paginas.produto(item.produto_slug);

      return (
        <a
          key={`${item.produto_id}-${item.ordem ?? ""}`}
          href={href}
          style={{
            display: "block",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 12,
                overflow: "hidden",
                background: "#f3f4f6",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
              }}
            >
              {imagemUrl ? (
                <img
                  src={imagemUrl}
                  alt={item.produto_nome}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : (
                <span style={{ fontSize: 12, opacity: 0.7 }}>Sem imagem</span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {item.produto_nome}
              </div>

              {item.produto_descricao ? (
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    marginBottom: 6,
                  }}
                >
                  {item.produto_descricao}
                </div>
              ) : null}

              <div style={{ fontWeight: 700 }}>
                {precoNum != null && !Number.isNaN(precoNum)
                  ? formatBRL(precoNum)
                  : "Preço sob consulta"}
              </div>
            </div>
          </div>
        </a>
      );
    });
  }, [itens]);

  if (loading) {
    return (
      <section style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
          Produtos em destaque
        </div>
        <div style={{ opacity: 0.75 }}>Carregando…</div>
      </section>
    );
  }

  if (erro) {
    return (
      <section style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
          Produtos em destaque
        </div>
        <div style={{ color: "#b91c1c" }}>{erro}</div>
      </section>
    );
  }

  if (!hasItens) {
    return (
      <section style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
          Produtos em destaque
        </div>
        <div style={{ opacity: 0.75 }}>Nenhum destaque ativo no momento.</div>
      </section>
    );
  }

  return (
    <section style={{ padding: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
        Produtos em destaque
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {cards}
      </div>
    </section>
  );
}