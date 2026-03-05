"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

type Campanha = {
    id_campanha: number;
    titulo: string;
    slug: string;
    descricao?: string;
    statusid?: number;
};

type Produto = {
    id_destaque: number;
    produto_nome: string;
    produto_slug: string;
    produto_descricao?: string;
    produto_preco: string;
    produto_imagem?: string;
};

function getImagemUrl(caminho?: string) {
    if (!caminho) return "";
    const base = api.defaults.baseURL || "";
    const clean = caminho.replace(/^\/+/, "");
    return `${base}/${clean}`;
}

function formatMoney(value: any) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

export default function DestaquesSection() {

    const [campanha, setCampanha] = useState<Campanha | null>(null);
    const [produtos, setProdutos] = useState<Produto[]>([]);

    async function carregar() {

        const resCamp = await api.get("/admin/campanhas");
        const campanhas = resCamp.data.dados.campanhas;

        const destaque = campanhas.find(
            (c: Campanha) => c.statusid === 3
        );

        setCampanha(destaque);

        const resProd = await api.get("/admin/produtos/destaques");
        setProdutos(resProd.data.dados);
    }

    useEffect(() => {
        carregar();
    }, []);

    return (

        <section className="py-5" style={{ background: "#f3ebe3" }}>

            <div className="container">

                {/* CAMPANHA */}

                {campanha && (

                    <div className="text-center mb-5">

                        <span
                            className="badge mb-2"
                            style={{ background: "#d77c7c" }}
                        >
                            Campanha
                        </span>

                        <h1 className="fw-bold">
                            {campanha.titulo}
                        </h1>

                        <p className="text-muted">
                            {campanha.descricao}
                        </p>

                        <Link
                            href={`/campanha/${campanha.slug}`}
                            className="btn text-white"
                            style={{ background: "#c78c5c" }}
                        >
                            Ver catálogo
                        </Link>

                    </div>

                )}

                {/* PRODUTOS */}

                <div className="row g-4">

                    {produtos.map((p) => {

                        const img = getImagemUrl(p.produto_imagem);

                        return (

                            <div key={p.id_destaque} className="col-md-6 col-lg-4">

                                <div className="card border-0 shadow-sm h-100 rounded-4">

                                    <div className="position-relative">

                                        <img
                                            src={img}
                                            className="card-img-top rounded-top-4"
                                            style={{ height: "220px", objectFit: "cover" }}
                                        />

                                        <span
                                            className="badge position-absolute"
                                            style={{
                                                top: "10px",
                                                left: "10px",
                                                background: "#c78c5c"
                                            }}
                                        >
                                            Destaque
                                        </span>

                                    </div>

                                    <div className="card-body d-flex flex-column">

                                        <h5 className="card-title fw-semibold">
                                            {p.produto_nome}
                                        </h5>

                                        <p className="text-muted small">
                                            {p.produto_descricao}
                                        </p>

                                        <div
                                            className="fw-bold fs-5 mb-3"
                                            style={{ color: "#c78c5c" }}
                                        >
                                            {formatMoney(p.produto_preco)}
                                        </div>

                                        <div className="d-flex gap-2 mt-auto">

                                            <Link
                                                href={`/produto/${p.produto_slug}`}
                                                className="btn btn-outline-secondary w-100"
                                            >
                                                Detalhes
                                            </Link>

                                            <button
                                                className="btn w-100 text-white"
                                                style={{ background: "#c78c5c" }}
                                            >
                                                Adicionar
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        )

                    })}

                </div>

            </div>

        </section>

    );
}