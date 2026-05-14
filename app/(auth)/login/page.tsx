import { AuthShell } from "@/components/auth/auth-shell";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      mode="login"
      title="Entra a tu sistema operativo ejecutivo."
      description="Accede con tu código único empresarial para administrar operación, usuarios, proyectos, métricas, finanzas y Orbit AI desde un solo entorno seguro."
    >
      <LoginForm />
    </AuthShell>
  );
}
