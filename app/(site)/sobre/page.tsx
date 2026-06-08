import Link from "next/link";
import {
  Heart,
  Gift,
  Sparkles,
  ShieldCheck,
  Truck,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

import styles from "./Sobre.module.css";

export default function SobrePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.tag}>Sobre nós</span>

          <h1>Universo Império</h1>

          <p>
            Criamos presentes, cestas, pelúcias e detalhes especiais para
            transformar momentos simples em lembranças inesquecíveis.
          </p>

          <div className={styles.actions}>
            <Link href="/" className={styles.primaryButton}>
              Ver produtos
              <ArrowRight size={18} />
            </Link>

            <Link href="/contato" className={styles.secondaryButton}>
              Falar conosco
            </Link>
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.iconCircle}>
            <Gift size={42} />
          </div>

          <h2>Feito com carinho</h2>

          <p>
            Cada pedido é preparado com atenção, cuidado e dedicação para
            encantar quem recebe.
          </p>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <Heart size={28} />
          <h3>Atendimento humanizado</h3>
          <p>
            Ajudamos você a escolher o presente ideal para cada ocasião.
          </p>
        </article>

        <article className={styles.card}>
          <Sparkles size={28} />
          <h3>Produtos especiais</h3>
          <p>
            Trabalhamos com itens delicados, criativos e cheios de significado.
          </p>
        </article>

        <article className={styles.card}>
          <ShieldCheck size={28} />
          <h3>Compra segura</h3>
          <p>
            Seu pedido é acompanhado com cuidado do início ao fim.
          </p>
        </article>

        <article className={styles.card}>
          <Truck size={28} />
          <h3>Entrega com cuidado</h3>
          <p>
            Preparação e envio pensados para preservar cada detalhe do presente.
          </p>
        </article>
      </section>

      <section className={styles.story}>
        <div>
          <span className={styles.tag}>Nossa história</span>

          <h2>Presentes que carregam sentimento</h2>

          <p>
            O Universo Império nasceu com o propósito de oferecer produtos que
            expressem carinho, amor, gratidão e celebração. Nosso foco é criar
            uma experiência bonita desde a escolha do produto até a entrega.
          </p>

          <p>
            Seja para aniversários, datas comemorativas, surpresas românticas ou
            momentos especiais, buscamos entregar mais do que um produto:
            entregamos uma lembrança.
          </p>
        </div>

        <div className={styles.highlight}>
          <MessageCircle size={34} />

          <h3>Precisa de ajuda?</h3>

          <p>
            Fale com nossa equipe para montar uma opção especial para sua
            ocasião.
          </p>

          <Link href="/contato">
            Entrar em contato
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}