import DashboardLayout from "@/components/pages/painel/layout";


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DashboardLayout />

      <div>
        {children}
      </div>
    </div>
  );
}