import Layout from "@/components/Layout";
import {
  Users,
  Target,
  TrendingUp,
  Award,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Reminder {
  id: string;
  name: string;
  company: string;
  next_reminder: string;
  job_title: string;
}

export default function SalesDashboard() {
  const { user } = useAuth();
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUpcomingReminders();
    }
  }, [user?.id]);

  const fetchUpcomingReminders = async () => {
    try {
      const { data } = await supabase
        .from("leads")
        .select("id, name, company, next_reminder, job_title")
        .eq("created_by", user?.id)
        .not("next_reminder", "is", null)
        .gte("next_reminder", new Date().toISOString().split("T")[0])
        .order("next_reminder", { ascending: true })
        .limit(5);

      if (data) {
        setUpcomingReminders(data);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };
  const salesStats = [
    {
      label: "Total Sales Persons",
      value: 12,
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: "Active Sales",
      value: 48,
      icon: Target,
      color: "text-orange-600",
    },
    {
      label: "This Month Revenue",
      value: "$125K",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Top Performer",
      value: "Emma Williams",
      icon: Award,
      color: "text-purple-600",
    },
  ];

  const salesPersonsPerformance = [
    {
      id: 1,
      name: "Emma Williams",
      leads: 24,
      converted: 8,
      revenue: "$45,000",
      conversionRate: "33%",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      leads: 20,
      converted: 6,
      revenue: "$38,000",
      conversionRate: "30%",
    },
    {
      id: 3,
      name: "Michael Chen",
      leads: 18,
      converted: 5,
      revenue: "$32,000",
      conversionRate: "28%",
    },
    {
      id: 4,
      name: "Lisa Anderson",
      leads: 16,
      converted: 4,
      revenue: "$28,000",
      conversionRate: "25%",
    },
    {
      id: 5,
      name: "David Martinez",
      leads: 14,
      converted: 3,
      revenue: "$22,000",
      conversionRate: "21%",
    },
  ];

  return (
    <Layout showSidebar={true}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Sales Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor sales team performance and metrics
          </p>
        </div>

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-900">
                Upcoming Reminders
              </h2>
            </div>
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {reminder.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reminder.company}
                      {reminder.job_title && ` • ${reminder.job_title}`}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-blue-600">
                    {new Date(reminder.next_reminder).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {salesStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`w-10 h-10 ${stat.color} opacity-20`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Table */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Sales Performance
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Sales Person
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Total Leads
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Converted
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Conversion Rate
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesPersonsPerformance.map((person) => (
                  <tr
                    key={person.id}
                    className="border-b border-border hover:bg-secondary"
                  >
                    <td className="py-4 px-4 text-foreground font-medium">
                      {person.name}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {person.leads}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {person.converted}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {person.conversionRate}
                    </td>
                    <td className="py-4 px-4 text-foreground font-semibold">
                      {person.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
