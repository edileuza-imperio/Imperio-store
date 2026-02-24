"use client";

import { TicketPercent, CalendarDays, Copy, Check, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

interface Cupom {
  codigo: string;
  descricao: string;
  desconto: string;
  expiracao: string;
  tipo: string;
}

export default function Cupons() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarCupons = async () => {
      try {
        const res = await api.get(rotas.cupons.ativos);

        if (res.data?.status !== 200) {
          setErro(res.data?.mensagem || "Erro ao carregar cupons.");
          return;
        }

        const dados: Cupom[] = (res.data?.dados ?? []).map((c: any) => ({
          codigo: c.codigo,
          descricao: c.descricao,
          desconto:
            c.tipo_codigo === "frete"
              ? "FRETE GRÁTIS"
              : c.tipo_codigo === "valor"
              ? `R$ ${c.desconto}`
              : `${c.desconto}%`,
          expiracao: c.expiracao
            ? c.expiracao.split("-").reverse().join("/")
            : "Indefinido",
          tipo: c.tipo_codigo,
        }));

        setCupons(dados);
      } catch (err: any) {
        console.error("Erro ao carregar cupons ativos:", err);
        setErro("Não foi possível carregar os cupons.");
      } finally {
        setLoading(false);
      }
    };

    carregarCupons();
  }, []);

  const copiar = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiado(codigo);
    setTimeout(() => setCopiado(null), 2000);
  };

  const theme = useMemo(
    () => ({
      rose: "#b76e79",
      roseSoft: "#d9a5ad",
      gold: "#d4af37",
    }),
    []
  );

  const corTipo = (tipo: string) => {
    switch (tipo) {
      case "frete":
        return `linear-gradient(135deg, ${theme.gold}, ${theme.roseSoft})`;
      case "valor":
        return `linear-gradient(135deg, ${theme.rose}, #923f45)`;
      default:
        return `linear-gradient(135deg, ${theme.roseSoft}, ${theme.gold})`;
    }
  };

  if (loading) return <div className="text-center py-5">Carregando cupons…</div>;
  if (erro) return <div className="text-center text-danger py-5">{erro}</div>;

  return (
    <section className="container py-5">
      <div className="text-center mb-5">
        <Sparkles size={28} />
        <h2 className="fw-bold mt-3">Cupons Exclusivos</h2>
        <p className="text-muted">
          Copie o código e aproveite descontos especiais.
        </p>
      </div>

      <div className="row g-4">
        {cupons.length === 0 && (
          <p className="text-center">Nenhum cupom disponível.</p>
        )}

        {cupons.map((cupom) => (
          <div key={cupom.codigo} className="col-md-6 col-lg-4">
            <div className="card shadow border-0 rounded-4 h-100 overflow-hidden">
              <div
                className="p-4 text-white"
                style={{ background: corTipo(cupom.tipo) }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span className="badge bg-light text-dark">
                    <TicketPercent size={14} /> Cupom
                  </span>
                  <strong className="fs-4">{cupom.desconto}</strong>
                </div>
              </div>

              <div className="p-4">
                <p className="text-muted">{cupom.descricao}</p>

                <div className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-3">
                  <strong>{cupom.codigo}</strong>
                  <button
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => copiar(cupom.codigo)}
                  >
                    {copiado === cupom.codigo ? (
                      <>
                        <Check size={14} /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copiar
                      </>
                    )}
                  </button>
                </div>

                <small className="text-muted d-flex align-items-center gap-2">
                  <CalendarDays size={14} />
                  Válido até: {cupom.expiracao}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}