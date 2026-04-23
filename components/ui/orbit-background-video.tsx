import { ORBIT_BACKGROUND_VIDEO_URL } from "@/lib/ui/background-media";
import { cn } from "@/lib/utils";

type OrbitBackgroundVideoProps = {
  className?: string;
  videoClassName?: string;
  primaryOverlayClassName?: string;
  secondaryOverlayClassName?: string;
  patternClassName?: string;
};

export function OrbitBackgroundVideo({
  className,
  videoClassName,
  primaryOverlayClassName,
  secondaryOverlayClassName,
  patternClassName
}: OrbitBackgroundVideoProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <video
        className={cn("absolute inset-0 h-full w-full object-cover object-center", videoClassName)}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src={ORBIT_BACKGROUND_VIDEO_URL} type="video/mp4" />
      </video>
      <div
        className={cn(
          "absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,15,30,0.34),rgba(3,8,20,0.86))]",
          primaryOverlayClassName
        )}
      />
      <div
        className={cn(
          "absolute inset-0 bg-[linear-gradient(135deg,rgba(3,11,27,0.48),rgba(7,19,40,0.68))]",
          secondaryOverlayClassName
        )}
      />
      <div
        className={cn(
          "absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:42px_42px]",
          patternClassName
        )}
      />
    </div>
  );
}
