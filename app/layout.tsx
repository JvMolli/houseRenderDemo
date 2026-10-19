import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casa 3D",
  description: "Maqueta 3D interactiva del piso",
  // Página privada para el anuncio: que no aparezca en buscadores.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
