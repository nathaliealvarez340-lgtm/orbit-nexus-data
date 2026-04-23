import { redirect } from "next/navigation";

import { AccessRecoveryForm } from "@/components/auth/access-recovery-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSession } from "@/lib/auth/session";

export default async function RecoverAccessPage() {
  const session = await getSession();

  if (session) {
    redirect("/workspace");
  }

  return (
    <AuthShell
      mode="login"
      title="Recupera tu acceso con una verificacion clara, segura y consistente."
      description="Selecciona si necesitas restablecer tu contrasena temporal o recuperar tu codigo unico sin salir de la experiencia premium de Orbit Nexus."
    >
      <AccessRecoveryForm />
    </AuthShell>
  );
}
