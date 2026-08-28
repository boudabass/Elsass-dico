import { redirect } from "next/navigation";

// "Mon Profil" a fusionné dans "Mon espace" (écran 6 du handoff mobile,
// 28/08/2026) : identité, rôle et contributions y vivent tous ensemble.
// Redirection plutôt que suppression pour ne pas casser un lien existant.
export default function ProfilePage() {
    redirect("/dashboard");
}
