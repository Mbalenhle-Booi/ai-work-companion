import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return createLovableAiGatewayProvider(key);
}

/* ---------- Email Generator ---------- */
const EmailInput = z.object({
  purpose: z.string().min(1),
  recipient: z.string().min(1),
  tone: z.enum(["Formal", "Friendly", "Persuasive"]),
  keyPoints: z.string().optional().default(""),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => EmailInput.parse(data))
  .handler(async ({ data }) => {
    const gateway = getGateway();
    const { experimental_output } = await generateText({
      model: gateway(MODEL),
      experimental_output: Output.object({
        schema: z.object({ subject: z.string(), body: z.string() }),
      }),
      system:
        "You are a professional workplace communication assistant. Write clear, well-structured emails.",
      prompt: `Write an email.

Purpose: ${data.purpose}
Recipient: ${data.recipient}
Tone: ${data.tone}
Key points: ${data.keyPoints || "(none)"}

Include a professional greeting, clear body paragraphs, a call to action, and a professional closing.`,
    });
    return experimental_output;
  });

/* ---------- Meeting Notes Summarizer ---------- */
const NotesInput = z.object({ notes: z.string().min(10) });

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => NotesInput.parse(data))
  .handler(async ({ data }) => {
    const gateway = getGateway();
    const { experimental_output } = await generateText({
      model: gateway(MODEL),
      experimental_output: Output.object({
        schema: z.object({
          summary: z.string(),
          decisions: z.array(z.string()),
          actionItems: z.array(z.string()),
          deadlines: z.array(z.string()),
        }),
      }),
      system:
        "You analyze meeting notes and produce structured, professional summaries.",
      prompt: `Analyze these meeting notes and return an executive summary, key decisions, action items, and deadlines.

NOTES:
${data.notes}`,
    });
    return experimental_output;
  });

/* ---------- Task Planner ---------- */
const PlannerInput = z.object({
  tasks: z.string().min(1),
  hours: z.string().min(1),
  mode: z.enum(["daily", "weekly"]),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PlannerInput.parse(data))
  .handler(async ({ data }) => {
    const gateway = getGateway();
    const { experimental_output } = await generateText({
      model: gateway(MODEL),
      experimental_output: Output.object({
        schema: z.object({
          overview: z.string(),
          blocks: z.array(
            z.object({
              time: z.string(),
              label: z.string(),
              priority: z.enum(["high", "medium", "low"]),
            }),
          ),
          tips: z.array(z.string()),
        }),
      }),
      system:
        "You are an AI productivity coach. Create realistic, prioritized schedules with time blocks.",
      prompt: `Create a ${data.mode} schedule.

Tasks:
${data.tasks}

Available hours: ${data.hours}

Requirements:
- Prioritize important and urgent tasks first
- Suggest concrete time blocks (e.g. "09:00–10:30")
- Avoid overloading the day; include short breaks
- Group similar work when possible`,
    });
    return experimental_output;
  });

/* ---------- Research Assistant ---------- */
const ResearchInput = z.object({
  topic: z.string().min(2),
  context: z.string().optional().default(""),
});

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ResearchInput.parse(data))
  .handler(async ({ data }) => {
    const gateway = getGateway();
    const { experimental_output } = await generateText({
      model: gateway(MODEL),
      experimental_output: Output.object({
        schema: z.object({
          summary: z.string(),
          insights: z.array(z.string()),
          recommendations: z.array(z.string()),
          challenges: z.array(z.string()),
          nextSteps: z.array(z.string()),
        }),
      }),
      system:
        "You are an AI research assistant. Produce concise, structured, actionable workplace research briefs.",
      prompt: `Research topic: ${data.topic}
Context: ${data.context || "(none)"}

Provide a topic summary, key insights, recommendations, risks/challenges, and next steps.`,
    });
    return experimental_output;
  });
