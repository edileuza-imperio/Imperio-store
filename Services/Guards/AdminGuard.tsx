"use client";

import { ReactNode, useEffect, useMemo } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/contexts/AuthContext";

// =====================================================
// TIPOS
// =====================================================

interface AdminGuardProps {
  children: ReactNode;
}

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const PERMISSAO_PAINEL = "painel.visualizar";

const ROTA_LOGIN = "/login";
const ROTA_SEM_PERMISSAO = "/Home";

// =====================================================
// COMPONENTE
// =====================================================

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();

  const { usuario, carregando, autenticado } = useAuth();

  // =================================================
  // VERIFICAR PERMISSÃO
  // =================================================

  const permissoes = useMemo(() => {
    return Array.isArray(usuario?.permissoes) ? usuario.permissoes : [];
  }, [usuario?.permissoes]);

  const podeAcessarPainel = permissoes.includes(PERMISSAO_PAINEL);

  // =================================================
  // VERIFICAR AUTENTICAÇÃO E AUTORIZAÇÃO
  // =================================================

  useEffect(() => {
    if (carregando) {
      return;
    }

    // Usuário não autenticado.
    if (!autenticado || !usuario) {
      router.replace(ROTA_LOGIN);
      return;
    }

    // Usuário autenticado, mas sem permissão.
    if (!podeAcessarPainel) {
      console.warn(
        "[ADMIN GUARD] Usuário sem permissão para acessar o painel.",
      );

      router.replace(ROTA_SEM_PERMISSAO);
    }
  }, [carregando, autenticado, usuario, podeAcessarPainel, router]);

  // =================================================
  // ESTADO DE CARREGAMENTO
  // =================================================

  if (carregando) {
    return (
      <div className="admin-guard">
        <div className="admin-guard__content">
          <span className="admin-guard__spinner" />

          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // =================================================
  // BLOQUEIO DE ACESSO
  // =================================================

  if (!autenticado || !usuario || !podeAcessarPainel) {
    return null;
  }

  // =================================================
  // ACESSO AUTORIZADO
  // =================================================

  return <>{children}</>;
}
