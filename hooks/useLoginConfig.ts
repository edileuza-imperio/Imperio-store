// /hooks/useLoginConfig.ts
import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type Step = "inicio" | "login" | "pin" | "cadastro";

export const useLoginConfig = () => {
  const router = useRouter();

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>("inicio");
  const [usuarioTempId, setUsuarioTempId] = useState<number | null>(null);

  // 🔹 Busca configuração do login
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get("/admin/configuracoes/login", {
          withCredentials: true,
        });
        setConfig(response.data.dados[0]);
      } catch {
        toast.error("Erro ao carregar configuração de login");
        setConfig({
          fundo: "#000000",
          logo: "/images/logo.png",
          titulo: "Imperio Loja",
          mensagem_personalizada: "Entre com suas credenciais.",
        });
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
        const res = await api.get("/me", { withCredentials: true });
        if (res.data?.dados?.usuario && !res.data?.dados?.pedir_pin) {
          router.push("/");
        } else if (res.data?.dados?.usuario && res.data?.dados?.pedir_pin) {
          setUsuarioTempId(res.data.dados.usuario.id);
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
    try {
      const res = await api.post(
        "/login/etapa1",
        { usuario, senha },
        { withCredentials: true }
      );
      const data = res.data.dados;

      if (data.acao === "pedir_pin") {
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
    try {
      await api.post(
        "/login/etapa2",
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
