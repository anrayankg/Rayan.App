import "./globals.css";
import Splash from "../components/Splash";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rayan-app.vercel.app"),
  title: "RAYAN — центр недвижимости",
  description: "RAYAN — центр недвижимости, Бишкек",
  openGraph: {
    title: "RAYAN — центр недвижимости",
    description: "RAYAN — центр недвижимости, Бишкек",
    siteName: "RAYAN — центр недвижимости",
    images: ["/og-rayan.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <Splash />
        {children}
      </body>
    </html>
  );
}
