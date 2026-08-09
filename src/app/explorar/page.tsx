import { Suspense } from "react";
import ExploreDirectory from "../../components/ExploreDirectory";
import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";

function DirectoryFallback() {
  return (
    <div className="mx-auto min-h-[620px] w-full max-w-7xl animate-pulse px-5 py-12 sm:px-8">
      <div className="h-10 w-2/3 rounded-xl bg-surface-soft" />
      <div className="mt-4 h-5 w-1/2 rounded-lg bg-surface-soft" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="h-72 rounded-2xl bg-surface-soft" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-96 rounded-3xl bg-surface-soft" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader activePage="explorar" />
      <main>
        <Suspense fallback={<DirectoryFallback />}>
          <ExploreDirectory />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
