import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "https://lightgrey-cattle-160990.hostingersite.com/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 🔥 ESSENCIAL PARA COOKIE (TOKEN)
});

export default api;
