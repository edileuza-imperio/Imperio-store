'use client';

interface ApiErrorProps {
  onRetry: () => void;
}

export default function ApiError({ onRetry }: ApiErrorProps) {
  return (
    <section style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 18,
          padding: 18,
          background: "rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
          Estamos com instabilidade no momento
        </div>

        <div style={{ opacity: 0.85, fontSize: 14 }}>
          Não foi possível carregar algumas informações da loja. Tente novamente.
        </div>

        <button
          onClick={onRetry}
          style={{
            marginTop: 12,
            borderRadius: 12,
            padding: "10px 14px",
            border: "1px solid rgba(0,0,0,0.14)",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          Tentar novamente
        </button>
      </div>
    </section>
  );
}