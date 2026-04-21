"use client";

import { useMenu } from "@/hooks/menu/useMenu";



export const Navbar = () => {
  const { menus, tituloNavbar, subtituloNavbar } = useMenu();

  const goTo = (rota?: string | null) => {
    if (rota) window.location.href = rota;
  };

  return (
    <>
      <nav className="navbar">

        {/* TOPO */}
        <div className="navbar-top">
          
          {/* LOGO */}
          <div className="logo" onClick={() => goTo("/")}>
            <h1>{tituloNavbar || "Universo Império"}</h1>
            <span>{subtituloNavbar || "Decorações & Eventos"}</span>
          </div>

          {/* BUSCA */}
          <div className="search">
            <input placeholder="Buscar produtos..." />
            <button>🔍</button>
          </div>

          {/* AÇÕES */}
          <div className="actions">
            <div className="action-item">Conta</div>
            <div className="cart">🛒 Carrinho</div>
          </div>
        </div>

        {/* MENU */}
        <div className="navbar-bottom">
          {menus.map((menu) => (
            <div key={menu.id || menu.id_menu} className="menu-item">
              <button onClick={() => goTo(menu.rota)}>
                {menu.nome || menu.titulo}
              </button>

              {menu.itens && (
                <div className="dropdown">
                  {menu.itens.map((item) => (
                    <div
                      key={item.id || item.id_item}
                      onClick={() => goTo(item.rota)}
                    >
                      {item.nome || item.titulo}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      <style>{`
        .navbar {
          width: 100%;
          font-family: 'Segoe UI', Arial;
          background: #fff;
          border-bottom: 1px solid #eee;
        }

        /* TOPO */
        .navbar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 30px;
          gap: 20px;
        }

        /* LOGO */
        .logo {
          cursor: pointer;
        }

        .logo h1 {
          margin: 0;
          font-size: 22px;
          color: #333;
        }

        .logo span {
          font-size: 12px;
          color: #b76e79;
          letter-spacing: 1px;
        }

        /* BUSCA */
        .search {
          flex: 1;
          max-width: 600px;
          display: flex;
          border: 2px solid #b76e79;
          border-radius: 30px;
          overflow: hidden;
          background: #fdf6f0;
        }

        .search input {
          flex: 1;
          border: none;
          padding: 12px 15px;
          outline: none;
          font-size: 14px;
          background: transparent;
        }

        .search button {
          background: #b76e79;
          border: none;
          padding: 0 20px;
          color: white;
          cursor: pointer;
          font-size: 16px;
        }

        /* AÇÕES */
        .actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .action-item {
          cursor: pointer;
          font-size: 14px;
        }

        .cart {
          border: 1px solid #000;
          padding: 8px 15px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
          transition: 0.2s;
        }

        .cart:hover {
          background: #b76e79;
          color: white;
          border-color: #b76e79;
        }

        /* MENU */
        .navbar-bottom {
          display: flex;
          gap: 25px;
          padding: 10px 30px;
          background: #b76e79;
        }

        .menu-item {
          position: relative;
        }

        .menu-item button {
          background: none;
          border: none;
          color: white;
          font-weight: 500;
          cursor: pointer;
        }

        .menu-item button:hover {
          text-decoration: underline;
        }

        /* DROPDOWN */
        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          min-width: 200px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          display: none;
          overflow: hidden;
          z-index: 1000;
        }

        .menu-item:hover .dropdown {
          display: block;
        }

        .dropdown div {
          padding: 12px;
          cursor: pointer;
          transition: 0.2s;
        }

        .dropdown div:hover {
          background: #fdf6f0;
        }

        /* RESPONSIVO */
        @media (max-width: 768px) {
          .navbar-top {
            flex-direction: column;
            align-items: stretch;
          }

          .actions {
            justify-content: space-between;
          }

          .navbar-bottom {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </>
  );
};