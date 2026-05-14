import "server-only";

export type MaiaActionIntent =
  | "create_quote"
  | "open_quotes"
  | "create_client"
  | "open_clients"
  | "open_tax_profile"
  | "open_invoices"
  | "create_invoice_draft"
  | "open_dashboard"
  | "search_module"
  | "summarize_operation"
  | "create_task"
  | "open_reports";

export type MaiaActionType =
  | "navigate"
  | "navigate_and_start_flow"
  | "start_flow"
  | "prepare_draft";

export type MaiaAction = {
  type: MaiaActionType;
  intent: MaiaActionIntent;
  route: string;
  action?: string;
  message: string;
  requiresConfirmation?: boolean;
  payload?: Record<string, unknown>;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, tokens: string[]) {
  return tokens.some((token) => text.includes(normalizeText(token)));
}

const CREATE_QUOTE_TOKENS = [
  "ayudame a hacer una cotizacion",
  "ayudame hacer una cotizacion",
  "quiero hacer una cotizacion",
  "haz una cotizacion",
  "hacer una cotizacion",
  "crear cotizacion",
  "crea una cotizacion",
  "necesito cotizar",
  "cotiza esto",
  "cotizar esto",
  "nueva cotizacion"
];

const OPEN_QUOTE_TOKENS = [
  "abre cotizaciones",
  "abrir cotizaciones",
  "ir a cotizaciones",
  "ver cotizaciones",
  "muestrame cotizaciones"
];

const CREATE_CLIENT_TOKENS = [
  "crear cliente",
  "nuevo cliente",
  "dar de alta cliente",
  "registrar cliente",
  "crear empresa cliente"
];

const OPEN_CLIENT_TOKENS = [
  "abre clientes",
  "abrir clientes",
  "ir a clientes",
  "ver clientes",
  "empresas clientes"
];

const OPEN_TAX_PROFILE_TOKENS = [
  "datos fiscales",
  "abre datos fiscales",
  "abrir datos fiscales",
  "perfil fiscal",
  "rfc"
];

const OPEN_INVOICE_TOKENS = [
  "abre facturas",
  "abrir facturas",
  "ir a facturas",
  "ver facturas",
  "facturas pendientes"
];

const CREATE_INVOICE_TOKENS = [
  "crear factura",
  "nueva factura",
  "borrador de factura",
  "hacer factura"
];

const DASHBOARD_TOKENS = [
  "abre command center",
  "ir al dashboard",
  "abrir dashboard",
  "command center",
  "inicio"
];

const REPORT_TOKENS = [
  "abre reportes",
  "abrir reportes",
  "ir a reportes",
  "ver reportes",
  "reporte semanal"
];

const CREATE_TASK_TOKENS = [
  "crear tarea",
  "nueva tarea",
  "agrega tarea",
  "registrar tarea"
];

const SUMMARY_TOKENS = [
  "resumen ejecutivo",
  "resume la operacion",
  "estado operativo",
  "que necesito resolver hoy"
];

export function detectMaiaAction(question: string): MaiaAction | null {
  const normalized = normalizeText(question);

  if (!normalized) {
    return null;
  }

  if (includesAny(normalized, CREATE_QUOTE_TOKENS)) {
    return {
      type: "navigate_and_start_flow",
      intent: "create_quote",
      route: "/workspace/quotes",
      action: "new_quote",
      message:
        "Claro, vamos a hacerla. Primero necesito que me digas el nombre del cliente.",
      payload: {
        flow: "quote_draft",
        nextField: "clientName"
      }
    };
  }

  if (includesAny(normalized, OPEN_QUOTE_TOKENS)) {
    return {
      type: "navigate",
      intent: "open_quotes",
      route: "/workspace/quotes",
      message: "Abro Cotizaciones para que revises o continúes tus propuestas."
    };
  }

  if (includesAny(normalized, CREATE_CLIENT_TOKENS)) {
    return {
      type: "navigate_and_start_flow",
      intent: "create_client",
      route: "/workspace/clients",
      action: "new_client",
      message: "Vamos a dar de alta una empresa o cliente. Primero necesito su razon social o nombre comercial."
    };
  }

  if (includesAny(normalized, OPEN_CLIENT_TOKENS)) {
    return {
      type: "navigate",
      intent: "open_clients",
      route: "/workspace/clients",
      message: "Abro Empresas / Clientes para que revises el directorio operativo."
    };
  }

  if (includesAny(normalized, OPEN_TAX_PROFILE_TOKENS)) {
    return {
      type: "navigate",
      intent: "open_tax_profile",
      route: "/workspace/tax-profile",
      message: "Abro Datos fiscales. Recuerda que el timbrado CFDI requiere un PAC autorizado."
    };
  }

  if (includesAny(normalized, CREATE_INVOICE_TOKENS)) {
    return {
      type: "navigate_and_start_flow",
      intent: "create_invoice_draft",
      route: "/workspace/invoices",
      action: "new_invoice_draft",
      requiresConfirmation: true,
      message:
        "Puedo preparar un borrador interno de factura, pero no timbraré CFDI sin confirmacion e integracion con PAC autorizado."
    };
  }

  if (includesAny(normalized, OPEN_INVOICE_TOKENS)) {
    return {
      type: "navigate",
      intent: "open_invoices",
      route: "/workspace/invoices",
      message: "Abro Facturas para revisar borradores, pendientes y estados preparados para CFDI futuro."
    };
  }

  if (includesAny(normalized, REPORT_TOKENS)) {
    return {
      type: "navigate",
      intent: "open_reports",
      route: "/workspace/reports",
      message: "Abro Reportes para revisar la lectura ejecutiva de la operacion."
    };
  }

  if (includesAny(normalized, CREATE_TASK_TOKENS)) {
    return {
      type: "navigate_and_start_flow",
      intent: "create_task",
      route: "/workspace/tasks",
      action: "new_task",
      message: "Vamos a crear una tarea. Dime el titulo, responsable y prioridad."
    };
  }

  if (includesAny(normalized, DASHBOARD_TOKENS)) {
    return {
      type: "navigate",
      intent: "open_dashboard",
      route: "/workspace",
      message: "Te llevo al Command Center para revisar la operacion completa."
    };
  }

  if (includesAny(normalized, SUMMARY_TOKENS)) {
    return {
      type: "prepare_draft",
      intent: "summarize_operation",
      route: "/workspace",
      message: "Preparo el resumen ejecutivo con proyectos, tareas, alertas, cotizaciones y facturas disponibles."
    };
  }

  return null;
}

export function getMaiaActionSuggestions(intent: MaiaActionIntent) {
  switch (intent) {
    case "create_quote":
      return [
        "El cliente es Cinemex.",
        "El concepto es mantenimiento mensual.",
        "Son 2 unidades de 15000 pesos."
      ];
    case "create_client":
      return ["La empresa es Cinemex.", "El correo es compras@empresa.com.", "Guardar cliente."];
    case "create_task":
      return ["La tarea es revisar pendientes.", "Prioridad alta.", "Asignala a operaciones."];
    default:
      return ["Dame el resumen ejecutivo.", "Abrir cotizaciones.", "Abrir clientes."];
  }
}
