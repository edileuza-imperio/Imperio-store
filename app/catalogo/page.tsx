"use client";

import { useEffect, useState } from "react";
import api from '@/Api/conectar';

interface Produto {
  id: number;
  nome: string;
  imagem: string;
}

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    api.get("/catalogo")
      .then(res => setProdutos(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      {produtos.map(produto => (
        <div key={produto.id}>
          <h3>{produto.nome}</h3>

          <img
            src={`https://lightgrey-cattle-160990.hostingersite.com/upload/${produto.imagem}`}
            alt={produto.nome}
            style={{ width: 200 }}
          />
        </div>
      ))}
    </div>
  );
}
