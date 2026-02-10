import api from "@/Api/conectar";

export const carrinhoService = {
  async buscarUsuario() {
    const res = await api.get("/me");
    return res.data.dados.usuario;
  },

  async buscarCarrinho(usuarioId: number) {
    const res = await api.get(`/carrinho/${usuarioId}`);
    return res.data.dados;
  },

  async removerItem(produtoId: number) {
    await api.delete(`/carrinho/remover/${produtoId}`);
  },

  async atualizarQuantidade(produtoId: number, quantidade: number) {
    await api.put(`/carrinho/atualizar/${produtoId}`, { quantidade });
  }
};
