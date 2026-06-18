import { useCallback, useEffect, useState } from "react";

export type ActivityType = "email" | "notes" | "planner" | "research" | "chat";

export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  preview: string;
  createdAt: number;
};

export type Counters = {
  email: number;
  notes: number;
  planner: number;
  research: number;
};

const ACTIVITY_KEY = "wpa.activity";
const COUNTERS_KEY = "wpa.counters";

const defaultCounters: Counters = { email: 0, notes: 0, planner: 0, research: 0 };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("wpa:storage", { detail: { key } }));
  } catch {
    /* ignore quota */
  }
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial));

  useEffect(() => {
    setValue(read(key, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        write(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}

export function useActivity() {
  const [activity, setActivity] = useState<Activity[]>(() =>
    read<Activity[]>(ACTIVITY_KEY, []),
  );
  const [counters, setCounters] = useState<Counters>(() =>
    read<Counters>(COUNTERS_KEY, defaultCounters),
  );

  useEffect(() => {
    const handler = () => {
      setActivity(read<Activity[]>(ACTIVITY_KEY, []));
      setCounters(read<Counters>(COUNTERS_KEY, defaultCounters));
    };
    window.addEventListener("wpa:storage", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("wpa:storage", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { activity, counters };
}

export function recordActivity(entry: Omit<Activity, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const current = read<Activity[]>(ACTIVITY_KEY, []);
  const next: Activity[] = [
    {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    },
    ...current,
  ].slice(0, 50);
  write(ACTIVITY_KEY, next);

  if (entry.type !== "chat") {
    const counters = read<Counters>(COUNTERS_KEY, defaultCounters);
    counters[entry.type] = (counters[entry.type] ?? 0) + 1;
    write(COUNTERS_KEY, counters);
  }
}

export function clearActivity() {
  write(ACTIVITY_KEY, []);
  write(COUNTERS_KEY, defaultCounters);
}
