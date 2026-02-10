'use client';

import { useState, useEffect } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export type StepLogin = "inicio" | "login" | "pin";

export default function useLogin() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<StepLogin>("inicio");
  const [loadingBtn, setLoadingBtn] = useState(false);

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [pin, setPin] = useState<string[]>(["", "", ""]); // 3 dígitos
  const [errorMsg, setErrorMsg] = useState("");
  const [usuarioIdPin, setUsuarioIdPin] = useState<number | null>(null);

  const router = useRouter();

  // Busca configuração do login
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await api.get("/config/login");
        setConfig(response.data.dados[0]);
      } catch (err: any) {
        toast.error("Erro ao carregar configuração de login");
        setConfig({
          fundo: "#000000",
          logo: "/images/logo.png",
          titulo: "Imperio Loja",
          mensagem_personalizada: "Entre com suas credenciais."
        });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Verifica sessão do usuário
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get("/me");
        // se tiver usuário e NÃO precisa de PIN
        if (res.data && res.data.usuario && !res.data.pedir_pin) {
          router.push("/"); 
        } else if (res.data && res.data.usuario && res.data.pedir_pin) {
          // usuário já logado mas precisa digitar PIN
          setUsuarioIdPin(res.data.usuario.id);
          setStep("pin");
        }
      } catch {
        // não autenticado, permanece no login
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  // Bloqueio de atalhos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && ["a","c","v","u"].includes(e.key.toLowerCase())) {
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

  // Login usuário/senha
  const handleLogin = async () => {
    if (!usuario || !senha) {
      setErrorMsg("Preencha todos os campos!");
      return;
    }

    setLoadingBtn(true);
    try {
      const res = await api.post("/login/etapa1", { usuario, senha });
      const data = res.data;

      if (data.acao === "pedir_pin") {
        // Superadmin precisa de PIN
        setUsuarioIdPin(data.id_usuario);
        setStep("pin");
        toast.info("Digite o PIN enviado.");
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/"); // usuário comum logado
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.mensagem || "Erro ao logar.");
    } finally {
      setLoadingBtn(false);
    }
  };

  // Valida PIN
  const handlePin = async () => {
    const pinStr = pin.join("");
    if (!pinStr || !usuarioIdPin) {
      setErrorMsg("Informe o PIN.");
      return;
    }

    setLoadingBtn(true);
    try {
      const res = await api.post("/login/etapa2", { id_usuario: usuarioIdPin, pin: pinStr });
      toast.success("Login realizado com sucesso!");
      router.push("/"); // PIN correto, redireciona
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.mensagem || "PIN incorreto.");
    } finally {
      setLoadingBtn(false);
    }
  };

  const handleEntrar = () => {
    setLoadingBtn(true);
    setTimeout(() => {
      setLoadingBtn(false);
      setStep("login");
    }, 500);
  };

  return {
    config,
    loading,
    step,
    loadingBtn,
    usuario,
    senha,
    pin,
    errorMsg,
    setUsuario,
    setSenha,
    setPin,
    handleEntrar,
    handleLogin,
    handlePin,
  };
}
