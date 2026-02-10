'use client';

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/Api/conectar";

interface Produto {
  id_produto: number;
  nome: string;
  slug: string;
  descricao?: string;
  preco?: number;
  estoque?: number;
  statusid?: number;
  imagem?: string;
}

interface Status {
  id_status: number;
  nome: string;
  codigo: string;
  descricao?: string;
}

export default function PaginaProduto() {
  const params = useParams();
  const slug = params.slug as string;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editProduto, setEditProduto] = useState<Partial<Produto>>({});
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 🔹 Carregar produto pelo slug
  useEffect(() => {
    if (!slug) return;
    const slugDecodificado = decodeURIComponent(slug);

    api.get(`/admin/produto/${slugDecodificado}`)
      .then(res => {
        console.log("[GET PRODUTO] Response completa:", res);
        if (res.data?.dados) {
          const p: Produto = { ...res.data.dados, preco: Number(res.data.dados.preco) };
          setProduto(p);
          setEditProduto({ ...p });
        } else {
          setErro("Produto não encontrado");
        }
      })
      .catch(err => {
        console.error("[GET PRODUTO] Erro ao carregar produto:", err);
        setErro("Erro ao carregar produto");
      });
  }, [slug]);

  // 🔹 Carregar status
  useEffect(() => {
    api.get("/admin/status")
      .then(res => {
        console.log("[GET STATUS] Response completa:", res);
        setStatusList(res.data.dados || []);
      })
      .catch(err => console.error("[GET STATUS] Erro:", err));
  }, []);

  // 🔹 Salvar alterações (FormData para imagem)
  const handleSave = () => {
    if (!produto) return;

    const formData = new FormData();
    if (editProduto.nome) formData.append("nome", editProduto.nome);
    formData.append("preco", String(editProduto.preco ?? 0));
    formData.append("estoque", String(editProduto.estoque ?? 0));
    if (editProduto.descricao) formData.append("descricao", editProduto.descricao);
    formData.append("statusid", String(editProduto.statusid ?? 1));
    if (selectedFile) formData.append("imagem", selectedFile);

    console.log("[PUT PRODUTO] Dados enviados:", Object.fromEntries(formData.entries()));

    api.put(`/admin/produtos/${produto.id_produto}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(res => {
      console.log("[PUT PRODUTO] Response completa:", res);
      if (res.data?.dados) {
        setProduto(res.data.dados);
        setEditProduto({ ...res.data.dados });
        setEditMode(false);
        setSelectedFile(null);
      } else {
        console.warn("[PUT PRODUTO] Nenhum dado retornado pelo backend");
      }
    })
    .catch(err => {
      console.error("[PUT PRODUTO] Erro ao salvar alterações:", err);
      alert("Erro ao salvar alterações");
    });
  };

  // 🔹 Alterar imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setEditProduto({ ...editProduto, imagem: reader.result as string });
      };
      reader.readAsDataURL(file);
      console.log("Imagem selecionada:", file);
    }
  };

  // 🔹 Alternar status
  const toggleStatus = () => {
    if (!statusList.length) return;
    const currentIndex = statusList.findIndex(s => s.id_status === editProduto.statusid);
    const nextIndex = (currentIndex + 1) % statusList.length;
    setEditProduto({ ...editProduto, statusid: statusList[nextIndex].id_status });
    console.log("Status alterado para:", statusList[nextIndex]);
  };

  return (
    <div className="container my-5 d-flex justify-content-center">
      {erro && <div className="alert alert-danger w-100 text-center">{erro}</div>}

      {produto && (
        <div className="produto-card p-4 d-flex flex-column flex-md-row gap-4 shadow-sm rounded-3 w-100" style={{ maxWidth: '900px' }}>
          
          {/* Imagem */}
          <div className="col-md-6 d-flex justify-content-center align-items-center flex-column">
            <img
              src={editProduto.imagem || produto.imagem || "/placeholder.png"}
              alt={produto.nome}
              className="img-fluid rounded mb-2"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
            {editMode && (
              <input
                type="file"
                className="form-control form-control-sm"
                onChange={handleImageChange}
              />
            )}
          </div>

          {/* Informações */}
          <div className="col-md-6 d-flex flex-column justify-content-between">
            <div>
              {editMode ? (
                <>
                  <input
                    className="form-control edit-input mb-2"
                    value={editProduto.nome || ""}
                    onChange={e => setEditProduto({ ...editProduto, nome: e.target.value })}
                    placeholder="Nome do produto"
                  />
                  <input
                    type="number"
                    className="form-control edit-input mb-2"
                    value={editProduto.preco ?? 0}
                    onChange={e => setEditProduto({ ...editProduto, preco: Number(e.target.value) })}
                    placeholder="Preço"
                  />
                  <input
                    type="number"
                    className="form-control edit-input mb-2"
                    value={editProduto.estoque ?? 0}
                    onChange={e => setEditProduto({ ...editProduto, estoque: Number(e.target.value) })}
                    placeholder="Estoque"
                  />
                  <textarea
                    className="form-control edit-input mb-2"
                    value={editProduto.descricao || ""}
                    onChange={e => setEditProduto({ ...editProduto, descricao: e.target.value })}
                    placeholder="Descrição"
                    rows={4}
                  />

                  <div className="mb-2 d-flex align-items-center gap-2">
                    <label className="form-label mb-0">Status:</label>
                    <button
                      className={`btn btn-sm ${
                        statusList.find(s => s.id_status === editProduto.statusid)?.codigo === 'ATIVO'
                          ? 'btn-success'
                          : 'btn-secondary'
                      }`}
                      onClick={toggleStatus}
                    >
                      {statusList.find(s => s.id_status === editProduto.statusid)?.nome || '—'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h1>{produto.nome}</h1>
                  <h4 className="text-success">R$ {(produto.preco ?? 0).toFixed(2)}</h4>
                  <p>Estoque: <span className="fw-medium">{produto.estoque ?? 0}</span></p>
                  <p>
                    Status:{" "}
                    <span className={`badge-status ${produto.statusid === 1 ? 'badge-ativo' : 'badge-inativo'}`}>
                      {statusList.find(s => s.id_status === produto.statusid)?.nome || (produto.statusid === 1 ? 'Ativo' : 'Inativo')}
                    </span>
                  </p>
                  {produto.descricao && (
                    <>
                      <h5>Descrição:</h5>
                      <p>{produto.descricao}</p>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="mt-3 d-flex gap-2">
              {editMode ? (
                <>
                  <button className="btn btn-success" onClick={handleSave}>
                    <i className="bi bi-check2"></i> Salvar
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setEditMode(false); setEditProduto(produto); setSelectedFile(null); }}>
                    <i className="bi bi-x"></i> Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline-primary" title="Editar" onClick={() => setEditMode(true)}>
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button className="btn btn-outline-danger" title="Deletar">
                    <i className="bi bi-trash"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .produto-card {
          background-color: #FFF8F0;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .produto-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.1);
        }
        .badge-status {
          font-weight: 500;
          padding: 0.3rem 0.6rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }
        .badge-ativo {
          background-color: #28a745;
          color: #fff;
        }
        .badge-inativo {
          background-color: #6c757d;
          color: #fff;
        }
        .edit-input {
          background-color: transparent;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 6px 10px;
          transition: border-color 0.2s;
        }
        .edit-input:focus {
          outline: none;
          border-color: #0d6efd;
          box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.2);
        }
        @media (max-width: 768px) {
          .produto-card {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
