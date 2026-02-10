'use client';
import { useEffect, useState } from 'react';
import { BiLogIn, BiPencil, BiX } from 'react-icons/bi';
import api from '@/Api/conectar';

interface ConfigLogin {
  id_config: number;
  titulo: string;
  logo: string;
  fundo: string;
  mensagem_personalizada: string;
  tipo_login_id: number;
  statusid: number;
  criado: string;
  atualizado: string;
}

export default function GerenciarLoginPage() {
  const [configs, setConfigs] = useState<ConfigLogin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ConfigLogin | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [previewFundo, setPreviewFundo] = useState<string | null>(null);

  async function carregarConfigs() {
    setLoading(true);
    try {
      const res = await api.get('/admin/configu/login/todas');
      setConfigs(res.data?.dados ?? []);
    } catch (e) {
      console.error('Erro ao carregar configs de login:', e);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarConfigs();
  }, []);

  function abrirModal(cfg: ConfigLogin) {
    setSelectedConfig(cfg);
    setPreviewLogo(cfg.logo);
    setPreviewFundo(cfg.fundo);
    setModalOpen(true);
  }

  function fecharModal() {
    setSelectedConfig(null);
    setModalOpen(false);
    setPreviewLogo(null);
    setPreviewFundo(null);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewLogo(url);
    }
  }

  function handleFundoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPreviewFundo(e.target.value);
  }

  return (
    <div className="gerenciar-page">
      <div className="page-header">
        <h1><BiLogIn size={28} /> Gerenciar Configuração de Login</h1>
      </div>

      {loading ? (
        <p className="info">Carregando configurações...</p>
      ) : configs.length === 0 ? (
        <p className="info">Nenhuma configuração encontrada</p>
      ) : (
        <div className="cards">
          {configs.map(cfg => (
            <div
              key={cfg.id_config}
              className="card-config"
              style={{ background: cfg.fundo || '#fff' }}
            >
              <div className="card-header">
                <img
                  src={cfg.logo}
                  alt="Logo"
                  className="logo"
                  draggable
                  onDragStart={e => e.preventDefault()}
                />
                <button className="edit-btn" onClick={() => abrirModal(cfg)}>
                  <BiPencil size={20} />
                </button>
              </div>
              <h3>{cfg.titulo}</h3>
              <p>{cfg.mensagem_personalizada}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedConfig && (
        <div className="modal-backdrop" onClick={fecharModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Configuração</h2>
              <button className="close-btn" onClick={fecharModal}>
                <BiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <label>Título</label>
              <input type="text" value={selectedConfig.titulo} readOnly />

              <label>Mensagem</label>
              <textarea value={selectedConfig.mensagem_personalizada} readOnly />

              <label>Fundo</label>
              <input
                type="color"
                value={previewFundo || '#ffffff'}
                onChange={handleFundoChange}
              />
              <div
                className="fundo-preview"
                style={{ background: previewFundo || selectedConfig.fundo }}
              >
                Preview do fundo
              </div>

              <label>Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoChange} />
              {previewLogo && (
                <img
                  src={previewLogo}
                  alt="Logo Preview"
                  className="logo modal-logo"
                />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={fecharModal}>Fechar</button>
              {/* Aqui futuramente pode ter botão de salvar */}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .gerenciar-page {
          padding: 20px;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: #f5f7fa;
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: relative;
          z-index: 1;
        }

        .page-header h1 {
          font-size: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #111827;
        }

        .info {
          text-align: center;
          font-size: 16px;
          color: #6b7280;
          padding: 40px;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }

        .card-config {
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: #111827;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }

        .card-config:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 32px rgba(0,0,0,0.12);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
          border-radius: 8px;
          cursor: grab;
        }

        .edit-btn {
          background: #3b82f6;
          border: none;
          color: #fff;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .edit-btn:hover {
          opacity: 0.9;
        }

        .card-config h3 {
          font-size: 18px;
          font-weight: 700;
        }

        .card-config p {
          font-size: 14px;
          color: #6b7280;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .modal {
          background: #fff;
          border-radius: 12px;
          width: 400px;
          max-width: 90%;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 20px;
        }

        .close-btn {
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .modal-body label {
          font-weight: 600;
          font-size: 14px;
          margin-top: 8px;
          display: block;
        }

        .modal-body input[type="text"],
        .modal-body textarea {
          width: 100%;
          padding: 8px;
          margin-top: 4px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          font-size: 14px;
        }

        .fundo-preview {
          height: 80px;
          border-radius: 8px;
          margin-top: 4px;
          border: 1px solid #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 600;
        }

        .modal-logo {
          max-width: 120px;
          max-height: 120px;
          margin-top: 8px;
          border-radius: 8px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
          gap: 10px;
        }

        .btn-close {
          padding: 8px 16px;
          border-radius: 8px;
          background: #3b82f6;
          color: #fff;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-close:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
