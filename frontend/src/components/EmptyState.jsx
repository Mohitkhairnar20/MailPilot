function EmptyState({ title, description }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-3 text-slate-600">{description}</p>
    </div>
  );
}

export default EmptyState;
