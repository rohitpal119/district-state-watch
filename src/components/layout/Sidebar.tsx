import { NavLink } from "react-router-dom";
import { Building2, BarChart3, DollarSign, AlertTriangle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: "state_official" | "district_collector";
}

const Sidebar = ({ userRole }: SidebarProps) => {
  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: Building2 },
    { to: "/projects", label: "Projects", icon: BarChart3 },
    { to: "/fund-flow", label: "Fund Flow", icon: DollarSign },
    { to: "/alerts", label: "Alerts", icon: AlertTriangle },
    { to: "/feedback", label: "Citizen Feedback", icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">PM-AJAY</h1>
            <p className="text-xs text-muted-foreground">
              {userRole === "state_official" ? "State Portal" : "District Portal"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-muted"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
