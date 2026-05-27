export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 overflow-hidden"
      style={{
        background: "oklch(0.07 0.015 285)",
        backgroundImage:
          "radial-gradient(oklch(0.22 0.04 285) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* Vignette — suaviza los bordes del grid de puntos */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, oklch(0.07 0.015 285) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </main>
  );
}
