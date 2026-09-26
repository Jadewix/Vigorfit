"use client";

import { useCallback, useState } from "react";
import { Button } from "@/frontend/ui/button";
import { CloseIcon, PencilIcon } from "@/frontend/components/icons";
import type { StudioClass } from "@/shared/classes";
import { ClassForm } from "./class-form";

/**
 * A class card's button row, led by Edit, which opens the class's own form
 * under the row. `children` are the card's other buttons (photo, delete);
 * they render their own forms, so they sit beside the editor, not inside it.
 */
export function ClassEditor({
  cls,
  coaches,
  today,
  uploaderId,
  children,
}: {
  cls: StudioClass;
  /** As for ClassForm: admins get the coach picker, coaches don't. */
  coaches?: { id: string; name: string }[];
  today: string;
  uploaderId: string;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={editing}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? (
            <>
              <CloseIcon width={14} height={14} /> Close
            </>
          ) : (
            <>
              <PencilIcon width={14} height={14} /> Edit
            </>
          )}
        </Button>
        {children}
      </div>
      {editing && (
        <div className="mt-4 border-t border-line-light pt-4">
          <ClassForm
            cls={cls}
            coaches={coaches}
            today={today}
            uploaderId={uploaderId}
            photosReady={false}
            onClose={close}
          />
        </div>
      )}
    </>
  );
}
