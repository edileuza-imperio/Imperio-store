"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Produto = {
  id_produto?: number | string;
  id?: number | string;
  nome?: string;
  slug?: string;
  preco?: number | string;
  preco_promocional?: number | string | null;
  marca?: string;
  status_id?: number | string;
};

function extrairListaProdutos(data: any): Produto[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  if (Array.isArray(data?.produtos)) return data.produtos;
  if (Array.isArray(data?.dados?.produtos)) return data.dados.produtos;
  return [];
}

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosListaPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErro("");

      const response = await api.get("/produtos");
      const lista = extrairListaProdutos(response?.data);

      setProdutos(lista);
    } catch (error: any) {
      console.error(error);
      setErro("Erro ao carregar produtos");
    } finally {
      setCarregando(false);
    }
  }

  const filtrados = useMemo(() => {
    return produtos.filter((p) =>
      (p.nome || "").toLowerCase().includes(busca.toLowerCase())
    );
  }, [produtos, busca]);

  function getId(p: Produto) {
    return p.id_produto ?? p.id;
  }

  function getStatus(status?: any) {
    return String(status) === "1" ? "Ativo" : "Inativo";
  }

  return (
    <div className="container">
      <div className="topo">
        <h1>Produtos</h1>

        <div className="acoes">
          <button onClick={carregarProdutos}>Atualizar</button>

          <Link href="/Admin/produtos/cadastrar">
            <button className="primary">Cadastrar</button>
          </Link>
        </div>
      </div>

      <input
        placeholder="Buscar produto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="busca"
      />

      {carregando ? (
        <p>Carregando...</p>
      ) : erro ? (
        <p>{erro}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Preço</th>
              <th>Promo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filtrados.map((p) => (
              <tr key={getId(p)}>
                <td>{getId(p)}</td>
                <td>{p.nome}</td>
                <td>{formatarPreco(Number(p.preco || 0))}</td>
                <td>
                  {p.preco_promocional
                    ? formatarPreco(Number(p.preco_promocional))
                    : "-"}
                </td>
                <td>{getStatus(p.status_id)}</td>

                <td>
                  <button
                    onClick={() =>
                      router.push(`/Admin/produtos/${getId(p)}`)
                    }
                  >
                    Ver
                  </button>

                  <button
                    onClick={() =>
                      router.push(`/Admin/produtos/${getId(p)}/editar`)
                    }
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .container {
          padding: 20px;
        }

        .topo {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .acoes button {
          margin-left: 10px;
        }

        .primary {
          background: purple;
          color: white;
        }

        .busca {
          width: 100%;
          padding: 10px;
          margin-bottom: 20px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          border-bottom: 1px solid #ddd;
          padding: 10px;
        }

        th {
          text-align: left;
        }
      `}</style>
    </div>
  );
}