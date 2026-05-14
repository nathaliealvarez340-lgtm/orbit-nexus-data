"use client";

import { Building2, Loader2, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { OperationsShell } from "@/components/dashboard/operations-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWorkspaceNavigationItems, getWorkspaceSearchItems } from "@/lib/workspace/modules";
import type { SessionUser } from "@/types/auth";

type WorkspaceClient = {
  id: string;
  legalName: string;
  commercialName: string | null;
  rfc: string | null;
  personType: string | null;
  fiscalRegime: string | null;
  cfdiUse: string | null;
  fiscalZipCode: string | null;
  fiscalAddress: string | null;
  email: string;
  additionalEmails: string[];
  phone: string | null;
  primaryContact: string | null;
  sector: string | null;
  notes: string | null;
  quotesCount: number;
  updatedAt: string;
};

type ClientsViewProps = {
  session: SessionUser;
  initialClients: WorkspaceClient[];
};

const emptyForm = {
  legalName: "",
  commercialName: "",
  rfc: "",
  personType: "MORAL",
  fiscalRegime: "",
  cfdiUse: "",
  fiscalZipCode: "",
  fiscalAddress: "",
  email: "",
  additionalEmails: "",
  phone: "",
  primaryContact: "",
  sector: "",
  notes: ""
};

function getPayload(form: typeof emptyForm) {
  return {
    ...form,
    additionalEmails: form.additionalEmails
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter(Boolean)
  };
}

function canEdit(role: SessionUser["role"]) {
  return ["OWNER", "ADMIN", "FINANCE", "MANAGER"].includes(role);
}

export function ClientsView({ session, initialClients }: ClientsViewProps) {
  const [clients, setClients] = useState(initialClients);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const editable = canEdit(session.role);

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return clients;
    }

    return clients.filter((client) =>
      [
        client.legalName,
        client.commercialName,
        client.rfc,
        client.email,
        client.primaryContact,
        client.sector
      ].some((value) => value?.toLowerCase().includes(normalized))
    );
  }, [clients, query]);

  function editClient(client: WorkspaceClient) {
    setEditingId(client.id);
    setForm({
      legalName: client.legalName,
      commercialName: client.commercialName ?? "",
      rfc: client.rfc ?? "",
      personType: client.personType ?? "MORAL",
      fiscalRegime: client.fiscalRegime ?? "",
      cfdiUse: client.cfdiUse ?? "",
      fiscalZipCode: client.fiscalZipCode ?? "",
      fiscalAddress: client.fiscalAddress ?? "",
      email: client.email,
      additionalEmails: client.additionalEmails.join("\n"),
      phone: client.phone ?? "",
      primaryContact: client.primaryContact ?? "",
      sector: client.sector ?? "",
      notes: client.notes ?? ""
    });
    setMessage(null);
  }

  async function submitForm() {
    if (!editable) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(editingId ? `/api/clients/${editingId}` : "/api/clients", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(getPayload(form))
      });
      const payload = (await response.json()) as {
        message?: string;
        data?: WorkspaceClient;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.message ?? "No fue posible guardar la empresa cliente.");
      }

      setClients((current) =>
        editingId
          ? current.map((client) => (client.id === payload.data!.id ? payload.data! : client))
          : [payload.data!, ...current]
      );
      setForm(emptyForm);
      setEditingId(null);
      setMessage(payload.message ?? "Datos guardados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar los datos.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <OperationsShell
      session={session}
      portalLabel="Executive OS"
      portalTitle="Empresas / Clientes"
      subtitle="Administra empresas receptoras, contactos y datos fiscales para cotizaciones y facturacion futura."
      navItems={getWorkspaceNavigationItems("/workspace/clients")}
      searchItems={getWorkspaceSearchItems()}
      showHero={false}
      contentClassName="mx-auto w-full max-w-[1480px]"
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <OperationsPanel
          className="bg-slate-950/84"
          contentClassName="space-y-5"
          description="Busca empresas, revisa contactos y conserva aislamiento por organizacion."
          eyebrow="Directorio operativo"
          title="Empresas / Clientes"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <Search className="h-4 w-4 text-cyan-300" />
            <Input
              className="h-10 border-0 bg-transparent px-0 text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
              placeholder="Buscar por empresa, RFC, correo o contacto..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {filteredClients.length ? (
            <div className="grid gap-3">
              {filteredClients.map((client) => (
                <article
                  key={client.id}
                  className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">{client.legalName}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {client.commercialName ?? "Sin nombre comercial"} · {client.email}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1">
                          RFC {client.rfc ?? "pendiente"}
                        </span>
                        <span className="rounded-full border border-cyan-400/15 bg-cyan-500/10 px-2.5 py-1 text-cyan-200">
                          {client.quotesCount} cotizaciones
                        </span>
                      </div>
                    </div>
                    <Button
                      className="border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.08]"
                      disabled={!editable}
                      type="button"
                      variant="outline"
                      onClick={() => editClient(client)}
                    >
                      Editar
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.03] px-5 py-8">
              <Building2 className="h-8 w-8 text-cyan-300" />
              <p className="mt-4 text-lg font-semibold text-white">Sin empresas registradas</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Agrega clientes para seleccionarlos en cotizaciones y preparar facturacion futura sin capturas duplicadas.
              </p>
            </div>
          )}
        </OperationsPanel>

        <OperationsPanel
          className="bg-slate-950/84"
          contentClassName="space-y-4"
          description={editable ? "Captura datos comerciales y fiscales del receptor." : "Tu rol permite consulta, no edicion."}
          eyebrow={editingId ? "Editar" : "Alta rapida"}
          title={editingId ? "Actualizar empresa" : "Nueva empresa"}
        >
          <div className="space-y-3">
            <Label className="text-slate-300">Razon social</Label>
            <Input value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-slate-300">Nombre comercial</Label>
              <Input value={form.commercialName} onChange={(event) => setForm({ ...form, commercialName: event.target.value })} />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-300">RFC</Label>
              <Input value={form.rfc} onChange={(event) => setForm({ ...form, rfc: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-slate-300">Correo principal</Label>
              <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-300">Telefono</Label>
              <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
              <Label className="text-slate-300">Uso CFDI</Label>
              <Input value={form.cfdiUse} onChange={(event) => setForm({ ...form, cfdiUse: event.target.value })} />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-slate-300">Regimen fiscal</Label>
            <Input value={form.fiscalRegime} onChange={(event) => setForm({ ...form, fiscalRegime: event.target.value })} />
          </div>
          <div className="space-y-3">
            <Label className="text-slate-300">Domicilio fiscal</Label>
            <textarea
              className="min-h-20 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/30"
              value={form.fiscalAddress}
              onChange={(event) => setForm({ ...form, fiscalAddress: event.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-slate-300">Codigo postal fiscal</Label>
              <Input value={form.fiscalZipCode} onChange={(event) => setForm({ ...form, fiscalZipCode: event.target.value })} />
            </div>
            <div className="space-y-3">
              <Label className="text-slate-300">Contacto principal</Label>
              <Input value={form.primaryContact} onChange={(event) => setForm({ ...form, primaryContact: event.target.value })} />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-slate-300">Correos adicionales</Label>
            <textarea
              className="min-h-20 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/30"
              placeholder="uno por linea"
              value={form.additionalEmails}
              onChange={(event) => setForm({ ...form, additionalEmails: event.target.value })}
            />
          </div>

          {message ? (
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/10 px-4 py-3 text-sm leading-6 text-cyan-100">
              {message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={!editable || isSaving} type="button" onClick={submitForm}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Guardar cambios" : "Crear cliente"}
            </Button>
            {editingId ? (
              <Button
                className="bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setMessage(null);
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </OperationsPanel>
      </section>
    </OperationsShell>
  );
}
