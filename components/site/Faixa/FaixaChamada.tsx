'use client';

import { TicketPercent, CalendarDays, Copy, Check, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/Api/conectar"; // seu axios configurado

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
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarCupons = async () => {
      try {
        const res = await api.get("/cupons/ativos");
        const dados: Cupom[] = res.data.dados.map((c: any) => ({
          codigo: c.codigo,
          descricao: c.descricao,
          desconto: c.tipo_codigo === "frete" ? "FREE" : c.desconto + (c.tipo_codigo === "valor" ? "R$" : "%"),
          expiracao: c.expiracao ? c.expiracao.split("-").reverse().join("/") : "Indefinido",
          tipo: c.tipo_codigo
        }));
        setCupons(dados);
      } catch (err) {
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

  const corTipo = (tipo: string) => {
    switch (tipo) {
      case "frete":
        return "linear-gradient(135deg,#198754,#20c997)";
      case "dourado":
        return "linear-gradient(135deg,#d4af37,#b9932f)";
      default:
        return "linear-gradient(135deg,#a55c62,#923f45)";
    }
  };

  if (loading) {
    return (
      <div className="loading">Carregando cupons...</div>
    );
  }

  if (erro) {
    return (
      <div className="erro">{erro}</div>
    );
  }

  return (
    <section className="cupons-section py-5">
      <div className="container">

        {/* CABEÇALHO */}
        <div className="text-center mb-5">
          <div className="icone-topo mb-3">
            <Sparkles size={34} />
          </div>
          <h2 className="titulo">
            Cupons <span>Exclusivos</span>
          </h2>
          <p className="subtitulo">
            Copie o código e aproveite descontos especiais
          </p>
        </div>

        {/* GRID */}
        <div className="row g-4">
          {cupons.length === 0 && <p>Nenhum cupom disponível no momento.</p>}
          {cupons.map(cupom => (
            <div key={cupom.codigo} className="col-lg-4 col-md-6">
              <div className="cupom-card">

                {/* HEADER */}
                <div className="cupom-header" style={{ background: corTipo(cupom.tipo) }}>
                  <span className="badge-tipo">
                    <TicketPercent size={14} /> CUPOM
                  </span>

                  <div className="desconto">
                    <strong>{cupom.desconto}</strong>
                    {cupom.tipo !== "frete" && <small>OFF</small>}
                  </div>
                </div>

                {/* BODY */}
                <div className="cupom-body">
                  <p className="descricao">{cupom.descricao}</p>

                  {/* CÓDIGO */}
                  <div className="codigo-box">
                    <span className="codigo">{cupom.codigo}</span>
                    <button
                      className={`btn-copiar ${copiado === cupom.codigo ? 'copiado' : ''}`}
                      onClick={() => copiar(cupom.codigo)}
                    >
                      {copiado === cupom.codigo ? (
                        <>
                          <Check size={16} /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> Copiar
                        </>
                      )}
                    </button>
                  </div>

                  {/* INFO */}
                  <div className="info">
                    <CalendarDays size={14} />
                    <span>{cupom.expiracao}</span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS */}
      <style jsx>{`
        .cupons-section {
          background: linear-gradient(135deg,#fffaf3,#f7efe4);
          padding-bottom: 5rem;
        }

        .loading, .erro {
          text-align: center;
          padding: 3rem 1rem;
          font-size: 1.2rem;
          color: #555;
        }

        .icone-topo {
          width: 72px;
          height: 72px;
          margin: auto;
          border-radius: 50%;
          background: linear-gradient(135deg,#d4af37,#b9932f);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 12px 30px rgba(0,0,0,.18);
        }

        .titulo {
          font-size: 2.4rem;
          font-weight: 800;
          color: #923f45;
        }

        .titulo span {
          color: #d4af37;
        }

        .subtitulo {
          color: #666;
          max-width: 520px;
          margin: auto;
        }

        .cupom-card {
          background: rgba(255,255,255,.85);
          backdrop-filter: blur(10px);
          border-radius: 26px;
          overflow: hidden;
          height: 100%;
          box-shadow: 0 15px 35px rgba(0,0,0,.1);
          transition: all .4s ease;
        }

        .cupom-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 50px rgba(0,0,0,.18);
        }

        .cupom-header {
          padding: 1.6rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #fff;
        }

        .badge-tipo {
          background: rgba(255,255,255,.25);
          padding: 6px 16px;
          border-radius: 999px;
          font-size: .7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .desconto strong {
          font-size: 2.4rem;
          font-weight: 900;
          line-height: 1;
        }

        .desconto small {
          font-size: .7rem;
          letter-spacing: 2px;
          opacity: .9;
        }

        .cupom-body {
          padding: 2rem;
        }

        .descricao {
          font-size: .95rem;
          color: #555;
          margin-bottom: 1.6rem;
        }

        .codigo-box {
          background: #fff;
          border: 2px dashed #e3d5b3;
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.2rem;
        }

        .codigo {
          font-weight: 900;
          letter-spacing: 2px;
          color: #923f45;
          font-size: 1.1rem;
        }

        .btn-copiar {
          border: none;
          background: linear-gradient(135deg,#d4af37,#b9932f);
          color: #fff;
          padding: .45rem 1rem;
          border-radius: 999px;
          font-size: .75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all .3s;
        }

        .btn-copiar:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(0,0,0,.2);
        }

        .btn-copiar.copiado {
          background: linear-gradient(135deg,#198754,#20c997);
        }

        .info {
          font-size: .8rem;
          color: #777;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 768px) {
          .titulo {
            font-size: 1.9rem;
          }
        }
      `}</style>
    </section>
  );
}
