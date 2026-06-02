import Navbar from "@/components/site/menu/navbar";
import FooterProfissional from "@/components/site/Rodape/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="header-stack">
        <Navbar />
      </header>

      <main className="main-content">
        {children}
      </main>

      <FooterProfissional />
    </>
  );
}