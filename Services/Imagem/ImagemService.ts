import ROTAS from "@/app/constants/rotas";

/**
 * Contextos conhecidos de armazenamento das imagens.
 *
 * Produtos são entregues pelo endpoint público /imagens/produto, pois o
 * diretório upload/produtos fica fora do DocumentRoot do Apache neste projeto.
 */
export type ContextoImagem =
  | "banner"
  | "produto"
  | "categoria"
  | "marca"
  | "vitrine"
  | "usuario";

export default class ImagemService {
  private static readonly API_PADRAO = "http://api.universoimperio.test";

  private static readonly PASTAS: Record<ContextoImagem, string> = {
    banner: "upload/banners",
    produto: "upload/produtos",
    categoria: "upload/categorias",
    marca: "upload/marcas",
    vitrine: "upload/vitrines",
    usuario: "upload/usuarios",
  };

  private static readonly EXTENSOES_IMAGEM =
    /\.(?:avif|bmp|gif|jpe?g|jfif|png|svg|webp)$/i;

  private static readonly EXTENSOES_BACKEND = /\.(?:jpe?g|jfif|png|webp|gif)$/i;

  private static obterOrigemApi(): string {
    const configurada = process.env.NEXT_PUBLIC_API_URL?.trim();

    if (configurada) {
      try {
        const url = new URL(configurada);
        if (url.protocol === "http:" || url.protocol === "https:") {
          return url.origin;
        }
      } catch {
        // Usa a origem padrão abaixo quando a variável estiver inválida.
      }
    }

    return this.API_PADRAO;
  }

  private static montarUrl(valor: string): URL | null {
    try {
      const origem = this.obterOrigemApi();
      const url = /^https?:\/\//i.test(valor)
        ? new URL(valor)
        : new URL(valor, `${origem}/`);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
      }

      return url;
    } catch {
      return null;
    }
  }

  private static completarContexto(
    valor: string,
    contexto?: ContextoImagem,
  ): string {
    if (!contexto) return valor;

    const pareceNomeDeArquivo =
      !valor.includes("/") &&
      !valor.includes("\\") &&
      this.EXTENSOES_IMAGEM.test(valor);

    return pareceNomeDeArquivo ? `${this.PASTAS[contexto]}/${valor}` : valor;
  }

  private static obterNomeArquivo(caminho: string): string | null {
    let nome: string;

    try {
      nome = decodeURIComponent(caminho);
    } catch {
      return null;
    }

    nome = nome.split(/[\\/]/).pop()?.trim() ?? "";

    if (!nome || nome === "." || nome === "..") return null;
    if (!this.EXTENSOES_BACKEND.test(nome)) return null;
    if (!/^[a-zA-Z0-9._-]+$/.test(nome)) return null;

    return nome;
  }

  private static resolverBanner(url: URL): string | null {
    const nome = this.obterNomeArquivo(url.pathname);
    if (!nome) return null;

    return `${url.origin}${ROTAS.BANNERS.IMAGEM(nome)}`;
  }

  /**
   * Extrai o caminho interno depois de /upload/produtos/.
   * Exemplo: upload/produtos/caneca/produto_123.jpg
   * Retorno: caneca/produto_123.jpg
   */
  private static extrairCaminhoProduto(pathname: string): string | null {
    const normalizado = pathname.replace(/\\/g, "/");
    const marcador = "/upload/produtos/";
    const indice = normalizado.toLowerCase().indexOf(marcador);

    if (indice < 0) return null;

    const relativo = normalizado.slice(indice + marcador.length);
    const segmentos = relativo.split("/");

    if (
      segmentos.length < 1 ||
      segmentos.some(
        (segmento) =>
          !segmento ||
          segmento === "." ||
          segmento === ".." ||
          !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(segmento),
      )
    ) {
      return null;
    }

    const nomeArquivo = segmentos[segmentos.length - 1];
    if (!this.EXTENSOES_BACKEND.test(nomeArquivo)) return null;

    return segmentos.join("/");
  }

  private static resolverProduto(url: URL): string | null {
    const caminhoRelativo = this.extrairCaminhoProduto(url.pathname);
    if (!caminhoRelativo) return null;

    const endpoint = new URL("/imagens/produto", url.origin);
    endpoint.searchParams.set("arquivo", caminhoRelativo);
    return endpoint.toString();
  }

  static resolver(
    caminho?: string | null,
    contexto?: ContextoImagem,
  ): string | null {
    if (typeof caminho !== "string") return null;

    let valor = caminho.trim();
    if (!valor) return null;

    if (/^data:image\//i.test(valor) || /^blob:/i.test(valor)) {
      return valor;
    }

    if (/^(?:javascript|file|vbscript):/i.test(valor)) {
      return null;
    }

    valor = this.completarContexto(valor, contexto);

    const url = this.montarUrl(valor);
    if (!url) return null;

    const pathname = url.pathname.replace(/\\/g, "/");

    // Um endpoint de produto já resolvido pode ser mantido após validação.
    if (/\/imagens\/produto\/?$/i.test(pathname)) {
      const arquivo = url.searchParams.get("arquivo");
      if (!arquivo) return null;

      const caminhoValidado = arquivo
        .replace(/\\/g, "/")
        .split("/")
        .every(
          (segmento) =>
            !!segmento &&
            segmento !== "." &&
            segmento !== ".." &&
            /^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(segmento),
        );

      return caminhoValidado &&
        arquivo.includes("/") &&
        this.EXTENSOES_BACKEND.test(arquivo)
        ? url.toString()
        : null;
    }

    // Banners usam o endpoint próprio já existente no backend.
    if (/\/imagens\/banner\/?$/i.test(pathname)) {
      const arquivo = url.searchParams.get("arquivo");
      if (!arquivo || !this.obterNomeArquivo(arquivo)) return null;
      return url.toString();
    }

    // Rotas de upload do painel não são URLs públicas de imagem.
    if (/\/painel\/banners\/upload\/?$/i.test(pathname)) {
      return null;
    }

    // Só encaminha imagens de produtos quando a origem é a API configurada.
    const origemApi = this.obterOrigemApi();
    if (url.origin === origemApi && /\/upload\/produtos\//i.test(pathname)) {
      return this.resolverProduto(url);
    }

    if (/\/(?:uploads?)\/banners?\//i.test(pathname)) {
      return this.resolverBanner(url);
    }

    // Outras imagens (categorias, marcas, vitrines, usuários, CDN) mantêm
    // seus caminhos atuais, desde que o servidor as exponha publicamente.
    return url.toString();
  }

  static produto(caminho?: string | null): string | null {
    return this.resolver(caminho, "produto");
  }

  static banner(caminho?: string | null): string | null {
    return this.resolver(caminho, "banner");
  }

  static categoria(caminho?: string | null): string | null {
    return this.resolver(caminho, "categoria");
  }

  static marca(caminho?: string | null): string | null {
    return this.resolver(caminho, "marca");
  }

  static vitrine(caminho?: string | null): string | null {
    return this.resolver(caminho, "vitrine");
  }

  static usuario(caminho?: string | null): string | null {
    return this.resolver(caminho, "usuario");
  }
}
