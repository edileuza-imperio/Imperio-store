'use client';

export default function HomeSkeleton() {
  return (
    <section style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          height: 18,
          width: 260,
          background: "rgba(0,0,0,0.08)",
          borderRadius: 10,
        }}
      />

      <div
        style={{
          height: 220,
          marginTop: 14,
          background: "rgba(0,0,0,0.06)",
          borderRadius: 18,
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginTop: 14,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 18,
              padding: 12,
              background: "rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1/1",
                background: "rgba(0,0,0,0.07)",
                borderRadius: 16,
              }}
            />

            <div
              style={{
                height: 12,
                width: "80%",
                background: "rgba(0,0,0,0.06)",
                borderRadius: 10,
                marginTop: 10,
              }}
            />

            <div
              style={{
                height: 12,
                width: "60%",
                background: "rgba(0,0,0,0.06)",
                borderRadius: 10,
                marginTop: 8,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}