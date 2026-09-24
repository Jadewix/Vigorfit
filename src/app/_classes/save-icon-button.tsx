"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/frontend/ui/button";

/** The timetable's "Save icon", which says so while the change goes in. */
export function SaveIconButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save icon"}
    </Button>
  );
}
