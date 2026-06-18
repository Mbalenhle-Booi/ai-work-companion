import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { summarizeNotes } from "@/lib/ai.functions";
import { PageShell, PageHeader, AiDisclaimer } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { recordActivity } from "@/lib/storage";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — Workmate AI" },
      {
        name: "description",
        content:
          "Turn raw meeting notes into an executive summary with decisions, action items, and deadlines.",
      },
      { property: "og:title", content: "Meeting Summarizer — Workmate AI" },
      {
        property: "og:description",
        content: "Extract decisions, action items, and deadlines from meeting notes.",
      },
    ],
  }),
  component: NotesPage,
});

type Output = {
  summary: string;
  decisions: string[];
  actionItems: string[];
  deadlines: string[];
};

function NotesPage() {
  const fn = useServerFn(summarizeNotes);
  const [notes, setNotes] = useState("");
  const [out, setOut] = useState<Output | null>(null);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { notes } }),
    onSuccess: (result) => {
      setOut(result);
      recordActivity({
        type: "notes",
        title: "Meeting summary",
        preview: result.summary.slice(0, 140),
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to summarize"),
  });

  const fullText = out
    ? `Summary\n${out.summary}\n\nDecisions:\n${out.decisions.map((d) => `• ${d}`).join("\n")}\n\nAction items:\n${out.actionItems.map((d) => `• ${d}`).join("\n")}\n\nDeadlines:\n${out.deadlines.map((d) => `• ${d}`).join("\n")}`
    : "";

  return (
    <PageShell>
      <PageHeader
        icon={<FileText className="h-5 w-5" />}
        title="Meeting Notes Summarizer"
        description="Paste raw notes; get a structured executive summary."
      />
      <AiDisclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="notes">Meeting notes</Label>
              <Textarea
                id="notes"
                rows={18}
                placeholder="Paste your meeting notes here…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={notes.trim().length < 10 || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Summarizing…" : "Summarize"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <Label>Summary</Label>
              {out && <CopyButton text={fullText} label="Copy all" />}
            </div>

            {!out ? (
              <p className="rounded-md bg-muted p-6 text-center text-sm text-muted-foreground">
                Your structured summary will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                <SummarySection label="Executive summary" items={[out.summary]} />
                <SummarySection label="Key decisions" items={out.decisions} />
                <SummarySection label="Action items" items={out.actionItems} />
                <SummarySection label="Deadlines" items={out.deadlines} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function SummarySection({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
        {label}
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted-foreground">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
