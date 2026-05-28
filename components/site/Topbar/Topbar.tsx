"use client";

import styles from "./Topbar.module.css";

import { FiTruck, FiShield, FiCreditCard } from "react-icons/fi";

export default function Topbar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.container}>
        <div className={styles.item}>
          <span className={styles.iconWrapper}>
            <FiTruck />
          </span>
          <span className={styles.text}>Entrega rápida para todo o Brasil</span>
        </div>

        <div className={styles.item}>
          <span className={styles.iconWrapper}>
            <FiShield />
          </span>
          <span className={styles.text}>Compra 100% segura e protegida</span>
        </div>

        <div className={styles.item}>
          <span className={styles.iconWrapper}>
            <FiCreditCard />
          </span>
          <span className={styles.text}>Parcele suas compras em até 12x</span>
        </div>
      </div>
    </div>
  );
}