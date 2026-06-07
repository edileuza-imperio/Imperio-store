import ProtegePainel from "@/components/pages/auth/ProtegePainel";
import DashboardLayout from "@/components/pages/painel/layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtegePainel>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtegePainel>
  );
}