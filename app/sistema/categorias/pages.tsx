"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import { Plus } from "lucide-react";

type Categoria = {
  id_categoria: number | string;
  nome: string;
  slug: string;
  descricao?: string;
  status_id?: number;
};

export default function Page() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCategorias();
  }, []);

  async function carregarCategorias() {
    try {
      setLoading(true);

      const response = await api.get("/painel/categorias", {
        withCredentials: true,
      });

      const lista =
        response.data?.dados?.dados ||
        response.data?.dados ||
        response.data ||
        [];

      setCategorias(lista);
    } catch (error) {
      console.error("Erro ao listar categorias:", error);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Categorias</h1>
        <p>Gerencie suas categorias do sistema</p>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className="grid">
          {categorias.map((cat) => (
            <div key={cat.id_categoria} className="card">
              <h3>{cat.nome}</h3>
              <span>{cat.slug}</span>
              {cat.descricao && <p>{cat.descricao}</p>}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <Link href="/painel/categoria/nova" className="fab">
        <Plus size={22} />
      </Link>

      {/* STYLE INLINE */}
      <style jsx>{`
        .container {
          position: relative;
        }

        .header {
          margin-bottom: 20px;
        }

        .header h1 {
          margin: 0;
          font-size: 28px;
          color: #342829;
        }

        .header p {
          margin: 4px 0 0;
          color: #836b6d;
        }

        .loading {
          padding: 20px;
          color: #666;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }

        .card {
          background: #fff;
          border: 1px solid #ead9db;
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
          transition: 0.2s;
        }

        .card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
        }

        .card h3 {
          margin: 0 0 6px;
          font-size: 18px;
          color: #342829;
        }

        .card span {
          font-size: 12px;
          color: #a85d6a;
        }

        .card p {
          margin-top: 10px;
          font-size: 13px;
          color: #666;
        }

        .fab {
          position: fixed;
          right: 24px;
          bottom: 24px;

          width: 58px;
          height: 58px;
          border-radius: 50%;

          background: linear-gradient(135deg, #b26a77, #874954);
          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
          transition: 0.2s;
        }

        .fab:hover {
          transform: scale(1.08);
        }
      `}</style>
    </div>
  );
}