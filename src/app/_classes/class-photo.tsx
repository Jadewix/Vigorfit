"use client";

import { useRef, useState } from "react";
import { createClient } from "@/backend/supabase/client";
import { Button } from "@/frontend/ui/button";
import { ClassMark } from "@/frontend/components/class-mark";
import {
  PHOTO_HINT,
  storagePathOf,
  toSquareJpeg,
} from "@/frontend/components/square-photo";
import { setClassPhotoAction } from "./actions";

const BUCKET = "class-photos";
const NOT_SET_UP =
  "Class photos aren't switched on yet. Run supabase/class-photos.sql in Supabase.";

// Replaced files are tidied up on a best-effort basis: a leftover file only
// costs storage space, so a failed delete isn't worth an error.
function discard(url: string | null) {
  const path = storagePathOf(BUCKET, url);
  if (path) void createClient().storage.from(BUCKET).remove([path]);
}

/**
 * Squares and shrinks the picked file, then uploads it from the browser
 * straight to Storage under the signed-in user's own folder (a server action
 * would hit the request size limit with phone photos). Returns its public URL.
 */
async function uploadPhoto(file: File, uploaderId: string): Promise<string> {
  const blob = await toSquareJpeg(file);
  const storage = createClient().storage.from(BUCKET);
  const path = `${uploaderId}/${Date.now()}.jpg`;
  const { error } = await storage.upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
  });
  if (error) {
    throw new Error(
      /bucket not found/i.test(error.message) ? NOT_SET_UP : error.message,
    );
  }
  return storage.getPublicUrl(path).data.publicUrl;
}

const errorOf = (e: unknown) =>
  e instanceof Error ? e.message : "The photo couldn't be uploaded.";

/** The hidden file input and the button that opens it. */
function PickButton({
  label,
  disabled,
  onPick,
}: {
  label: string;
  disabled: boolean;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
    </>
  );
}

/**
 * The photo in the "Add a class" form. It uploads as soon as a file is
 * picked, so the preview is the real thing, and hands the URL to the form in
 * a hidden `photo_url` field for the create action to save.
 */
export function ClassPhotoField({
  uploaderId,
  defaultUrl,
}: {
  uploaderId: string;
  /** Kept across a rejected submit, so the upload isn't lost. */
  defaultUrl?: string;
}) {
  const [url, setUrl] = useState(defaultUrl || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setError(null);
    setBusy(true);
    try {
      const next = await uploadPhoto(file, uploaderId);
      discard(url);
      setUrl(next);
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">
        Photo <span className="text-ink-muted">(optional)</span>
      </p>
      <input type="hidden" name="photo_url" value={url ?? ""} />
      <div className="flex items-center gap-4">
        <ClassMark
          photoUrl={url}
          className="h-16 w-16 rounded-lg"
        />
        <div className="flex flex-wrap gap-2">
          <PickButton
            label={busy ? "Uploading…" : url ? "Change photo" : "Upload photo"}
            disabled={busy}
            onPick={pick}
          />
          {url && !busy && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                discard(url);
                setUrl(null);
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-muted">{PHOTO_HINT}</p>
      {error && (
        <p className="mt-2 rounded-lg bg-oxblood/10 px-3 py-2 text-sm text-oxblood">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Add, change or remove a class's photo from the timetable, each saved
 * straight away. The card it sits in shows the picture itself.
 */
export function ClassPhotoControl({
  classId,
  uploaderId,
  photoUrl,
}: {
  classId: string;
  uploaderId: string;
  photoUrl: string | null;
}) {
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setError(null);
    setBusy("upload");
    let next: string | null = null;
    try {
      next = await uploadPhoto(file, uploaderId);
      const result = await setClassPhotoAction(classId, next);
      if (result.error) throw new Error(result.error);
      discard(photoUrl);
    } catch (e) {
      discard(next);
      setError(errorOf(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setError(null);
    setBusy("remove");
    const result = await setClassPhotoAction(classId, null);
    if (result.error) setError(result.error);
    else discard(photoUrl);
    setBusy(null);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <PickButton
          label={
            busy === "upload"
              ? "Uploading…"
              : photoUrl
                ? "Change photo"
                : "Add photo"
          }
          disabled={busy !== null}
          onPick={pick}
        />
        {photoUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy !== null}
            onClick={remove}
          >
            {busy === "remove" ? "Removing…" : "Remove photo"}
          </Button>
        )}
      </div>
      {error && (
        <p className="basis-full rounded-lg bg-oxblood/10 px-3 py-2 text-sm text-oxblood">
          {error}
        </p>
      )}
    </>
  );
}
