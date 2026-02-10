'use client';

import { ShoppingBag, MapPin, CreditCard, QrCode, Trash2, Plus, Minus, CheckCircle } from 'lucide-react';
import Navbar from '@/components/site/menu/navbar';
import Footer from '@/components/site/Rodape/Footer';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { useCarrinhoCheckout } from '@/services/useCarrinhoCheckout';


export default function CarrinhoCheckoutPage() {
  const {
    itens,
    loading,
    etapa,
    setEtapa,

    cupomInput,
    setCupomInput,
    cupomAplicado,
    applyingCoupon,
    aplicarCupom,

    alterarQuantidade,
    removerItem,

    cep,
    setCep,
    rua,
    setRua,
    numero,
    setNumero,
    complemento,
    setComplemento,
    bairro,
    setBairro,
    cidade,
    setCidade,
    estado,
    setEstado,
    cepLoading,
    buscarCepAuto,

    metodoPagamento,
    setMetodoPagamento,
    pixPayload,
    processingPayment,
    finalizarPedido,

    cardName,
    setCardName,
    cardNumber,
    onCardNumberChange,
    cardExpiry,
    setCardExpiry,
    cardCVV,
    setCardCVV,

    copyToClipboard,

    subtotal,
    descontoValor,
    total,

    isCardValid,
    maskExpiry,
    getImagemUrl
  } = useCarrinhoCheckout();

  if (loading) {
    return (
      <div className="container text-center my-5">
        <div className="spinner-border text-warning" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <ToastContainer />

      <style jsx>{`
        :root {
          --rosa-queimado: #b76e79;
          --dourado: #c9a24d;
          --bg: #faf8f6;
        }
        body { background: var(--bg); }
        .card-box { background: #fff; border-radius: 18px; padding: 20px; box-shadow: 0 12px 36px rgba(0,0,0,0.08); }
        .summary { background: linear-gradient(180deg, rgba(201,162,77,0.06), rgba(183,110,121,0.02)); border-radius: 16px; padding: 18px; }
        .price { color: var(--rosa-queimado); font-weight: 700; }
        .btn-gold { background: linear-gradient(135deg, var(--dourado), #b8923a); color: #fff; border: none; border-radius: 12px; }
        .btn-ghost-gold { background: transparent; color: var(--dourado); border: 1px solid rgba(201,162,77,0.25); border-radius: 12px; }
        .product-img { width: 84px; height: 84px; border-radius: 12px; object-fit: cover; border: 1px solid #eee; }
        .small-muted { color: #6b6b6b; font-size: 0.9rem; }
        .input-pill { border-radius: 12px; padding: 12px; }
        .card-input { border-radius: 12px; padding: 10px 12px; border: 1px solid #e8e8e8; }
        .label-strong { font-weight: 700; color: #333; }
      `}</style>

      <main className="container my-5">
        <div className="row g-4">
          {/* LEFT */}
          <div className="col-lg-8">
            {/* Step: Cart */}
            {etapa === 1 && (
              <div className="card-box">
                <h4 className="mb-3">
                  <ShoppingBag className="me-2" /> Seu Carrinho
                </h4>

                {itens.length === 0 && <div className="alert alert-warning">Seu carrinho está vazio</div>}

                {itens.map(item => (
                  <div key={item.id_item} className="d-flex align-items-center gap-3 mb-3">
                    <img src={getImagemUrl(item.imagem)} alt={item.nome_produto} className="product-img" />
                    <div className="flex-grow-1">
                      <div className="label-strong">{item.nome_produto}</div>
                      <div className="small-muted">R$ {Number(item.preco_unitario).toFixed(2)}</div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button className="btn btn-outline-secondary" onClick={() => alterarQuantidade(item.id_item, item.quantidade - 1)}>
                        <Minus size={14} />
                      </button>
                      <div className="px-2">{item.quantidade}</div>
                      <button className="btn btn-outline-secondary" onClick={() => alterarQuantidade(item.id_item, item.quantidade + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>

                    <button className="btn btn-link text-danger" onClick={() => removerItem(item.id_item)}>
                      <Trash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Step: Address */}
            {etapa === 2 && (
              <div className="card-box">
                <h4 className="mb-3">
                  <MapPin className="me-2" /> Endereço de Entrega
                </h4>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label label-strong">CEP</label>
                    <input
                      className="form-control input-pill"
                      placeholder="00000000"
                      value={cep}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setCep(digits);
                        if (digits.length === 8) buscarCepAuto(digits);
                      }}
                      onBlur={() => { if (cep.length === 8) buscarCepAuto(cep); }}
                    />
                    {cepLoading && <div className="form-text small-muted">Buscando CEP...</div>}
                  </div>

                  <div className="col-md-8">
                    <label className="form-label label-strong">Rua</label>
                    <input className="form-control input-pill" placeholder="Rua, Avenida..." value={rua} onChange={e => setRua(e.target.value)} />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label label-strong">Número</label>
                    <input className="form-control input-pill" value={numero} onChange={e => setNumero(e.target.value)} />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label label-strong">Complemento</label>
                    <input className="form-control input-pill" value={complemento} onChange={e => setComplemento(e.target.value)} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label label-strong">Bairro</label>
                    <input className="form-control input-pill" value={bairro} onChange={e => setBairro(e.target.value)} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label label-strong">Cidade</label>
                    <input className="form-control input-pill" value={cidade} onChange={e => setCidade(e.target.value)} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label label-strong">Estado</label>
                    <select className="form-select input-pill" value={estado} onChange={e => setEstado(e.target.value)}>
                      <option>SP</option>
                      <option>RJ</option>
                      <option>MG</option>
                      <option>BA</option>
                      <option>PR</option>
                    </select>
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <button className="btn btn-outline-secondary" onClick={() => setEtapa(1)}>
                    Voltar
                  </button>
                  <button className="btn btn-gold" onClick={() => setEtapa(3)}>
                    Ir para Pagamento
                  </button>
                </div>
              </div>
            )}

            {/* Step: Payment */}
            {etapa === 3 && (
              <div className="card-box">
                <h4 className="mb-3">
                  <CreditCard className="me-2" /> Pagamento
                </h4>

                <div className="mb-3">
                  <div className="d-flex gap-2">
                    <button className={metodoPagamento === 'pix' ? 'btn btn-gold' : 'btn btn-ghost-gold'} onClick={() => setMetodoPagamento('pix')}>
                      <QrCode className="me-2" /> Pix
                    </button>
                    <button className={metodoPagamento === 'cartao' ? 'btn btn-gold' : 'btn btn-ghost-gold'} onClick={() => setMetodoPagamento('cartao')}>
                      <CreditCard className="me-2" /> Cartão
                    </button>
                  </div>
                </div>

                {metodoPagamento === 'pix' && (
                  <div className="text-center">
                    <div className="mb-3">
                      {pixPayload?.qrUrl ? (
                        <img src={pixPayload.qrUrl} alt="QR Pix" style={{ width: 220 }} />
                      ) : (
                        <div style={{ width: 220, height: 220, borderRadius: 12, background: '#f5f5f5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={72} />
                        </div>
                      )}
                    </div>

                    <div className="mb-2 small-muted">Copiar código Pix</div>
                    <div className="d-flex gap-2 align-items-center justify-content-center">
                      <input className="form-control" style={{ maxWidth: 320 }} readOnly value={pixPayload?.payload || '000201...exemplo-pix-copia-cola'} />
                      <button className="btn btn-outline-secondary" onClick={() => copyToClipboard(pixPayload?.payload)}>Copiar</button>
                    </div>
                  </div>
                )}

                {metodoPagamento === 'cartao' && (
                  <div className="row g-3 mb-3">
                    <div className="col-12">
                      <label className="form-label label-strong">Nome no cartão</label>
                      <input className="form-control card-input" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Como escrito no cartão" />
                    </div>

                    <div className="col-12">
                      <label className="form-label label-strong">Número do cartão</label>
                      <input
                        className="form-control card-input"
                        value={cardNumber}
                        onChange={e => onCardNumberChange(e.target.value)}
                        inputMode="numeric"
                        placeholder="4242 4242 4242 4242"
                      />
                      {!isCardValid() && cardNumber.length > 0 && (
                        <div className="form-text text-danger">Número de cartão inválido</div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label label-strong">Validade (MM/YY)</label>
                      <input className="form-control card-input" value={cardExpiry} onChange={e => setCardExpiry(maskExpiry(e.target.value))} placeholder="MM/YY" />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label label-strong">CVV</label>
                      <input className="form-control card-input" value={cardCVV} onChange={e => setCardCVV(e.target.value.replace(/\D/g, '').slice(0,4))} placeholder="123" />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label label-strong">Parcelas</label>
                      <select className="form-select card-input">
                        <option value="1">1x (à vista)</option>
                        <option value="2">2x sem juros</option>
                        <option value="3">3x sem juros</option>
                        <option value="6">6x</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-3">
                  <button className="btn btn-outline-secondary" onClick={() => setEtapa(2)}>Voltar</button>
                  <button className="btn btn-gold" onClick={finalizarPedido} disabled={processingPayment || (metodoPagamento === 'cartao' && !isCardValid())}>
                    {processingPayment ? 'Processando...' : 'Finalizar Pedido'}
                  </button>
                </div>
              </div>
            )}

            {etapa === 4 && (
              <div className="card-box text-center">
                <CheckCircle size={64} className="text-success mb-3" />
                <h3>Pedido Confirmado</h3>
                <p className="small-muted">Você receberá por e-mail os detalhes do pedido.</p>
                <div className="mt-3">
                  <button className="btn btn-ghost-gold me-2" onClick={() => { setEtapa(1); window.location.href = '/home'; }}>
                    Voltar à loja
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SUMMARY */}
          <div className="col-lg-4">
            <div className="summary card-box summary">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <div className="small-muted">Resumo</div>
                  <div className="label-strong">Itens: {itens.length}</div>
                </div>
                <div className="price">R$ {subtotal.toFixed(2)}</div>
              </div>

              {cupomAplicado ? (
                <div className="mb-2 p-2" style={{ background: 'rgba(183,110,121,0.06)', borderRadius: 8 }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="label-strong">{cupomAplicado.codigo}</div>
                      <div className="small-muted">{cupomAplicado.descricao || (cupomAplicado.tipo === 'percentual' ? `${cupomAplicado.valor}% off` : `R$ ${cupomAplicado.valor.toFixed(2)} off`)}</div>
                    </div>
                    <div className="text-success">-R$ {descontoValor.toFixed(2)}</div>
                  </div>
                </div>
              ) : (
                <div className="mb-2">
                  <div className="input-group">
                    <input value={cupomInput} onChange={e => setCupomInput(e.target.value)} className="form-control input-pill" placeholder="Tem um cupom?" />
                    <button className="btn btn-outline-secondary" onClick={aplicarCupom} disabled={applyingCoupon}>
                      {applyingCoupon ? 'Validando...' : 'Aplicar'}
                    </button>
                  </div>
                </div>
              )}

              <hr />

              <div className="d-flex justify-content-between"><div className="small-muted">Subtotal</div><div>R$ {subtotal.toFixed(2)}</div></div>
              {descontoValor > 0 && <div className="d-flex justify-content-between text-success"><div className="small-muted">Desconto</div><div>-R$ {descontoValor.toFixed(2)}</div></div>}
              <div className="d-flex justify-content-between mt-3"><div className="label-strong">Total</div><div className="price">R$ {total.toFixed(2)}</div></div>

              <div className="mt-3">
                {etapa < 3 ? (
                  <button className="btn btn-gold w-100" onClick={() => setEtapa((etapa + 1) as any)}>Continuar</button>
                ) : (
                  <button className="btn btn-gold w-100" onClick={finalizarPedido} disabled={processingPayment || (metodoPagamento === 'cartao' && !isCardValid())}>
                    {processingPayment ? 'Processando...' : 'Finalizar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
