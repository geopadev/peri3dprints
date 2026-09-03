"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { UTILITY_TEXT } from "@/components/ui/type";
import { createClient } from "@/lib/supabase/browser";
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_BYTES,
  type Attachment,
} from "@/lib/validation/chat";

/**
 * Uploads pictures straight from the browser into the private bucket under
 * this conversation's prefix, then hands the message form their paths in a
 * hidden field. The bucket policy refuses any other prefix, so a buyer cannot
 * write into someone else's thread even by editing the request.
 */
export function AttachmentPicker({
  conversationId,
  bucket,
  max = MAX_ATTACHMENTS_PER_MESSAGE,
}: {
  conversationId: string;
  bucket: "chat-uploads" | "custom-request-uploads";
  max?: number;
}) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(list: FileList | null) {
    if (!list || list.length === 0) return;
    setProblem(null);
    const room = max - files.length;
    const chosen = Array.from(list).slice(0, room);
    if (chosen.length < list.length) setProblem(`Up to ${max} pictures per message.`);

    const tooBig = chosen.find((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (tooBig) {
      setProblem(`${tooBig.name} is over 5 MB. Try a smaller picture.`);
      return;
    }
    const notImage = chosen.find((f) => !f.type.startsWith("image/"));
    if (notImage) {
      setProblem("Pictures only.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const uploaded: Attachment[] = [];
    for (const file of chosen) {
      const safe = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
      const path = `${conversationId}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type });
      if (error) {
        setProblem(`${file.name} did not upload. Try again.`);
        continue;
      }
      uploaded.push({ path, name: file.name, size: file.size, type: file.type });
    }
    setFiles((current) => [...current, ...uploaded]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="attachments" value={JSON.stringify(files)} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        id={`pick-${conversationId}`}
        onChange={(e) => void onPick(e.target.files)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy || files.length >= max}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading" : "Add a picture"}
        </Button>
        {files.map((f) => (
          <span
            key={f.path}
            className={`${UTILITY_TEXT} rounded-pill border-2 border-ink px-2 py-0.5`}
          >
            {f.name.length > 18 ? `${f.name.slice(0, 18)}...` : f.name}
            <button
              type="button"
              aria-label={`Remove ${f.name}`}
              className="ml-2 cursor-pointer"
              onClick={() => setFiles((c) => c.filter((x) => x.path !== f.path))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {problem && <p className="text-sm font-semibold">{problem}</p>}
    </div>
  );
}
