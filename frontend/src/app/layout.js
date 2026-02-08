import { Poppins } from "next/font/google";
import "./globals.css";
import AppProvider from "@/redux/provider";
import MainLayout from "@/layouts/MainLayout";
import Header from "@/component/Header";
import Footer from "@/component/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
      <body>
        <AppProvider>
          <MainLayout>
            <Header />
            <main className="min-h-screen dark:bg-gray-900 dark:text-white">
              {children}
            </main>
            <Footer />
          </MainLayout>
        </AppProvider>
        <ToastContainer position="bottom-right" autoClose="2500" />
      </body>
    </html>
  );
}