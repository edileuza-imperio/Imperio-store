"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { rotas } from "@/components/Bibioteca/config/rotas";

export type LoginConfig = {
  fundo: string;
  logo: string;
  titulo: string;
  mensagem_personalizada: string;
  cor_primaria?: string;
  cor_secundaria?: string;
};

const DEFAULT_CONFIG: LoginConfig = {
  fundo: "#000000",
  logo: "/images/logo.png",
  titulo: "Imperio Loja",
  mensagem_personalizada: "Entre com suas credenciais.",
};

function resolveConfig(payload: any): LoginConfig | null {
  const root = payload?.dados ?? payload?.data ?? payload;

  if (!root) return null;

  if (Array.isArray(root)) {
    return root[0] ?? null;
  }

  if (typeof root === "object") {
    return root;
  }

  return null;
}

export const useLoginConfig = () => {
  const router = useRouter();

  const [config, setConfig] = useState<LoginConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [precisaPin, setPrecisaPin] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;

    const fetchConfig = async () => {
      try {
        const response = await api.get(rotas.configLogin);
        const cfg = resolveConfig(response.data);

        if (!alive) return;
        setConfig(cfg ?? DEFAULT_CONFIG);
      } catch (error) {
        console.error("Erro ao carregar config do login:", error);

        if (!alive) return;
        setConfig(DEFAULT_CONFIG);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    fetchConfig();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const checkSession = async () => {
      try {
        const res = await api.get(rotas.auth.me);
        const dados = res.data?.dados ?? res.data?.data ?? res.data;
        const usuario = dados?.usuario;

        if (!alive) return;

        if (usuario) {
          router.replace("/");
        }
      } catch {
        // não autenticado
      }
    };

    checkSession();

    return () => {
      alive = false;
    };
  }, [router]);

  const handleLogin = async (email: string, senha: string) => {
    if (!email || !senha) {
      const mensagem = "Preencha todos os campos!";
      setErrorMsg(mensagem);

      return {
        sucesso: false,
        pedirPin: false,
        mensagem,
      };
    }

    setLoadingBtn(true);
    setErrorMsg("");

    try {
      const res = await api.post(rotas.auth.loginEtapa1, {
        email,
        senha,
      });

      const data = res.data?.dados ?? res.data?.data ?? res.data;

      if (data?.etapa2 === true) {
        setPrecisaPin(true);
        toast.info("Informe o PIN para concluir o login.");

        return {
          sucesso: true,
          pedirPin: true,
        };
      }

      toast.success("Login realizado com sucesso!");
      router.replace("/");

      return {
        sucesso: true,
        pedirPin: false,
      };
    } catch (err: any) {
      console.error("Erro no login:", err?.response?.data || err);

      const mensagem =
        err?.response?.data?.mensagem ||
        err?.response?.data?.dados?.mensagem ||
        "Erro ao logar.";

      setErrorMsg(mensagem);

      return {
        sucesso: false,
        pedirPin: false,
        mensagem,
      };
    } finally {
      setLoadingBtn(false);
    }
  };

  const handleValidarPin = async (pin: string) => {
    if (!pin) {
      const mensagem = "Informe o PIN.";
      setErrorMsg(mensagem);

      return {
        sucesso: false,
        mensagem,
      };
    }

    setLoadingBtn(true);
    setErrorMsg("");

    try {
      await api.post(rotas.auth.loginEtapa2, { pin });

      setPrecisaPin(false);
      toast.success("PIN confirmado! Acesso liberado.");
      router.replace("/");

      return {
        sucesso: true,
      };
    } catch (err: any) {
      console.error("Erro no PIN:", err?.response?.data || err);

      const mensagem =
        err?.response?.data?.mensagem ||
        err?.response?.data?.dados?.mensagem ||
        "PIN incorreto.";

      setErrorMsg(mensagem);

      return {
        sucesso: false,
        mensagem,
      };
    } finally {
      setLoadingBtn(false);
    }
  };

  return {
    config,
    loading,
    precisaPin,
    loadingBtn,
    errorMsg,
    setErrorMsg,
    handleLogin,
    handleValidarPin,
  };
};