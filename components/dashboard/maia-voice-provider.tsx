"use client";

import {
  AlertTriangle,
  Loader2,
  Mic,
  MicOff,
  Radio,
  Volume2
} from "lucide-react";
import type { Route } from "next";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  ORBIT_AI_WAKE_WORD,
  ORBIT_AI_WAKE_WORD_VARIANTS
} from "@/lib/services/orbit-ai/voice-config";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";

type MaiaVoiceState =
  | "idle"
  | "permission_required"
  | "listening_for_wake_word"
  | "wake_word_detected"
  | "conversation_active"
  | "processing"
  | "speaking"
  | "error"
  | "muted";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type MaiaVoiceContextValue = {
  state: MaiaVoiceState;
  isSupported: boolean;
  transcript: string;
  errorMessage: string | null;
  start: () => Promise<void>;
  stop: () => void;
};

type MaiaVoiceProviderProps = {
  session: SessionUser;
  children: React.ReactNode;
};

type MaiaVoiceAction = {
  type: "navigate" | "navigate_and_start_flow" | "start_flow" | "prepare_draft";
  intent: string;
  route: string;
  action?: string;
  message: string;
};

const MaiaVoiceContext = createContext<MaiaVoiceContextValue | null>(null);

const ACTIVE_TIMEOUT_MS = 45000;
const RESTART_DELAY_MS = 650;
const SENSITIVE_ACTION_TOKENS = [
  "emitir factura",
  "timbrar",
  "borrar usuario",
  "eliminar usuario",
  "cambiar permisos",
  "eliminar cliente",
  "cancelar factura",
  "enviar correo"
];

