// ProdutoDestaque.tsx
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { useEffect, useState } from "react";

type ProdutoDestaqueApi = {
  produto_id: number;
  ordem?: number;
  statusid: number;

  produto_nome: string;
  produto_slug: string;
  produto_imagem: string | null;
  produto_preco: number | string | null;
  produto_preco_promocional?: number | string | null;
  produto_descricao: string | null;
};

type ApiResponse<T> = {
  data?: T;
  dados?: T;
};

function resolveApiData<T>(payload: any): T {
  if (Array.isArray(payload)) return payload as T;
  if (payload?.data) return payload.data as T;
  if (payload?.dados) return payload.dados as T;
  return payload as T;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutoDestaque() {
  const [itens, setItens] = useState<ProdutoDestaqueApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get<ApiResponse<ProdutoDestaqueApi[]>>(
          rotas.produtos.destaques.ativos
        );

        const data = resolveApiData<ProdutoDestaqueApi[]>(res.data);
        setItens(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar destaques:", err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  if (loading) {
    return <div className="destaque-loading">Carregando destaques...</div>;
  }

  return (
    <section className="destaque-container">
      <h2 className="destaque-titulo">Produtos em Destaque</h2>

      <div className="destaque-grid">
        {itens.map((item) => {
          const preco =
            typeof item.produto_preco === "string"
              ? Number(item.produto_preco)
              : item.produto_preco;

          const precoPromo =
            typeof item.produto_preco_promocional === "string"
              ? Number(item.produto_preco_promocional)
              : item.produto_preco_promocional;

          const imagemUrl =
            item.produto_imagem &&
            (item.produto_imagem.startsWith("http")
              ? item.produto_imagem
              : `${api.defaults.baseURL}/${item.produto_imagem}`);

          return (
            <a
              key={item.produto_id}
              href={rotas.produtos.paginas.produto(item.produto_slug)}
              className="destaque-card"
            >
              <div className="destaque-imagem-wrapper">
                {imagemUrl ? (
                  <img
                    src={imagemUrl}
                    alt={item.produto_nome}
                    className="destaque-imagem"
                  />
                ) : (
                  <div className="sem-imagem">Sem imagem</div>
                )}
              </div>

              <div className="destaque-info">
                <h3>{item.produto_nome}</h3>

                {item.produto_descricao && (
                  <p className="descricao">{item.produto_descricao}</p>
                )}

                <div className="preco">
                  {precoPromo && precoPromo < (preco || 0) ? (
                    <>
                      <span className="preco-promo">
                        {formatBRL(precoPromo)}
                      </span>
                      <span className="preco-original">
                        {formatBRL(preco || 0)}
                      </span>
                    </>
                  ) : (
                    <span className="preco-normal">
                      {formatBRL(preco || 0)}
                    </span>
                  )}
                </div>

                <button className="btn-ver">Ver Produto</button>
              </div>
            </a>
          );
        })}
      </div>

      {/* CSS GLOBAL EMBUTIDO */}
      <style>{`
        .destaque-container {
          padding: 40px 20px;
          background-color: #f5efe6;
        }

        .destaque-titulo {
          text-align: center;
          font-size: 28px;
          margin-bottom: 30px;
          color: #5a4636;
        }

        .destaque-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .destaque-card {
          background: #fff8ed;
          border-radius: 16px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .destaque-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }

        .destaque-imagem-wrapper {
          height: 220px;
          background: #f0e6d8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .destaque-imagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sem-imagem {
          color: #9c8773;
        }

        .destaque-info {
          padding: 20px;
        }

        .destaque-info h3 {
          font-size: 18px;
          margin-bottom: 8px;
          color: #4b3b2b;
        }

        .descricao {
          font-size: 14px;
          color: #7b6a5a;
          margin-bottom: 12px;
        }

        .preco {
          margin-bottom: 15px;
        }

        .preco-normal {
          font-weight: bold;
          font-size: 16px;
          color: #3f3225;
        }

        .preco-promo {
          font-weight: bold;
          font-size: 16px;
          color: #b48b5f;
          margin-right: 10px;
        }

        .preco-original {
          text-decoration: line-through;
          font-size: 14px;
          color: #8b7a6a;
        }

        .btn-ver {
          width: 100%;
          padding: 10px;
          background-color: #c9a27e;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s;
        }

        .btn-ver:hover {
          background-color: #b68c67;
        }

        .destaque-loading {
          padding: 40px;
          text-align: center;
          background: #f5efe6;
          color: #5a4636;
        }
      `}</style>
    </section>
  );
}