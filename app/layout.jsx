import "./globals.css";

export const metadata = {
  title: "RAYAN — центр недвижимости",
  description: "Внутренняя база объектов RAYAN",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="bg-green-deep min-h-screen text-cream">{children}</body>
    </html>
  );
}
