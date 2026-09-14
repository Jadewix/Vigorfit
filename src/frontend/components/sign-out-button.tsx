import { signOutAction } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-paper hover:text-ink app-dark:rounded-none app-dark:text-sage-dim app-dark:hover:bg-panel-2 app-dark:hover:text-bone"
      >
        Sign out
      </button>
    </form>
  );
}
