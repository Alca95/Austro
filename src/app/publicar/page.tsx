import { redirect } from "next/navigation";
import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";
import PublishWizard from "../../components/PublishWizard";
import { createClient } from "../../lib/supabase/server";

export default async function PublishPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/iniciar-sesion");
  }

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, allowed_types")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader activePage="publicar" />

      <main>
        {categoriesError || !categories?.length ? (
          <section className="mx-auto max-w-2xl px-5 py-16">
            <h1 className="text-2xl font-semibold text-foreground">
              No pudimos cargar las categorías
            </h1>
            <p className="mt-3 text-text-secondary">
              Intenta cargar nuevamente la página para continuar.
            </p>
            <a
              href="/publicar"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white"
            >
              Volver a intentar
            </a>
          </section>
        ) : (
          <PublishWizard categories={categories} />
        )}
      </main>

      <PublicFooter />
    </div>
  );
}