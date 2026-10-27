"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";
type ThemeCtx = { pref: ThemePref; resolved: "light" | "dark"; setPref: (p: ThemePref) => void };

const Ctx = createContext<ThemeCtx>({ pref: "system", resolved: "light", setPref: () => undefined });

/** Script inline para aplicar el tema antes de pintar (evita parpadeo). */
export const themeInitScript = `(function(){try{var p=localStorage.getItem('theme');var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

function readPref(): ThemePref {
  try {
    const p = localStorage.getItem("theme");
    return p === "light" || p === "dark" ? p : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    setPrefState(readPref());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved = pref === "system" ? (systemDark ? "dark" : "light") : pref;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    try {
      if (p === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", p);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  return <Ctx.Provider value={{ pref, resolved, setPref }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
