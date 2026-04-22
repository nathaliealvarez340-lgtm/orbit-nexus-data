import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getSession } from "@/lib/auth/session";

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session) {
    redirect("/workspace");
  }

  return (
    <AuthShell
      title="Recuperar contrasena"
      description="Valida tu codigo unico y tu correo para registrar una nueva contrasena segura."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
