'use client';

import { useState } from "react";
import { useLoginConfig } from "@/hooks/useLoginConfig";
import { useRouter } from "next/navigation";

export default function LoginEntrar() {

  const router = useRouter();
  const { handleLogin, loadingBtn, errorMsg } = useLoginConfig();

  const [usuario,setUsuario] = useState("");
  const [senha,setSenha] = useState("");

  return (

    <div className="page">

      <div className="card">

        <h2>Entrar</h2>

        {errorMsg && <p className="error">{errorMsg}</p>}

        <input
          placeholder="Usuário ou email"
          value={usuario}
          onChange={e=>setUsuario(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e=>setSenha(e.target.value)}
        />

        <button
          onClick={()=>handleLogin(usuario,senha)}
          disabled={loadingBtn}
        >
          Entrar
        </button>

        <button
          className="back"
          onClick={()=>router.push("/login")}
        >
          Voltar
        </button>

      </div>

    </div>

  );
}