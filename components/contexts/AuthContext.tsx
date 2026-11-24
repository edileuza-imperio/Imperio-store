"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

// =====================================================
// TIPOS
// =====================================================

export interface ClienteAutenticado {
  id_cliente?: number;
  cliente_id?: number;
}

export interface UsuarioAutenticado {
  id: number;
  id_usuario: number;
  id_cliente?: number | null;
  cliente?: ClienteAutenticado | null;

  nome: string;
  email: string;
  telefone?: string | null;

  ativo?: boolean;
  email_verificado_em?: string | null;
  ultimo_acesso_em?: string | null;
  criado_em?: string;
  atualizado_em?: string;

  papeis: string[];
  permissoes: string[];
}

interface AuthContextType {
  usuario: UsuarioAutenticado | null;
  carregando: boolean;
  autenticado: boolean;
  atualizarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =====================================================
// NORMALIZAÇÃO DOS DADOS
// =====================================================

function extrairListaStrings(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function obterObjeto(valor: unknown): Record<string, any> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  return valor as Record<string, any>;
}

function extrairUsuario(respostaApi: unknown): UsuarioAutenticado | null {
  const resposta = obterObjeto(respostaApi);

  if (!resposta) {
    return null;
  }

  const dados = obterObjeto(resposta.dados);
  const dadosAninhados = obterObjeto(dados?.dados);

  const usuarioRecebido =
    obterObjeto(resposta.usuario) ??
    obterObjeto(dados?.usuario) ??
    obterObjeto(dadosAninhados?.usuario);

  if (!usuarioRecebido) {
    return null;
  }

  const id = Number(usuarioRecebido.id_usuario ?? usuarioRecebido.id);

  const nome =
    typeof usuarioRecebido.nome === "string" ? usuarioRecebido.nome.trim() : "";

  const email =
    typeof usuarioRecebido.email === "string"
      ? usuarioRecebido.email.trim()
      : "";

  if (!Number.isInteger(id) || id <= 0 || !nome || !email) {
    return null;
  }

  const clienteRecebido = obterObjeto(usuarioRecebido.cliente);

  const idClienteInformado =
    usuarioRecebido.id_cliente ??
    usuarioRecebido.cliente_id ??
    clienteRecebido?.id_cliente ??
    clienteRecebido?.cliente_id;

  const idCliente = Number(idClienteInformado);

  const cliente =
    clienteRecebido ||
    (Number.isInteger(idCliente) && idCliente > 0
      ? { id_cliente: idCliente }
      : null);

  return {
    id,
    id_usuario: id,

    id_cliente: Number.isInteger(idCliente) && idCliente > 0 ? idCliente : null,

    cliente,

    nome,
    email,

    telefone:
      typeof usuarioRecebido.telefone === "string" &&
      usuarioRecebido.telefone.trim()
        ? usuarioRecebido.telefone.trim()
        : null,

    ativo:
      typeof usuarioRecebido.ativo === "boolean"
        ? usuarioRecebido.ativo
        : undefined,

    email_verificado_em:
      typeof usuarioRecebido.email_verificado_em === "string"
        ? usuarioRecebido.email_verificado_em
        : null,

    ultimo_acesso_em:
      typeof usuarioRecebido.ultimo_acesso_em === "string"
        ? usuarioRecebido.ultimo_acesso_em
        : null,

    criado_em:
      typeof usuarioRecebido.criado_em === "string"
        ? usuarioRecebido.criado_em
        : undefined,

    atualizado_em:
      typeof usuarioRecebido.atualizado_em === "string"
        ? usuarioRecebido.atualizado_em
        : undefined,

    papeis: extrairListaStrings(usuarioRecebido.papeis),
    permissoes: extrairListaStrings(usuarioRecebido.permissoes),
  };
}

// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);

  const [carregando, setCarregando] = useState(true);

  const atualizarUsuario = useCallback(async () => {
    setCarregando(true);

    try {
      const resposta = await conexao.get(ROTAS.AUTH.USUARIO_ATUAL);

      const dados = resposta.data;

      if (dados?.sucesso === false || dados?.autenticado === false) {
        setUsuario(null);
        return;
      }

      const usuarioAutenticado = extrairUsuario(dados);

      setUsuario(usuarioAutenticado);
    } catch (erro) {
      console.error("[AUTH] Erro ao recuperar usuário:", erro);

      setUsuario(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void atualizarUsuario();
  }, [atualizarUsuario]);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        autenticado: usuario !== null,
        atualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useAuth(): AuthContextType {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth precisa ser utilizado dentro de AuthProvider.");
  }

  return contexto;
}
