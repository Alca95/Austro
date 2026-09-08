import { redirect } from "next/navigation";
import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";
import PublishWizard from "../../components/PublishWizard";
import { createClient } from "../../lib/supabase/server";

export default async function PublishPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/iniciar-sesion");
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader activePage="publicar" />
      <main>
        <PublishWizard />
      </main>
      <PublicFooter />
    </div>
  );
}