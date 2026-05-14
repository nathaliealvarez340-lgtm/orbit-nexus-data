export const ORBIT_AI_WAKE_WORD = "MAIA";

export const ORBIT_AI_WAKE_WORD_VARIANTS = [
  "maia",
  "maya",
  "hey maia",
  "hey maya",
  "oye maia",
  "oye maya"
] as const;

export const orbitAiVoiceFutureProviders = [
  "Web Speech API",
  "OpenAI Whisper",
  "Deepgram",
  "ElevenLabs",
  "OpenAI TTS"
] as const;

export const orbitAiVoiceFutureEnvVars = [
  "OPENAI_API_KEY",
  "DEEPGRAM_API_KEY",
  "ELEVENLABS_API_KEY",
  "ORBIT_AI_VOICE_ENABLED",
  "ORBIT_AI_WAKE_WORD_ENABLED",
  "ORBIT_AI_TTS_PROVIDER",
  "ORBIT_AI_STT_PROVIDER"
] as const;

export const orbitAiVoiceSecurityPolicy = {
  explicitConsentRequired: true,
  passiveListeningEnabled: false,
  wakeWord: ORBIT_AI_WAKE_WORD,
  criticalActionRequiresConfirmation: true,
  allowedInitialActions: ["transcribe", "ask_orbit_ai", "summarize", "recommend"],
  blockedWithoutConfirmation: [
    "delete_users",
    "delete_projects",
    "issue_invoices",
    "change_permissions",
    "send_external_information",
    "modify_critical_financial_data"
  ]
} as const;
