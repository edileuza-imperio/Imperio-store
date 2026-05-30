"use client";

import {
  FiMapPin,
  FiTruck,
  FiCreditCard,
  FiCheck,
} from "react-icons/fi";

type CheckoutStepsProps = {
  etapaAtual: number;
};

const etapas = [
  {
    id: 1,
    titulo: "Endereço",
    descricao: "Escolha onde receber",
    icone: FiMapPin,
  },
  {
    id: 2,
    titulo: "Entrega",
    descricao: "Frete e envio",
    icone: FiTruck,
  },
  {
    id: 3,
    titulo: "Pagamento",
    descricao: "Finalizar pedido",
    icone: FiCreditCard,
  },
];

export default function CheckoutSteps({
  etapaAtual,
}: CheckoutStepsProps) {
  return (
    <section className="checkoutSteps">
      <div className="line" />

      {etapas.map((etapa, index) => {
        const Icon = etapa.icone;

        const ativa = etapa.id === etapaAtual;
        const concluida = etapa.id < etapaAtual;

        return (
          <div
            key={etapa.id}
            className={`stepCard 
              ${ativa ? "active" : ""}
              ${concluida ? "done" : ""}
            `}
          >
            <div className="stepTop">
              <div className="stepCircle">
                {concluida ? (
                  <FiCheck />
                ) : (
                  <Icon />
                )}
              </div>

              <div className="stepNumber">
                Passo {etapa.id}
              </div>
            </div>

            <div className="stepContent">
              <h3>{etapa.titulo}</h3>
              <p>{etapa.descricao}</p>
            </div>

            {ativa && (
              <div className="activeGlow" />
            )}
          </div>
        );
      })}

      <style jsx>{`
        .checkoutSteps {
          position: relative;

          display: grid;
          grid-template-columns: repeat(3, 1fr);

          gap: 20px;

          margin-bottom: 32px;
        }

        .line {
          position: absolute;

          top: 42px;
          left: 10%;

          width: 80%;
          height: 2px;

          background: linear-gradient(
            90deg,
            rgba(192, 138, 122, 0.45),
            rgba(192, 138, 122, 0.1)
          );

          z-index: 0;
        }

        .stepCard {
          position: relative;
          z-index: 1;

          overflow: hidden;

          padding: 24px;

          border-radius: 28px;

          background: rgba(255, 255, 255, 0.58);

          border: 1px solid rgba(233, 222, 214, 0.9);

          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);

          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;

          min-height: 180px;

          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .stepCard::before {
          content: "";

          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,0.22),
              transparent
            );

          pointer-events: none;
        }

        .stepCard:hover {
          transform: translateY(-4px);

          border-color: rgba(192, 138, 122, 0.5);

          box-shadow:
            0 20px 34px rgba(80, 50, 40, 0.08);
        }

        .stepCard.active {
          border: 1px solid rgba(192, 138, 122, 0.45);

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,0.78),
              rgba(192,138,122,0.12)
            );

          box-shadow:
            0 22px 42px rgba(192, 138, 122, 0.14);
        }

        .stepCard.done {
          border-color: rgba(92, 170, 120, 0.35);
        }

        .stepTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stepCircle {
          width: 62px;
          height: 62px;

          border-radius: 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #c08a7a,
              #a96d61
            );

          color: white;

          box-shadow:
            0 16px 28px rgba(192, 138, 122, 0.3);

          flex-shrink: 0;
        }

        .stepCard.done .stepCircle {
          background:
            linear-gradient(
              135deg,
              #65b07b,
              #4f9964
            );
        }

        .stepCircle :global(svg) {
          width: 26px;
          height: 26px;
        }

        .stepNumber {
          font-size: 12px;

          font-weight: 700;

          text-transform: uppercase;

          letter-spacing: 0.12em;

          color: rgba(43, 43, 43, 0.45);
        }

        .stepContent {
          margin-top: 26px;
        }

        .stepContent h3 {
          margin: 0;

          font-size: 24px;

          color: #8c5a50;

          letter-spacing: -0.03em;
        }

        .stepContent p {
          margin-top: 8px;

          font-size: 14px;

          line-height: 1.5;

          color: rgba(43, 43, 43, 0.65);
        }

        .activeGlow {
          position: absolute;

          width: 180px;
          height: 180px;

          border-radius: 999px;

          background:
            radial-gradient(
              rgba(192, 138, 122, 0.22),
              transparent 70%
            );

          top: -80px;
          right: -60px;

          pointer-events: none;
        }

        @media (max-width: 980px) {
          .checkoutSteps {
            grid-template-columns: 1fr;
          }

          .line {
            display: none;
          }

          .stepCard {
            min-height: auto;
          }
        }

        @media (max-width: 768px) {
          .checkoutSteps {
            gap: 14px;
          }

          .stepCard {
            padding: 18px;
            border-radius: 22px;
          }

          .stepCircle {
            width: 56px;
            height: 56px;
            border-radius: 18px;
          }

          .stepContent {
            margin-top: 18px;
          }

          .stepContent h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </section>
  );
}