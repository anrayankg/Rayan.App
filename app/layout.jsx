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
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Тема до первой отрисовки, чтобы экран не мигал: rayan_theme = dark | light | system */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('rayan_theme')||'system';var r=t==='system'?(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t;document.documentElement.setAttribute('data-theme',r);if(t==='system'&&window.matchMedia){window.matchMedia('(prefers-color-scheme: light)').addEventListener('change',function(e){if((localStorage.getItem('rayan_theme')||'system')==='system')document.documentElement.setAttribute('data-theme',e.matches?'light':'dark');});}}catch(e){}})();` }} />
      </head>
      <body>
        <Splash />
        {children}
      </body>
    </html>
  );
}
