export type NexusIntelligenceCategory = "Tendencia" | "Estrategia" | "Riesgo" | "Oportunidad";

export type NexusIntelligenceFeedItem = {
  id: string;
  title: string;
  subtitle: string;
  category: NexusIntelligenceCategory;
  image: string;
  ctaText: string;
};

function createFeedImage(category: string, start: string, end: string, accent: string) {
  const svg = `
    <svg width="1200" height="675" viewBox="0 0 1200 675" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="675" rx="36" fill="#020617"/>
      <rect width="1200" height="675" fill="url(#bg)"/>
      <circle cx="938" cy="142" r="180" fill="${accent}" fill-opacity="0.18"/>
      <circle cx="244" cy="568" r="210" fill="${accent}" fill-opacity="0.12"/>
      <path d="M36 532C188 392 348 358 480 394C612 430 742 538 886 518C984 504 1074 430 1164 320" stroke="white" stroke-opacity="0.12" stroke-width="2"/>
      <path d="M36 578C178 450 326 428 468 456C610 484 738 578 890 558C1010 542 1096 468 1164 390" stroke="${accent}" stroke-opacity="0.32" stroke-width="4"/>
      <g filter="url(#glow)">
        <rect x="72" y="74" width="220" height="56" rx="28" fill="white" fill-opacity="0.08"/>
        <text x="182" y="110" text-anchor="middle" fill="white" fill-opacity="0.95" font-size="24" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">${category.toUpperCase()}</text>
      </g>
      <defs>
        <linearGradient id="bg" x1="92" y1="48" x2="1096" y2="612" gradientUnits="userSpaceOnUse">
          <stop stop-color="${start}"/>
          <stop offset="1" stop-color="${end}"/>
        </linearGradient>
        <filter id="glow" x="36" y="38" width="292" height="128" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
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
  Tendencia: createFeedImage("Tendencia", "#0B1223", "#11284C", "#38BDF8"),
  Estrategia: createFeedImage("Estrategia", "#08111F", "#1D2E5C", "#5EEAD4"),
  Riesgo: createFeedImage("Riesgo", "#120A17", "#2E1B4F", "#A78BFA"),
  Oportunidad: createFeedImage("Oportunidad", "#091422", "#153B63", "#22D3EE")
} as const;

export const leaderIntelligenceFeedItems: NexusIntelligenceFeedItem[] = [
  {
    id: "leader-risk-signals",
    title: "Tres señales tempranas que anticipan cuellos de botella antes de afectar la entrega",
    subtitle: "Detecta saturación, retrasos y dependencia crítica antes de que escalen.",
    category: "Riesgo",
    image: baseImages.Riesgo,
    ctaText: "Ver señal"
  },
  {
    id: "leader-capacity-model",
    title: "Cómo redistribuir capacidad sin perder visibilidad sobre tus proyectos prioritarios",
    subtitle: "Una lectura ejecutiva para decidir con menos fricción y más control operativo.",
    category: "Estrategia",
    image: baseImages.Estrategia,
    ctaText: "Leer análisis"
  },
  {
    id: "leader-demand-trend",
    title: "La demanda operativa ya no se gestiona por intuición: se anticipa con trazabilidad",
    subtitle: "Las organizaciones más ágiles reducen retrasos ajustando carga en tiempo real.",
    category: "Tendencia",
    image: baseImages.Tendencia,
    ctaText: "Explorar tendencia"
  },
  {
    id: "leader-upside-window",
    title: "Estandarizar validaciones puede acelerar aprobaciones sin agregar más reuniones",
    subtitle: "Menos fricción de revisión significa más avance visible para cliente y liderazgo.",
    category: "Oportunidad",
    image: baseImages.Oportunidad,
    ctaText: "Ver oportunidad"
  }
];

export const consultantIntelligenceFeedItems: NexusIntelligenceFeedItem[] = [
  {
    id: "consultant-priority-stack",
    title: "Priorizar entregables con criterio operativo evita retrabajo y mejora tu ritmo de ejecución",
    subtitle: "Organiza foco, capacidad y dependencia para mantener una entrega consistente.",
    category: "Estrategia",
    image: baseImages.Estrategia,
    ctaText: "Leer análisis"
  },
  {
    id: "consultant-risk-load",
    title: "La sobrecarga silenciosa se refleja primero en la calidad antes que en el calendario",
    subtitle: "Aprende a detectar cuándo un frente necesita ayuda antes de perder tracción.",
    category: "Riesgo",
    image: baseImages.Riesgo,
    ctaText: "Ver señal"
  },
  {
    id: "consultant-execution-trend",
    title: "Los consultores con trazabilidad visible aceleran validaciones y generan más confianza",
    subtitle: "La claridad en avances se convierte en ventaja profesional dentro de la operación.",
    category: "Tendencia",
    image: baseImages.Tendencia,
    ctaText: "Explorar tendencia"
  },
  {
    id: "consultant-opportunity-evidence",
    title: "Documentar decisiones clave convierte avances operativos en reputación medible",
    subtitle: "Cada entrega bien contextualizada mejora tu lectura de desempeño y tu impacto.",
    category: "Oportunidad",
    image: baseImages.Oportunidad,
    ctaText: "Ver oportunidad"
  }
];
