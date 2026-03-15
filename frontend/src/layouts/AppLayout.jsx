import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navigation = [
  { to: "/app", label: "Dashboard" },
  { to: "/app/campaigns/new", label: "Create Campaign" },
  { to: "/app/campaigns/upload", label: "Upload CSV" },
  { to: "/app/contacts", label: "Contacts" },
  { to: "/app/templates", label: "Templates" },
  { to: "/app/logs", label: "Email Logs" },
  { to: "/app/analytics", label: "Analytics" }
];

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = navigation.find((item) => item.to === location.pathname)?.label || "Overview";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f8f5ef] px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1560px] gap-4 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[196px_minmax(0,1fr)]">
        <aside className="rounded-[1.2rem] border border-[#e8dfd3] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:sticky lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:flex-col">
          <div className="rounded-[0.95rem] border border-[#ece4d8] bg-[#fcfaf7] px-3 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#132238] text-sm font-bold text-white shadow-sm">MP</div>
              <div className="min-w-0">
                <p className="font-display text-[1.25rem] font-semibold leading-none text-[#132238]">MailPilot</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Navigation</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/app/campaigns/new")}
              className="mt-3 w-full rounded-xl bg-[#ff6b57] px-3 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,107,87,0.18)] transition hover:brightness-95"
            >
              New campaign
            </button>
          </div>

          <nav className="mt-3 space-y-1.5">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app"}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium transition ${
                    isActive
                      ? "bg-[#132238] text-white"
                      : "text-slate-700 hover:bg-[#faf6f0]"
                  }`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 rounded-[0.95rem] border border-[#ece4d8] bg-[#fcfaf7] px-3 py-3 lg:mt-auto">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Account</p>
            <div className="mt-2.5 flex items-center gap-2.5">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full border border-[#ece4d8] object-cover" />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#132238] text-xs font-bold text-white">
                  {(user?.name || "M").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-ink">{user?.name || "MailPilot User"}</p>
                <p className="truncate text-[12px] text-slate-500">{user?.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full rounded-lg border border-[#e3d8ca] bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#faf6f0]"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0 rounded-[1.45rem] border border-[#e8dfd3] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6 xl:p-7">
          <div className="mb-6 flex flex-col gap-3 rounded-[1.1rem] border border-[#ece4d8] bg-[#fcfaf7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
              <p className="text-xl font-semibold text-ink">{currentPage}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 rounded-full border border-[#ece4d8] bg-white px-3 py-1.5">
                <p className="max-w-[220px] truncate text-sm font-medium text-slate-600">{user?.email}</p>
              </div>

              <div className="rounded-full bg-[#fff1e5] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d16d35]">
                Workspace live
              </div>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
