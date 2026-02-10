import Link from "next/link";

interface Props {
  href: string;
  icon: string;
  label: string;
  open: boolean;
}

export default function AdminSidebarItem({ href, icon, label, open }: Props) {
  return (
    <Link
      href={href}
      className="d-flex align-items-center gap-3 px-3 py-3 text-decoration-none"
      style={{ color: "#6b4c4f" }}
    >
      <i className={`bi ${icon} fs-5`} />
      {open && <span className="fw-semibold">{label}</span>}
    </Link>
  );
}
