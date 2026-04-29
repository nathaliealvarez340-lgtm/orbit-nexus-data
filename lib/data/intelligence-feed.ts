export type NexusIntelligenceCategory =
  | "Riesgo"
  | "Productividad"
  | "Talento"
  | "Mercado"
  | "Operacion";

export type NexusIntelligenceSourceType = "internal" | "external";

export type NexusIntelligenceFeedItem = {
  id: string;
  title: string;
  subtitle: string;
  category: NexusIntelligenceCategory;
  image: string;
  ctaText: string;
  sourceType: NexusIntelligenceSourceType;
  sourceName: string;
  publishedAt: string;
  confidence: number;
  actionableInsight: string;
  recommendedAction: string;
  expectedImpact: string;
};

function createFeedImage(category: string, start: string, end: string, accent: string) {
  const svg = `
    <svg width="1200" height="675" viewBox="0 0 1200 675" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="675" rx="36" fill="#020617"/>
      <rect width="1200" height="675" fill="url(#bg)"/>
      <circle cx="946" cy="148" r="182" fill="${accent}" fill-opacity="0.18"/>
      <circle cx="248" cy="564" r="214" fill="${accent}" fill-opacity="0.12"/>
      <path d="M38 540C198 402 360 370 496 406C632 442 764 548 908 528C1006 514 1092 440 1166 334" stroke="white" stroke-opacity="0.12" stroke-width="2"/>
      <path d="M42 586C188 456 334 434 474 462C614 490 742 584 896 564C1010 550 1098 478 1166 396" stroke="${accent}" stroke-opacity="0.32" stroke-width="4"/>
      <g filter="url(#glow)">
        <rect x="76" y="74" width="252" height="56" rx="28" fill="white" fill-opacity="0.08"/>
        <text x="202" y="110" text-anchor="middle" fill="white" fill-opacity="0.95" font-size="24" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">${category.toUpperCase()}</text>
      </g>
      <defs>
        <linearGradient id="bg" x1="92" y1="48" x2="1096" y2="612" gradientUnits="userSpaceOnUse">
          <stop stop-color="${start}"/>
          <stop offset="1" stop-color="${end}"/>
        </linearGradient>
        <filter id="glow" x="36" y="38" width="332" height="128" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur_1_2"/>
        </filter>
      </defs>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const baseImages = {
  Riesgo: createFeedImage("Riesgo", "#120A17", "#2E1B4F", "#A78BFA"),
  Productividad: createFeedImage("Productividad", "#091422", "#153B63", "#22D3EE"),
  Talento: createFeedImage("Talento", "#0B1223", "#11284C", "#38BDF8"),
  Mercado: createFeedImage("Mercado", "#111827", "#1F3A5F", "#60A5FA"),
  Operacion: createFeedImage("Operacion", "#08111F", "#1D2E5C", "#5EEAD4")
} as const;

export const leaderIntelligenceFeedItems: NexusIntelligenceFeedItem[] = [
  {
    id: "leader-risk-capacity",
    title: "La combinacion entre capacidad parcial y avance bajo suele anticipar los bloqueos mas costosos",
    subtitle: "Insight operativo",
    category: "Riesgo",
    image: baseImages.Riesgo,
    ctaText: "Ver analisis",
    sourceType: "internal",
    sourceName: "Orbit Nexus Intelligence",
    publishedAt: "2026-04-29T09:00:00.000Z",
    confidence: 92,
    actionableInsight:
      "Los frentes con menos de 60% de avance y cobertura parcial de consultores muestran mayor probabilidad de escalacion.",
    recommendedAction:
      "Prioriza reasignacion o seguimiento ejecutivo antes de abrir un nuevo frente sobre el mismo equipo.",
    expectedImpact: "Menor riesgo de retraso y mejor visibilidad de capacidad real."
  },
  {
    id: "leader-productivity-validation",
    title: "Estandarizar validaciones reduce friccion y acelera aprobaciones sin inflar reuniones",
    subtitle: "Insight operativo",
    category: "Productividad",
    image: baseImages.Productividad,
    ctaText: "Aplicar recomendacion",
    sourceType: "internal",
    sourceName: "Orbit Nexus Intelligence",
    publishedAt: "2026-04-29T09:20:00.000Z",
    confidence: 88,
    actionableInsight:
      "Los equipos que definen checkpoints fijos por entregable cierran comentarios en menos ciclos y con menos retrabajo.",
    recommendedAction:
      "Agrupa validaciones por hito y deja un criterio de aprobacion claro antes de la siguiente entrega.",
    expectedImpact: "Mas velocidad de aprobacion y menos desgaste del lider."
  },
  {
    id: "leader-talent-load",
    title: "La carga alta sostenida primero deteriora calidad y luego cumplimiento",
    subtitle: "Insight operativo",
    category: "Talento",
    image: baseImages.Talento,
    ctaText: "Ver analisis",
    sourceType: "internal",
    sourceName: "Orbit Nexus Intelligence",
    publishedAt: "2026-04-29T09:40:00.000Z",
    confidence: 86,
    actionableInsight:
      "Cuando un consultor supera 75% de ocupacion por varios ciclos, la calidad empieza a ceder antes de que el calendario lo refleje.",
    recommendedAction:
      "Revisa a tiempo proximas asignaciones y evita cargar mas trabajo sin reequilibrar prioridades.",
    expectedImpact: "Mayor estabilidad en entregables y menor riesgo de rechazo."
  },
  {
    id: "leader-market-execution",
    title: "Las organizaciones con trazabilidad ejecutiva reaccionan mas rapido que las que operan por intuicion",
    subtitle: "Fuente preparada para integracion externa",
    category: "Mercado",
    image: baseImages.Mercado,
    ctaText: "Ver analisis",
    sourceType: "external",
    sourceName: "Future market feed",
    publishedAt: "2026-04-29T10:00:00.000Z",
    confidence: 64,
    actionableInsight:
      "Este espacio quedo listo para conectar noticias externas o RSS sin simular informacion real en produccion.",
    recommendedAction:
      "Mientras no exista una fuente externa activa, usa esta tarjeta como recordatorio para contrastar tus procesos contra senales de mercado reales.",
    expectedImpact: "Arquitectura preparada para comparativos operativos con contexto externo."
  },
  {
    id: "leader-operation-bottleneck",
    title: "Los cuellos de botella repetidos suelen concentrarse en los mismos pasos del flujo operativo",
    subtitle: "Insight operativo",
    category: "Operacion",
    image: baseImages.Operacion,
    ctaText: "Aplicar recomendacion",
    sourceType: "internal",
    sourceName: "Orbit Nexus Intelligence",
    publishedAt: "2026-04-29T10:18:00.000Z",
    confidence: 90,
    actionableInsight:
      "Cuando un mismo paso aparece como bloqueo en varios proyectos, conviene intervenir proceso antes que personas.",
    recommendedAction:
      "Revisa handoffs, dependencias y aprobaciones intermedias antes de sumar mas capacidad al problema.",
    expectedImpact: "Mejor throughput y menos friccion entre areas."
  }
];

export const consultantIntelligenceFeedItems: NexusIntelligenceFeedItem[] = [
  {
    id: "consultant-productivity-focus",
    title: "Un entregable bien priorizado vale mas que tres avances dispersos sin narrativa",
    subtitle: "Insight operativo",
    category: "Productividad",
    image: baseImages.Productividad,
    ctaText: "Aplicar recomendacion",
    sourceType: "internal",
    sourceName: "Orbit Nexus Intelligence",
    publishedAt: "2026-04-29T09:10:00.000Z",
    confidence: 89,
    actionableInsight:
      "La ejecucion mejora cuando el consultor resuelve primero la entrega que desbloquea al lider o al cliente.",
    recommendedAction:
      "Ordena tu jornada por impacto operativo y no solo por fecha o volumen de tareas.",
    expectedImpact: "Mas claridad en validaciones y mejor uso de capacidad."
  },
  {
    id: "consultant-risk-overload",
    title: "La sobrecarga silenciosa se detecta antes en calidad que en calendario",
    subtitle: "Insight operativo",
    category: "Riesgo",
    image: baseImages.Riesgo,
    ctaText: "Ver analisis",
    sourceType: "internal",
    sourceName: "Orbit Nexus Intelligence",
    publishedAt: "2026-04-29T09:32:00.000Z",
    confidence: 84,
    actionableInsight:
      "Si tu respuesta se vuelve mas lenta y las correcciones aumentan, probablemente ya entraste en una zona de carga delicada.",
    recommendedAction:
      "Abre una conversacion temprana con liderazgo antes de que el riesgo se convierta en retraso visible.",
    expectedImpact: "Menos retrabajo y mejor control del ritmo operativo."
  },
  {
    id: "consultant-talent-traceability",
    title: "La trazabilidad visible fortalece tu reputacion interna mas rapido que la velocidad aislada",
    subtitle: "Insight operativo",
    category: "Talento",
    image: baseImages.Talento,
    ctaText: "Ver analisis",
    sourceType: "internal",
    sourceName: "Orbit Nexus Intelligence",
    publishedAt: "2026-04-29T09:54:00.000Z",
    confidence: 87,
    actionableInsight:
      "Los perfiles con mejor avance visible y contexto claro suelen ser validados con menos friccion por liderazgo y cliente.",
    recommendedAction:
      "Documenta decisiones clave, bloqueos y siguiente paso en cada entrega importante.",
    expectedImpact: "Mayor confianza, menos ida y vuelta y mejor lectura de desempeno."
  }
];
