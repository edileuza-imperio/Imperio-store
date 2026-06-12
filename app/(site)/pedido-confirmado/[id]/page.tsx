"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";

import {
  FiCheckCircle,
  FiClock,
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiShield,
  FiMail,
} from "react-icons/fi";

import styles from "./pedidoConfirmado.module.css";

export default function PedidoConfirmadoPage() {
  const params = useParams();

  const pedidoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    toast.dismiss();
  }, []);

  return (
    <main className={styles.page}>
      <ToastContainer
        autoClose={1500}
        closeOnClick
        pauseOnHover={false}
        newestOnTop
      />

      <div className={styles.bgGlowOne} />
      <div className={styles.bgGlowTwo} />

      <section className={styles.card}>
        <div className={styles.successCircle}>
          <FiCheckCircle />
        </div>

        <span className={styles.tag}>Pagamento aprovado com sucesso</span>

        <h1>Pedido confirmado! 🎉</h1>

        <p className={styles.description}>
          Recebemos seu pagamento e seu pedido já foi registrado. Agora ele será
          separado e preparado para entrega.
        </p>

        <div className={styles.orderBox}>
          <div className={styles.orderItem}>
            <div className={styles.orderIcon}>
              <FiPackage />
            </div>

            <div>
              <span>Número do pedido</span>
              <strong>#{pedidoId}</strong>
            </div>
          </div>

          <div className={styles.orderItem}>
            <div className={styles.orderIcon}>
              <FiClock />
            </div>

            <div>
              <span>Status atual</span>
              <strong>Pagamento aprovado</strong>
            </div>
          </div>

          <div className={styles.orderItem}>
            <div className={styles.orderIcon}>
              <FiTruck />
            </div>

            <div>
              <span>Próxima etapa</span>
              <strong>Separação dos produtos</strong>
            </div>
          </div>
        </div>

        <div className={styles.steps}>
          <div className={styles.stepActive}>
            <div>
              <FiCheckCircle />
            </div>
            <span>Pagamento</span>
          </div>

          <span className={styles.line} />

          <div className={styles.stepPending}>
            <div>
              <FiPackage />
            </div>
            <span>Preparação</span>
          </div>

          <span className={styles.line} />

          <div className={styles.stepPending}>
            <div>
              <FiTruck />
            </div>
            <span>Entrega</span>
          </div>
        </div>

        <div className={styles.notice}>
          <FiMail />
          <span>Um e-mail de confirmação foi enviado para você.</span>
        </div>

        <div className={styles.security}>
          <FiShield />
          <span>Compra processada com segurança pelo Mercado Pago.</span>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            <FiHome />
            Continuar comprando
          </Link>

          <Link href="/pedidos" className={styles.secondaryBtn}>
            <FiShoppingBag />
            Acompanhar pedido
          </Link>
        </div>
      </section>
    </main>
  );
}