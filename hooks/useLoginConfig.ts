// /hooks/useLoginConfig.ts
"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { rotas } from "@/components/Bibioteca/config/rotas"; // ajuste o caminho se necessário

type Step = "inicio" | "login" | "pin" | "cadastro";

type LoginConfig = {
  fundo: string;
  logo: string;
  titulo: string;
  mensagem_personalizada: string;
};

const DEFAULT_CONFIG: LoginConfig = {
  fundo: "#000000",
  logo: "/images/logo.png",
  titulo: "Imperio Loja",
  mensagem_personalizada: "Entre com suas credenciais.",
};

export const useLoginConfig = () => {
  const router = useRouter();

  const [config, setConfig] = useState<LoginConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>("inicio");
  const [usuarioTempId, setUsuarioTempId] = useState<number | null>(null);

  // 🔹 Busca configuração do login
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get(rotas.admin.configLogin, {
          withCredentials: true,
        });

        // sua API parece retornar dados[0]
        const cfg = response.data?.dados?.[0];
        setConfig(cfg ?? DEFAULT_CONFIG);
      } catch {
        toast.error("Erro ao carregar configuração de login");
        setConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // 🔹 Verifica sessão
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get(rotas.auth.me, { withCredentials: true });
        const usuario = res.data?.dados?.usuario;

        // Se você não usa mais pedir_pin no /me, pode remover essa parte depois.
        const pedirPin = res.data?.dados?.pedir_pin;

        if (usuario && !pedirPin) {
          router.push("/");
        } else if (usuario && pedirPin) {
          setUsuarioTempId(usuario.id);
          setStep("pin");
        }
      } catch {
        // não autenticado
      }
    };

    checkSession();
  }, [router]);

  // 🔹 Bloqueio de atalhos
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

  // 🔑 Login e PIN
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (usuario: string, senha: string) => {
    if (!usuario || !senha) {
      setErrorMsg("Preencha todos os campos!");
      return;
    }

    setLoadingBtn(true);
    setErrorMsg("");

    try {
      const res = await api.post(
        rotas.auth.loginEtapa1,
        { usuario, senha },
        { withCredentials: true }
      );

      const data = res.data?.dados;

      if (data?.acao === "pedir_pin") {
        setUsuarioTempId(data.id_usuario);
        setStep("pin");
        toast.info("Digite o PIN enviado.");
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.mensagem || "Erro ao logar.");
    } finally {
      setLoadingBtn(false);
    }
  };

  const handleValidarPin = async (pin: string) => {
    if (!pin || !usuarioTempId) {
      setErrorMsg("Informe o PIN.");
      return;
    }

    setLoadingBtn(true);
    setErrorMsg("");

    try {
      await api.post(
        rotas.auth.loginEtapa2,
        { id_usuario: usuarioTempId, pin },
        { withCredentials: true }
      );

      toast.success("PIN confirmado! Acesso liberado.");
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.mensagem || "PIN incorreto");
    } finally {
      setLoadingBtn(false);
    }
  };

  return {
    config,
    loading,
    step,
    setStep,
    usuarioTempId,
    loadingBtn,
    errorMsg,
    handleLogin,
    handleValidarPin,
  };
};