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
      <div className={styles.container}>
        <div className={styles.item}>
          <FiTruck />
          <span>
            Entrega rápida para todo o Brasil
          </span>
        </div>

        <div className={styles.item}>
          <FiShield />
          <span>
            Compra 100% segura e protegida
          </span>
        </div>

        <div className={styles.item}>
          <FiCreditCard />
          <span>
            Parcele suas compras em até 12x
          </span>
        </div>
      </div>
    </div>
  );
}