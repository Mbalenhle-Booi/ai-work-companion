import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { researchTopic } from "@/lib/ai.functions";
import { PageShell, PageHeader, AiDisclaimer } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { recordActivity } from "@/lib/storage";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — Workmate AI" },
      {
        name: "description",
        content: "AI research briefs with insights, recommendations, and next steps.",
      },
      { property: "og:title", content: "Research Assistant — Workmate AI" },
      {
        property: "og:description",
        content: "Get structured workplace research on any topic in seconds.",
      },
    ],
  }),
  component: ResearchPage,
});

type Output = {
  summary: string;
  insights: string[];
  recommendations: string[];
  challenges: string[];
  nextSteps: string[];
};

function ResearchPage() {
  const fn = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [out, setOut] = useState<Output | null>(null);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { topic, context } }),
    onSuccess: (result) => {
      setOut(result);
      recordActivity({
        type: "research",
        title: topic,
        preview: result.summary.slice(0, 140),
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to research"),
  });

  const fullText = out
    ? `Topic: ${topic}\n\nSummary\n${out.summary}\n\nKey Insights:\n${out.insights.map((d) => `• ${d}`).join("\n")}\n\nRecommendations:\n${out.recommendations.map((d) => `• ${d}`).join("\n")}\n\nChallenges:\n${out.challenges.map((d) => `• ${d}`).join("\n")}\n\nNext Steps:\n${out.nextSteps.map((d) => `• ${d}`).join("\n")}`
    : "";

  return (
    <PageShell>
      <PageHeader
        icon={<Search className="h-5 w-5" />}
        title="AI Research Assistant"
        description="Topic summaries, insights, and actionable takeaways."
      />
      <AiDisclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="topic">Research topic</Label>
              <Input
                id="topic"
                placeholder="e.g. Remote team performance management"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctx">Additional context (optional)</Label>
              <Textarea
                id="ctx"
                rows={6}
                placeholder="Industry, team size, constraints, goals…"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={topic.trim().length < 2 || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Researching…" : "Research Topic"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <Label>Brief</Label>
              {out && <CopyButton text={fullText} label="Copy all" />}
            </div>
            {!out ? (
              <p className="rounded-md bg-muted p-6 text-center text-sm text-muted-foreground">
                Your research brief will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                <Section label="Summary" items={[out.summary]} />
                <Section label="Key Insights" items={out.insights} />
                <Section label="Recommendations" items={out.recommendations} />
                <Section label="Risks & Challenges" items={out.challenges} />
                <Section label="Next Steps" items={out.nextSteps} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Section({ label, items }: { label: string; items: string[] }) {
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
