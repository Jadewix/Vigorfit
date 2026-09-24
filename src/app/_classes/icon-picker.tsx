import { ClassGlyph } from "@/frontend/components/class-mark";
import { CLASS_ICONS, type ClassIcon } from "@/shared/classes";

/**
 * Choose a class's icon: one tile per icon, each a radio button underneath,
 * so it posts `name` with the chosen key, needs no JavaScript, and a keyboard
 * moves through it with the arrow keys like any radio group.
 *
 * Four tiles to a row on a phone, where each is still a thumb-sized target
 * with room for its label, and all sixteen in two rows once the form is wide
 * enough (a container query, since the form's width, not the screen's, is
 * what decides that).
 */
export function IconPicker({
  defaultValue,
  name = "icon",
}: {
  defaultValue: ClassIcon;
  name?: string;
}) {
  return (
    <fieldset className="@container">
      <legend className="mb-1.5 block text-sm font-medium text-ink">Icon</legend>
      <div className="grid max-w-sm grid-cols-4 gap-1.5 @xl:max-w-2xl @xl:grid-cols-8">
        {CLASS_ICONS.map(({ key, label }) => (
          <label
            key={key}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-line-light bg-paper-panel pb-2 pt-2.5 text-ink-muted transition-colors hover:border-forest/50 hover:text-ink has-[:checked]:border-forest has-[:checked]:bg-forest has-[:checked]:text-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest has-[:focus-visible]:ring-offset-2"
          >
            <input
              type="radio"
              name={name}
              value={key}
              defaultChecked={key === defaultValue}
              className="sr-only"
            />
            <ClassGlyph icon={key} width={26} height={26} />
            <span className="w-full truncate text-center text-[10px] leading-none">
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
