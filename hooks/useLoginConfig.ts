// /hooks/useLoginConfig.ts
"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { rotas } from "@/components/Bibioteca/config/rotas";

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

// ✅ resolve: suporta {dados: obj}, {dados: [obj]}, {data: obj}, {data:[obj]}
function resolveConfig(payload: any): LoginConfig | null {
  const root = payload?.dados ?? payload?.data ?? payload;

  if (!root) return null;

  // caso venha array
  if (Array.isArray(root)) return (root[0] ?? null) as LoginConfig | null;

  // caso venha objeto
  if (typeof root === "object") return root as LoginConfig;

  return null;
}

export const useLoginConfig = () => {
  const router = useRouter();

  const [config, setConfig] = useState<LoginConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>("inicio");
  const [usuarioTempId, setUsuarioTempId] = useState<number | null>(null);

  // 🔹 Busca configuração do login
  useEffect(() => {
    let alive = true;

    const fetchConfig = async () => {
      try {
        // ✅ agora é na raiz: rotas.configLogin
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

  // 🔹 Verifica sessão
  useEffect(() => {
    let alive = true;

    const checkSession = async () => {
      try {
        const res = await api.get(rotas.auth.me, { withCredentials: true });

        const dados = res.data?.dados ?? res.data?.data ?? res.data;
        const usuario = dados?.usuario;
        const pedirPin = dados?.pedir_pin;

        if (!alive) return;

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
    return () => {
      alive = false;
    };
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

      const data = res.data?.dados ?? res.data?.data ?? res.data;

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