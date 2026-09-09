"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { PlusIcon, CloseIcon } from "@/components/icons";
import { CreateUserForm } from "./create-user-form";

/**
 * Collapsible "create account" section. Collapsed by default so the user list
 * stays the focus; the admin opens it only when adding someone.
 */
export function CreateAccountPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses("primary", "md", "w-full sm:w-auto")}
      >
        <PlusIcon width={18} height={18} /> Add a new account
      </button>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Add a new account
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <CloseIcon width={18} height={18} />
        </button>
      </div>
      <CardBody>
        <CreateUserForm />
      </CardBody>
    </Card>
  );
}
