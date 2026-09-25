"use client";

import { useRef, useState } from "react";
import { createClient } from "@/backend/supabase/client";
import { Button } from "@/frontend/ui/button";
import { CoachAvatar } from "@/frontend/components/coach-avatar";
import {
  storagePathOf,
  toSquareJpeg,
} from "@/frontend/components/square-photo";
import { saveCoachPhotoAction, type FormState } from "./actions";

const BUCKET = "coach-photos";
const NOT_SET_UP =
  "Photo uploads aren't switched on yet. Ask the studio admin.";

/**
 * Upload, change or remove the coach's profile photo. The file goes from the
 * browser straight to Storage under the coach's own session (a server action
 * would hit the request size limit with phone photos); the server action then
 * records the new URL on their coaches row.
 */
export function CoachPhotoForm({
  coachId,
  name,
  photoUrl,
}: {
  coachId: string;
  name: string;
  photoUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(photoUrl);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [message, setMessage] = useState<FormState>({});

  // Replaced files are tidied up on a best-effort basis: a leftover file
  // only costs storage space, so a failed delete isn't worth an error.
  function discard(url: string | null) {
    const path = storagePathOf(BUCKET, url);
    if (path) void createClient().storage.from(BUCKET).remove([path]);
  }

  async function upload(file: File) {
    setMessage({});
    setBusy("upload");
    try {
      const blob = await toSquareJpeg(file);
      const storage = createClient().storage.from(BUCKET);
      const path = `${coachId}/${Date.now()}.jpg`;
      const { error } = await storage.upload(path, blob, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
      });
      if (error) {
        throw new Error(
          /bucket not found/i.test(error.message) ? NOT_SET_UP : error.message,
        );
      }

      const url = storage.getPublicUrl(path).data.publicUrl;
      const result = await saveCoachPhotoAction(url);
      if (result.error) {
        discard(url);
        throw new Error(result.error);
      }
      discard(current);
      setCurrent(url);
      setMessage(result);
    } catch (e) {
      setMessage({
        error:
          e instanceof Error ? e.message : "The photo couldn't be uploaded.",
      });
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setMessage({});
    setBusy("remove");
    const result = await saveCoachPhotoAction(null);
    if (!result.error) {
      discard(current);
      setCurrent(null);
    }
    setMessage(result);
    setBusy(null);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">Profile photo</p>
      <div className="flex items-center gap-4">
        <CoachAvatar
          name={name}
          photoUrl={current}
          className="h-16 w-16 rounded-lg text-xl"
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            disabled={busy !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => inputRef.current?.click()}
          >
            {busy === "upload"
              ? "Uploading…"
              : current
                ? "Change photo"
                : "Upload photo"}
          </Button>
          {current && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              onClick={remove}
            >
              {busy === "remove" ? "Removing…" : "Remove"}
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Shown on your coach card. It&rsquo;s cropped to a square.
      </p>

      {message.error && (
        <p className="mt-3 rounded-lg bg-oxblood/10 px-3 py-2 text-sm text-oxblood">
          {message.error}
        </p>
      )}
      {message.success && (
        <p className="mt-3 rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest-lift">
          {message.success}
        </p>
      )}
    </div>
  );
}
