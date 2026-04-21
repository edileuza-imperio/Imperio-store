"use client";

import { useMenu } from "@/hooks/menu/useMenu";



export const Menu = () => {
  const { menus, tituloNavbar, subtituloNavbar, loading, error } = useMenu();

  const goTo = (rota?: string | null) => {
    if (rota) window.location.href = rota;
  };

  if (loading) return <div className="navbar-loading">Carregando...</div>;
  if (error) return <div className="navbar-error">{error}</div>;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-top">
          
          {/* Logo / título */}
          <div className="navbar-logo" onClick={() => goTo("/")}>
            <strong>{tituloNavbar}</strong>
            {subtituloNavbar && (
              <span className="navbar-sub">{subtituloNavbar}</span>
            )}
          </div>

          {/* Busca */}
          <div className="navbar-search">
            <input placeholder="Buscar produtos..." />
            <button>🔍</button>
          </div>

          {/* Ações */}
          <div className="navbar-actions">
            <span>Conta</span>
            <span>Carrinho 🛒</span>
          </div>
        </div>

        {/* Menu inferior */}
        <div className="navbar-bottom">
          <ul className="navbar-menu">
            {menus.map((menu) => (
              <li key={menu.id || menu.id_menu} className="navbar-item">
                
                <button onClick={() => goTo(menu.rota)}>
                  {menu.nome || menu.titulo}
                </button>

                {menu.itens && menu.itens.length > 0 && (
                  <ul className="dropdown">
                    {menu.itens.map((item) => (
                      <li key={item.id || item.id_item}>
                        <button onClick={() => goTo(item.rota)}>
                          {item.nome || item.titulo}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <style>{`
        .navbar {
          width: 100%;
          font-family: Arial;
        }

        /* TOPO */
        .navbar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #b76e79; /* rosa queimado */
          color: white;
          padding: 10px 20px;
          gap: 20px;
        }

        .navbar-logo {
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }

        .navbar-sub {
          font-size: 12px;
          color: #ffeedd;
        }

        /* BUSCA */
        .navbar-search {
          flex: 1;
          display: flex;
          max-width: 500px;
          background: #fdf6f0; /* creme */
          border-radius: 5px;
          overflow: hidden;
        }

        .navbar-search input {
          flex: 1;
          border: none;
          padding: 10px;
          outline: none;
          background: transparent;
        }

        .navbar-search button {
          border: none;
          padding: 10px 15px;
          background: #a0525c;
          color: white;
          cursor: pointer;
        }

        /* AÇÕES */
        .navbar-actions {
          display: flex;
          gap: 15px;
          font-size: 14px;
          cursor: pointer;
        }

        /* MENU */
        .navbar-bottom {
          background: #fdf6f0; /* creme */
          padding: 10px 20px;
          border-bottom: 1px solid #eee;
        }

        .navbar-menu {
          list-style: none;
          display: flex;
          gap: 20px;
          margin: 0;
          padding: 0;
        }

        .navbar-item {
          position: relative;
        }

        .navbar-item button {
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }

        .navbar-item button:hover {
          color: #b76e79;
        }

        /* DROPDOWN */
        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 5px;
          display: none;
          min-width: 180px;
          z-index: 1000;
        }

        .navbar-item:hover .dropdown {
          display: block;
        }

        .dropdown li button {
          width: 100%;
          text-align: left;
          padding: 10px;
        }

        .dropdown li button:hover {
          background: #fdf6f0;
        }

        /* LOADING / ERRO */
        .navbar-loading,
        .navbar-error {
          padding: 10px;
        }

        .navbar-error {
          color: red;
        }

        /* RESPONSIVO */
        @media (max-width: 768px) {
          .navbar-top {
            flex-direction: column;
            align-items: stretch;
          }

          .navbar-menu {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
};