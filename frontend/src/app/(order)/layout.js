// Minimal layout for QR ordering page.
// Avoids the marketing Header/Footer so customers can focus on ordering.

export default function OrderLayout({ children }) {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      {children}
    </main>
  );
}

