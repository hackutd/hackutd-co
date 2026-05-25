"use client";

import type { ComponentProps, CSSProperties } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";

type ShaderGradientProps = ComponentProps<typeof ShaderGradient> & {
  axesHelper?: string;
  bgColor1?: string;
  bgColor2?: string;
  destination?: string;
  embedMode?: string;
  fov?: number;
  format?: string;
  frameRate?: number;
  gizmoHelper?: string;
  pixelDensity?: number;
};

type BrandShaderBackgroundProps = {
  className?: string;
  lazyLoad?: boolean;
  style?: CSSProperties;
};

const brandShaderGradientProps: Omit<ShaderGradientProps, "animate"> = {
  axesHelper: "off",
  bgColor1: "#000000",
  bgColor2: "#000000",
  brightness: 1.5,
  cAzimuthAngle: 110,
  cDistance: 7.1,
  cPolarAngle: 104,
  cameraZoom: 10.5,
  color1: "#6C17FE",
  color2: "#F31667",
  color3: "#FFA21F",
  destination: "onCanvas",
  embedMode: "off",
  envPreset: "dawn",
  format: "gif",
  fov: 45,
  frameRate: 10,
  gizmoHelper: "hide",
  grain: "on",
  lightType: "3d",
  pixelDensity: 1,
  positionX: 0,
  positionY: -0.05,
  positionZ: 0,
  range: "disabled",
  rangeEnd: 40,
  rangeStart: 0,
  reflection: 0.1,
  rotationX: 28,
  rotationY: -18,
  rotationZ: -32,
  shader: "defaults",
  type: "sphere",
  uAmplitude: 2.2,
  uDensity: 1.7,
  uFrequency: 5.5,
  uSpeed: 0.18,
  uStrength: 0.85,
  uTime: 0,
  wireframe: false,
};

export default function BrandShaderBackground({
  className,
  lazyLoad = false,
  style,
}: BrandShaderBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const wrapperClassName = [
    "pointer-events-none h-full w-full",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div
      className={wrapperClassName}
      style={{ height: "100%", width: "100%", ...style }}
    >
      <ShaderGradientCanvas
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
        pixelDensity={brandShaderGradientProps.pixelDensity}
        fov={brandShaderGradientProps.fov}
        pointerEvents="none"
        lazyLoad={lazyLoad}
      >
        <ShaderGradient
          {...brandShaderGradientProps}
          animate={prefersReducedMotion ? "off" : "on"}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
