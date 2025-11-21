import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  BarChart3,
  LogOut,
  FileText,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function Layout({ children, showSidebar = true }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: BarChart3,
      adminOnly: true,
    },
    {
      label: "Sales Person",
      href: "/sales-person",
      icon: Users,
      salesOnly: true,
    },
    {
      label: "Sales Persons",
      href: "/admin/sales-persons",
      icon: Users,
      adminOnly: true,
    },
    {
      label: "Leads",
      href: user?.role === "admin" ? "/admin/leads" : "/leads",
      icon: TrendingUp,
    },
    {
      label: "Invoices",
      href: "/admin/invoices",
      icon: FileText,
      adminOnly: true,
    },
  ].filter(
    (item) =>
      (!item.adminOnly || user?.role === "admin") &&
      (!item.salesOnly || user?.role === "sales"),
  );

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getRoleLabel = () => {
    if (user?.role === "admin") return "Admin";
    return "Sales Person";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fc74248048c80462f93d5f4025f650682%2Fc2993ec3161b4da2bec916066d5b8ea1?format=webp&width=800"
              alt="Axisphere"
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-bold text-lg text-foreground hidden sm:block">
              AXISPHERE CRM
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-foreground">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getRoleLabel()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        {showSidebar && (
          <nav className="hidden md:flex items-center justify-center gap-1 px-6 bg-white overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                    isActive(item.href)
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Mobile Nav */}
        {showSidebar && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border">
            <nav className="flex justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors",
                      isActive(item.href)
                        ? "text-primary border-t-2 border-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs mt-1">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto w-full",
            showSidebar && "pb-16 md:pb-0",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
