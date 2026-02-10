interface CarrinhoItem {
  id_item: number;
  nome_produto: string;
  imagem?: string;
  quantidade: number;
  preco_unitario: string;
}

type CupomApi = {
  codigo: string;
  tipo: 'percentual' | 'fixo';
  valor: number;
  descricao?: string;
};