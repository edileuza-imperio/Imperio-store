import api from "@/Api/conectar";

import Banner from "@/components/site/Banner/Banner";
import CategoriasDestaque from "@/components/site/categoria/Categoria";
import Destaques from "@/components/Vitrine/Destaques";
import Campanhas from "../campanha/page";

type BannerItem = {
  id_banner: number;
  titulo: string;
  descricao?: string | null;
  imagem: string;
  link?: string | null;
  statusid?: number;
};

type Vitrine = {
  id_vitrine: number | string;
  nome?: string;
  slug?: string;
  titulo?: string;
  subtitulo?: string | null;
  tipo?: string;
  itens?: any[];
};

function extrairLista(payload: any): any[] {
  if (Array.isArray(payload?.dados?.dados))
    return payload.dados.dados;

  if (Array.isArray(payload?.dados))
    return payload.dados;

  if (Array.isArray(payload))
    return payload;

  return [];
}

export default async function HomeContent() {
  let vitrines: Vitrine[] = [];
  let banners: BannerItem[] = [];

  try {
    const [resBanners, resVitrines] =
      await Promise.all([
        api.get("/banners"),
        api.get("/vitrines/com-itens"),
      ]);

    banners = (
      resBanners.data?.dados?.dados ?? []
    ).filter(
      (b: BannerItem) =>
        b.statusid === 1 && b.imagem
    );

    vitrines = extrairLista(
      resVitrines.data
    ) as Vitrine[];
  } catch (error) {
    console.error(error);
  }

  return (
    <>
      <Banner banners={banners} />

      <CategoriasDestaque />

      <Campanhas />

      {vitrines.map((vitrine) => (
        <Destaques
          key={String(vitrine.id_vitrine)}
          vitrine={vitrine}
        />
      ))}
    </>
  );
}