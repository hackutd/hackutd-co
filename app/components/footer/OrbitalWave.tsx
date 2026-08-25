import { forwardRef } from "react";
import { FOOTER_ORBITAL_WAVE } from "./sceneConfig";

type OrbitalWaveProps = {
  className?: string;
};

const OrbitalWave = forwardRef<SVGSVGElement, OrbitalWaveProps>(
  function OrbitalWave({ className }, ref) {
    return (
      <svg
        ref={ref}
        aria-hidden="true"
        viewBox={FOOTER_ORBITAL_WAVE.viewBox}
        preserveAspectRatio="none"
        className={className}
      >
        <path d={FOOTER_ORBITAL_WAVE.path} fill="var(--sponsor-panel)" />
      </svg>
    );
  },
);

export default OrbitalWave;
