"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as FaIcons from "react-icons/fa";
import api from "@/Api/conectar";

import styles from "./Footer.module.css";

type FooterConfig = {
  titulo?: string;
  subtitulo?: string;
  logo_texto?: string;
  descricao?: string;
  copyright_texto?: string;
};

type FooterItem = {
  id_item?: number;
  titulo?: string;
  valor?: string;
  url?: string;
  icone?: string;
  posicao?: number;
};

type FooterData = {
  footer?: FooterConfig;
  links?: FooterItem[];
  redes_sociais?: FooterItem[];
  contatos?: FooterItem[];
  pagamentos?: FooterItem[];
};

export default function Footer() {
  const [data, setData] = useState<FooterData | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const response = await api.get("/footer");

        const dados = response?.data?.dados?.dados;

        setData(dados || null);
      } catch (error) {
        console.error(error);
      }
    }

    carregar();
  }, []);

  const footer = data?.footer;

  const ordenar = (items?: FooterItem[]) => {
    return [...(items || [])].sort(
      (a, b) => (a.posicao || 0) - (b.posicao || 0)
    );
  };

  const links = useMemo(() => ordenar(data?.links), [data]);
  const redes = useMemo(() => ordenar(data?.redes_sociais), [data]);
  const contatos = useMemo(() => ordenar(data?.contatos), [data]);
  const pagamentos = useMemo(() => ordenar(data?.pagamentos), [data]);

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;

    const Icon =
      FaIcons[iconName as keyof typeof FaIcons];

    if (!Icon) return null;

    return <Icon />;
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <div className={styles.brand}>
              <div className={styles.logo}>
                {footer?.logo_texto || "UI"}
              </div>

              <div>
                <h2>{footer?.titulo}</h2>
                <p>{footer?.subtitulo}</p>
              </div>
            </div>

            <p className={styles.description}>
              {footer?.descricao}
            </p>

            <div className={styles.social}>
              {redes.map((item) => (
                <a
                  key={item.id_item}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {renderIcon(item.icone)}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3>Navegação</h3>

            <ul className={styles.links}>
              {links.map((item) => (
                <li key={item.id_item}>
                  <Link href={item.url || "#"}>
                    {item.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Contato</h3>

            <div className={styles.contactList}>
              {contatos.map((item) => (
                <div
                  key={item.id_item}
                  className={styles.contactItem}
                >
                  <span className={styles.contactIcon}>
                    {renderIcon(item.icone)}
                  </span>

                  <div>
                    <strong>{item.titulo}</strong>

                    {item.url ? (
                      <a href={item.url}>
                        {item.valor}
                      </a>
                    ) : (
                      <p>{item.valor}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            {footer?.copyright_texto}
          </p>

          <div className={styles.payments}>
            {pagamentos.map((item) => (
              <span key={item.id_item}>
                {renderIcon(item.icone)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}