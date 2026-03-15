import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function EmailActivityChart({ data }) {
  return (
    <div className="rounded-[1.1rem] border border-[#ece4d8] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Activity</p>
        <h3 className="mt-2 font-display text-[1.8rem] text-ink">Email activity</h3>
      </div>
      <div className="h-[20.5rem]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6b57" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#ff6b57" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee7de" />
            <XAxis dataKey="label" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#ece4d8" }} />
            <Area type="monotone" dataKey="emails" stroke="#ff6b57" fill="url(#activityFill)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatusBreakdownChart({ data }) {
  const colors = ["#ff6b57", "#0f172a", "#7dd3fc"];

  return (
    <div className="rounded-[1.1rem] border border-[#ece4d8] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Status mix</p>
      <h3 className="mt-2 font-display text-[1.8rem] text-ink">Send outcomes</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function VolumeChart({ data }) {
  return (
    <div className="rounded-[1.1rem] border border-[#ece4d8] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Campaign volume</p>
      <h3 className="mt-2 font-display text-[1.8rem] text-ink">Weekly send trend</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Bar dataKey="sent" fill="#0f172a" radius={[10, 10, 0, 0]} />
            <Bar dataKey="failed" fill="#ff6b57" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
