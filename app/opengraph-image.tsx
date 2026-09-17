import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt =
  "HackUTD — North America's Largest 24-Hour University Hackathon";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
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
            color: "#a3a3a3",
            display: "flex",
            fontSize: 24,
            fontWeight: 400,
          }}
        >
          hackutd.co · The University of Texas at Dallas
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
