"use client";

import { AlertTriangle, Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ORBIT_AI_WAKE_WORD } from "@/lib/services/orbit-ai/voice-config";
import { cn } from "@/lib/utils";

export type OrbitAiVoiceStatus = "idle" | "listening" | "processing" | "speaking" | "error";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
  confidence?: number;
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

type OrbitAiVoiceControlProps = {
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  onStatusChange?: (status: OrbitAiVoiceStatus) => void;
  onTranscript: (transcript: string) => Promise<void> | void;
};

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as WindowWithSpeechRecognition;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function getStatusLabel(status: OrbitAiVoiceStatus) {
  switch (status) {
    case "listening":
      return "Escuchando";
    case "processing":
      return "Procesando";
    case "speaking":
      return "Respondiendo";
    case "error":
      return "Error de voz";
    default:
      return "Voz lista";
  }
}

function getStatusIcon(status: OrbitAiVoiceStatus) {
  switch (status) {
    case "listening":
      return <MicOff className="h-4 w-4 text-cyan-200" />;
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />;
    case "speaking":
      return <Volume2 className="h-4 w-4 text-cyan-200" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-amber-200" />;
    default:
      return <Mic className="h-4 w-4 text-cyan-200" />;
  }
}

export function OrbitAiVoiceControl({
  className,
  compact = false,
  disabled = false,
  onStatusChange,
  onTranscript
}: OrbitAiVoiceControlProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [status, setStatus] = useState<OrbitAiVoiceStatus>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionConstructor()));

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function changeStatus(nextStatus: OrbitAiVoiceStatus) {
    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
  }

  async function handleFinalTranscript(nextTranscript: string) {
    const cleanedTranscript = nextTranscript.trim();

    if (!cleanedTranscript) {
      changeStatus("idle");
      return;
    }

    changeStatus("processing");

    try {
      await onTranscript(cleanedTranscript);
      changeStatus("speaking");
      window.setTimeout(() => changeStatus("idle"), 700);
    } catch {
      setErrorMessage("No pude enviar la transcripcion a MAIA Executive Agent.");
      changeStatus("error");
    }
  }

  function startListening() {
    if (disabled) {
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setErrorMessage("Tu navegador no soporta transcripcion por Web Speech API.");
      changeStatus("error");
      return;
    }

    setErrorMessage(null);
    setTranscript("");

    const recognition = new Recognition();
    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => changeStatus("listening");
    recognition.onerror = (event) => {
      setErrorMessage(
        event.error === "not-allowed"
          ? "Activa el permiso de microfono para usar MAIA Executive Agent."
          : "No pude capturar audio. Intenta de nuevo."
      );
      changeStatus("error");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus((currentStatus) => (currentStatus === "listening" ? "idle" : currentStatus));
    };
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      setTranscript((finalTranscript || interimTranscript).trim());

      if (finalTranscript.trim()) {
        recognition.stop();
        void handleFinalTranscript(finalTranscript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    changeStatus("idle");
  }

  const content = (
    <>
      {getStatusIcon(status)}
      {!compact ? <span>{status === "listening" ? "Detener" : "Hablar con Orbit"}</span> : null}
    </>
  );

  if (compact) {
    return (
      <Button
        aria-label={status === "listening" ? "Detener escucha de MAIA Executive Agent" : "Activar microfono de MAIA Executive Agent"}
        className={cn(
          "h-11 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-slate-100 hover:bg-white/[0.08]",
          status === "listening" && "border-cyan-400/35 bg-cyan-500/15",
          className
        )}
        disabled={disabled || status === "processing"}
        type="button"
        variant="outline"
        onClick={status === "listening" ? stopListening : startListening}
      >
        {content}
      </Button>
    );
  }

  return (
    <div className={cn("rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            MAIA Executive Agent
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {isSupported
              ? `${getStatusLabel(status)}. Wake word futura: "${ORBIT_AI_WAKE_WORD}".`
              : "Tu navegador no soporta Web Speech API; la arquitectura queda lista para Whisper o Deepgram."}
          </p>
        </div>
        <Button
          className={cn(
            "rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]",
            status === "listening" && "border-cyan-400/35 bg-cyan-500/15"
          )}
          disabled={disabled || status === "processing"}
          type="button"
          variant="outline"
          onClick={status === "listening" ? stopListening : startListening}
        >
          {content}
        </Button>
      </div>

      {status === "listening" || transcript ? (
        <div className="mt-3 rounded-[1rem] border border-cyan-400/15 bg-cyan-500/10 px-3 py-3 text-sm leading-6 text-cyan-50">
          {transcript || "Escuchando una sola consulta. No hay escucha permanente."}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-3 rounded-[1rem] border border-amber-400/15 bg-amber-500/10 px-3 py-3 text-sm leading-6 text-amber-100">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
