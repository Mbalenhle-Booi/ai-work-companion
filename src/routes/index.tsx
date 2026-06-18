import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  FileText,
  Calendar,
  Search,
  MessageSquare,
  LayoutDashboard,
  Trash2,
} from "lucide-react";
import { useActivity, clearActivity, type ActivityType } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workmate AI" },
      {
        name: "description",
        content:
          "Your AI productivity dashboard: quick actions, usage stats, and recent activity.",
      },
      { property: "og:title", content: "Dashboard — Workmate AI" },
      {
        property: "og:description",
        content: "Quick access to AI tools for emails, summaries, planning, research, and chat.",
      },
    ],
  }),
  component: Dashboard,
});

const ICONS: Record<ActivityType, typeof Mail> = {
  email: Mail,
  notes: FileText,
  planner: Calendar,
  research: Search,
  chat: MessageSquare,
};

const TYPE_LABEL: Record<ActivityType, string> = {
  email: "Email",
  notes: "Summary",
  planner: "Schedule",
  research: "Research",
  chat: "Chat",
};

const quickActions = [
  { to: "/email", label: "Generate Email", icon: Mail, desc: "Draft a professional email" },
  { to: "/notes", label: "Summarize Notes", icon: FileText, desc: "Extract decisions & actions" },
  { to: "/planner", label: "Plan Schedule", icon: Calendar, desc: "Build a prioritized day" },
  { to: "/research", label: "Research Topic", icon: Search, desc: "Insights & next steps" },
  { to: "/chat", label: "Ask AI", icon: MessageSquare, desc: "Conversational assistant" },
] as const;

function Dashboard() {
  const { activity, counters } = useActivity();

  const kpis = [
    { label: "Emails Generated", value: counters.email, icon: Mail },
    { label: "Meetings Summarized", value: counters.notes, icon: FileText },
    { label: "Schedules Planned", value: counters.planner, icon: Calendar },
    { label: "Research Requests", value: counters.research, icon: Search },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={<LayoutDashboard className="h-5 w-5" />}
        title="Dashboard"
        description="Your AI workspace at a glance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-start gap-3 p-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <k.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold tabular-nums">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <a.icon className="h-4 w-4" />
              </div>
              <div className="text-sm font-semibold">{a.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{a.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent activity
          </h2>
          {activity.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Clear all saved activity and counters?")) clearActivity();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {activity.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No activity yet. Try a quick action above to get started.
              </div>
            ) : (
              <ul className="divide-y">
                {activity.slice(0, 12).map((item) => {
                  const Icon = ICONS[item.type];
                  return (
                    <li key={item.id} className="flex items-start gap-3 p-4">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wide text-primary">
                            {TYPE_LABEL[item.type]}
                          </span>
                          <span className="truncate text-sm font-medium">{item.title}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {item.preview}
                        </p>
                      </div>
                      <time className="shrink-0 text-[11px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}

// Suppress unused warnings for header components if not used
void CardHeader;
void CardTitle;
