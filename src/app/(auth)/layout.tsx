/**
 * Layout para el grupo de rutas (auth): /login, /register, etc.
 * Centra el contenido vertical y horizontalmente con un fondo sutil.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      {children}
    </main>
  );
}
