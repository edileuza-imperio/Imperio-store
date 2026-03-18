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

  const [usuarioTempId, setUsuarioTempId] = useState<number | null>(null);

  const [loadingBtn, setLoadingBtn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;

    const fetchConfig = async () => {
      try {
        const response = await api.get(rotas.configLogin, {
          withCredentials: true,
        });

        const cfg = resolveConfig(response.data);

        if (!alive) return;
        setConfig(cfg ?? DEFAULT_CONFIG);
      } catch {
        if (!alive) return;
        toast.error("Erro ao carregar configuração de login");
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
        const res = await api.get(rotas.auth.me, {
          withCredentials: true,
        });

        const dados = res.data?.dados ?? res.data?.data ?? res.data;
        const usuario = dados?.usuario;
        const pedirPin = dados?.pedir_pin;

        if (!alive) return;

        if (usuario && !pedirPin) {
          router.push("/");
          return;
        }

        if (usuario && pedirPin) {
          setUsuarioTempId(Number(usuario.id));
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && ["a", "c", "v", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        toast.warning("Atalho bloqueado!");
      }

      if (e.key === "F12") {
        e.preventDefault();
        toast.warning("Atalho bloqueado!");
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  const buscarUsuarioPendente = async (): Promise<number | null> => {
    try {
      const res = await api.get(rotas.auth.me, {
        withCredentials: true,
      });

      const dados = res.data?.dados ?? res.data?.data ?? res.data;
      const usuario = dados?.usuario;
      const pedirPin = dados?.pedir_pin;

      if (usuario?.id && pedirPin) {
        const id = Number(usuario.id);
        setUsuarioTempId(id);
        return id;
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleLogin = async (usuario: string, senha: string) => {
    if (!usuario || !senha) {
      setErrorMsg("Preencha todos os campos!");
      return { sucesso: false, pedirPin: false };
    }

    setLoadingBtn(true);
    setErrorMsg("");

    try {
      const res = await api.post(
        rotas.auth.loginEtapa1,
        { usuario, senha },
        { withCredentials: true }
      );

      const data = res.data?.dados ?? res.data?.data ?? res.data;

      if (data?.acao === "pedir_pin") {
        if (data?.id_usuario) {
          setUsuarioTempId(Number(data.id_usuario));
        }

        toast.info("Digite o PIN enviado.");
        return {
          sucesso: true,
          pedirPin: true,
          idUsuario: data?.id_usuario ? Number(data.id_usuario) : null,
        };
      }

      toast.success("Login realizado com sucesso!");
      router.push("/");

      return {
        sucesso: true,
        pedirPin: false,
      };
    } catch (err: any) {
      const mensagem = err?.response?.data?.mensagem || "Erro ao logar.";
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
      setErrorMsg("Informe o PIN.");
      return { sucesso: false };
    }

    setLoadingBtn(true);
    setErrorMsg("");

    try {
      let idUsuario = usuarioTempId;

      if (!idUsuario) {
        idUsuario = await buscarUsuarioPendente();
      }

      if (!idUsuario) {
        const mensagem = "Sessão expirada. Faça login novamente.";
        setErrorMsg(mensagem);
        return { sucesso: false, mensagem };
      }

      await api.post(
        rotas.auth.loginEtapa2,
        { id_usuario: idUsuario, pin },
        { withCredentials: true }
      );

      toast.success("PIN confirmado! Acesso liberado.");
      router.push("/");

      return { sucesso: true };
    } catch (err: any) {
      const mensagem = err?.response?.data?.mensagem || "PIN incorreto";
      setErrorMsg(mensagem);
      return { sucesso: false, mensagem };
    } finally {
      setLoadingBtn(false);
    }
  };

  return {
    config,
    loading,
    usuarioTempId,
    loadingBtn,
    errorMsg,
    setErrorMsg,
    handleLogin,
    handleValidarPin,
  };
};