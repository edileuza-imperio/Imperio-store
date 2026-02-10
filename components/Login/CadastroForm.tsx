'use client';

import React from "react";
import { FiUser, FiLock, FiMail, FiPhone, FiFileText } from "react-icons/fi";

interface CadastroFormProps {
  onVoltar: () => void;
  onCadastro: (dados: { nome: string; email: string; senha: string; telefone?: string; cpf?: string }) => void;
  loading?: boolean;
  error?: string | null;
}

export default function CadastroForm({ onVoltar, onCadastro, loading, error }: CadastroFormProps) {
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [telefone, setTelefone] = React.useState("");
  const [cpf, setCpf] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCadastro({ nome, email, senha, telefone, cpf });
  };

  // Funções de máscara manual
  const formatTelefone = (value: string) => {
    value = value.replace(/\D/g, "");
    if (value.length <= 10) {
      value = value.replace(/(\d{2})(\d)/, "($1) $2");
      value = value.replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      value = value.replace(/(\d{2})(\d)/, "($1) $2");
      value = value.replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value;
  };

  const formatCPF = (value: string) => {
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return value;
  };

  const inputContainerStyle = {
    display: "flex",
    alignItems: "center",
    padding: "1rem",
    marginBottom: "1rem",
    borderRadius: "8px",
    border: "1px solid #555",
    backgroundColor: "rgba(255,255,255,0.05)",
  };

  const inputStyle = {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "1rem",
  };

  const iconStyle = { marginRight: "0.75rem", color: "#ccc" };
  const buttonStyle = { padding: "1rem", background: "#0070f3", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "bold", cursor: "pointer", marginBottom: "1rem" };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "400px", position: "relative" }}>
        {/* Botão Voltar no topo */}
        <button
          type="button"
          onClick={onVoltar}
          style={{
            position: "absolute",
            top: "-50px",
            left: "0",
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            border: "1px solid #555",
            borderRadius: "6px",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Voltar
        </button>

        <h2 style={{ marginBottom: "1.5rem", fontSize: "2rem", textAlign: "center" }}>Cadastro</h2>

        {error && <div style={{ color: "red", marginBottom: "1rem", textAlign: "center" }}>{error}</div>}

        <div style={inputContainerStyle}><FiUser style={iconStyle} /><input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} required /></div>
        <div style={inputContainerStyle}><FiMail style={iconStyle} /><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required /></div>
        <div style={inputContainerStyle}><FiLock style={iconStyle} /><input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} required /></div>
        <div style={inputContainerStyle}><FiPhone style={iconStyle} /><input type="text" placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(formatTelefone(e.target.value))} style={inputStyle} /></div>
        <div style={inputContainerStyle}><FiFileText style={iconStyle} /><input type="text" placeholder="CPF" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} style={inputStyle} /></div>

        <button type="submit" style={buttonStyle} disabled={loading}>{loading ? "Cadastrando..." : "Cadastrar"}</button>
      </form>
    </div>
  );
}
