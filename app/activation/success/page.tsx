import { ActivationSuccessStatus } from "@/components/commercial/activation-success-status";

type ActivationSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function ActivationSuccessPage({
  searchParams
}: ActivationSuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id ?? "";

  return (
    <main className="container flex min-h-screen items-center justify-center py-10">
      {sessionId ? (
        <ActivationSuccessStatus sessionId={sessionId} />
      ) : (
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/12 bg-slate-950/80 p-8 text-white shadow-[0_28px_80px_rgba(2,6,23,0.42)] backdrop-blur-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
            Activacion comercial
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            No encontramos la sesion de activacion
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Regresa a la portada y vuelve a iniciar la activacion de tu empresa.
          </p>
        </div>
      )}
    </main>
  );
}
