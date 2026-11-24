import { toast } from "react-toastify";

const Toast = {
  sucesso(mensagem: string) {
    toast.success(mensagem);
  },

  erro(mensagem: string) {
    toast.error(mensagem);
  },

  alerta(mensagem: string) {
    toast.warning(mensagem);
  },

  informacao(mensagem: string) {
    toast.info(mensagem);
  },

  carregando(mensagem: string) {
    return toast.loading(mensagem);
  },

  atualizar(
    id: string | number,
    mensagem: string,
    tipo: "success" | "error" | "info" | "warning",
  ) {
    toast.update(id, {
      render: mensagem,
      type: tipo,
      isLoading: false,
      autoClose: 3000,
    });
  },

  remover(id?: string | number) {
    toast.dismiss(id);
  },

  removerTodos() {
    toast.dismiss();
  },
};

export default Toast;
