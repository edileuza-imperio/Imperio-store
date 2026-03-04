"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import api from "@/Api/conectar";

import {
  FiHome,
  FiUsers,
  FiImage,
  FiBox,
  FiTag,
  FiChevronDown,
} from "react-icons/fi";

type SidebarItem = {
  type: "link" | "group";
  label: string;
  href?: string;
  match?: string;
  children?: SidebarItem[];
};

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open }: SidebarProps) {

  const pathname = usePathname();

  const [items, setItems] = useState<SidebarItem[]>([]);
  const [groups, setGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  function isActive(href?: string) {
    if (!href) return false;
    return pathname.startsWith(href);
  }

  function getIcon(label: string) {
    const text = label.toLowerCase();

    if (text.includes("dashboard")) return FiHome;
    if (text.includes("usu")) return FiUsers;
    if (text.includes("banner")) return FiImage;
    if (text.includes("prod")) return FiBox;
    if (text.includes("categ")) return FiTag;

    return FiBox;
  }

  async function loadMenu() {
    try {

      const res = await api.get("/admin/dashboard");

      const data =
        res?.data?.dados?.dados ??
        res?.data?.dados ??
        [];

      if (Array.isArray(data)) {
        setItems(data);
      }

    } catch (error) {

      console.error("Erro ao carregar sidebar:", error);
      setItems([]);

    } finally {

      setLoading(false);

    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>

        {/* LOGO */}

        <div className="logo">

          <span className="dot"/>

          <div>
            <strong>Universo Império</strong>
            <p>Admin</p>
          </div>

        </div>

        {/* MENU */}

        <nav>

          <small>NAVEGAÇÃO</small>

          {loading && <p className="loading">Carregando...</p>}

          {!loading && items.map((item, i) => {

            const Icon = getIcon(item.label);

            if (item.type === "link") {

              return (
                <Link
                  key={i}
                  href={item.href || "#"}
                  className={`item ${isActive(item.href) ? "active" : ""}`}
                >
                  <Icon size={18}/>
                  {item.label}
                </Link>
              );

            }

            const opened = groups[item.label];

            return (
              <div key={i}>

                <button
                  className="group"
                  onClick={() =>
                    setGroups(prev => ({
                      ...prev,
                      [item.label]: !opened
                    }))
                  }
                >

                  <Icon size={18}/>
                  {item.label}

                  <FiChevronDown
                    className={opened ? "rotate" : ""}
                  />

                </button>

                {opened && (

                  <div className="submenu">

                    {item.children?.map((c, j) => {

                      const IconChild = getIcon(c.label);

                      return (
                        <Link
                          key={j}
                          href={c.href || "#"}
                          className={`subitem ${isActive(c.href) ? "subactive" : ""}`}
                        >
                          <IconChild size={16}/>
                          {c.label}
                        </Link>
                      );

                    })}

                  </div>

                )}

              </div>
            );

          })}

        </nav>

      </aside>

      <style jsx>{`

:global(a){
text-decoration:none;
color:inherit;
}

.sidebar{
width:260px;
height:100vh;
background:linear-gradient(180deg,#020617,#020617 60%,#030712);
color:white;
padding:20px;
border-right:1px solid rgba(255,255,255,.05);
display:flex;
flex-direction:column;
position:sticky;
top:0;
}

.logo{
display:flex;
align-items:center;
gap:10px;
margin-bottom:25px;
}

.logo strong{
font-size:15px;
}

.logo p{
font-size:11px;
color:#64748b;
}

.dot{
width:10px;
height:10px;
background:#a855f7;
border-radius:5px;
}

nav{
display:flex;
flex-direction:column;
gap:8px;
}

nav small{
font-size:11px;
color:#64748b;
margin-bottom:5px;
}

.loading{
font-size:12px;
color:#94a3b8;
padding:5px;
}

.item{
display:flex;
align-items:center;
gap:10px;
padding:10px 12px;
border-radius:10px;
font-size:14px;
color:#cbd5f5;
transition:.2s;
}

.item:hover{
background:#1e293b;
color:white;
}

.active{
background:#7c3aed;
color:white;
}

.group{
display:flex;
align-items:center;
gap:10px;
width:100%;
padding:10px 12px;
background:rgba(255,255,255,.04);
border-radius:10px;
border:none;
color:white;
cursor:pointer;
font-size:14px;
transition:.2s;
}

.group:hover{
background:#1f2937;
}

.group svg:last-child{
margin-left:auto;
}

.rotate{
transform:rotate(180deg);
transition:.2s;
}

.submenu{
display:flex;
flex-direction:column;
gap:4px;
padding-left:14px;
margin-top:4px;
}

.subitem{
display:flex;
align-items:center;
gap:10px;
padding:8px 10px;
border-radius:8px;
font-size:13px;
color:#94a3b8 !important;
transition:.2s;
}

.subitem:hover{
background:#1e293b;
color:white !important;
}

.subactive{
background:#1e293b;
color:white !important;
}

/* MOBILE */

@media(max-width:900px){

.sidebar{
position:fixed;
left:-100%;
transition:.3s;
z-index:100;
}

.sidebar.open{
left:0;
}

}

      `}</style>

    </>
  );
}