"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CoachAvatar } from "@/components/coach-avatar";
import { saveCoachPhotoAction, type FormState } from "./actions";

const BUCKET = "coach-photos";
/** Photos are stored as square JPEGs this many pixels across. */
const SIZE = 512;
const NOT_SET_UP =
  "Photo uploads aren't switched on yet. Ask the studio admin.";

/**
 * Centre-crops the picked image to a square and re-encodes it as a JPEG of at
 * most SIZE px, so a phone photo uploads as ~60 KB instead of several MB.
 */
async function toSquareJpeg(file: File): Promise<Blob> {
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = src;
    await img.decode().catch(() => {
      throw new Error("That image couldn't be read. Try a JPEG or PNG.");
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const out = Math.min(SIZE, side);
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't process photos.");
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      out,
      out,
    );

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("That image couldn't be read.")),
        "image/jpeg",
        0.85,
      ),
    );
  } finally {
    URL.revokeObjectURL(src);
  }
}

/** Storage path of a photo URL in this bucket, or null for anything else. */
function pathOf(url: string | null): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url ? url.indexOf(marker) : -1;
  return url && i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

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
    const path = pathOf(url);
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
        <p className="mt-3 rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest">
          {message.success}
        </p>
      )}
    </div>
  );
}
