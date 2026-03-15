function MetricCard({ label, value, helper, tone = "light" }) {
  const toneClass =
    tone === "dark"
      ? "border-[#24354f] bg-[#1b2b44] text-white"
      : "border-[#ece4d8] bg-white text-ink";

  return (
    <div className={`rounded-[1.1rem] border p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${toneClass}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
      <h3 className="mt-3 font-display text-[2rem] font-semibold leading-none">{value}</h3>
      <p className={`mt-2 text-sm leading-6 ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{helper}</p>
    </div>
  );
}

export default MetricCard;
