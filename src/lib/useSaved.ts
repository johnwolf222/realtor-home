import { useCallback, useEffect, useState } from "react";

const KEY = "ev_saved_homes";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

// Simple cross-component store
let listeners: Array<() => void> = [];
function emit() {
  listeners.forEach((l) => l());
}

export function useSaved() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    setSaved(read());
    const onChange = () => setSaved(read());
    listeners.push(onChange);
    return () => {
      listeners = listeners.filter((l) => l !== onChange);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    emit();
  }, []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  return { saved, toggle, isSaved };
}
