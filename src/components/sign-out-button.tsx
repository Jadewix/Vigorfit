import { signOutAction } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 app-dark:rounded-none app-dark:text-mist app-dark:hover:bg-surface-2 app-dark:hover:text-bone"
      >
        Sign out
      </button>
    </form>
  );
}
