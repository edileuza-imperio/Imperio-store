"use client";

import { useState } from "react";
import { FaMapMarkerAlt, FaTruck } from "react-icons/fa";

export default function CepCard() {
  const [cep, setCep] = useState("");

  return (
    <div className="cep-card p-3 rounded shadow-sm bg-white mb-3">
      <div className="d-flex align-items-center gap-2 mb-2">
        <FaMapMarkerAlt className="text-gold" />
        <h6 className="mb-0 fw-semibold">Calcular frete</h6>
      </div>
      <div className="d-flex gap-2 mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="Digite seu CEP"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
        />
        <button className="btn btn-rosa-queimado">Calcular</button>
      </div>
      <small className="text-muted d-flex align-items-center">
        <FaTruck className="me-1 text-rosa" /> Frete grátis para compras acima de R$100
      </small>
    </div>
  );
}
