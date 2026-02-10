import api from "@/Api/conectar";

export async function buscarUsuarioAutenticado() {
  try {
    const res = await api.get("/me", { withCredentials: true });

    return res.data?.dados?.usuario ?? null;
  } catch {
    return null;
  }
}
