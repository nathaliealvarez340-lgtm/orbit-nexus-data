import { AuthShell } from "@/components/auth/auth-shell";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      mode="login"
      title="Ingresa a una capa de control más clara, más segura y mucho más inteligente."
      description="Entra a Orbit Nexus con tu código único para continuar dentro de una experiencia premium diseñada para velocidad, trazabilidad y control empresarial."
    >
      <LoginForm />
    </AuthShell>
  );
}
