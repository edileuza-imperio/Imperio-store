"use client";

import "../../../../components/styles/sistema/cadastrar-produto.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Package,
  ImagePlus,
  Truck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";

import { imagemFundo } from "@/components/Bibioteca/imagem";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.universoimperio.com.br/api/v1";

interface Categoria {
  id_categoria: number;
  nome: string;
}

interface StatusItem {
  id_status: number;
  nome: string;
  codigo: string;
}

export default function CadastrarProdutoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState(1);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [imagens, setImagens] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [form, setForm] = useState({
    nome: "",
    slug: "",
    descricao: "",
    preco: "",
    quantidade: "",
    sku: "",
    marca: "",
    categoria_id: "",
    status_id: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const urls = imagens.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagens]);

  async function carregarDados() {
    try {
      const [categoriasRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/painel/categorias`, { credentials: "include" }),
        fetch(`${API_URL}/painel/status`, { credentials: "include" }),
      ]);

      const categoriasJson = await categoriasRes.json();
      const statusJson = await statusRes.json();

      const categoriasDados = Array.isArray(categoriasJson?.dados)
        ? categoriasJson.dados
        : [];

      const statusDados = Array.isArray(statusJson?.dados)
        ? statusJson.dados
        : [];

      setCategorias(categoriasDados);
      setStatusList(statusDados);

      const statusAtivo = statusDados.find(
        (item: StatusItem) => item.codigo === "ATIVO"
      );

      if (statusAtivo) {
        setForm((old) => ({
          ...old,
          status_id: String(statusAtivo.id_status),
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar categorias e status.");
    }
  }

  function gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function gerarSKU(nome: string) {
    const prefixo = nome.trim().substring(0, 3).toUpperCase().replace(/\s/g, "");
    const numero = Math.floor(100000 + Math.random() * 900000);

    return `${prefixo || "PRO"}-${numero}`;
  }

  function handleChange(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((old) => {
      const updated = { ...old, [name]: value };

      if (name === "nome") {
        updated.slug = gerarSlug(value);
        updated.sku = gerarSKU(value);
      }

      return updated;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files || []);

    if (!arquivos.length) return;

    setImagens((prev) => [...prev, ...arquivos]);
    e.target.value = "";
  }

  function removerImagem(index: number) {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  }

  function validarFormulario() {
    if (imagens.length < 1) {
      alert("Envie pelo menos uma imagem.");
      setEtapa(1);
      return false;
    }

    if (!form.nome.trim()) {
      alert("Preencha o nome.");
      setEtapa(2);
      return false;
    }

    if (!form.preco || Number(form.preco) <= 0) {
      alert("Preencha um preço válido.");
      setEtapa(2);
      return false;
    }

    if (!form.marca.trim()) {
      alert("Preencha a marca.");
      setEtapa(2);
      return false;
    }

    if (!form.categoria_id) {
      alert("Selecione uma categoria.");
      setEtapa(2);
      return false;
    }

    if (!form.status_id) {
      alert("Selecione um status.");
      setEtapa(2);
      return false;
    }

    if (!form.descricao.trim()) {
      alert("Preencha a descrição.");
      setEtapa(3);
      return false;
    }

    return true;
  }

  async function salvar() {
    try {
      if (!validarFormulario()) return;

      setLoading(true);

      const data = new FormData();

      data.append("nome", form.nome.trim());
      data.append("slug", form.slug.trim());
      data.append("descricao", form.descricao.trim());
      data.append("preco", String(form.preco).replace(",", "."));
      data.append("quantidade", form.quantidade || "0");
      data.append("sku", form.sku.trim());
      data.append("marca", form.marca.trim());
      data.append("categoria_id", form.categoria_id);
      data.append("status_id", form.status_id);

      imagens.forEach((arquivo) => {
        data.append("imagens[]", arquivo);
      });

      const response = await fetch(`${API_URL}/painel/produto`, {
        method: "POST",
        body: data,
        credentials: "include",
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw resultado;
      }

      alert(
        resultado?.dados?.mensagem ||
          resultado?.mensagem ||
          "Produto cadastrado com sucesso!"
      );

      router.push("/painel/sistema/produtos");
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);

      alert(
        error?.dados?.mensagem ||
          error?.mensagem ||
          "Erro ao cadastrar produto."
      );
    } finally {
      setLoading(false);
    }
  }

  const progresso = useMemo(() => ((etapa - 1) / 2) * 100, [etapa]);

  return (
    <div className="cad-produto">
      {/* pode manter o resto do seu JSX igual */}
    </div>
  );
}