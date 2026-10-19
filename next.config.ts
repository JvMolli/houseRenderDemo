import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Nada del sitio debe indexarse, tampoco las fotos de /fotos (la meta robots solo cubre el HTML).
  // No se usa robots.txt con Disallow: los rastreadores no verían el noindex y Meta no podría
  // generar la vista previa del enlace del anuncio.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noimageindex" }] }];
  },
};

export default nextConfig;
