'use client';

import Link from "next/link";

interface Props {
  href: string;
  icon: string;
  label: string;
  open: boolean;
  active?: boolean;
}

export default function AdminSidebarItem({ href, icon, label, open, active }: Props) {
  return (
    <>
      <Link
        href={href}
        className={`admItem ${active ? "isActive" : ""}`}
        title={!open ? label : undefined}
      >
        <i className={`bi ${icon} admItem__icon`} />
        {open && <span className="admItem__label">{label}</span>}
        {!open && <span className="admItem__dot" />}
      </Link>

      <style jsx global>{`
        .admItem{
          text-decoration:none;
          display:flex;
          align-items:center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 16px;
          color: #2c2f33;
          border: 1px solid transparent;
          transition: background .12s ease, border-color .12s ease, transform .12s ease;
          position: relative;
        }
        .admItem:hover{
          background: rgba(212,175,55,0.10);
          border-color: rgba(212,175,55,0.18);
        }
        .admItem:active{ transform: translateY(1px); }

        .admItem__icon{
          font-size: 18px;
          color: #6b4c4f;
          width: 22px;
          text-align:center;
        }
        .admItem__label{
          font-weight: 900;
          color: #111827;
          font-size: 13px;
          white-space: nowrap;
        }

        .admItem.isActive{
          background: rgba(212,175,55,0.16);
          border-color: rgba(212,175,55,0.28);
        }
        .admItem.isActive .admItem__icon{ color:#c97a7e; }

        .admItem__dot{
          margin-left:auto;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(201,122,126,.9);
          opacity: .8;
        }
      `}</style>
    </>
  );
}
