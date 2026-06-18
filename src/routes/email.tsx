import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { generateEmail } from "@/lib/ai.functions";
import { PageShell, PageHeader, AiDisclaimer } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { recordActivity } from "@/lib/storage";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — Workmate AI" },
      {
        name: "description",
        content: "Generate professional workplace emails with selectable tone.",
      },
      { property: "og:title", content: "Email Generator — Workmate AI" },
      {
        property: "og:description",
        content: "Draft polished emails in formal, friendly, or persuasive tones.",
      },
    ],
  }),
  component: EmailPage,
});

type Tone = "Formal" | "Friendly" | "Persuasive";

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState<Tone>("Formal");
  const [keyPoints, setKeyPoints] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      fn({ data: { purpose, recipient, tone, keyPoints } }),
    onSuccess: (out) => {
      setSubject(out.subject);
      setBody(out.body);
      recordActivity({
        type: "email",
        title: out.subject || purpose,
        preview: out.body.slice(0, 140),
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to generate"),
  });

  return (
    <PageShell>
      <PageHeader
        icon={<Mail className="h-5 w-5" />}
        title="Smart Email Generator"
        description="Tell us what you need to say. We'll draft a professional email."
      />
      <AiDisclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                placeholder="e.g. Decline a meeting invitation politely"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                placeholder="e.g. My manager, the marketing team"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kp">Key points (optional)</Label>
              <Textarea
                id="kp"
                rows={4}
                placeholder="Bullet points to include"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!purpose || !recipient || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Generating…" : "Generate Email"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject">Subject</Label>
                {subject && <CopyButton text={subject} />}
              </div>
              <Input
                id="subject"
                value={subject}
                placeholder="Subject will appear here"
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Body</Label>
                {body && <CopyButton text={`Subject: ${subject}\n\n${body}`} label="Copy all" />}
              </div>
              <Textarea
                id="body"
                rows={16}
                value={body}
                placeholder="Generated email will appear here. You can edit it."
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
