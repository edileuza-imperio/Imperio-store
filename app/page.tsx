"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import api from "@/Api/conectar";
import ApiError from "@/components/pages/Error/ApiError";
import HomeSkeleton from "@/components/pages/ui/HomeSkeleton";
import useApi from "@/components/principal/UseApi";
import HomeContent from "@/Home/HomeContent";
import useUsuario from "@/hooks/Auth/useUsuario";

export default function Home() {
  const router = useRouter();

  const { usuario, loading: loadingUser, logado } = useUsuario();
  const { loading, error, refetch } = useApi();

  const [testeApiLoading, setTesteApiLoading] = useState(true);
  const [testeApiErro, setTesteApiErro] = useState("");
  const [testeApiDados, setTesteApiDados] = useState<any>(null);

  useEffect(() => {
    if (!loadingUser && !logado) {
      router.push("/login");
    }
  }, [loadingUser, logado, router]);

  useEffect(() => {
    let ativo = true;

    async function testarApi() {
      try {
        setTesteApiLoading(true);
        setTesteApiErro("");

        const response = await api.get("/config-login", {
          withCredentials: true,
        });

        if (!ativo) return;

        setTesteApiDados(response?.data ?? null);
      } catch (err: any) {
        if (!ativo) return;

        console.error("Erro no teste da API:", err);

        setTesteApiErro(
          err?.response?.data
            ? typeof err.response.data === "string"
              ? err.response.data
              : JSON.stringify(err.response.data, null, 2)
            : err?.message || "Erro ao testar API"
        );
      } finally {
        if (ativo) {
          setTesteApiLoading(false);
        }
      }
    }

    testarApi();

    return () => {
      ativo = false;
    };
  }, []);

  if (loadingUser || loading) {
    return <HomeSkeleton />;
  }

 

  return (
    <>
      <div
        style={{
          margin: "16px",
          padding: "16px",
          borderRadius: "12px",
          background: "#fff",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: "12px" }}>Teste da API</h2>

        <p>
          <strong>Base URL:</strong>{" "}
          {process.env.NEXT_PUBLIC_API_URL || "NÃO DEFINIDA"}
        </p>

        <p>
          <strong>Usuário logado:</strong> {logado ? "Sim" : "Não"}
        </p>

        <p>
          <strong>Nome usuário:</strong> {usuario?.nome || "Não carregado"}
        </p>

        {testeApiLoading && <p>Testando API...</p>}

        {!testeApiLoading && testeApiErro && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              borderRadius: "10px",
              background: "#ffe5e5",
              color: "#8a1f1f",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            <strong>Erro no teste:</strong>
            <br />
            {testeApiErro}
          </div>
        )}

        {!testeApiLoading && !testeApiErro && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              borderRadius: "10px",
              background: "#e9fff0",
              color: "#14532d",
            }}
          >
            <strong>API respondeu com sucesso.</strong>
          </div>
        )}

        {!testeApiLoading && testeApiDados && (
          <pre
            style={{
              marginTop: "12px",
              padding: "12px",
              borderRadius: "10px",
              background: "#f7f7f7",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: "12px",
            }}
          >
            {JSON.stringify(testeApiDados, null, 2)}
          </pre>
        )}
      </div>

      {!error && <HomeContent />}
    </>
  );
}