"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  name?: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  onChange: (value: string) => void;
};

export function PasswordField({
  id,
  name,
  value,
  placeholder,
  autoComplete,
  className,
  onChange
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        autoComplete={autoComplete}
        className={className}
        id={id}
        name={name}
        placeholder={placeholder}
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      <button
        aria-label={isVisible ? "Ocultar contrasena" : "Mostrar contrasena"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
        type="button"
        onClick={() => setIsVisible((current) => !current)}
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

