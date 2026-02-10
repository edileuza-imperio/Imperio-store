"use client";

import { FaTag, FaBarcode, FaShippingFast } from "react-icons/fa";

interface Props {
  produto: any;
}

export default function ProdutoDescricao({ produto }: Props) {
  const descricao = produto.descricao?.split("\n") || [];

  return (
    <div className="mt-5">
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h4 className="mb-3 pb-2 border-bottom border-gold-light">
            <FaTag className="me-2 text-gold" /> Descrição do Produto
          </h4>

          {descricao.map((p: string, idx: number) => (
            <p key={idx} className="mb-2">{p}</p>
          ))}

          {/* Informações técnicas */}
          <div className="row mt-4 pt-3 border-top border-gold-light">
            <div className="col-md-6">
              <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2 text-gold">
                <FaBarcode /> Informações do Produto
              </h6>
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <td>Categoria</td>
                    <td>{produto.categoria_nome }</td>
                  </tr>
                  <tr>
                    <td>Status</td>
                    <td>{produto.status_nome }</td>
                  </tr>
                  <tr>
                    <td>Código</td>
                    <td>#{produto.id_produto}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2 text-rosa">
                <FaShippingFast /> Informações de Entrega
              </h6>
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <td>Tempo de Entrega</td>
                    <td>5-7 dias úteis</td>
                  </tr>
                  <tr>
                    <td>Frete Grátis</td>
                    <td>Acima de R$100</td>
                  </tr>
                  <tr>
                    <td>Disponibilidade</td>
                    <td>{produto.ilimitado ? "Ilimitada" : `${produto.estoque} unidades`}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
