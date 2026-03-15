function CampaignTable({ campaigns }) {
  return (
    <div className="overflow-hidden rounded-[1.1rem] border border-[#ece4d8] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-[#fcfaf7]">
          <tr>
            <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Campaign</th>
            <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Status</th>
            <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Recipients</th>
            <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Schedule</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {campaigns.map((campaign) => (
            <tr key={campaign._id} className="hover:bg-[#fcfaf7]">
              <td className="px-5 py-4">
                <p className="font-semibold text-ink">{campaign.title}</p>
                <p className="text-sm text-slate-500">{campaign.subject}</p>
              </td>
              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                    campaign.status === "sent"
                      ? "bg-emerald-50 text-emerald-700"
                      : campaign.status === "failed"
                        ? "bg-rose-50 text-rose-600"
                        : campaign.status === "scheduled"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {campaign.status}
                </span>
              </td>
              <td className="px-5 py-4 text-slate-600">{campaign.recipients?.length || 0}</td>
              <td className="px-5 py-4 text-slate-600">
                {campaign.scheduleAt ? new Date(campaign.scheduleAt).toLocaleString() : "Send now"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CampaignTable;
