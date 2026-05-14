export type Language = "es" | "en";

export const DEFAULT_LANGUAGE: Language = "es";

export const languageLabels: Record<Language, string> = {
  es: "Español",
  en: "English"
};

export const translations = {
  es: {
    "common.login": "Iniciar sesión",
    "common.activateCompany": "Activar empresa",
    "common.back": "Volver",
    "common.close": "Cerrar",
    "common.language": "Idioma",
    "home.hero.title": "Opera tu empresa como CEO.",
    "home.hero.subtitle":
      "Centraliza operación, finanzas, clientes, equipo y decisiones en un solo sistema ejecutivo impulsado por IA.",
    "home.card.command.title": "Command Center Ejecutivo",
    "home.card.command.description":
      "Visualiza prioridades, riesgos y métricas clave desde un solo entorno operativo.",
    "home.card.maia.title": "MAIA Assistant",
    "home.card.maia.description":
      "Ejecuta tareas, responde con contexto y guía decisiones estratégicas en tiempo real.",
    "home.card.finance.title": "Finanzas & Control",
    "home.card.finance.description":
      "Gestiona cotizaciones, facturas y datos fiscales dentro de una arquitectura empresarial.",
    "home.card.operation.title": "Operación en tiempo real",
    "home.card.operation.description":
      "Monitorea proyectos, tareas, alertas y actividad operativa sin perder trazabilidad.",
    "activation.trigger": "Activar empresa",
    "activation.intro.badge": "Activación comercial",
    "activation.intro.title": "La infraestructura detrás de empresas que quieren crecer en serio.",
    "activation.intro.subtitle": "Menos caos operativo.\nMás control ejecutivo.",
    "activation.intro.body":
      "Transforma procesos dispersos en una operación alineada, visible y preparada para crecer sin fricción.",
    "activation.intro.panelTitle": "ACTIVA TU ENTORNO OPERATIVO",
    "activation.intro.panelText":
      "La nueva capa operativa para empresas que necesitan estructura, velocidad y control en tiempo real.",
    "activation.intro.viewPlans": "VER PLANES",
    "activation.intro.loginPrompt": "¿Ya tienes código único?",
    "activation.intro.loginLink": "Ir a login",
    "activation.card.guided.title": "Activación guiada",
    "activation.card.guided.text": "Crea tu organización y el primer owner sin fricción.",
    "activation.card.rbac.title": "RBAC flexible",
    "activation.card.rbac.text":
      "Base preparada para owner, admin, finance, operations y usuarios de consulta.",
    "activation.card.system.title": "Sistema ejecutivo",
    "activation.card.system.text":
      "Una capa diseñada para controlar operación, finanzas, reportes y MAIA.",
    "activation.card.fluid.title": "Experiencia fluida",
    "activation.card.fluid.text":
      "Una interfaz premium para activar la empresa con claridad desde el primer ingreso.",
    "activation.plans.step": "Paso 2 · Selección de plan",
    "activation.plans.title": "Elige la capacidad operativa que mejor encaja con tu empresa.",
    "activation.plans.selected": "Plan seleccionado",
    "activation.plans.includes": "Este plan incluye:",
    "activation.plans.continue": "Siguiente",
    "activation.plans.contact": "Contactar",
    "activation.billing.step": "Paso 3 · Configuración mensual",
    "activation.billing.title": "Configura la activación mensual",
    "activation.billing.summary": "Resumen de activación",
    "activation.billing.base": "Precio base",
    "activation.billing.total": "Total mensual",
    "activation.billing.autoNote":
      "Tu entorno se activará automáticamente después de la confirmación.",
    "auth.login.title": "Accede a tu CEO Operating System",
    "auth.login.description":
      "Accede con tu código único empresarial para administrar operación, usuarios, proyectos, métricas, finanzas y MAIA desde un solo entorno seguro.",
    "auth.login.code": "Código único",
    "auth.login.password": "Contraseña",
    "auth.login.recover": "Recuperar acceso",
    "auth.login.submit": "Iniciar sesión",
    "auth.login.submitting": "Ingresando...",
    "auth.login.missing": "Completa tu código único y tu contraseña.",
    "auth.login.invalid": "No pudimos validar tus credenciales. Revisa tu código y contraseña.",
    "auth.login.server":
      "El sistema no pudo conectar con el entorno seguro. Intenta de nuevo en unos segundos.",
    "auth.login.protectedTitle": "ENTORNO PROTEGIDO",
    "auth.login.protectedText":
      "Tu sesión opera bajo autenticación empresarial, permisos internos y validación segura.",
    "auth.login.noCompany": "¿Aún no tienes una empresa activa?",
    "auth.login.admin": "¿Eres administrador?",
    "auth.register.title": "Activa tu empresa en Orbit Nexus",
    "auth.register.description":
      "Crea la organización, el primer owner y el código único para entrar al entorno operativo.",
    "auth.register.company": "Nombre de la empresa",
    "auth.register.owner": "Nombre completo del owner/admin",
    "auth.register.email": "Correo empresarial",
    "auth.register.phone": "Teléfono",
    "auth.register.password": "Contraseña",
    "auth.register.confirmPassword": "Repetir contraseña",
    "auth.register.submit": "Activar empresa",
    "auth.register.submitting": "Activando empresa...",
    "auth.success.title": "¡FELICIDADES!",
    "auth.success.text":
      "Tu empresa se activó correctamente. Ahora podrás disfrutar de los beneficios exclusivos que tenemos para ti.",
    "auth.success.instructions":
      "Para poder ingresar a tu cuenta copia el siguiente código único de autenticación. Es importante que lo guardes en un lugar seguro, ya que es tu clave de acceso a ORBIT NEXUS.",
    "auth.success.codeLabel": "Código único de autenticación",
    "auth.success.copied": "Código copiado correctamente",
    "auth.success.login": "INICIAR SESIÓN",
    "workspace.sidebar.system": "CEO OPERATING SYSTEM",
    "workspace.sidebar.protected":
      "Sesión protegida para decidir, ejecutar y controlar la empresa con contexto seguro.",
    "workspace.sidebar.code": "Código",
    "workspace.sidebar.dashboard": "DASHBOARD",
    "workspace.sidebar.notifications": "NOTIFICACIONES",
    "workspace.sidebar.gmail": "Gmail",
    "workspace.sidebar.orbit": "Orbit",
    "workspace.sidebar.quotes": "COTIZACIONES",
    "workspace.sidebar.newQuote": "Crear nueva cotización",
    "workspace.sidebar.completedQuotes": "Cotizaciones realizadas",
    "workspace.sidebar.drafts": "Borradores",
    "workspace.sidebar.deletedQuotes": "Cotizaciones eliminadas",
    "workspace.sidebar.billing": "FACTURACIÓN",
    "workspace.sidebar.newInvoice": "Crear factura",
    "workspace.sidebar.issuedCfdi": "CFDI emitidos",
    "workspace.sidebar.inProgress": "En proceso",
    "workspace.sidebar.deletedCfdi": "CFDI eliminados",
    "workspace.sidebar.information": "INFORMACIÓN",
    "workspace.sidebar.companyClient": "Empresa / Cliente",
    "workspace.sidebar.tasks": "Tareas",
    "workspace.sidebar.reports": "Reportes",
    "workspace.sidebar.settings": "AJUSTES",
    "workspace.sidebar.account": "CUENTA",
    "workspace.search.placeholder":
      "Buscar módulos, cotizaciones, facturas, clientes o actividad...",
    "footer.copyright":
      "Todos los derechos reservados. Los datos personales y empresariales son protegidos conforme a nuestras políticas de privacidad y seguridad."
  },
  en: {
    "common.login": "Sign in",
    "common.activateCompany": "Activate company",
    "common.back": "Back",
    "common.close": "Close",
    "common.language": "Language",
    "home.hero.title": "Run your company like a CEO.",
    "home.hero.subtitle":
      "Centralize operations, finance, clients, team and decisions in one AI-powered executive system.",
    "home.card.command.title": "Executive Command Center",
    "home.card.command.description":
      "See priorities, risks and key metrics from one operating environment.",
    "home.card.maia.title": "MAIA Assistant",
    "home.card.maia.description":
      "Execute tasks, answer with context and guide strategic decisions in real time.",
    "home.card.finance.title": "Finance & Control",
    "home.card.finance.description":
      "Manage quotes, invoices and tax data inside an enterprise architecture.",
    "home.card.operation.title": "Real-time operations",
    "home.card.operation.description":
      "Monitor projects, tasks, alerts and operational activity without losing traceability.",
    "activation.trigger": "Activate company",
    "activation.intro.badge": "Commercial activation",
    "activation.intro.title": "The infrastructure behind companies that want serious growth.",
    "activation.intro.subtitle": "Less operational chaos.\nMore executive control.",
    "activation.intro.body":
      "Turn scattered processes into an aligned, visible operation prepared to grow without friction.",
    "activation.intro.panelTitle": "ACTIVATE YOUR OPERATING ENVIRONMENT",
    "activation.intro.panelText":
      "The new operating layer for companies that need structure, speed and real-time control.",
    "activation.intro.viewPlans": "VIEW PLANS",
    "activation.intro.loginPrompt": "Already have a unique code?",
    "activation.intro.loginLink": "Go to login",
    "activation.card.guided.title": "Guided activation",
    "activation.card.guided.text": "Create your organization and first owner without friction.",
    "activation.card.rbac.title": "Flexible RBAC",
    "activation.card.rbac.text":
      "Foundation ready for owner, admin, finance, operations and read-only users.",
    "activation.card.system.title": "Executive system",
    "activation.card.system.text":
      "A layer designed to control operations, finance, reports and MAIA.",
    "activation.card.fluid.title": "Fluid experience",
    "activation.card.fluid.text":
      "A premium interface to activate the company clearly from the first entry.",
    "activation.plans.step": "Step 2 · Plan selection",
    "activation.plans.title": "Choose the operating capacity that fits your company.",
    "activation.plans.selected": "Selected plan",
    "activation.plans.includes": "This plan includes:",
    "activation.plans.continue": "Next",
    "activation.plans.contact": "Contact",
    "activation.billing.step": "Step 3 · Monthly setup",
    "activation.billing.title": "Configure monthly activation",
    "activation.billing.summary": "Activation summary",
    "activation.billing.base": "Base price",
    "activation.billing.total": "Monthly total",
    "activation.billing.autoNote":
      "Your environment will activate automatically after confirmation.",
    "auth.login.title": "Access your CEO Operating System",
    "auth.login.description":
      "Sign in with your unique company code to manage operations, users, projects, metrics, finance and MAIA from one secure environment.",
    "auth.login.code": "Unique code",
    "auth.login.password": "Password",
    "auth.login.recover": "Recover access",
    "auth.login.submit": "Sign in",
    "auth.login.submitting": "Signing in...",
    "auth.login.missing": "Enter your unique code and password.",
    "auth.login.invalid": "We could not validate your credentials. Check your code and password.",
    "auth.login.server":
      "The system could not connect to the secure environment. Try again in a few seconds.",
    "auth.login.protectedTitle": "PROTECTED ENVIRONMENT",
    "auth.login.protectedText":
      "Your session runs under enterprise authentication, internal permissions and secure validation.",
    "auth.login.noCompany": "No active company yet?",
    "auth.login.admin": "Are you an administrator?",
    "auth.register.title": "Activate your company in Orbit Nexus",
    "auth.register.description":
      "Create the organization, first owner and unique code to enter the operating environment.",
    "auth.register.company": "Company name",
    "auth.register.owner": "Owner/admin full name",
    "auth.register.email": "Business email",
    "auth.register.phone": "Phone",
    "auth.register.password": "Password",
    "auth.register.confirmPassword": "Repeat password",
    "auth.register.submit": "Activate company",
    "auth.register.submitting": "Activating company...",
    "auth.success.title": "CONGRATULATIONS!",
    "auth.success.text":
      "Your company was activated successfully. You can now enjoy the exclusive benefits we have for you.",
    "auth.success.instructions":
      "To access your account, copy the following unique authentication code. Keep it somewhere safe, as it is your access key to ORBIT NEXUS.",
    "auth.success.codeLabel": "Unique authentication code",
    "auth.success.copied": "Code copied successfully",
    "auth.success.login": "SIGN IN",
    "workspace.sidebar.system": "CEO OPERATING SYSTEM",
    "workspace.sidebar.protected":
      "Protected session to decide, execute and control the company with secure context.",
    "workspace.sidebar.code": "Code",
    "workspace.sidebar.dashboard": "DASHBOARD",
    "workspace.sidebar.notifications": "NOTIFICATIONS",
    "workspace.sidebar.gmail": "Gmail",
    "workspace.sidebar.orbit": "Orbit",
    "workspace.sidebar.quotes": "QUOTES",
    "workspace.sidebar.newQuote": "Create new quote",
    "workspace.sidebar.completedQuotes": "Completed quotes",
    "workspace.sidebar.drafts": "Drafts",
    "workspace.sidebar.deletedQuotes": "Deleted quotes",
    "workspace.sidebar.billing": "BILLING",
    "workspace.sidebar.newInvoice": "Create invoice",
    "workspace.sidebar.issuedCfdi": "Issued CFDI",
    "workspace.sidebar.inProgress": "In progress",
    "workspace.sidebar.deletedCfdi": "Deleted CFDI",
    "workspace.sidebar.information": "INFORMATION",
    "workspace.sidebar.companyClient": "Company / Client",
    "workspace.sidebar.tasks": "Tasks",
    "workspace.sidebar.reports": "Reports",
    "workspace.sidebar.settings": "SETTINGS",
    "workspace.sidebar.account": "ACCOUNT",
    "workspace.search.placeholder": "Search modules, quotes, invoices, clients or activity...",
    "footer.copyright":
      "All rights reserved. Personal and business data is protected according to our privacy and security policies."
  }
} as const;

export type TranslationKey = keyof typeof translations.es;
