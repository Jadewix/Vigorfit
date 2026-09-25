import { cn } from "@/shared/utils";
import type { ClassIcon } from "@/shared/classes";
import {
  BallIcon,
  BikeIcon,
  BoltIcon,
  DumbbellIcon,
  FlameIcon,
  GloveIcon,
  HeartPulseIcon,
  JumpingJackIcon,
  KettlebellIcon,
  LotusIcon,
  MatIcon,
  MusicIcon,
  PullUpIcon,
  ShoeIcon,
  StopwatchIcon,
  WhistleIcon,
} from "@/frontend/components/icons";

// Typed against the keys in CLASS_ICONS, so an icon added there without a
// drawing here fails the build rather than rendering nothing.
const GLYPHS: Record<ClassIcon, (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  dumbbell: DumbbellIcon,
  kettlebell: KettlebellIcon,
  pullup: PullUpIcon,
  lotus: LotusIcon,
  mat: MatIcon,
  glove: GloveIcon,
  bike: BikeIcon,
  shoe: ShoeIcon,
  heart: HeartPulseIcon,
  bolt: BoltIcon,
  stopwatch: StopwatchIcon,
  jack: JumpingJackIcon,
  music: MusicIcon,
  flame: FlameIcon,
  whistle: WhistleIcon,
  ball: BallIcon,
};

/** A class icon's bare drawing, sized and coloured by whatever holds it. */
export function ClassGlyph({
  icon,
  ...props
}: { icon: ClassIcon } & React.SVGProps<SVGSVGElement>) {
  const Glyph = GLYPHS[icon];
  return <Glyph aria-hidden {...props} />;
}

/**
 * A class's picture: its photo when it has one, otherwise its icon on a sage
 * square — the same square a coach without a photo gets their initials on, so
 * the Team and Classes bands are built from one part. Size it with
 * `className` (e.g. "h-16 w-16"). Decorative: the class's name always sits
 * beside it.
 */
export function ClassMark({
  icon,
  photoUrl,
  className,
}: {
  icon: ClassIcon;
  photoUrl?: string | null;
  className?: string;
}) {
  if (photoUrl) {
    return (
      // Photos are already 512px squares from the uploader, so a plain <img>
      // does the job without configuring next/image for Supabase Storage.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        width={512}
        height={512}
        loading="lazy"
        decoding="async"
        className={cn("shrink-0 object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-sage text-ink",
        className,
      )}
    >
      <ClassGlyph icon={icon} width="52%" height="52%" />
    </span>
  );
}
