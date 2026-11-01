/**
 * Pantalla que se sirve (503) con la web bloqueada. HTML autónomo con estilos en línea:
 * no depende de Next, de la BD ni de ningún fichero estático, que también están bloqueados.
 */
export const LOCKED_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>ALLO TABIB</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;600&family=Inter:wght@500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #F2F1F6; --ink: #1E1C2E; --muted: #5E5B6E;
    --blue: #1800AC; --coral: #87C442; --glow-a: rgba(24,0,172,.16); --glow-b: rgba(135,196,66,.24);
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #13111F; --ink: #EEEDF4; --muted: #A09DB2;
      --blue: #9D8CFF; --glow-a: rgba(157,140,255,.16); --glow-b: rgba(135,196,66,.14);
      color-scheme: dark;
    }
  }
  * { box-sizing: border-box; margin: 0; }
  html, body { height: 100%; }
  body {
    min-height: 100dvh; display: grid; place-items: center; overflow: hidden;
    padding: max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom));
    background:
      radial-gradient(60vmax 60vmax at 12% 8%, var(--glow-a), transparent 60%),
      radial-gradient(55vmax 55vmax at 92% 96%, var(--glow-b), transparent 60%),
      var(--bg);
    color: var(--ink);
    font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  main { width: min(100%, 1100px); text-align: center; animation: rise .9s cubic-bezier(.2,.7,.2,1) both; }
  .mark {
    width: 72px; height: 72px; margin: 0 auto clamp(28px, 6vh, 56px); border-radius: 22px;
    display: grid; place-items: center; color: #fff;
    background: linear-gradient(145deg, #2A12C4, #1800AC);
    box-shadow: 0 18px 40px -16px rgba(24,0,172,.45), inset 0 1px 0 rgba(255,255,255,.25);
  }
  h1 {
    font-weight: 600; line-height: 1.04; letter-spacing: -0.035em; text-wrap: balance;
    font-size: clamp(2.4rem, 7.2vw, 5.6rem);
  }
  h1 .accent { color: var(--blue); }
  .divider {
    display: flex; align-items: center; justify-content: center; gap: 14px;
    margin: clamp(26px, 5vh, 48px) auto;
  }
  .divider span { height: 1px; width: clamp(48px, 12vw, 120px); background: currentColor; opacity: .18; }
  .divider i { width: 9px; height: 9px; border-radius: 50%; background: var(--coral); box-shadow: 0 0 0 6px var(--glow-b); }
  h2 {
    font-family: "IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif;
    font-weight: 600; line-height: 1.35; text-wrap: balance;
    font-size: clamp(2.2rem, 6.6vw, 5rem);
  }
  h2 .accent { color: var(--blue); }
  @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { main { animation: none; } }
</style>
</head>
<body>
<main>
  <div class="mark" aria-hidden="true">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="10.5" width="16" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor"/>
    </svg>
  </div>
  <h1>Veuillez contacter <span class="accent">l'administrateur</span> du site</h1>
  <div class="divider" aria-hidden="true"><span></span><i></i><span></span></div>
  <h2 lang="ar" dir="rtl">يرجى التواصل مع <span class="accent">مسؤول</span> الموقع</h2>
</main>
</body>
</html>`;
