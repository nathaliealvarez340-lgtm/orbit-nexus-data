"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { PasswordRequirements } from "@/components/auth/password-requirements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPasswordValidationMessage, isPasswordValid } from "@/lib/password-policy";

type ResetPasswordFormState = {
  accessCode: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
};

const initialFormState: ResetPasswordFormState = {
  accessCode: "",
  email: "",
  newPassword: "",
  confirmPassword: ""
};

export function ResetPasswordForm() {
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const passwordValidationMessage = getPasswordValidationMessage(form.newPassword);
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword;
  const canSubmit =
    !!form.accessCode.trim() &&
    !!form.email.trim() &&
    !!form.newPassword &&
    !!form.confirmPassword &&
    isPasswordValid(form.newPassword) &&
    passwordsMatch;

  function updateField<K extends keyof ResetPasswordFormState>(
    key: K,
    value: ResetPasswordFormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
    setError(null);
    setSuccessMessage(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!form.accessCode.trim() || !form.email.trim() || !form.newPassword || !form.confirmPassword) {
      setError("Completa todos los campos para restablecer la contraseña.");
      return;
    }

    if (passwordValidationMessage) {
      setError(passwordValidationMessage);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("La confirmación de contraseña no coincide.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            accessCode: form.accessCode,
            email: form.email,
            newPassword: form.newPassword,
            confirmPassword: form.confirmPassword
          })
        });

        const payload = await response.json();

        if (!response.ok) {
          setError(payload?.message ?? "No fue posible actualizar la contraseña.");
          return;
        }

        setSuccessMessage(payload?.message ?? "La contraseña se actualizó correctamente.");
        setForm(initialFormState);
      } catch {
        setError("Ocurrió un error inesperado al restablecer la contraseña.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="accessCode">Código único</Label>
        <Input
          id="accessCode"
          name="accessCode"
          placeholder="LDR-001"
          value={form.accessCode}
          onChange={(e) => updateField("accessCode", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="correo@empresa.com"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          value={form.newPassword}
          onChange={(e) => updateField("newPassword", e.target.value)}
        />
        <PasswordRequirements password={form.newPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
        />
        {form.confirmPassword && !passwordsMatch ? (
          <p className="text-sm text-red-700">La confirmación de contraseña no coincide.</p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <Button className="w-full" type="submit" disabled={isPending || !canSubmit}>
        {isPending ? "Actualizando..." : "Restablecer contraseña"}
      </Button>

      <p className="text-sm text-muted-foreground">
        ¿Ya recordaste tu acceso?{" "}
        <Link className="font-semibold text-primary" href="/login">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