function devLog(event: string, metadata?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[MAIA Voice] ${event}`, metadata ?? {});
  }
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as WindowWithSpeechRecognition;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function normalizeVoiceText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function containsWakeWord(value: string) {
  const normalized = normalizeVoiceText(value);
  return ORBIT_AI_WAKE_WORD_VARIANTS.some((variant) => normalized.includes(variant));
}

function stripWakeWord(value: string) {
  let cleaned = normalizeVoiceText(value);

  for (const variant of ORBIT_AI_WAKE_WORD_VARIANTS) {
    cleaned = cleaned.replace(variant, "").trim();
  }

  return cleaned;
}

function containsSensitiveAction(value: string) {
  const normalized = normalizeVoiceText(value);
  return SENSITIVE_ACTION_TOKENS.some((token) => normalized.includes(token));
}

function getStateLabel(state: MaiaVoiceState) {
  switch (state) {
    case "permission_required":
      return "Permitir micrófono";
    case "listening_for_wake_word":
      return `Escuchando ${ORBIT_AI_WAKE_WORD}`;
    case "wake_word_detected":
      return "MAIA detectada";
    case "conversation_active":
      return "MAIA activa";
    case "processing":
      return "Pensando";
    case "speaking":
      return "Respondiendo";
    case "error":
      return "Voz no disponible";
    case "muted":
      return "Voz pausada";
    default:
      return "Voz lista";
  }
}

function getStateIcon(state: MaiaVoiceState) {
  switch (state) {
    case "listening_for_wake_word":
    case "conversation_active":
    case "wake_word_detected":
      return <Radio className="h-4 w-4 text-cyan-200" />;
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />;
    case "speaking":
      return <Volume2 className="h-4 w-4 text-cyan-200" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-amber-200" />;
    case "muted":
      return <MicOff className="h-4 w-4 text-slate-300" />;
    default:
      return <Mic className="h-4 w-4 text-cyan-200" />;
  }
}

export function useVoiceAssistant() {
  const context = useContext(MaiaVoiceContext);

  if (!context) {
    throw new Error("useVoiceAssistant must be used within MaiaVoiceProvider.");
  }

  return context;
}

export function MaiaVoiceProvider({ session, children }: MaiaVoiceProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stateRef = useRef<MaiaVoiceState>("permission_required");
  const activeTimeoutRef = useRef<number | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const isManualStopRef = useRef(false);
  const shouldListenRef = useRef(false);
  const [state, setState] = useState<MaiaVoiceState>("permission_required");
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const firstName = useMemo(
    () => session.fullName.trim().split(/\s+/)[0] ?? "Nathalie",
    [session.fullName]
  );

  useEffect(() => {
    const speechSupported = Boolean(getSpeechRecognitionConstructor());
    setIsSupported(speechSupported);
    devLog("speechSupported", { speechSupported });

    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.abort();

      if (activeTimeoutRef.current) {
        window.clearTimeout(activeTimeoutRef.current);
      }

      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  function changeState(nextState: MaiaVoiceState) {
    stateRef.current = nextState;
    setState(nextState);
  }

  function resetConversationTimer() {
    if (activeTimeoutRef.current) {
      window.clearTimeout(activeTimeoutRef.current);
    }

    activeTimeoutRef.current = window.setTimeout(() => {
      if (stateRef.current !== "muted" && stateRef.current !== "error") {
        changeState("listening_for_wake_word");
      }
    }, ACTIVE_TIMEOUT_MS);
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    devLog("speechSynthesisStarted");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.onend = () => {
      devLog("speechSynthesisEnded");

      if (stateRef.current === "speaking") {
        changeState("conversation_active");
        resetConversationTimer();
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  function activateConversation() {
    devLog("wakeWordDetected");
    changeState("wake_word_detected");
    window.setTimeout(() => {
      devLog("conversationActive");
      changeState("speaking");
      speak(`Hola ${firstName}, ¿cómo puedo ayudarte hoy?`);
    }, 160);
    resetConversationTimer();
  }

  function handleVoiceAction(action: MaiaVoiceAction) {
    if (action.intent === "create_quote" || action.action === "new_quote") {
      window.dispatchEvent(new CustomEvent("maia:open"));
      window.dispatchEvent(new CustomEvent("maia:quote:new"));

      if (!pathname.startsWith("/workspace/quotes")) {
        try {
          window.sessionStorage.setItem("maia-open-after-navigation", "1");
        } catch {
          // Navigation still works if session storage is unavailable.
        }
        router.push("/workspace/quotes?maiaAction=new_quote" as Route);
      }

      return;
    }

    if (action.route) {
      router.push(action.route as Route);
    }
  }

  async function askOrbitAi(question: string) {
    const cleanedQuestion = question.trim();

    if (!cleanedQuestion) {
      return;
    }

    if (containsSensitiveAction(cleanedQuestion)) {
      changeState("speaking");
      speak("Necesito confirmación antes de ejecutar esta acción.");
      return;
    }

    devLog("commandSentToOrbitAI");
    changeState("processing");

    try {
      const response = await fetch("/api/orbit-ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: cleanedQuestion,
          inputMode: "voice",
          routePath: pathname,
          contextLabel: "MAIA Voice"
        })
      });
      const payload = (await response.json()) as {
        data?: {
          text: string;
          action?: MaiaVoiceAction;
        };
        message?: string;
      };

      if (!response.ok || !payload.data?.text) {
        throw new Error(payload.message ?? "No pude consultar MAIA.");
      }

      if (payload.data.action) {
        handleVoiceAction(payload.data.action);
      }

      changeState("speaking");
      speak(payload.data.text);
    } catch {
      setErrorMessage("No pude completar la consulta por voz. Puedes usar el chat por texto.");
      changeState("conversation_active");
      resetConversationTimer();
    }
  }

  function createRecognition() {
    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setErrorMessage("Tu navegador no soporta voz continua. Usa MAIA por texto.");
      changeState("error");
      return null;
    }

    const recognition = new Recognition();
    recognition.lang = "es-MX";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      devLog("recognitionStarted");

      if (stateRef.current === "permission_required" || stateRef.current === "idle") {
        changeState("listening_for_wake_word");
      }
    };
    recognition.onerror = (event) => {
      const recognitionError = event.error ?? "unknown";
      devLog("recognitionError", { recognitionError });

      if (recognitionError === "not-allowed" || recognitionError === "service-not-allowed") {
        shouldListenRef.current = false;
        setErrorMessage("Activa el permiso de micrófono para escuchar MAIA.");
        changeState("error");
        return;
      }

      if (recognitionError === "audio-capture") {
        shouldListenRef.current = false;
        setErrorMessage("No encontré un micrófono disponible. Usa MAIA por texto.");
        changeState("error");
        return;
      }

      setErrorMessage(
        "La escucha continua depende del navegador. Puedes usar el botón para hablar con MAIA."
      );

      if (shouldListenRef.current && stateRef.current !== "muted") {
        changeState(
          stateRef.current === "conversation_active"
            ? "conversation_active"
            : "listening_for_wake_word"
        );
      }
    };
    recognition.onend = () => {
      devLog("recognitionEnded");
      recognitionRef.current = null;

      if (
        !shouldListenRef.current ||
        isManualStopRef.current ||
        stateRef.current === "muted" ||
        stateRef.current === "error"
      ) {
        return;
      }

      restartTimeoutRef.current = window.setTimeout(() => {
        devLog("recognitionRestarted");
        startRecognitionLoop();
      }, RESTART_DELAY_MS);
    };
    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      const spokenText = (finalTranscript || interimTranscript).trim();
      setTranscript(spokenText);

      if (spokenText) {
        devLog("transcript", { transcript: spokenText });
      }

      if (!finalTranscript.trim()) {
        return;
      }

      const currentState = stateRef.current;

      if (currentState === "listening_for_wake_word" && containsWakeWord(finalTranscript)) {
        activateConversation();
        const commandAfterWakeWord = stripWakeWord(finalTranscript);

        if (commandAfterWakeWord.length > 2) {
          void askOrbitAi(commandAfterWakeWord);
        }
        return;
      }

      if (currentState === "conversation_active") {
        resetConversationTimer();
        void askOrbitAi(finalTranscript);
      }
    };

    return recognition;
  }

  function startRecognitionLoop() {
    const recognition = createRecognition();

    if (!recognition) {
      return;
    }

    try {
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setErrorMessage("No pude reiniciar el micrófono. Usa el botón para hablar con MAIA.");
      changeState("error");
    }
  }

  async function start() {
    if (!isSupported) {
      setErrorMessage("Tu navegador no soporta voz continua. Usa MAIA por texto.");
      changeState("error");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Tu navegador no permite solicitar micrófono. Usa MAIA por texto.");
      changeState("error");
      return;
    }

    if (recognitionRef.current) {
      return;
    }

    try {
      devLog("micPermissionRequested");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      devLog("micPermissionGranted");

      shouldListenRef.current = true;
      isManualStopRef.current = false;
      setErrorMessage(null);
      changeState("listening_for_wake_word");
      startRecognitionLoop();
    } catch {
      shouldListenRef.current = false;
      setErrorMessage("No pude iniciar el micrófono. Revisa permisos del navegador.");
      changeState("error");
    }
  }

  function stop() {
    shouldListenRef.current = false;
    isManualStopRef.current = true;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    changeState("muted");
  }

  const contextValue = useMemo(
    () => ({
      state,
      isSupported,
      transcript,
      errorMessage,
      start,
      stop
    }),
    [errorMessage, isSupported, start, state, stop, transcript]
  );

  return <MaiaVoiceContext.Provider value={contextValue}>{children}</MaiaVoiceContext.Provider>;
}

export function MaiaVoiceStatus() {
  const { state, isSupported, transcript, errorMessage, start, stop } = useVoiceAssistant();
  const isActive = state !== "permission_required" && state !== "muted" && state !== "error";

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-slate-950/88 px-3 py-3 text-xs text-slate-300 shadow-[0_18px_55px_rgba(2,6,23,0.38)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {getStateIcon(state)}
          <span className="font-semibold uppercase tracking-[0.16em] text-slate-400">
            {getStateLabel(state)}
          </span>
        </div>
        <Button
          className={cn(
            "h-8 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-[11px] text-slate-200 hover:bg-white/[0.08]",
            isActive && "border-cyan-400/25 bg-cyan-500/10 text-cyan-100"
          )}
          disabled={!isSupported && state !== "error"}
          type="button"
          variant="outline"
          onClick={isActive ? stop : () => void start()}
        >
          {isActive ? "Detener" : state === "muted" || state === "error" ? "Reactivar" : "Permitir"}
        </Button>
      </div>
      <p className="mt-2 leading-5 text-slate-400">
        {isSupported
          ? `Di "${ORBIT_AI_WAKE_WORD}" para activar conversación.`
          : "Tu navegador no soporta voz continua. Usa MAIA por texto."}
      </p>
      {transcript && isActive ? (
        <p className="mt-2 line-clamp-2 rounded-xl border border-cyan-400/15 bg-cyan-500/10 px-2 py-2 text-cyan-100">
          {transcript}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-2 rounded-xl border border-amber-400/15 bg-amber-500/10 px-2 py-2 text-amber-100">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
