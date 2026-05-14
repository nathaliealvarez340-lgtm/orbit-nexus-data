"use client";

import type { Route } from "next";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminAccessForm } from "@/components/auth/admin-access-modal";
import { PasswordField } from "@/components/auth/password-field";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  orbitInfoPanelClassName,
  orbitInputClassName,
  orbitPrimaryButtonClassName
} from "@/lib/ui/orbit-form-styles";

export default function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);

    const accessCode = code.trim();

    if (!accessCode || !password.trim()) {
      setError(t("auth.login.missing"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessCode,
          password
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          response.status === 401
            ? t("auth.login.invalid")
            : typeof payload?.message === "string" && payload.message.trim().length > 0
              ? payload.message
              : t("auth.login.server")
        );
        return;
      }

      router.replace("/workspace");
      router.refresh();
    } catch {
      setError(t("auth.login.server"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAdminMode) {
    return <AdminAccessForm onBack={() => setIsAdminMode(false)} />;
  }

  return (
    <form className="space-y-7" noValidate onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          {t("auth.login.title")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {t("auth.login.description")}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="accessCode">
          {t("auth.login.code")}
        </label>
        <input
          autoComplete="username"
          className={orbitInputClassName}
          id="accessCode"
          name="accessCode"
          placeholder="Ej. MAIA-001234"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-200" htmlFor="password">
            {t("auth.login.password")}
          </label>

          <Link
            className="text-xs font-semibold tracking-[0.08em] text-cyan-200 transition hover:text-cyan-100 hover:underline"
            href={"/auth/recover-access" as Route}
          >
            {t("auth.login.recover")}
          </Link>
        </div>

        <PasswordField
          autoComplete="current-password"
          className={`${orbitInputClassName} pr-11`}
          id="password"
          name="password"
          placeholder={t("auth.login.password")}
          value={password}
          onChange={setPassword}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <button className={orbitPrimaryButtonClassName} disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("auth.login.submitting")}
          </>
        ) : (
          t("auth.login.submit")
        )}
      </button>

      <div className={orbitInfoPanelClassName}>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
          {t("auth.login.protectedTitle")}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {t("auth.login.protectedText")}
        </p>
      </div>

      <p className="text-center text-sm text-slate-400">
        {t("auth.login.noCompany")}{" "}
        <Link className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline" href="/register">
          {t("common.activateCompany")}
        </Link>
      </p>

      <button
        className="mx-auto block text-center text-xs font-semibold text-slate-400 transition hover:text-cyan-300"
        type="button"
        onClick={() => setIsAdminMode(true)}
      >
        {t("auth.login.admin")}
      </button>
    </form>
  );
}
