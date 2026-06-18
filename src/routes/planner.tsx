import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

import { planTasks } from "@/lib/ai.functions";
import { PageShell, PageHeader, AiDisclaimer } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { recordActivity } from "@/lib/storage";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Task Planner — Workmate AI" },
      {
        name: "description",
        content:
          "AI-generated daily and weekly schedules with priorities and time blocks.",
      },
      { property: "og:title", content: "Task Planner — Workmate AI" },
      {
        property: "og:description",
        content: "Prioritize tasks by urgency and importance with AI time-blocking.",
      },
    ],
  }),
  component: PlannerPage,
});

type Block = { time: string; label: string; priority: "high" | "medium" | "low" };
type Output = { overview: string; blocks: Block[]; tips: string[] };

const PRIO_COLOR: Record<Block["priority"], string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
};

function PlannerPage() {
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [hours, setHours] = useState("8");
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [out, setOut] = useState<Output | null>(null);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { tasks, hours, mode } }),
    onSuccess: (result) => {
      setOut(result);
      recordActivity({
        type: "planner",
        title: `${mode === "daily" ? "Daily" : "Weekly"} plan`,
        preview: result.overview.slice(0, 140),
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to plan"),
  });

  const fullText = out
    ? `${out.overview}\n\nSchedule:\n${out.blocks.map((b) => `• ${b.time} — ${b.label} [${b.priority}]`).join("\n")}\n\nTips:\n${out.tips.map((t) => `• ${t}`).join("\n")}`
    : "";

  return (
    <PageShell>
      <PageHeader
        icon={<Calendar className="h-5 w-5" />}
        title="AI Task Planner"
        description="Generate a prioritized, time-blocked schedule."
      />
      <AiDisclaimer />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>Schedule type</Label>
              <Tabs value={mode} onValueChange={(v) => setMode(v as "daily" | "weekly")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Available hours</Label>
              <Input
                id="hours"
                placeholder="e.g. 8"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasks">Tasks</Label>
              <Textarea
                id="tasks"
                rows={12}
                placeholder={"One task per line, e.g.\nFinish Q3 report\nReview PRs\nPrepare slides…"}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!tasks.trim() || !hours || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Planning…" : "Generate Schedule"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <Label>Schedule</Label>
              {out && <CopyButton text={fullText} label="Copy all" />}
            </div>
            {!out ? (
              <p className="rounded-md bg-muted p-6 text-center text-sm text-muted-foreground">
                Your prioritized schedule will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{out.overview}</p>
                <ul className="space-y-2">
                  {out.blocks.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-lg border bg-background p-3"
                    >
                      <div className="w-28 shrink-0 font-mono text-xs text-muted-foreground">
                        {b.time}
                      </div>
                      <div className="min-w-0 flex-1 text-sm">{b.label}</div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${PRIO_COLOR[b.priority]}`}
                      >
                        {b.priority}
                      </span>
                    </li>
                  ))}
                </ul>
                {out.tips.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                      Tips
                    </div>
                    <ul className="space-y-1 text-sm">
                      {out.tips.map((t, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
