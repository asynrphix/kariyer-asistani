import { ImageResponse } from "next/og";

export const alt = "Kariyer Asistanı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #f4ecff 0%, #eef4ff 100%)",
          color: "#1e1b4b",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at top left, rgba(124,58,237,0.18), transparent 40%), radial-gradient(circle at bottom right, rgba(168,85,247,0.14), transparent 35%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            padding: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 34,
              background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
              color: "white",
              fontSize: 66,
              fontWeight: 700,
              boxShadow: "0 18px 38px rgba(124,58,237,0.28)",
            }}
          >
            K
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2 }}>Kariyer Asistanı</div>
            <div style={{ fontSize: 34, fontWeight: 600, color: "#4C1D95" }}>
              İlanı yapıştır, CV&apos;ni ekle, uyumu gör.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed 0%, #e9d5ff 100%)",
              position: "relative",
              boxShadow: "0 20px 40px rgba(124,58,237,0.15)",
            }}
          >
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: "50%",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                fontWeight: 800,
                color: "#1e1b4b",
              }}
            >
              86%
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
