import { Poppins } from "next/font/google";
import "./globals.css";
import AppProvider from "@/redux/provider";
import MainLayout from "@/layouts/MainLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// PrimeReact styles
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "RestoSmart - Premium QR Restaurant Management",
  description: "Modern QR Ordering, POS, and Kitchen Management System for restaurants.",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link
          id="theme-link"
          rel="stylesheet"
          href="/themes/lara-light-blue/theme.css"
        />
      </head>
      <body>
        <AppProvider>
          <MainLayout>
            <main className="min-h-screen dark:bg-gray-900 dark:text-white">
              {children}
            </main>
          </MainLayout>
        </AppProvider>
        <ToastContainer position="bottom-right" autoClose="2500" />
      </body>
    </html>
  );
}