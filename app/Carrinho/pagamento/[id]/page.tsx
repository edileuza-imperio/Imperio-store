/* =========================================================
   NOVO LAYOUT PREMIUM CHECKOUT
   VISUAL IGUAL AO PRINT DA IMAGEM
========================================================= */

return (
  <>
    <Navbar />

    <main className="checkoutPage">
      <div className="checkoutContainer">
        {/* LEFT */}
        <section className="checkoutHero">
          <div className="secureBadge">
            <FiLock />
            <span>Pagamento seguro</span>
          </div>

          <div className={`heroStatus ${statusClass}`}>
            {statusLabel}
          </div>

          <h1>
            Finalizar
            <br />
            pagamento
          </h1>

          <p>
            Escolha PIX ou cartão e conclua sua compra
            com uma interface moderna, limpa e profissional.
          </p>
        </section>

        {/* CENTER */}
        <section className="paymentArea">
          <div className="paymentCard">
            <span className="miniTitle">CHECKOUT</span>

            <h2>Pagamento do pedido</h2>

            <p>
              Fluxo direto, visual minimalista
              e foco total na conversão.
            </p>

            {/* CLIENTE */}
            <div className="customerBox">
              <div className="customerTitle">
                <FiUser />
                <span>Cliente</span>
              </div>

              <div className="customerContent">
                <div className="avatar">
                  <Image
                    src="/images/sem-imagem.png"
                    alt="Usuário"
                    width={52}
                    height={52}
                  />
                </div>

                <div className="customerInfo">
                  <strong>{usuario?.nome}</strong>
                  <span>{usuario?.email}</span>
                  <small>CPF: {usuario?.cpf}</small>
                </div>
              </div>
            </div>

            {/* TABS */}
            <div className="methodSwitch">
              <button
                className={metodo === "pix" ? "active" : ""}
                onClick={() => setMetodo("pix")}
              >
                <FiSmartphone />
                PIX
              </button>

              <button
                className={metodo === "cartao" ? "active" : ""}
                onClick={() => setMetodo("cartao")}
              >
                <FiCreditCard />
                Cartão
              </button>
            </div>

            {/* PIX */}
            {metodo === "pix" && (
              <div className="pixArea">
                {!pixCode ? (
                  <>
                    <button
                      className="generatePix"
                      onClick={gerarPix}
                    >
                      {loadingPix
                        ? "Gerando PIX..."
                        : "Gerar pagamento PIX"}
                    </button>

                    <div className="pixPlaceholder">
                      <FiClock size={34} />
                      <span>
                        Gere o PIX para visualizar
                        o QR Code.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="qrBox">
                      <QRCodeCanvas
                        value={pixCode}
                        size={220}
                      />
                    </div>

                    <textarea
                      className="pixCode"
                      value={pixCode}
                      readOnly
                    />

                    <div className="pixButtons">
                      <button
                        className="copyButton"
                        onClick={copiarPix}
                      >
                        <FiCopy />
                        {copiado
                          ? "Copiado"
                          : "Copiar código"}
                      </button>

                      <button
                        className="confirmButton"
                        onClick={() =>
                          verificarPagamentoNoServidor(false)
                        }
                      >
                        <FiCheckCircle />
                        Já paguei
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* CARTÃO */}
            {metodo === "cartao" && (
              <div className="cardForm">
                <input
                  placeholder="Número do cartão"
                  value={cartao.numero}
                  onChange={(e) =>
                    setCartao({
                      ...cartao,
                      numero: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Nome do titular"
                  value={cartao.nome}
                  onChange={(e) =>
                    setCartao({
                      ...cartao,
                      nome: e.target.value,
                    })
                  }
                />

                <div className="tripleGrid">
                  <input
                    placeholder="MM"
                    value={cartao.mes}
                    onChange={(e) =>
                      setCartao({
                        ...cartao,
                        mes: e.target.value,
                      })
                    }
                  />

                  <input
                    placeholder="AA"
                    value={cartao.ano}
                    onChange={(e) =>
                      setCartao({
                        ...cartao,
                        ano: e.target.value,
                      })
                    }
                  />

                  <input
                    placeholder="CVV"
                    value={cartao.cvv}
                    onChange={(e) =>
                      setCartao({
                        ...cartao,
                        cvv: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  className="payButton"
                  onClick={pagarCartao}
                >
                  Pagar agora
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT */}
        <aside className="summaryArea">
          <div className="summaryCard">
            <div className="summaryHeader">
              <FiClock />

              <div>
                <strong>Resumo do pedido</strong>
                <p>Informações rápidas.</p>
              </div>
            </div>

            <div className="summaryItem">
              <span>Pedido</span>
              <strong>#{pedido.id_pedido}</strong>
            </div>

            <div className="summaryItem">
              <span>Total</span>
              <strong>
                {formatarMoeda(pedido.valor_total)}
              </strong>
            </div>

            <div className="summaryItem">
              <span>Status</span>
              <strong>{statusLabel}</strong>
            </div>
          </div>

          <div className="infoCardSide">
            <FiAlertCircle />

            <div>
              <strong>Dica importante</strong>

              <p>
                O botão “Já paguei” apenas consulta
                o backend e aguarda confirmação.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .checkoutPage {
          min-height: 100vh;
          background: #f5f5f7;
          padding: 120px 30px 60px;
        }

        .checkoutContainer {
          max-width: 1380px;
          margin: 0 auto;

          display: grid;
          grid-template-columns: 1fr 520px 320px;
          gap: 24px;
          align-items: start;
        }

        /* LEFT */

        .checkoutHero {
          background: #fff;
          border-radius: 32px;
          padding: 40px;
          min-height: 760px;
          border: 1px solid #ececec;

          display: flex;
          flex-direction: column;
        }

        .secureBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          width: fit-content;

          padding: 10px 16px;

          border-radius: 999px;

          background: #f3f4f6;

          font-size: 13px;
          font-weight: 700;
        }

        .heroStatus {
          margin-top: 18px;

          width: fit-content;

          padding: 12px 18px;

          border-radius: 999px;

          font-size: 13px;
          font-weight: 700;
        }

        .checkoutHero h1 {
          margin-top: 34px;

          font-size: 64px;
          line-height: 0.95;
          letter-spacing: -4px;

          color: #0f172a;
        }

        .checkoutHero p {
          margin-top: 24px;

          max-width: 420px;

          color: #64748b;
          font-size: 17px;
          line-height: 1.7;
        }

        /* CENTER */

        .paymentCard {
          background: #fff;

          border-radius: 32px;

          padding: 30px;

          border: 1px solid #ececec;
        }

        .miniTitle {
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.12em;
        }

        .paymentCard h2 {
          margin-top: 12px;
          font-size: 40px;
          line-height: 1;
          letter-spacing: -2px;
        }

        .paymentCard p {
          margin-top: 12px;
          color: #64748b;
          line-height: 1.6;
        }

        .customerBox {
          margin-top: 28px;

          padding: 20px;

          border-radius: 24px;

          background: #fafafa;
          border: 1px solid #ececec;
        }

        .customerTitle {
          display: flex;
          align-items: center;
          gap: 8px;

          font-size: 13px;
          font-weight: 700;

          margin-bottom: 18px;
        }

        .customerContent {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .avatar {
          width: 54px;
          height: 54px;

          overflow: hidden;

          border-radius: 18px;
        }

        .customerInfo {
          display: flex;
          flex-direction: column;
        }

        .customerInfo strong {
          font-size: 16px;
        }

        .customerInfo span,
        .customerInfo small {
          color: #64748b;
          font-size: 13px;
        }

        /* METHODS */

        .methodSwitch {
          margin-top: 28px;

          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .methodSwitch button {
          height: 58px;

          border-radius: 18px;

          border: 1px solid #dcdcdc;

          background: #fff;

          font-weight: 700;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          cursor: pointer;
        }

        .methodSwitch .active {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }

        /* PIX */

        .pixArea {
          margin-top: 24px;

          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .generatePix,
        .payButton {
          height: 58px;

          border: none;

          border-radius: 18px;

          background: #0f172a;

          color: #fff;

          font-size: 15px;
          font-weight: 700;

          cursor: pointer;
        }

        .pixPlaceholder {
          min-height: 260px;

          border-radius: 28px;

          border: 2px dashed #d6d6d6;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 14px;

          color: #64748b;

          text-align: center;
        }

        .qrBox {
          background: #fff;

          border-radius: 28px;

          padding: 30px;

          display: flex;
          justify-content: center;

          border: 1px solid #ececec;
        }

        .pixCode {
          width: 100%;
          min-height: 120px;

          border-radius: 20px;

          border: 1px solid #e4e4e7;

          padding: 18px;

          resize: none;
        }

        .pixButtons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .copyButton,
        .confirmButton {
          height: 56px;

          border: none;

          border-radius: 18px;

          color: #fff;

          font-weight: 700;

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .copyButton {
          background: #0f172a;
        }

        .confirmButton {
          background: #16a34a;
        }

        /* CARD */

        .cardForm {
          margin-top: 24px;

          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cardForm input {
          height: 56px;

          border-radius: 18px;

          border: 1px solid #ddd;

          padding: 0 18px;

          font-size: 15px;
        }

        .tripleGrid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        /* RIGHT */

        .summaryArea {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .summaryCard,
        .infoCardSide {
          background: #fff;

          border-radius: 28px;

          padding: 24px;

          border: 1px solid #ececec;
        }

        .summaryHeader {
          display: flex;
          gap: 12px;

          margin-bottom: 20px;
        }

        .summaryHeader p {
          color: #64748b;
          font-size: 13px;
        }

        .summaryItem {
          display: flex;
          justify-content: space-between;

          margin-top: 18px;

          font-size: 14px;
        }

        .summaryItem strong {
          color: #0f172a;
        }

        .infoCardSide {
          display: flex;
          gap: 12px;
        }

        .infoCardSide p {
          margin-top: 8px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }

        /* STATUS */

        .pending {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
        }

        .ok {
          background: #ecfdf3;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        /* RESPONSIVE */

        @media (max-width: 1200px) {
          .checkoutContainer {
            grid-template-columns: 1fr;
          }

          .checkoutHero {
            min-height: auto;
          }
        }

        @media (max-width: 768px) {
          .checkoutPage {
            padding: 100px 16px 40px;
          }

          .checkoutHero,
          .paymentCard,
          .summaryCard,
          .infoCardSide {
            border-radius: 24px;
            padding: 22px;
          }

          .checkoutHero h1 {
            font-size: 44px;
            letter-spacing: -2px;
          }

          .paymentCard h2 {
            font-size: 30px;
          }

          .methodSwitch,
          .pixButtons,
          .tripleGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>

    <Footer />
  </>
);