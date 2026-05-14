import type { DashboardSearchItem } from "@/lib/dashboard/mock-data";

export type WorkspaceModule = {
  id: string;
  label: string;
  href: string;
  description: string;
  keywords: string[];
};

export const WORKSPACE_MODULES: WorkspaceModule[] = [
  {
    id: "command-center",
    label: "Command Center",
    href: "/workspace",
    description: "Centro CEO para decidir, priorizar y controlar la empresa en tiempo real.",
    keywords: ["command center", "dashboard", "inicio", "control empresarial", "operacion", "ceo"]
  },
  {
    id: "projects",
    label: "Proyectos",
    href: "/workspace/projects",
    description: "Seguimiento de proyectos activos, riesgo y avance operativo.",
    keywords: ["proyecto", "proyectos", "avance", "operacion", "portafolio"]
  },
  {
    id: "tasks",
    label: "Tareas",
    href: "/workspace/tasks",
    description: "Prioridades, tareas criticas y bloqueos operativos.",
    keywords: ["tarea", "tareas", "pendientes", "prioridad", "bloqueos"]
  },
  {
    id: "alerts",
    label: "Alertas",
    href: "/workspace/alerts",
    description: "Riesgos, alertas abiertas e incidencias detectadas.",
    keywords: ["alerta", "alertas", "riesgo", "riesgos", "incidencia"]
  },
  {
    id: "reports",
    label: "Reportes",
    href: "/workspace/reports",
    description: "Reportes ejecutivos y lectura directiva de la operacion.",
    keywords: ["reporte", "reportes", "resumen", "semanal", "ejecutivo"]
  },
  {
    id: "automations",
    label: "Automatizaciones",
    href: "/workspace/automations",
    description: "Rutinas operativas y automatizaciones configurables.",
    keywords: ["automatizacion", "automatizaciones", "workflow", "rutinas"]
  },
  {
    id: "orbit-ai",
    label: "MAIA",
    href: "/workspace/orbit-ai",
    description: "Asistente CEO por chat y voz para ejecutar acciones con contexto.",
    keywords: ["maia", "orbit ai", "ai", "ia", "asistente", "voz", "chat", "acciones"]
  },
  {
    id: "quotes",
    label: "Cotizaciones",
    href: "/workspace/quotes",
    description: "Crea, edita y controla cotizaciones profesionales.",
    keywords: ["cotizacion", "cotizaciones", "quote", "quotes", "propuesta", "precio"]
  },
  {
    id: "invoices",
    label: "Facturas",
    href: "/workspace/invoices",
    description: "Prepara facturas internas y arquitectura para CFDI futuro.",
    keywords: ["factura", "facturas", "cfdi", "sat", "cobro", "finanzas"]
  },
  {
    id: "tax-profile",
    label: "Datos fiscales",
    href: "/workspace/tax-profile",
    description: "Perfil fiscal de la empresa emisora para cotizar y facturar.",
    keywords: ["datos fiscales", "rfc", "razon social", "regimen fiscal", "csf"]
  },
  {
    id: "clients",
    label: "Empresas / Clientes",
    href: "/workspace/clients",
    description: "Alta y administracion de empresas receptoras y contactos.",
    keywords: ["cliente", "clientes", "empresa", "empresas", "receptor", "contactos"]
  },
  {
    id: "integrations",
    label: "Integraciones",
    href: "/workspace/integrations",
    description: "Conecta correo y sistemas externos cuando OAuth este listo.",
    keywords: ["integraciones", "gmail", "outlook", "microsoft", "correo", "imap", "oauth"]
  }
];

export function getWorkspaceNavigationItems(currentHref = "/workspace") {
  return WORKSPACE_MODULES.map((module) => ({
    label: module.label,
    href: module.href,
    active:
      currentHref === module.href ||
      (module.href !== "/workspace" && currentHref.startsWith(`${module.href}/`))
  }));
}

export function getWorkspaceSearchItems(): DashboardSearchItem[] {
  return WORKSPACE_MODULES.map((module) => ({
    id: `workspace-module-${module.id}`,
    type: "action",
    title: module.label,
    subtitle: module.description,
    href: module.href,
    keywords: [module.label, module.description, ...module.keywords]
  }));
}
