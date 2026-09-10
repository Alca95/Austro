import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";

export default function MyListingsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        <div role="status" aria-label="Cargando mis publicaciones">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-surface-soft" />
          <div className="mt-4 h-5 w-full max-w-lg animate-pulse rounded-lg bg-surface-soft" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-3xl bg-surface-soft"
              />
            ))}
          </div>
          <span className="sr-only">Cargando mis publicaciones...</span>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
