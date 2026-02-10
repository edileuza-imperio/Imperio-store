// src/hooks/useUsuario.ts
import api from "@/Api/conectar";
import { useState } from "react";

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  senha?: string; // opcional, usado só para envio
  telefone?: string | null;
  cpf?: string | null;
  pin?: string; // gerado automaticamente pelo backend
  nivel_id: number;
  statusid: number;
  criado: string;
  atualizado: string;
}

interface UseUsuarioReturn {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
  listarUsuarios: () => Promise<void>;
  buscarUsuario: (id: number) => Promise<Usuario | null>;
  criarUsuario: (dados: Partial<Usuario>) => Promise<Usuario | null>;
  atualizarUsuario: (id: number, dados: Partial<Usuario>) => Promise<boolean>;
  deletarUsuario: (id: number) => Promise<boolean>;
}

export default function useUsuario(): UseUsuarioReturn {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tratarErro = (err: any, mensagemPadrao: string) => {
    if (err.response?.data?.mensagem) {
      setError(err.response.data.mensagem);
    } else {
      setError(err.message || mensagemPadrao);
    }
  };

  // Listar todos os usuários
  const listarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data.dados?.usuarios || []);
    } catch (err: any) {
      tratarErro(err, "Erro ao listar usuários");
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuário por ID
  const buscarUsuario = async (id: number): Promise<Usuario | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/usuarios/${id}`);
      return res.data.dados || null;
    } catch (err: any) {
      tratarErro(err, "Erro ao buscar usuário");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Criar usuário
  const criarUsuario = async (dados: Partial<Usuario>): Promise<Usuario | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/usuarios", dados);
      return res.data.dados || null; // retorna objeto com id_usuario, pin, token_sessao etc.
    } catch (err: any) {
      tratarErro(err, "Erro ao criar usuário");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar usuário
  const atualizarUsuario = async (id: number, dados: Partial<Usuario>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await api.put(`/usuarios/${id}`, dados);
      return true;
    } catch (err: any) {
      tratarErro(err, "Erro ao atualizar usuário");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Deletar usuário
  const deletarUsuario = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/usuarios/${id}`);
      return true;
    } catch (err: any) {
      tratarErro(err, "Erro ao deletar usuário");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    usuarios,
    loading,
    error,
    listarUsuarios,
    buscarUsuario,
    criarUsuario,
    atualizarUsuario,
    deletarUsuario,
  };
}
