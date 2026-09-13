/**
 * HeroObject — the reserved layer for the hero's 3D dumbbell.
 *
 * The point of this component is that the hero's layout does not care what
 * ends up inside it. Drop in an <img> (a transparent WebP/PNG render), a
 * <canvas> (three.js / R3F), a <video> loop, or an <iframe> embed, and the
 * type, spacing and safe area around it stay exactly as they are. Nothing
 * here needs to be undone to swap the asset in.
 *
 * Placement is tunable from the outside via three custom properties rather
 * than by editing this file:
 *
 *   <HeroObject style={{ "--ho-x": "8%", "--ho-y": "-4%", "--ho-scale": 1.1 }} />
 *
 * Until an asset arrives it renders a wireframe weight plate — concentric
 * rings are what a plate actually looks like head-on, so the placeholder
 * reads as a deliberate graphic rather than a missing image. Delete nothing
 * when the render lands: pass it as children and the placeholder steps aside.
 *
 * The object is decorative, so the whole layer is aria-hidden and never
 * intercepts pointer events aimed at the hero's buttons behind it.
 */
export function HeroObject({
  children,
  className,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={[
        // The layer itself. `grid place-items-center` centres whatever asset
        // is handed in, at any aspect ratio, without further positioning.
        "pointer-events-none absolute z-0 grid place-items-center",
        // Safe area: on phones the object sits behind the ledger at low
        // opacity so the type is never competing with it. From `lg` it moves
        // into its own column, starting past where the hero's text column
        // ends — an opaque render dropped in here must not land on the type.
        "inset-0 opacity-[0.18]",
        "lg:inset-y-0 lg:left-[53%] lg:right-0 lg:opacity-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        // Defaults the caller can override. Kept as custom properties so
        // nudging the render's position later is a one-line change in the
        // hero rather than a rewrite of this component.
        ["--ho-x" as string]: "0%",
        ["--ho-y" as string]: "0%",
        ["--ho-scale" as string]: "1",
        ...style,
      }}
    >
      <div
        className="relative aspect-square w-[min(84%,30rem)]"
        style={{
          transform:
            "translate(var(--ho-x), var(--ho-y)) scale(var(--ho-scale))",
        }}
      >
        {/*
          Light bloom. This stays even once a render is dropped in: it is what
          seats the object on the olive ground instead of leaving it floating
          as a cut-out.
        */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 42% 38%, rgba(151,176,140,0.20), rgba(151,176,140,0.05) 45%, transparent 68%)",
          }}
        />

        {children ?? <PlatePlaceholder />}

        {/*
          Contact shadow, sitting below the object's base. A render with a
          transparent background reads as genuinely resting on the page with
          this behind it, and as a sticker without it.
        */}
        <div
          className="absolute bottom-[6%] left-1/2 h-[7%] w-[62%] -translate-x-1/2 rounded-[50%] blur-md"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(11,13,11,0.55), transparent 72%)",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Wireframe weight plate, drawn in CSS so it costs no request and no
 * dependency. Replaced the moment a real asset is passed as children.
 */
function PlatePlaceholder() {
  // Ring diameters as a share of the layer, outermost first, each with the
  // alpha it carries. Concentric circles of falling opacity give the plate
  // depth without shading it.
  const rings: [number, number][] = [
    [100, 0.5],
    [82, 0.34],
    [64, 0.24],
    [46, 0.18],
    [28, 0.14],
  ];

  return (
    <div className="absolute inset-0">
      {rings.map(([size, alpha]) => (
        <div
          key={size}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: `${size}%`,
            height: `${size}%`,
            borderColor: `rgba(151,176,140,${alpha})`,
          }}
        />
      ))}

      {/* Centre hub — the plate's bore, and the one solid mark in the group. */}
      <div
        className="absolute left-1/2 top-1/2 h-[11%] w-[11%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "rgba(151,176,140,0.22)" }}
      />

      {/* Crosshair ticks, so the plate reads as a measured object. */}
      <div
        className="absolute left-1/2 top-1/2 h-px w-[100%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(151,176,140,0.18) 18%, rgba(151,176,140,0.18) 82%, transparent)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[100%] w-px -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(151,176,140,0.18) 18%, rgba(151,176,140,0.18) 82%, transparent)",
        }}
      />
    </div>
  );
}
