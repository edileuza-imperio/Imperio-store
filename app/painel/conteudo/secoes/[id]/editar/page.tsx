"use client";

import FormVitrine from "../../components/FormVitrine";
import { useParams } from "next/navigation";

export default function EditarSecaoPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <main style={{ minHeight: "100vh", padding: 40, background: "#0f0e0f", color: "#f5edf3" }}>
        Identificador da seção inválido.
      </main>
    );
  }

  return <FormVitrine id={id} />;
}
