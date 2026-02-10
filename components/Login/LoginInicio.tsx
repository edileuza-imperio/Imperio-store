'use client';

interface LoginInicioProps {
  config?: {
    logo?: string;
    titulo?: string;
    mensagem_personalizada?: string | null;
  };
  onEntrar: () => void;
}

export default function LoginInicio({ config, onEntrar }: LoginInicioProps) {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      width: "100%",
      height: "100%",
      animation: "fadeIn 0.8s",
    }}>
      {config?.logo && (
        <img 
          src={config.logo} 
          alt={config.titulo} 
          style={{ maxWidth: "180px", marginBottom: "2rem", animation: "bounce 1s infinite alternate" }} 
        />
      )}
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>{config?.titulo}</h1>
      {config?.mensagem_personalizada && (
        <p style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>{config.mensagem_personalizada}</p>
      )}
      <button
        style={{
          padding: "1rem 2rem",
          background: "#0070f3",
          border: "none",
          borderRadius: "8px",
          color: "#fff",
          cursor: "pointer",
          fontWeight: "bold",
          transition: "all 0.3s",
        }}
        onClick={onEntrar}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#005ac1")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0070f3")}
      >
        Entrar
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
