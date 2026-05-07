"use client";

import api from "@/Api/conectar";
import Navbar from "@/components/site/menu/navbar";
import Footer from "@/components/site/Rodape/Footer";
import { useState, useEffect } from "react";


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

      setEnderecos(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar endereços", error);
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
      console.error("Erro ao buscar CEP", error);
    }
  }

  async function cadastrarEndereco(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/usuario/endereco", form);

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

      alert("Endereço cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar endereço", error);
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
      console.error("Erro ao excluir endereço", error);
    }
  }

  async function definirPrincipal(id: number) {
    try {
      await api.put(`/usuario/endereco/${id}/principal`);

      await carregarEnderecos();
    } catch (error) {
      console.error("Erro ao definir endereço principal", error);
    }
  }

  return (
    <>
      <Navbar />

      <main style={styles.main}>
        <div style={styles.container}>
          <h1 style={styles.title}>Meus Endereços</h1>

          <div style={styles.grid}>
            {/* FORM */}
            <div style={styles.card}>
              <h2 style={styles.subtitle}>
                Cadastrar Endereço
              </h2>

              <form
                onSubmit={cadastrarEndereco}
                style={styles.form}
              >
                <div>
                  <label style={styles.label}>CEP</label>

                  <input
                    type="text"
                    value={form.cep}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        cep: e.target.value,
                      });

                      buscarCep(e.target.value);
                    }}
                    placeholder="00000-000"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>
                    Endereço
                  </label>

                  <input
                    type="text"
                    value={form.endereco}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endereco: e.target.value,
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>
                      Número
                    </label>

                    <input
                      type="text"
                      value={form.numero}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          numero: e.target.value,
                        })
                      }
                      style={styles.input}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>
                      Complemento
                    </label>

                    <input
                      type="text"
                      value={form.complemento}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          complemento: e.target.value,
                        })
                      }
                      style={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>
                    Bairro
                  </label>

                  <input
                    type="text"
                    value={form.bairro}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bairro: e.target.value,
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>
                      Cidade
                    </label>

                    <input
                      type="text"
                      value={form.cidade}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cidade: e.target.value,
                        })
                      }
                      style={styles.input}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>
                      Estado
                    </label>

                    <input
                      type="text"
                      value={form.estado}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          estado: e.target.value,
                        })
                      }
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={form.principal === 1}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        principal: e.target.checked ? 1 : 0,
                      })
                    }
                  />

                  <span>Definir como principal</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={styles.button}
                >
                  {loading
                    ? "Salvando..."
                    : "Cadastrar Endereço"}
                </button>
              </form>
            </div>

            {/* LISTA */}
            <div>
              <h2 style={styles.subtitle}>
                Endereços Cadastrados
              </h2>

              <div style={styles.lista}>
                {enderecos.length === 0 && (
                  <div style={styles.empty}>
                    Nenhum endereço cadastrado.
                  </div>
                )}

                {enderecos.map((endereco) => (
                  <div
                    key={endereco.id}
                    style={styles.item}
                  >
                    <div style={styles.itemTop}>
                      <h3 style={styles.itemTitle}>
                        {endereco.endereco},{" "}
                        {endereco.numero}
                      </h3>

                      {endereco.principal === 1 && (
                        <span style={styles.badge}>
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

                    <div style={styles.actions}>
                      {endereco.principal !== 1 && (
                        <button
                          onClick={() =>
                            definirPrincipal(
                              endereco.id
                            )
                          }
                          style={styles.secondaryButton}
                        >
                          Tornar Principal
                        </button>
                      )}

                      <button
                        onClick={() =>
                          excluirEndereco(endereco.id)
                        }
                        style={styles.deleteButton}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

const styles: any = {
  main: {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  title: {
    fontSize: "36px",
    fontWeight: "700",
    marginBottom: "40px",
  },

  subtitle: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "40px",
  },

  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
  },

  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },

  row: {
    display: "flex",
    gap: "16px",
  },

  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  button: {
    background: "#000",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "15px",
  },

  lista: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  empty: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
  },

  item: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },

  itemTitle: {
    fontSize: "20px",
    fontWeight: "600",
  },

  badge: {
    background: "#000",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  },

  secondaryButton: {
    border: "1px solid #000",
    background: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  deleteButton: {
    border: "none",
    background: "#ff3b30",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },
};