import { AuthShell } from "@/components/auth/auth-shell";
import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      mode="register"
      title="Activa acceso dentro de una arquitectura diseñada para crecer con elegancia y control."
      description="Registra usuarios autorizados, valida identidad por rol y construye una base premium lista para escalar con seguridad, claridad y trazabilidad."
    >
      <RegisterForm />
    </AuthShell>
  );
}