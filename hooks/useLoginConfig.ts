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

  const [config,setConfig] = useState<LoginConfig | null>(null);
  const [loading,setLoading] = useState(true);

  const [usuarioTempId,setUsuarioTempId] = useState<number | null>(null);

  const [loadingBtn,setLoadingBtn] = useState(false);
  const [errorMsg,setErrorMsg] = useState("");

  // Buscar configuração
  useEffect(()=>{

    let alive = true;

    const fetchConfig = async () => {

      try {

        const response = await api.get(rotas.configLogin,{
          withCredentials:true
        });

        const cfg = resolveConfig(response.data);

        if(!alive) return;

        setConfig(cfg ?? DEFAULT_CONFIG);

      } catch {

        if(!alive) return;

        toast.error("Erro ao carregar configuração de login");

        setConfig(DEFAULT_CONFIG);

      } finally {

        if(!alive) return;

        setLoading(false);

      }

    };

    fetchConfig();

    return ()=>{ alive = false };

  },[]);

  // Verificar sessão
  useEffect(()=>{

    let alive = true;

    const checkSession = async () => {

      try {

        const res = await api.get(rotas.auth.me,{
          withCredentials:true
        });

        const dados = res.data?.dados ?? res.data?.data ?? res.data;

        const usuario = dados?.usuario;
        const pedirPin = dados?.pedir_pin;

        if(!alive) return;

        if(usuario && !pedirPin){
          router.push("/");
        }

        if(usuario && pedirPin){
          setUsuarioTempId(usuario.id);
          router.push("/login/pin");
        }

      } catch {}

    };

    checkSession();

    return ()=>{ alive = false };

  },[router]);

  // Bloqueio de atalhos
  useEffect(()=>{

    const handleKeyDown = (e:KeyboardEvent)=>{

      if(e.ctrlKey && ["a","c","v","u"].includes(e.key.toLowerCase())){
        e.preventDefault();
        toast.warning("Atalho bloqueado!");
      }

      if(e.key === "F12"){
        e.preventDefault();
        toast.warning("Atalho bloqueado!");
      }

    };

    const handleContextMenu = (e:MouseEvent)=> e.preventDefault();

    document.addEventListener("keydown",handleKeyDown);
    document.addEventListener("contextmenu",handleContextMenu);

    return ()=>{
      document.removeEventListener("keydown",handleKeyDown);
      document.removeEventListener("contextmenu",handleContextMenu);
    };

  },[]);

  // LOGIN
  const handleLogin = async (usuario:string,senha:string)=>{

    if(!usuario || !senha){
      setErrorMsg("Preencha todos os campos!");
      return;
    }

    setLoadingBtn(true);
    setErrorMsg("");

    try {

      const res = await api.post(
        rotas.auth.loginEtapa1,
        { usuario, senha },
        { withCredentials:true }
      );

      const data = res.data?.dados ?? res.data?.data ?? res.data;

      if(data?.acao === "pedir_pin"){

        setUsuarioTempId(data.id_usuario);

        toast.info("Digite o PIN enviado.");

        router.push("/login/pin");

      } else {

        toast.success("Login realizado com sucesso!");

        router.push("/");

      }

    } catch (err:any){

      setErrorMsg(err?.response?.data?.mensagem || "Erro ao logar.");

    } finally {

      setLoadingBtn(false);

    }

  };

  // VALIDAR PIN
  const handleValidarPin = async (pin:string)=>{

    if(!pin || !usuarioTempId){
      setErrorMsg("Informe o PIN.");
      return;
    }

    setLoadingBtn(true);
    setErrorMsg("");

    try {

      await api.post(
        rotas.auth.loginEtapa2,
        { id_usuario: usuarioTempId, pin },
        { withCredentials:true }
      );

      toast.success("PIN confirmado! Acesso liberado.");

      router.push("/");

    } catch (err:any){

      setErrorMsg(err?.response?.data?.mensagem || "PIN incorreto");

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

    handleLogin,
    handleValidarPin

  };

};