import styles from "./Faq.module.css";

const perguntas = [
  {
    pergunta: "Como faço um pedido?",
    resposta:
      "Escolha os produtos desejados, adicione ao carrinho e finalize a compra informando seus dados e forma de pagamento.",
  },
  {
    pergunta: "Quais formas de pagamento são aceitas?",
    resposta:
      "Aceitamos Pix, cartão de crédito, cartão de débito e outras formas disponíveis no checkout.",
  },
  {
    pergunta: "Qual o prazo de entrega?",
    resposta:
      "O prazo varia conforme a região e é informado durante a finalização da compra.",
  },
  {
    pergunta: "Posso trocar ou devolver um produto?",
    resposta:
      "Sim. Entre em contato com nossa equipe para receber orientações sobre troca ou devolução.",
  },
  {
    pergunta: "Como falar com o suporte?",
    resposta:
      "Você pode utilizar nossa página de contato ou os canais de atendimento disponíveis no site.",
  },
];

export default function FaqPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <span className={styles.badge}>
          Central de Ajuda
        </span>

        <h1 className={styles.title}>
          Perguntas Frequentes
        </h1>

        <p className={styles.subtitle}>
          Encontre respostas para as dúvidas mais comuns.
        </p>

        <div className={styles.faqList}>
          {perguntas.map((item, index) => (
            <details
              key={index}
              className={styles.item}
            >
              <summary>
                {item.pergunta}
              </summary>

              <p>{item.resposta}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}