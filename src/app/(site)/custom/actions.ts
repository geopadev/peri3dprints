"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { customRequestSchema } from "@/lib/validation/custom";
import { sendOwnerNewMessage } from "@/lib/email";

export type CustomState = { status: "idle" } | { status: "error"; message: string };

/**
 * A custom request is a conversation with structure: a conversation of kind
 * custom_request, a details row, and a first message that reads as prose so
 * the owner sees the whole ask in the thread rather than in a form.
 */
export async function submitCustomRequest(
  _prev: CustomState,
  formData: FormData,
): Promise<CustomState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=%2Fcustom");

  let references: unknown = [];
  try {
    references = JSON.parse(String(formData.get("attachments") ?? "[]"));
  } catch {
    references = [];
  }

  const parsed = customRequestSchema.safeParse({
    what: formData.get("what"),
    sizeNote: formData.get("sizeNote") ?? "",
    colourPref: formData.get("colourPref") ?? "",
    budget: formData.get("budget") ?? "",
    deadline: formData.get("deadline") ?? "",
    references,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the details and try again.",
    };
  }
  const d = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: convo, error } = await supabase
    .from("conversations")
    .insert({
      buyer_id: user.id,
      kind: "custom_request",
      subject: "Custom print",
      display_name: profile?.display_name ?? null,
      email: profile?.email ?? user.email ?? null,
    })
    .select("id")
    .single();
  if (error || !convo)
    return { status: "error", message: "That did not send. Try again in a moment." };

  await supabase.from("custom_request_details").insert({
    conversation_id: convo.id,
    budget_cents: d.budget,
    deadline: d.deadline,
    colour_pref: d.colourPref,
    size_note: d.sizeNote,
    reference_paths: d.references.map((r) => r.path),
  });

  const parts = [d.what];
  if (d.sizeNote) parts.push(`Size: ${d.sizeNote}.`);
  if (d.colourPref) parts.push(`Colour: ${d.colourPref}.`);
  if (d.budget) parts.push(`Budget around ${(d.budget / 100).toFixed(0)} euros.`);
  if (d.deadline) parts.push(`Needed by ${d.deadline}.`);

  await supabase.from("messages").insert({
    conversation_id: convo.id,
    sender_id: user.id,
    sender_role: "buyer",
    kind: "text",
    body: parts.join(" "),
    attachments: d.references,
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await sendOwnerNewMessage({
    from: profile?.display_name ?? user.email ?? "Someone",
    preview: d.what.slice(0, 200),
    adminUrl: `${site}/admin/messages/${convo.id}`,
  });

  redirect("/custom/sent");
}
