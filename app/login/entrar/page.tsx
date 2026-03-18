'use client';

import { useState } from "react";
import { useLoginConfig } from "@/hooks/useLoginConfig";
import { useRouter } from "next/navigation";

export default function LoginEntrar(){

  const router = useRouter();

  const {
    config,
    loading,
    handleLogin,
    loadingBtn,
    errorMsg
  } = useLoginConfig();

  const [usuario,setUsuario] = useState("");
  const [senha,setSenha] = useState("");

  if (loading) {
    return <p style={{color:"white",textAlign:"center"}}>Carregando...</p>;
  }

  return (

    <>
    <div
      className="page"
      style={{background: config?.fundo}}
    >

      <div className="loginBox">

        {config?.logo && (
          <img src={config.logo} className="logo"/>
        )}

        <h2 className="title">
          {config?.titulo}
        </h2>

        {errorMsg && (
          <p className="error">{errorMsg}</p>
        )}

        <input
          className="input"
          placeholder="Usuário ou email"
          value={usuario}
          onChange={(e)=>setUsuario(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e)=>setSenha(e.target.value)}
        />

        <button
          className="btnLogin"
          onClick={()=>handleLogin(usuario,senha)}
          disabled={loadingBtn}
        >
          {loadingBtn ? "Entrando..." : "Entrar"}
        </button>

        <button
          className="btnBack"
          onClick={()=>router.push("/login")}
        >
          Voltar
        </button>

      </div>

    </div>


<style jsx>{`

.page{
  min-height:100vh;
  width:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:20px;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
}

.loginBox{
  width:100%;
  max-width:360px;
  display:flex;
  flex-direction:column;
  gap:14px;
}

.logo{
  width:110px;
  margin:0 auto 10px auto;
  display:block;
}

.title{
  text-align:center;
  font-size:30px;
  font-weight:900;
  color:white;
}

.input{
  width:100%;
  padding:14px;
  border-radius:10px;
  border:1px solid rgba(255,255,255,.2);
  background:rgba(255,255,255,.08);
  color:white;
  font-size:14px;
  outline:none;
  transition:.2s;
}

.input::placeholder{
  color:rgba(255,255,255,.6);
}

.input:focus{
  border-color:rgba(255,255,255,.6);
  background:rgba(255,255,255,.12);
}

.btnLogin{
  width:100%;
  padding:14px;
  border-radius:10px;
  border:none;
  font-weight:800;
  cursor:pointer;
  background:linear-gradient(90deg,#ffd0db,#ff9fb3);
  color:#2b0c16;
  transition:.2s;
}

.btnLogin:hover{
  transform:translateY(-1px);
}

.btnLogin:disabled{
  opacity:.6;
  cursor:not-allowed;
}

.btnBack{
  background:none;
  border:none;
  color:white;
  opacity:.8;
  cursor:pointer;
  font-size:13px;
}

.btnBack:hover{
  opacity:1;
}

.error{
  background:rgba(255,0,0,.15);
  border:1px solid rgba(255,0,0,.25);
  padding:10px;
  border-radius:8px;
  font-size:13px;
  color:#ffd1d1;
}

@media(max-width:600px){

.loginBox{
  max-width:100%;
}

.logo{
  width:90px;
}

.title{
  font-size:24px;
}

}

`}</style>

</>
  );
}