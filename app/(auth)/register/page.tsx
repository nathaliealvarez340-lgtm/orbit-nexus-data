import { AuthShell } from "@/components/auth/auth-shell";
import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      mode="register"
      title="Activa tu empresa dentro de un sistema operativo ejecutivo."
      description="Crea una organización, habilita el primer owner y entra a una capa premium para administrar usuarios, proyectos, métricas, finanzas y Orbit AI."
    >
      <RegisterForm />
    </AuthShell>
  );
}
