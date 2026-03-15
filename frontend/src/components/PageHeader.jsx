function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff6b57]">{eyebrow}</p>
        <h1 className="mt-2 font-display text-[2.2rem] font-semibold leading-tight text-ink">{title}</h1>
        <p className="mt-2 max-w-2xl text-[1rem] leading-7 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default PageHeader;
