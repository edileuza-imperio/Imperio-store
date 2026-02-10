"use client";

import { FaPlus, FaLock, FaFacebookF, FaTwitter, FaWhatsapp, FaShareAlt } from "react-icons/fa";

interface Props {
  produto: any;
}

export default function AcoesProduto({ produto }: Props) {
  const emEstoque = produto.ilimitado || (produto.estoque > 0);

  return (
    <div className="actions-product">
      <div className="row g-2 mb-3">
        <div className="col-md-6">
          <button className="btn btn-dourado w-100 py-3 fw-bold" disabled={!emEstoque}>
            <FaPlus className="me-2" /> {emEstoque ? "Adicionar ao Carrinho" : "Produto Esgotado"}
          </button>
        </div>
        <div className="col-md-6">
          <button className="btn btn-rosa-queimado w-100 py-3 fw-bold" disabled={!emEstoque}>
            <FaLock className="me-2" /> Comprar Agora
          </button>
        </div>
      </div>

      {/* Compartilhamento */}
      <div className="sharing-section d-flex align-items-center gap-2">
        <FaShareAlt className="text-rosa" />
        <span className="fw-medium text-rosa">Compartilhar:</span>
        <div className="d-flex gap-1">
          <button className="btn btn-facebook"><FaFacebookF /></button>
          <button className="btn btn-twitter"><FaTwitter /></button>
          <button className="btn btn-whatsapp"><FaWhatsapp /></button>
        </div>
      </div>
    </div>
  );
}
