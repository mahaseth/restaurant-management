import Header from "@/component/Header";
import Footer from "@/component/Footer";

export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
