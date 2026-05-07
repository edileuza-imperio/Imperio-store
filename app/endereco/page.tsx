"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import "./endereco.css";

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

      if (Array.isArray(response.data)) {
        setEnderecos(response.data);
      } else if (Array.isArray(response.data?.dados)) {
        setEnderecos(response.data.dados);
      } else {
        setEnderecos([]);
      }
    } catch (error) {
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
    }
  }

  async function definirPrincipal(id: number) {
    try {
      await api.put(`/usuario/endereco/${id}/principal`);

      await carregarEnderecos();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <Navbar />

      <main className="endereco-page">
        <div className="container-endereco">
          <div className="header-endereco">
            <div>
              <span className="mini-title">
                Minha Conta
              </span>

              <h1>Meus Endereços</h1>

              <p>
                Gerencie seus endereços de entrega para
                finalizar suas compras com mais rapidez.
              </p>
            </div>
          </div>

          <div className="grid-endereco">
            {/* FORM */}
            <div className="card-endereco">
              <div className="card-header">
                <h2>Novo Endereço</h2>

                <span>
                  Preencha os dados abaixo
                </span>
              </div>

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

                <label className="checkbox-group">
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

                  <span>
                    Definir como endereço principal
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-salvar"
                >
                  {loading
                    ? "Salvando..."
                    : "Salvar Endereço"}
                </button>
              </form>
            </div>

            {/* LISTA */}
            <div className="lista-endereco">
              <div className="card-header">
                <h2>Endereços Salvos</h2>

                <span>
                  {enderecos.length} endereço(s)
                  cadastrado(s)
                </span>
              </div>

              {loading && (
                <div className="card-vazio">
                  Carregando endereços...
                </div>
              )}

              {!loading &&
                enderecos.length === 0 && (
                  <div className="card-vazio">
                    <h3>
                      Nenhum endereço encontrado
                    </h3>

                    <p>
                      Cadastre um endereço para
                      continuar suas compras.
                    </p>
                  </div>
                )}

              {Array.isArray(enderecos) &&
                enderecos.map((endereco) => (
                  <div
                    className="item-endereco"
                    key={endereco.id}
                  >
                    <div className="topo-item">
                      <div>
                        <h3>
                          {endereco.endereco},{" "}
                          {endereco.numero}
                        </h3>

                        <span className="cidade">
                          {endereco.cidade} -{" "}
                          {endereco.estado}
                        </span>
                      </div>

                      {endereco.principal === 1 && (
                        <span className="badge-principal">
                          Principal
                        </span>
                      )}
                    </div>

                    <div className="info-endereco">
                      <p>
                        <strong>Bairro:</strong>{" "}
                        {endereco.bairro}
                      </p>

                      <p>
                        <strong>CEP:</strong>{" "}
                        {endereco.cep}
                      </p>

                      {endereco.complemento && (
                        <p>
                          <strong>
                            Complemento:
                          </strong>{" "}
                          {endereco.complemento}
                        </p>
                      )}
                    </div>

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