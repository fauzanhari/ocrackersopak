import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "O-Crackers | Opak-Opak Ambon Khas Lombok",
  description: "Rasakan sensasi renyahnya Opak-Opak Ambon dengan bumbu Sate Tanjung autentik khas Lombok.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
