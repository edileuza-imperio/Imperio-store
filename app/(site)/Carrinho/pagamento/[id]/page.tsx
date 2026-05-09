"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCopy,
  FiArrowLeft,
  FiPackage,
} from "react-icons/fi";

import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-toastify";

import api from "@/Api/conectar";

interface Pedido {
  id: number;
  codigo?: string;
  total?: number;
  status_pagamento?: string;
  pix_qrcode?: string;
  pix_copia_cola?: string;
  created_at?: string;
}

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!params?.id) return;

    buscarPedido();

    const intervalo = setInterval(() => {
      buscarPedido(true);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [params?.id]);

  async function buscarPedido(silencioso = false) {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      const res = await api.get(`/pedido/${params.id}`);

      const pedidoAtual =
        res.data?.dados?.pedido ??
        res.data?.pedido ??
        null;

      setPedido(pedidoAtual);

      const status = String(
        pedidoAtual?.status_pagamento ?? ""
      ).toLowerCase();

      if (
        status === "approved" ||
        status === "aprovado" ||
        status === "pago"
      ) {
        toast.success("Pagamento aprovado!");

        setTimeout(() => {
          router.push("/Carrinho/sucesso");
        }, 1500);
      }
    } catch (error) {
      console.error(error);

      if (!silencioso) {
        toast.error("Erro ao carregar pedido");
      }
    } finally {
      setLoading(false);
    }
  }

  async function copiarPix() {
    if (!pedido?.pix_copia_cola) return;

    try {
      await navigator.clipboard.writeText(
        pedido.pix_copia_cola
      );

      setCopiado(true);

      toast.success("Código PIX copiado!");

      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch (error) {
      toast.error("Erro ao copiar código");
    }
  }

  function renderStatus() {
    const status = String(
      pedido?.status_pagamento ?? ""
    ).toLowerCase();

    if (
      status === "approved" ||
      status === "aprovado" ||
      status === "pago"
    ) {
      return (
        <div className="status aprovado">
          <FiCheckCircle />
          <span>Pagamento aprovado</span>
        </div>
      );
    }

    if (
      status === "pending" ||
      status === "pendente"
    ) {
      return (
        <div className="status pendente">
          <FiClock />
          <span>Aguardando pagamento</span>
        </div>
      );
    }

    return (
      <div className="status erro">
        <FiAlertCircle />
        <span>Pagamento pendente</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pagamento-loading">
        <div className="spinner"></div>
        <p>Carregando pagamento...</p>
      </div>
    );
  }

  return (
    <main className="pagamento-page">
      <div className="pagamento-container">
        <Link href="/" className="voltar">
          <FiArrowLeft />
          Voltar para loja
        </Link>

        <div className="pagamento-card">
          <div className="topo">
            <div className="icone">
              <FiPackage />
            </div>

            <div>
              <h1>Pagamento PIX</h1>

              <p>
                Finalize seu pedido realizando o pagamento
              </p>
            </div>
          </div>

          {renderStatus()}

          <div className="pedido-info">
            <div className="item">
              <span>Pedido</span>
              <strong>
                #{pedido?.codigo || pedido?.id}
              </strong>
            </div>

            <div className="item">
              <span>Total</span>
              <strong>
                R${" "}
                {Number(pedido?.total || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {pedido?.pix_qrcode && (
            <div className="qr-area">
              <QRCodeCanvas
                value={pedido.pix_qrcode}
                size={240}
              />
            </div>
          )}

          <div className="pix-box">
            <label>PIX Copia e Cola</label>

            <textarea
              readOnly
              value={pedido?.pix_copia_cola || ""}
            />

            <button onClick={copiarPix}>
              <FiCopy />

              {copiado
                ? "Código copiado"
                : "Copiar código PIX"}
            </button>
          </div>

          <div className="aviso">
            <FiClock />

            <p>
              O pagamento pode levar alguns segundos para
              ser confirmado automaticamente.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pagamento-page {
          min-height: 100vh;
          background: #f4f6f9;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .pagamento-container {
          width: 100%;
          max-width: 620px;
        }

        .voltar {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          color: #444;
          text-decoration: none;
          font-weight: 600;
        }

        .pagamento-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }

        .topo {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 25px;
        }

        .icone {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: #111;
        }

        .topo h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }

        .topo p {
          margin-top: 4px;
          color: #666;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: 14px;
          font-weight: 600;
          margin-bottom: 25px;
        }

        .status.aprovado {
          background: #dcfce7;
          color: #166534;
        }

        .status.pendente {
          background: #fef3c7;
          color: #92400e;
        }

        .status.erro {
          background: #fee2e2;
          color: #991b1b;
        }

        .pedido-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 30px;
        }

        .item {
          background: #f8fafc;
          padding: 18px;
          border-radius: 16px;
        }

        .item span {
          display: block;
          color: #666;
          margin-bottom: 8px;
        }

        .item strong {
          font-size: 20px;
        }

        .qr-area {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
        }

        .pix-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pix-box label {
          font-weight: 700;
        }

        .pix-box textarea {
          width: 100%;
          min-height: 120px;
          border-radius: 14px;
          border: 1px solid #ddd;
          padding: 16px;
          resize: none;
          outline: none;
          font-size: 14px;
        }

        .pix-box button {
          height: 52px;
          border: none;
          border-radius: 14px;
          background: black;
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.3s;
        }

        .pix-box button:hover {
          opacity: 0.9;
        }

        .aviso {
          margin-top: 25px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 16px;
          border-radius: 14px;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .pagamento-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
          background: #f4f6f9;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #ddd;
          border-top: 4px solid #000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .pagamento-card {
            padding: 22px;
          }

          .pedido-info {
            grid-template-columns: 1fr;
          }

          .topo {
            flex-direction: column;
            text-align: center;
          }

          .topo h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </main>
  );
}