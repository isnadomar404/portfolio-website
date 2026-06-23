// Hero-diorama motifs — the visual through-line that ties every section back to
// the locked hero (floating UI panels, node-graph, swatches, the cat). Rendered
// as flat SVG/CSS at low opacity on the P1/P2 depth planes. No WebGL.

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/** P0 ambient cobalt glow. Large, heavily blurred, low opacity. */
export function GlowBlob({
  className = "",
  color = "var(--accent-glow)",
  size = 620,
  opacity = 0.16,
  style,
}: {
  className?: string;
  color?: string;
  size?: number;
  opacity?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "9999px",
        background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        opacity,
        filter: "blur(60px)",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

const glass: React.CSSProperties = {
  background: "var(--glass-fill)",
  border: "1px solid var(--glass-stroke)",
  borderRadius: 16,
  backdropFilter: "blur(12px) saturate(140%)",
  WebkitBackdropFilter: "blur(12px) saturate(140%)",
  boxShadow:
    "inset 0 1px 0 var(--glass-highlight), 0 14px 40px -24px rgba(0,0,0,0.85), 0 0 22px -8px rgba(76,141,255,0.35)",
};

/** Type-specimen panel — "Aa" + ruled lines, echoing the hero's floating UI. */
export function TypeSpecimen({ className = "", style }: DivProps) {
  return (
    <div className={className} style={{ ...glass, padding: 18, width: 200, ...style }}>
      <div
        className="font-display"
        style={{ fontSize: 52, lineHeight: 1, color: "var(--fg)", opacity: 0.9 }}
      >
        Aa
      </div>
      <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
        <span style={{ height: 6, width: "80%", borderRadius: 4, background: "var(--card-stroke)" }} />
        <span style={{ height: 6, width: "55%", borderRadius: 4, background: "var(--card-stroke)" }} />
      </div>
    </div>
  );
}

/** Swatch cluster — grid of colour chips; one warm chip is the rare warm pop. */
export function SwatchCluster({
  warm = true,
  className = "",
  style,
}: DivProps & { warm?: boolean }) {
  const chips = [
    "var(--accent)",
    "var(--accent-bright)",
    "#257179",
    warm ? "var(--accent-warm)" : "#3b5dc9",
    "#566c86",
    "#94b0c2",
  ];
  return (
    <div className={className} style={{ ...glass, padding: 16, width: 184, ...style }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {chips.map((c, i) => (
          <span
            key={i}
            style={{
              height: 38,
              borderRadius: 8,
              background: c,
              boxShadow:
                warm && i === 3
                  ? "0 0 0 2px var(--accent-warm), 0 0 18px rgba(240,151,90,0.5)"
                  : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Node graph — dots connected by thin lines, like the hero's flow diagram. */
export function NodeGraph({ className = "", style }: DivProps) {
  return (
    <div className={className} style={{ ...glass, padding: 14, width: 240, ...style }}>
      <svg viewBox="0 0 220 140" width="100%" style={{ display: "block" }}>
        <g
          stroke="var(--accent)"
          strokeWidth="1.4"
          fill="none"
          opacity="0.7"
          strokeDasharray="3 4"
        >
          <path d="M28 30 H96 V96 H168" />
          <path d="M28 30 V104 H96" />
          <path d="M96 96 V40 H168" />
        </g>
        {[
          [28, 30],
          [96, 96],
          [96, 40],
          [168, 96],
          [168, 40],
          [96, 104],
          [28, 104],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="5"
            fill={i === 3 ? "var(--accent-bright)" : "var(--panel-2)"}
            stroke="var(--accent)"
            strokeWidth="1.6"
          />
        ))}
      </svg>
    </div>
  );
}

/** Big ghosted quotation mark for the Testimonials P1 plane. */
export function QuoteMark({ className = "", style }: DivProps) {
  return (
    <div aria-hidden className={className} style={style}>
      <svg viewBox="0 0 200 160" width="100%" height="100%">
        <text
          x="0"
          y="150"
          className="font-display"
          style={{ fontSize: 220, fontWeight: 700 }}
          fill="var(--accent-glow)"
        >
          &ldquo;
        </text>
      </svg>
    </div>
  );
}

/** Layers/stack panel — rows of layer entries, one active. */
export function LayersPanel({ className = "", style }: DivProps) {
  const rows = ["Cover", "Type", "Grid", "Glow"];
  return (
    <div className={className} style={{ ...glass, padding: 14, width: 196, ...style }}>
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((r, i) => (
          <div
            key={r}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 8px",
              borderRadius: 8,
              background: i === 1 ? "var(--accent-soft)" : "transparent",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: i === 1 ? "var(--accent)" : "var(--card-stroke)",
              }}
            />
            <span style={{ fontSize: 12, color: i === 1 ? "var(--fg)" : "var(--fg-muted)" }}>
              {r}
            </span>
            <span
              style={{
                marginLeft: "auto",
                width: 28,
                height: 5,
                borderRadius: 3,
                background: "var(--card-stroke)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pen-tool vector-path card — bezier with anchor handles. */
export function PenToolCard({ className = "", style }: DivProps) {
  return (
    <div className={className} style={{ ...glass, padding: 14, width: 208, ...style }}>
      <svg viewBox="0 0 200 120" width="100%" style={{ display: "block" }}>
        <path
          d="M24 92 C 60 20, 120 20, 176 70"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        {/* handles */}
        <g stroke="var(--accent-bright)" strokeWidth="1" opacity="0.6">
          <line x1="24" y1="92" x2="60" y2="44" />
          <line x1="176" y1="70" x2="140" y2="34" />
        </g>
        {[
          [24, 92],
          [176, 70],
        ].map(([cx, cy], i) => (
          <rect
            key={i}
            x={cx - 4}
            y={cy - 4}
            width="8"
            height="8"
            fill="var(--panel-2)"
            stroke="var(--accent)"
            strokeWidth="1.6"
          />
        ))}
        {[
          [60, 44],
          [140, 34],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="var(--accent-bright)" />
        ))}
        {/* pen nib */}
        <path d="M150 78 l16 6 l-10 6 z" fill="var(--fg)" opacity="0.85" />
      </svg>
    </div>
  );
}

/** Spacing/measurement ruler card. */
export function RulerCard({ className = "", style }: DivProps) {
  return (
    <div className={className} style={{ ...glass, padding: 14, width: 220, ...style }}>
      <div style={{ position: "relative", height: 40 }}>
        <div
          style={{
            position: "absolute",
            insetInline: 0,
            top: 14,
            height: 1,
            background: "var(--card-stroke)",
          }}
        />
        {Array.from({ length: 11 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${i * 10}%`,
              top: 14,
              width: 1,
              height: i % 5 === 0 ? 12 : 7,
              background: "var(--fg-muted)",
              opacity: 0.7,
            }}
          />
        ))}
        {/* dimension span */}
        <div
          style={{
            position: "absolute",
            left: "20%",
            width: "50%",
            top: 30,
            height: 1,
            background: "var(--accent)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "42%",
            top: 22,
            fontSize: 11,
            color: "var(--accent-bright)",
          }}
        >
          120
        </span>
      </div>
    </div>
  );
}

/** Sitting-cat silhouette — the diorama's closer, used on Get in Touch. */
export function CatSilhouette({ className = "", style }: DivProps) {
  return (
    <div aria-hidden className={className} style={style}>
      <svg viewBox="0 0 200 240" width="100%" height="100%">
        <path
          fill="currentColor"
          d="M64 44c2-14 8-30 14-30s10 14 12 26c8-2 16-2 24 0 2-12 6-26 12-26s12 16 14 30c14 12 22 30 22 52 0 44-26 74-58 74S62 140 62 96c0-2 0-4 0-6-2 2-4 6-4 12 0 8 4 14 4 14-10-2-18-12-18-26 0-20 8-44 16-56Z"
        />
        <ellipse cx="100" cy="224" rx="56" ry="12" fill="currentColor" opacity="0.5" />
      </svg>
    </div>
  );
}
