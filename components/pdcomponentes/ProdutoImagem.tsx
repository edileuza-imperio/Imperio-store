"use client";

import { useState } from "react";
import { FaStar, FaBox, FaShieldAlt } from "react-icons/fa";

interface Props {
  produto: any;
}

export default function ProdutoImagem({ produto }: Props) {
  const [imagemPrincipal, setImagemPrincipal] = useState(produto.imagem);

  return (
    <>
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4 position-relative">
          {/* Badges */}
          {produto.destaque && <div className="badge bg-warning text-dark">Destaque</div>}
          {produto.ilimitado && <div className="badge bg-success">Estoque Ilimitado</div>}

          <div className="text-center">
            <img
              src={imagemPrincipal}
              alt={produto.nome}
              className="img-fluid rounded shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Miniaturas */}
      <div className="d-flex gap-2 flex-wrap justify-content-center">
        {[produto.imagem, ...(produto.imagensSecundarias || [])].map(
          (img: string, idx: number) =>
            img && (
              <img
                key={idx}
                src={img}
                alt={`Miniatura ${idx + 1}`}
                className={`img-thumbnail`}
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  cursor: "pointer",
                  border: imagemPrincipal === img ? "2px solid #d4af37" : "2px solid transparent",
                }}
                onClick={() => setImagemPrincipal(img)}
              />
            )
        )}
      </div>
    </>
  );
}
