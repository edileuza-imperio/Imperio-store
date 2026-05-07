"use client";

import api from "@/Api/conectar";
import { useEffect, useState } from "react";


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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">
        Meus Endereços
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* FORM */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">
            Cadastrar Endereço
          </h2>

          <form
            onSubmit={cadastrarEndereco}
            className="space-y-4"
          >
            <div>
              <label className="block mb-1 text-sm font-medium">
                CEP
              </label>

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
                className="w-full border rounded-xl px-4 py-3"
                placeholder="00000-000"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
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
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
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
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
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
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
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
                className="w-full border rounded-xl px-4 py-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
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
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
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
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
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
              className="w-full bg-black text-white rounded-xl py-3 font-semibold hover:opacity-90 transition"
            >
              {loading
                ? "Salvando..."
                : "Cadastrar Endereço"}
            </button>
          </form>
        </div>

        {/* LISTA */}
        <div>
          <h2 className="text-xl font-semibold mb-6">
            Endereços Cadastrados
          </h2>

          <div className="space-y-4">
            {enderecos.length === 0 && (
              <div className="border rounded-2xl p-6 text-gray-500">
                Nenhum endereço cadastrado.
              </div>
            )}

            {enderecos.map((endereco) => (
              <div
                key={endereco.id}
                className="border rounded-2xl p-5 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">
                    {endereco.endereco},{" "}
                    {endereco.numero}
                  </h3>

                  {endereco.principal === 1 && (
                    <span className="bg-black text-white text-xs px-3 py-1 rounded-full">
                      Principal
                    </span>
                  )}
                </div>

                <p className="text-gray-600">
                  {endereco.bairro}
                </p>

                <p className="text-gray-600">
                  {endereco.cidade} -{" "}
                  {endereco.estado}
                </p>

                <p className="text-gray-600 mb-4">
                  CEP: {endereco.cep}
                </p>

                {endereco.complemento && (
                  <p className="text-gray-600 mb-4">
                    Complemento:{" "}
                    {endereco.complemento}
                  </p>
                )}

                <div className="flex gap-3">
                  {endereco.principal !== 1 && (
                    <button
                      onClick={() =>
                        definirPrincipal(endereco.id)
                      }
                      className="px-4 py-2 rounded-xl border"
                    >
                      Tornar Principal
                    </button>
                  )}

                  <button
                    onClick={() =>
                      excluirEndereco(endereco.id)
                    }
                    className="px-4 py-2 rounded-xl bg-red-500 text-white"
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
  );
}