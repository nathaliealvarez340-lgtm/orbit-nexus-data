import { ActivationSuccessStatus } from "@/components/commercial/activation-success-status";
import { OrbitBackgroundVideo } from "@/components/ui/orbit-background-video";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 md:px-6">
      <OrbitBackgroundVideo
        primaryOverlayClassName="bg-[radial-gradient(circle_at_center,rgba(10,15,30,0.22),rgba(3,8,20,0.8))]"
        secondaryOverlayClassName="bg-[linear-gradient(135deg,rgba(3,11,27,0.34),rgba(7,19,40,0.58))]"
        videoClassName="saturate-[1.05] contrast-[1.03]"
      />
      <div className="relative z-10 w-full max-w-5xl">
        {sessionId ? (
          <ActivationSuccessStatus sessionId={sessionId} />
        ) : (
          <div className="w-full rounded-[2rem] border border-white/12 bg-slate-950/80 p-8 text-white shadow-[0_28px_80px_rgba(2,6,23,0.42)] backdrop-blur-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Activación comercial
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              No encontramos la sesión de activación
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Regresa a la portada y vuelve a iniciar la activación de tu empresa.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
