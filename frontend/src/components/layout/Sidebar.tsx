import { NavLink } from "react-router-dom";
import { LayoutGrid, ListTree, ShieldAlert, Radar, Settings, Satellite } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/transactions", label: "Transactions", icon: ListTree },
  { to: "/alerts", label: "Fraud Alerts", icon: ShieldAlert },
  { to: "/live", label: "Live Radar", icon: Radar },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-foreground/[0.06] bg-panel/40 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
          <Satellite className="h-5 w-5 text-background" />
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-none">Sentinel</p>
          <p className="text-[11px] text-muted-foreground mt-1">Fraud Detection Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsla(var(--glow-a),0.25)]"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mb-4 rounded-lg border border-foreground/[0.06] bg-foreground/[0.02] p-3.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Settings className="h-3.5 w-3.5" />
          Model Status
        </div>
        <div className="mt-2 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">XGBoost</span>
            <span className="text-success">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Isolation Forest</span>
            <span className="text-success">Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
