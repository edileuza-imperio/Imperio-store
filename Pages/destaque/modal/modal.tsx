"use client";

type Props = {
  aberto: boolean;
};

export default function ModalCarrinho({ aberto }: Props) {
  if (!aberto) return null;

  return (
    <div className="overlay">
      <div className="modal">
        <div className="spinner" />
        <h3>Levando você para o carrinho</h3>
        <p>Seu produto foi adicionado com sucesso.</p>
      </div>

      <style jsx global>{`
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          background: rgba(15, 23, 42, 0.42);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal {
          width: 100%;
          max-width: 360px;
          background: rgba(255, 250, 247, 0.98);
          border: 1px solid rgba(183, 110, 121, 0.1);
          border-radius: 28px;
          padding: 30px 24px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
        }

        .spinner {
          width: 54px;
          height: 54px;
          margin: 0 auto 18px;
          border-radius: 50%;
          border: 4px solid #eadfd8;
          border-top-color: #b76e79;
          animation: spin 0.85s linear infinite;
        }

        .modal h3 {
          margin: 0 0 8px;
          font-size: 22px;
          color: #6d4c52;
        }

        .modal p {
          margin: 0;
          color: #8b6b70;
          font-size: 14px;
          line-height: 1.7;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}