import "./globals.css";
import Splash from "../components/Splash";

export const metadata = {
  title: "RAYAN — центр недвижимости",
  description: "Внутренняя база объектов RAYAN",
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


