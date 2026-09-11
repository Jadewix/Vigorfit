import type { Viewport } from "next";
import { LoginForm } from "@/components/login-form";
import { loginAction } from "./actions";

// Dark page: match the phone browser's toolbar to it.
export const viewport: Viewport = { themeColor: "#0a0809" };

export default function LoginPage() {
  return (
    <LoginForm
      action={loginAction}
      title="Welcome back"
      subtitle="Sign in to your account."
      footNote={
        <p>
          Accounts are created by your coaching studio. Contact your admin if
          you need access.
        </p>
      }
    />
  );
}
