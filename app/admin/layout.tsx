"use client";

import type { ReactNode } from "react";
import AdminShell from "@/components/Painel/layout/AdminShell";

export default function PainelLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}