"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";


interface Endereco {
  id: number;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: number;
}

export default function EnderecoPage() {
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    principal: 0,
  });

  async function carregarEnderecos() {
    try {
      setLoading(true);

      const response = await api.get("/usuario/endereco");

      console.log("ENDEREÇOS:", response.data);

      if (Array.isArray(response.data)) {
        setEnderecos(response.data);
      } else if (Array.isArray(response.data?.dados)) {
        setEnderecos(response.data.dados);
      } else {
        setEnderecos([]);
      }
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);
      setEnderecos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarEnderecos();
  }, []);

  async function buscarCep(cep: string) {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );

      const data = await response.json();

      if (data.erro) return;

      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }));
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  }

  async function cadastrarEndereco(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/usuario/endereco", form);

      alert("Endereço cadastrado com sucesso!");

      setForm({
        cep: "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        principal: 0,
      });

      await carregarEnderecos();
    } catch (error) {
      console.error("Erro ao cadastrar endereço:", error);
      alert("Erro ao cadastrar endereço");
    } finally {
      setLoading(false);
    }
  }

  async function excluirEndereco(id: number) {
    const confirmar = confirm(
      "Deseja realmente excluir este endereço?"
    );

    if (!confirmar) return;

    try {
      await api.delete(`/usuario/endereco/${id}`);

      await carregarEnderecos();
    } catch (error) {
      console.error("Erro ao excluir endereço:", error);
    }
  }

  async function definirPrincipal(id: number) {
    try {
      await api.put(`/usuario/endereco/${id}/principal`);

      await carregarEnderecos();
    } catch (error) {
      console.error(
        "Erro ao definir endereço principal:",
        error
      );
    }
  }

  return (
    <>
      <Navbar />

      <main className="endereco-page">
        <div className="container-endereco">
          <h1 className="titulo-page">
            Meus Endereços
          </h1>

          <div className="grid-endereco">
            {/* FORM */}
            <div className="card-endereco">
              <h2>Cadastrar Endereço</h2>

              <form onSubmit={cadastrarEndereco}>
                <div className="form-group">
                  <label>CEP</label>

                  <input
                    type="text"
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        cep: e.target.value,
                      });

                      buscarCep(e.target.value);
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Endereço</label>

                  <input
                    type="text"
                    value={form.endereco}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endereco: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="duplo">
                  <div className="form-group">
                    <label>Número</label>

                    <input
                      type="text"
                      value={form.numero}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          numero: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Complemento</label>

                    <input
                      type="text"
                      value={form.complemento}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          complemento: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Bairro</label>

                  <input
                    type="text"
                    value={form.bairro}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bairro: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="duplo">
                  <div className="form-group">
                    <label>Cidade</label>

                    <input
                      type="text"
                      value={form.cidade}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cidade: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Estado</label>

                    <input
                      type="text"
                      value={form.estado}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          estado: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={form.principal === 1}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        principal: e.target.checked
                          ? 1
                          : 0,
                      })
                    }
                  />

                  <span>Definir como principal</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-salvar"
                >
                  {loading
                    ? "Salvando..."
                    : "Cadastrar Endereço"}
                </button>
              </form>
            </div>

            {/* LISTA */}
            <div className="lista-endereco">
              <h2>Endereços Cadastrados</h2>

              {loading && (
                <div className="card-vazio">
                  Carregando...
                </div>
              )}

              {!loading &&
                enderecos.length === 0 && (
                  <div className="card-vazio">
                    Nenhum endereço cadastrado.
                  </div>
                )}

              {Array.isArray(enderecos) &&
                enderecos.map((endereco) => (
                  <div
                    className="item-endereco"
                    key={endereco.id}
                  >
                    <div className="topo-item">
                      <h3>
                        {endereco.endereco},{" "}
                        {endereco.numero}
                      </h3>

                      {endereco.principal === 1 && (
                        <span className="badge-principal">
                          Principal
                        </span>
                      )}
                    </div>

                    <p>{endereco.bairro}</p>

                    <p>
                      {endereco.cidade} -{" "}
                      {endereco.estado}
                    </p>

                    <p>CEP: {endereco.cep}</p>

                    {endereco.complemento && (
                      <p>
                        Complemento:{" "}
                        {endereco.complemento}
                      </p>
                    )}

                    <div className="acoes">
                      {endereco.principal !== 1 && (
                        <button
                          className="btn-principal"
                          onClick={() =>
                            definirPrincipal(
                              endereco.id
                            )
                          }
                        >
                          Tornar Principal
                        </button>
                      )}

                      <button
                        className="btn-excluir"
                        onClick={() =>
                          excluirEndereco(endereco.id)
                        }
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}