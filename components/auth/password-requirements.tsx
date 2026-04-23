"use client";

import { getPasswordRequirementChecks } from "@/lib/password-policy";
import { cn } from "@/lib/utils";

type PasswordRequirementsProps = {
  password: string;
  className?: string;
};

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  const requirements = getPasswordRequirementChecks(password);

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3", className)}>
      <p className="text-sm font-medium text-slate-700">La contraseña debe incluir:</p>

      <ul className="mt-2 space-y-1 text-sm">
        {requirements.map((requirement) => (
          <li
            key={requirement.id}
            className={requirement.passed ? "text-emerald-700" : "text-slate-500"}
          >
            {requirement.passed ? "Cumple:" : "Falta:"} {requirement.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
