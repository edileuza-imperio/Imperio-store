"use client";

import { initMercadoPago } from "@mercadopago/sdk-react";
import { useEffect } from "react";

export default function MercadoPagoProvider() {
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

    console.log("MP PUBLIC KEY:", publicKey);

    if (!publicKey) {
      console.error("NEXT_PUBLIC_MP_PUBLIC_KEY não configurada.");
      return;
    }

    initMercadoPago(publicKey, {
      locale: "pt-BR",
    });
  }, []);

  return null;
}