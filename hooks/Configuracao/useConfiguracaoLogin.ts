'use client';

import api from "@/Api/conectar";
import { useState, useEffect } from "react";

export interface TipoLogin {
  id_tipo: number;
  nome: string;
  descricao?: string | null;
  criado: string;
}

export interface ConfiguracaoLogin {
  id: number;
  titulo: string;
  logo: string;
  fundo: string;
  mensagem_personalizada?: string | null;
  tipo_login_id: number;
  tipo_login?: TipoLogin | null;
  statusid: number;
  criado: string;
  atualizado: string;
}

export default function useConfiguracaoLogin() {
  const [config, setConfig] = useState<ConfiguracaoLogin | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfiguracao = async () => {
      try {
        setLoading(true);
        const response = await api.get("/config/login");
        setConfig(response.data.dados);
        setErro(null);
      } catch (err: any) {
        setErro(err.response?.data?.mensagem || "Erro ao carregar configuração");
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };
    fetchConfiguracao();
  }, []);

  return { config, loading, erro };
}
