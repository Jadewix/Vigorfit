import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardPathForRole, getCurrentProfile } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { BoltIcon } from "@/components/icons";
import { ChangePasswordForm } from "./change-password-form";
import { EditProfileForm } from "./edit-profile-form";

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const home = dashboardPathForRole(profile.role);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center justify-center gap-2 text-slate-900"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <BoltIcon />
        </span>
        <span className="text-xl font-bold tracking-tight">Vigorfit</span>
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account
        </h1>
        <Link
          href={home}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Back
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardBody>
          <EditProfileForm profile={profile} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardBody>
          <ChangePasswordForm />
        </CardBody>
      </Card>

      <p className="mt-4 text-center text-sm text-slate-500">
        Signed in as{" "}
        <span className="font-medium text-slate-700">
          {profile.username ?? profile.full_name}
        </span>
      </p>
    </main>
  );
}
