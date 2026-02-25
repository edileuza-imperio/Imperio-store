import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

export default function CategoriaPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug);

  return (
    <>
      <Navbar />

      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>
          Categoria: {slug}
        </h1>

        <p style={{ marginTop: 10, opacity: 0.75 }}>
          Página de teste. Agora você pode buscar produtos por slug aqui.
        </p>
      </main>

      <FooterPrincipal />
    </>
  );
}