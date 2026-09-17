import { useState, useRef, useCallback } from "react";
import { TaskPriority } from "../types/board";
import { addDays, addHours, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, format, setHours, setMinutes } from "date-fns";

export interface ParsedTask {
  title: string;
  notes: string;
  priority: TaskPriority;
  endAt: string; // ISO string
}

// Natural language → structured task
function parseTaskFromSpeech(text: string): ParsedTask {
  let remaining = text.trim();

  // ---- Priority ----
  let priority: TaskPriority = "MEDIUM";
  const urgentRx = /\b(urgent|critical|asap|emergency|immediately)\b/i;
  const highRx = /\b(high|important|priority)\b/i;
  const lowRx = /\b(low|minor|whenever|eventually)\b/i;

  if (urgentRx.test(remaining)) {
    priority = "URGENT";
    remaining = remaining.replace(urgentRx, "").trim();
  } else if (highRx.test(remaining)) {
    priority = "HIGH";
    remaining = remaining.replace(highRx, "").trim();
  } else if (lowRx.test(remaining)) {
    priority = "LOW";
    remaining = remaining.replace(lowRx, "").trim();
  }

  // ---- Date / time ----
  const now = new Date();
  let endAt = addDays(now, 1);
  endAt = setHours(setMinutes(endAt, 0), 23);

  // Parse hour from "at X pm/am"
  const timeRx = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const timeMatch = remaining.match(timeRx);
  let parsedHour: number | null = null;
  let parsedMinute = 0;
  if (timeMatch) {
    parsedHour = parseInt(timeMatch[1], 10);
    parsedMinute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === "pm" && parsedHour < 12) parsedHour += 12;
    if (meridiem === "am" && parsedHour === 12) parsedHour = 0;
    remaining = remaining.replace(timeRx, "").trim();
  }

  const applyTime = (d: Date) => {
    if (parsedHour !== null) return setMinutes(setHours(d, parsedHour), parsedMinute);
    return setHours(setMinutes(d, 0), 17); // default 5 pm
  };

  // "today"
  if (/\btoday\b/i.test(remaining)) {
    endAt = applyTime(now);
    remaining = remaining.replace(/\btoday\b/i, "").trim();
  }
  // "tomorrow"
  else if (/\btomorrow\b/i.test(remaining)) {
    endAt = applyTime(addDays(now, 1));
    remaining = remaining.replace(/\btomorrow\b/i, "").trim();
  }
  // "next week"
  else if (/\bnext\s+week\b/i.test(remaining)) {
    endAt = applyTime(addDays(now, 7));
    remaining = remaining.replace(/\bnext\s+week\b/i, "").trim();
  }
  // "in X days"
  else if (/\bin\s+(\d+)\s+days?\b/i.test(remaining)) {
    const m = remaining.match(/\bin\s+(\d+)\s+days?\b/i)!;
    endAt = applyTime(addDays(now, parseInt(m[1], 10)));
    remaining = remaining.replace(/\bin\s+\d+\s+days?\b/i, "").trim();
  }
  // "in X hours"
  else if (/\bin\s+(\d+)\s+hours?\b/i.test(remaining)) {
    const m = remaining.match(/\bin\s+(\d+)\s+hours?\b/i)!;
    endAt = addHours(now, parseInt(m[1], 10));
    remaining = remaining.replace(/\bin\s+\d+\s+hours?\b/i, "").trim();
  }
  // Day names
  else if (/\b(monday)\b/i.test(remaining)) {
    endAt = applyTime(nextMonday(now));
    remaining = remaining.replace(/\bmonday\b/i, "").trim();
  } else if (/\b(tuesday)\b/i.test(remaining)) {
    endAt = applyTime(nextTuesday(now));
    remaining = remaining.replace(/\btuesday\b/i, "").trim();
  } else if (/\b(wednesday)\b/i.test(remaining)) {
    endAt = applyTime(nextWednesday(now));
    remaining = remaining.replace(/\bwednesday\b/i, "").trim();
  } else if (/\b(thursday)\b/i.test(remaining)) {
    endAt = applyTime(nextThursday(now));
    remaining = remaining.replace(/\bthursday\b/i, "").trim();
  } else if (/\b(friday)\b/i.test(remaining)) {
    endAt = applyTime(nextFriday(now));
    remaining = remaining.replace(/\bfriday\b/i, "").trim();
  } else if (parsedHour !== null) {
    endAt = applyTime(now);
  }

  // ---- Strip filler phrases ----
  remaining = remaining
    .replace(/\b(create|add|make|new|a|an|task|to-?do|todo|remind me to|i need to|please|can you|set|schedule)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Capitalise first letter
  const title = remaining.charAt(0).toUpperCase() + remaining.slice(1);

  return {
    title: title || "New task",
    notes: "",
    priority,
    endAt: endAt.toISOString(),
  };
}

type RecognitionState = "idle" | "listening" | "processing" | "error";

export function useVoiceInput() {
  const [state, setState] = useState<RecognitionState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(
    (onResult: (parsed: ParsedTask, raw: string) => void) => {
      if (!isSupported) {
        setError("Voice input is not supported in this browser. Try Chrome.");
        return;
      }

      const SR: any =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const recognition = new SR();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      setState("listening");
      setError(null);
      setTranscript("");

      recognition.onresult = (event: any) => {
        const raw = event.results[0][0].transcript;
        setTranscript(raw);
        setState("processing");
        const parsed = parseTaskFromSpeech(raw);
        onResult(parsed, raw);
        setState("idle");
      };

      recognition.onerror = (event: any) => {
        setError(event.error === "not-allowed"
          ? "Microphone access denied. Please allow it in your browser settings."
          : `Voice error: ${event.error}`);
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      };

      recognition.onend = () => {
        if (state === "listening") setState("idle");
      };

      recognition.start();
    },
    [isSupported, state]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState("idle");
  }, []);

  return { state, transcript, error, isSupported, startListening, stopListening };
}
