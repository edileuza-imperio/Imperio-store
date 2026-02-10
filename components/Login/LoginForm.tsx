'use client';

import { useState } from "react";
import { FiUser, FiLock } from "react-icons/fi";

interface LoginFormProps {
  onVoltar: () => void;
  onCadastrar: () => void;
  onLogin: (usuario: string, senha: string) => void;
}

export default function LoginForm({ onVoltar, onCadastrar, onLogin }: LoginFormProps) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(usuario, senha);
  };

  const inputContainerStyle = { display: "flex", alignItems: "center", padding: "1rem", marginBottom: "1rem", borderRadius: "8px", border: "1px solid #555", backgroundColor: "rgba(255,255,255,0.05)" };
  const inputStyle = { flex: 1, border: "none", outline: "none", background: "transparent", color: "#fff", fontSize: "1rem" };
  const iconStyle = { marginRight: "0.75rem", color: "#ccc" };
  const buttonStyle = { padding: "1rem", background: "#0070f3", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "bold", cursor: "pointer", marginBottom: "1rem" };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "350px" }}>
        <h2 style={{ marginBottom: "2rem", fontSize: "2rem", textAlign: "center" }}>Login</h2>
        <div style={inputContainerStyle}><FiUser style={iconStyle} /><input type="text" placeholder="Usuário ou email" value={usuario} onChange={(e) => setUsuario(e.target.value)} style={inputStyle} /></div>
        <div style={inputContainerStyle}><FiLock style={iconStyle} /><input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} /></div>
        <button type="submit" style={buttonStyle}>Entrar</button>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <button type="button" onClick={onCadastrar} style={{ background: "transparent", border: "none", color: "#28a745", fontWeight: "bold", textDecoration: "underline", cursor: "pointer" }}>Criar conta</button>
          <button type="button" onClick={onVoltar} style={{ background: "transparent", border: "none", color: "#ccc", textDecoration: "underline", cursor: "pointer" }}>Voltar</button>
        </div>
      </form>
    </div>
  );
}
