export default function DashboardPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>

      <p>Bem-vindo ao painel!</p>

      <div style={{ marginTop: 20 }}>
        <h2>Status</h2>
        <ul>
          <li>Usuários ativos: 120</li>
          <li>Vendas hoje: 35</li>
          <li>Novos cadastros: 8</li>
        </ul>
      </div>
    </div>
  );
}