import type { AppRoleKey, RegistrableRoleKey } from "@/types/auth";

export const APP_NAME = "Orbit Nexus";
export const AUTH_COOKIE_NAME = "orbit_nexus_session";

export const ROLE_LABELS: Record<AppRoleKey, string> = {
  SUPERADMIN: "Superadmin",
  LEADER: "Lider",
  CONSULTANT: "Consultor",
  CLIENT: "Cliente"
};

export const ROLE_DESCRIPTIONS: Record<RegistrableRoleKey, string> = {
  LEADER: "Crea proyectos, gestiona consultores y supervisa la operacion de su empresa.",
  CONSULTANT: "Recibe proyectos, reporta avances y colabora directamente con el cliente.",
  CLIENT: "Da seguimiento al proyecto, revisa avances y valida entregables."
};

export const ACCESS_CODE_PREFIXES: Record<
  Extract<AppRoleKey, "LEADER" | "CONSULTANT" | "CLIENT">,
  string
> = {
  LEADER: "LDR",
  CONSULTANT: "CDN",
  CLIENT: "CLT"
};

export const UNAUTHORIZED_DIRECTORY_MESSAGE =
  "Tu nombre no aparece en la base autorizada para este tipo de usuario. Verifica la informacion o contacta al administrador de la plataforma.";

export const INVALID_PROJECT_FOLIO_MESSAGE =
  "El folio del proyecto no es valido para registrar un cliente. Verifica el folio o solicita apoyo al lider del proyecto.";

export const ALREADY_REGISTERED_MESSAGE =
  "Este usuario ya fue registrado en la plataforma. Inicia sesion con tu codigo unico o solicita apoyo al administrador.";

export const AMBIGUOUS_DIRECTORY_MATCH_MESSAGE =
  "Se encontraron multiples coincidencias para este usuario en empresas distintas. Contacta al administrador de la plataforma para validar tu empresa.";

export const AUTH_INVALID_CREDENTIALS_MESSAGE =
  "Codigo de acceso o contrasena incorrectos.";

export const AUTH_PENDING_ACTIVATION_MESSAGE =
  "Tu usuario aun no ha sido activado. Completa tu registro o contacta al administrador de la plataforma.";

export const AUTH_DISABLED_USER_MESSAGE =
  "Tu usuario fue deshabilitado. Contacta al administrador de la plataforma para reactivar el acceso.";

export const TENANT_ACCESS_DENIED_MESSAGE =
  "No tienes permisos para acceder a la informacion de esta empresa.";
