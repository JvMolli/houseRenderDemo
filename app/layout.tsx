import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casa 3D",
  description: "Maqueta 3D interactiva del piso",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
