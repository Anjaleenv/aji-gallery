import { ImageResponse } from "next/og";

export const alt = "Aji Construction — Building the Future";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(145deg, #0a0c10 0%, #1a222d 45%, #0a0c10 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              width: 88,
              height: 4,
              background: "#c9a45c",
            }}
          />
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#f2f0eb",
              lineHeight: 1.1,
            }}
          >
            Aji Construction
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(242,240,235,0.8)",
            }}
          >
            Building the Future
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(242,240,235,0.5)",
              marginTop: 8,
            }}
          >
            Quality masonry & construction
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
