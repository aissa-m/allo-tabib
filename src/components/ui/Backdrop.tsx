/** Fondo con degradado sutil y manchas difuminadas de los colores de acento (para que el blur se note). */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-bg via-bg to-bg-soft">
      <div className="absolute -start-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-sage/25 blur-3xl dark:bg-sage/10" />
      <div className="absolute -end-32 top-1/3 h-[32rem] w-[32rem] rounded-full bg-slate/20 blur-3xl dark:bg-slate/10" />
      <div className="absolute -bottom-40 start-1/4 h-[26rem] w-[26rem] rounded-full bg-terra/15 blur-3xl dark:bg-terra/[0.07]" />
    </div>
  );
}
