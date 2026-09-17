import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt =
  "HackUTD — North America's Largest 24-Hour University Hackathon";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const gradient = await readFile(
    path.join(process.cwd(), "app/assets/background/section-gradient.png"),
  );
  const gradientSrc = `data:image/png;base64,${gradient.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          color: "#1a1a1a",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 770,
            left: -80,
            opacity: 0.8,
            position: "absolute",
            bottom: -160,
            width: 1500,
          }}
        >
          <img
            alt=""
            src={gradientSrc}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
            padding: "72px",
            position: "relative",
            width: "100%",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", fontSize: 112, fontWeight: 700 }}>
            HackUTD
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 42,
              fontWeight: 400,
              maxWidth: 900,
            }}
          >
            North America&apos;s Largest 24-Hour University Hackathon
          </div>
          <div
            style={{
              color: "#5f5f5f",
              display: "flex",
              fontSize: 24,
              fontWeight: 400,
            }}
          >
            hackutd.co · The University of Texas at Dallas
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
