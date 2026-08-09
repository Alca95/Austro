import PublicFooter from "../../components/PublicFooter";
import PublicHeader from "../../components/PublicHeader";
import PublishWizard from "../../components/PublishWizard";

export default function PublishPage() {
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
