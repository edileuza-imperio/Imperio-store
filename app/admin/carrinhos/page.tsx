'use client';

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";

// Função para gerar URL completa da imagem
export const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;
  const base = api.defaults.baseURL || "";
  const caminhoLimpo = caminho.replace(/^\/+/, "");
  const baseFinal = base.endsWith("/") ? base : `${base}/`;
  return `${baseFinal}${caminhoLimpo}`;
};

interface CarrinhoItem {
  id_item: number;
  produto_id: number;
  nome_produto: string;
  imagem: string | null;
  quantidade: number;
  preco_unitario: number | string | null;
}

interface Carrinho {
  id_carrinho: number;
  usuario_id: number;
  usuario_nome?: string;
  criado: string;
  itens: CarrinhoItem[];
}

export default function CarrinhosPage() {
  const [carrinhos, setCarrinhos] = useState<Carrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCarrinhos = async () => {
      try {
        const res = await api.get("/admin/carrinho");
        const dados: Carrinho[] = (res.data.dados || []).map((c: any) => ({
          ...c,
          usuario_nome: c.usuario_nome || `ID ${c.usuario_id}`,
          itens: c.itens?.map((i: any) => ({
            ...i,
            preco_unitario: Number(i.preco_unitario) || 0
          })) || []
        }));
        setCarrinhos(dados);
      } catch (err: any) {
        console.error(err);
        setError("Erro ao carregar carrinhos.");
      } finally {
        setLoading(false);
      }
    };
    fetchCarrinhos();
  }, []);

  if (loading) return <p>Carregando carrinhos...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Carrinhos</h1>

      {carrinhos.length === 0 ? (
        <p>Nenhum carrinho encontrado.</p>
      ) : (
        <div className="row g-3">
          {carrinhos.map(c => (
            <div key={c.id_carrinho} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{c.usuario_nome}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">
                    Criado em: {new Date(c.criado).toLocaleString()}
                  </h6>
                  <p className="mb-2"><strong>Total de itens:</strong> {c.itens?.reduce((acc, item) => acc + item.quantidade, 0)}</p>

                  {c.itens?.length ? (
                    <div className="d-flex flex-column gap-2">
                      {c.itens.map(item => (
                        <div key={item.id_item} className="d-flex align-items-center border rounded p-2">
                          <img
                            src={getImagemUrl(item.imagem ?? undefined) || "/placeholder.png"}
                            alt={item.nome_produto}
                            style={{ width: 50, height: 50, objectFit: "cover", marginRight: 10 }}
                          />
                          <div>
                            <p className="mb-1 fw-bold">{item.nome_produto}</p>
                            <small>Qtd: {item.quantidade} - R$ {(Number(item.preco_unitario) || 0).toFixed(2)}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">Sem itens</p>
                  )}
                </div>
                <div className="card-footer text-end bg-white">
                  <Link href={`/admin/carrinhos/${c.id_carrinho}`} className="btn btn-sm btn-primary">
                    Ver detalhes
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
