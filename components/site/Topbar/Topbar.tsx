"use client";

import styles from "./Topbar.module.css";

import {
  FiTruck,
  FiShield,
  FiCreditCard,
} from "react-icons/fi";

export default function Topbar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.glow} />

      <div className={styles.container}>
        <div className={styles.item}>
          <div className={styles.icon}>
            <FiTruck />
          </div>

          <div className={styles.content}>
            <strong>Entrega Rápida</strong>
            <span>Enviamos para todo o Brasil</span>
          </div>
        </div>

        <div className={styles.item}>
          <div className={styles.icon}>
            <FiShield />
          </div>

          <div className={styles.content}>
            <strong>Compra Segura</strong>
            <span>Pagamento protegido e confiável</span>
          </div>
        </div>

        <div className={styles.item}>
          <div className={styles.icon}>
            <FiCreditCard />
          </div>

          <div className={styles.content}>
            <strong>Parcelamento</strong>
            <span>Parcele em até 12x no cartão</span>
          </div>
        </div>
      </div>
    </div>
  );
}