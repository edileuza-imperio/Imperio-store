import { AuthProvider } from "@/components/contexts/AuthContext";

import AdminGuard from "@/Services/Guards/AdminGuard";

import Header from "./Components/Header/Header";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminGuard>
        <section className="painel-container">
          
          <Header />

          <main className="painel-content">{children}</main>
        </section>
      </AdminGuard>
    </AuthProvider>
  );
}
