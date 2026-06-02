import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "oklch(0.52 0.22 285)",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "40px",
        color: "white",
        fontSize: "72px",
        fontWeight: 700,
        letterSpacing: "2px",
      }}
    >
      TP
    </div>,
    { ...size }
  )
}
