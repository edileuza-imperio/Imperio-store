import Link from "next/link";

export default function PoliticaPage() {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
      <h1>Política de Privacidade</h1>

      <p>
        Esta página apresenta as políticas de privacidade, segurança e uso de
        dados do Universo Império.
      </p>

      <p>
        Coletamos apenas as informações necessárias para processar pedidos,
        pagamentos, entregas e atendimento ao cliente.
      </p>

      <p>
        Seus dados são utilizados com responsabilidade e não são vendidos para
        terceiros.
      </p>

      <Link href="/">Voltar para a loja</Link>
    </main>
  );
}