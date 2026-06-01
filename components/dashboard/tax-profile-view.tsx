"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWorkspaceNavigationItems, getWorkspaceSearchItems } from "@/lib/workspace/modules";
import type { SessionUser } from "@/types/auth";

type TaxProfile = {
  rfc: string | null;
  legalName: string | null;
  personType: string | null;
  fiscalRegime: string | null;
  fiscalZipCode: string | null;
  fiscalAddress: string | null;
  fiscalEmail: string | null;
  phone: string | null;
  commercialName: string | null;
  completenessState: string;
  storageNotice: string | null;
};

type TaxProfileViewProps = {
  session: SessionUser;
  initialProfile: TaxProfile | null;
};

function canEdit(role: SessionUser["role"]) {
  return ["OWNER", "ADMIN", "FINANCE"].includes(role);
}

function getStateCopy(state: string) {
  switch (state) {
    case "READY_FOR_FUTURE_INVOICING":
      return "Listo para facturacion futura";
    case "READY_FOR_QUOTES":
      return "Listo para cotizar";
    default:
      return "Incompleto";
  }
}

export function TaxProfileView({ session, initialProfile }: TaxProfileViewProps) {
  const editable = canEdit(session.role);
  const [profile, setProfile] = useState(initialProfile);
  const [form, setForm] = useState({
    rfc: initialProfile?.rfc ?? "",
    legalName: initialProfile?.legalName ?? "",
    personType: initialProfile?.personType ?? "MORAL",
    fiscalRegime: initialProfile?.fiscalRegime ?? "",
    fiscalZipCode: initialProfile?.fiscalZipCode ?? "",
    fiscalAddress: initialProfile?.fiscalAddress ?? "",
    fiscalEmail: initialProfile?.fiscalEmail ?? "",
    phone: initialProfile?.phone ?? "",
    commercialName: initialProfile?.commercialName ?? ""
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const statusCopy = useMemo(
    () => getStateCopy(profile?.completenessState ?? "INCOMPLETE"),
    [profile?.completenessState]
  );

  async function saveProfile() {
    if (!editable) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/tax-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as {
        message?: string;
        data?: TaxProfile;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.message ?? "No fue posible guardar datos fiscales.");
      }

      setProfile(payload.data);
      setMessage(payload.message ?? "Datos fiscales actualizados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar datos fiscales.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <OperationsShell
      session={session}
      portalLabel="Executive OS"
      portalTitle="Datos fiscales"
      subtitle="Configura la informacion fiscal emisora para cotizaciones y facturacion CFDI futura."
      navItems={getWorkspaceNavigationItems("/workspace/tax-profile")}
      searchItems={getWorkspaceSearchItems()}
      showHero={false}
      contentClassName="mx-auto w-full max-w-[1480px]"
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <OperationsPanel
          className="bg-slate-950/84"
          contentClassName="space-y-5"
          description={editable ? "Solo owner, admin y finance pueden editar estos datos." : "Tu rol puede consultar estos datos, no modificarlos."}
          eyebrow="Empresa emisora"
          title="Perfil fiscal"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-slate-300">RFC</Label>
              <Input value={form.rfc} onChange={(event) => setForm({ ...form, rfc: event.target.value })} />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-300">Razon social</Label>
              <Input value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-300">Tipo de persona</Label>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none transition-colors hover:border-cyan-400/30"
                value={form.personType}
                onChange={(event) => setForm({ ...form, personType: event.target.value })}
              >
                <option value="MORAL">Moral</option>
                <option value="FISICA">Fisica</option>
              </select>
            </div>
            <div className="space-y-3">
              <Label className="text-slate-300">Regimen fiscal</Label>
              <Input value={form.fiscalRegime} onChange={(event) => setForm({ ...form, fiscalRegime: event.target.value })} />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-300">Codigo postal fiscal</Label>
              <Input value={form.fiscalZipCode} onChange={(event) => setForm({ ...form, fiscalZipCode: event.target.value })} />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-300">Correo fiscal</Label>
              <Input value={form.fiscalEmail} onChange={(event) => setForm({ ...form, fiscalEmail: event.target.value })} />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-300">Domicilio fiscal</Label>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/30"
              value={form.fiscalAddress}
              onChange={(event) => setForm({ ...form, fiscalAddress: event.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-slate-300">Telefono opcional</Label>
              <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-300">Nombre comercial opcional</Label>
              <Input value={form.commercialName} onChange={(event) => setForm({ ...form, commercialName: event.target.value })} />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/15 bg-amber-500/10 px-4 py-4 text-sm leading-6 text-amber-100">
            La carga segura de CSF requiere storage privado configurado. Por ahora puedes guardar los datos fiscales manualmente.
          </div>

          {message ? (
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/10 px-4 py-3 text-sm leading-6 text-cyan-100">
              {message}
            </div>
          ) : null}

          <Button disabled={!editable || isSaving} type="button" onClick={saveProfile}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Guardar datos fiscales
          </Button>
        </OperationsPanel>

        <OperationsPanel
          className="bg-slate-950/84"
          contentClassName="space-y-4"
          description="Estos datos preparan la emision fiscal. El timbrado CFDI requiere integracion con PAC autorizado."
          eyebrow="Estado"
          title={statusCopy}
        >
          <div className="rounded-[1.5rem] border border-cyan-400/15 bg-cyan-500/10 px-4 py-4">
            <p className="text-sm font-semibold text-cyan-100">CFDI oficial no conectado</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Mikaelson OS no timbra ni genera XML fiscal valido hasta integrar un PAC autorizado como Facturama,
              Facturapi, SW sapien u otro proveedor CFDI.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-300">
            <p className="font-semibold text-white">Checklist minimo</p>
            <p className="mt-2">RFC, razon social, regimen fiscal, codigo postal, domicilio fiscal y correo fiscal.</p>
          </div>
        </OperationsPanel>
      </section>
    </OperationsShell>
  );
}
