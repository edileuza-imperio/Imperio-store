"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  FiCheckCircle,
  FiClock,
  FiHome,
  FiPackage,
  FiShoppingBag,
} from "react-icons/fi";

import styles from "./pedidoConfirmado.module.css";

export default function PedidoConfirmadoPage() {
  const params = useParams();

  const pedidoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.iconBox}>
          <FiCheckCircle />
        </div>

        <span className={styles.tag}>Pagamento aprovado</span>

        <h1>Pedido confirmado!</h1>

        <p>
          Recebemos seu pagamento com sucesso. Seu pedido já foi registrado e
          será preparado em breve.
        </p>

        <div className={styles.infoBox}>
          <div>
            <FiPackage />
            <span>Pedido</span>
            <strong>#{pedidoId}</strong>
          </div>

          <div>
            <FiClock />
            <span>Status</span>
            <strong>Pago</strong>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            <FiHome />
            Ir para início
          </Link>

          <Link href="/meus-pedidos" className={styles.secondaryBtn}>
            <FiShoppingBag />
            Meus pedidos
          </Link>
        </div>
      </section>
    </main>
  );
}