import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  Bell,
  Users,
  TrendingUp,
  Eye,
  Calendar,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SalesPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  job_title: string;
  status_id: string;
  assigned_to?: string;
  next_reminder?: string;
}

interface LeadStatus {
  id: string;
  name: string;
  order_index: number;
  color: string;
}

interface CurrentSalesPerson {
  id: string;
  name: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassigningLeadId, setReassigningLeadId] = useState<string | null>(null);
  const [currentSalesPerson, setCurrentSalesPerson] = useState<CurrentSalesPerson | null>(null);

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    fetchData();
  }, [user?.id, user]);

  const fetchData = async () => {
    try {
      const { data: sp } = await supabase.from("sales_persons").select("*");
      if (sp) setSalesPersons(sp);

      const { data: leadsData } = await supabase.from("leads").select("*");
      if (leadsData) setLeads(leadsData);

      const { data: statusData } = await supabase
        .from("lead_status_pipeline")
        .select("*");
      if (statusData) setStatuses(statusData);

      // Fetch current sales person if user is a sales person
      if (user?.role === "sales" && user?.id) {
        const { data: spData } = await supabase
          .from("sales_persons")
          .select("id, name")
          .eq("user_id", user.id)
          .single();
        if (spData) {
          setCurrentSalesPerson(spData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReassignLead = async (leadId: string, newAssignedTo: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: newAssignedTo })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead reassigned successfully",
      });

      setReassigningLeadId(null);
      await fetchData();
    } catch (error) {
      console.error("Error reassigning lead:", error);
      toast({
        title: "Error",
        description: "Failed to reassign lead",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (statusId: string) => {
    const status = statuses.find((s) => s.id === statusId);
    if (!status) return "bg-gray-100 text-gray-800";

    const colorMap: Record<string, string> = {
      gray: "bg-gray-100 text-gray-800",
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      pink: "bg-pink-100 text-pink-800",
      green: "bg-green-100 text-green-800",
    };
    return colorMap[status.color] || "bg-gray-100 text-gray-800";
  };

  const userLeads = leads.filter((l) => {
    if (user?.role === "sales") {
      return l.assigned_to === currentSalesPerson?.id;
    }
    return l.assigned_to === user?.id;
  });
  const assignedLeads = userLeads.length;

  const upcomingReminders = userLeads.filter((lead) => {
    if (!lead.next_reminder) return false;
    const reminderDate = new Date(lead.next_reminder);
    const today = new Date();

    // Set to start of day for comparison
    today.setHours(0, 0, 0, 0);
    reminderDate.setHours(0, 0, 0, 0);

    // Check if reminder is today or within next 7 days
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return reminderDate >= today && reminderDate <= sevenDaysFromNow;
  }).length;

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 mb-8 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-2">
              Welcome to Axisphere CRM
            </h1>
            <p className="text-blue-100 mb-6">
              Manage your sales team and team efficiently
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/leads")}
                className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Manage Leads
              </button>
              <button
                onClick={() => navigate("/admin/sales-persons/add")}
                className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Manage Sales Persons
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* My Assigned Leads */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-medium text-sm">
                  My Assigned Leads
                </h3>
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-4xl font-bold text-gray-900">
                {assignedLeads}
              </p>
            </div>

            {/* Upcoming Reminders */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-medium text-sm">
                  Upcoming Reminders
                </h3>
                <Bell className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-4xl font-bold text-gray-900">
                {upcomingReminders}
              </p>
            </div>

            {/* Total Sales Persons */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-600 font-medium text-sm">
                  Total Sales Persons
                </h3>
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-4xl font-bold text-gray-900">
                {salesPersons.length}
              </p>
            </div>
          </div>

          {/* Upcoming Reminders Section */}
          {upcomingReminders > 0 ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Upcoming Reminders (Next 7 Days)
              </h2>
              <div className="space-y-3">
                {userLeads
                  .filter((lead) => {
                    if (!lead.next_reminder) return false;
                    const reminderDate = new Date(lead.next_reminder);
                    const today = new Date();

                    today.setHours(0, 0, 0, 0);
                    reminderDate.setHours(0, 0, 0, 0);

                    const sevenDaysFromNow = new Date(today);
                    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

                    return reminderDate >= today && reminderDate <= sevenDaysFromNow;
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.next_reminder || "").getTime();
                    const dateB = new Date(b.next_reminder || "").getTime();
                    return dateA - dateB;
                  })
                  .map((lead) => {
                    const status = statuses.find((s) => s.id === lead.status_id);
                    return (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-orange-400 rounded-full" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {lead.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {status?.name || "Unknown"} • {lead.company}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(lead.next_reminder!).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">Reminder</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Reminders
                </h2>
              </div>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-gray-600 font-medium">No upcoming reminders</p>
                <p className="text-gray-400 text-sm">
                  All your tasks are up to date
                </p>
              </div>
            </div>
          )}

          {/* Next 7 Days Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Next 7 Days Summary
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {userLeads.filter((lead) => {
                    if (!lead.next_reminder) return false;
                    const reminderDate = new Date(lead.next_reminder);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    reminderDate.setHours(0, 0, 0, 0);
                    return reminderDate < today;
                  }).length}
                </p>
                <p className="text-gray-500 text-sm mt-2">Overdue</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {userLeads.filter((lead) => {
                    if (!lead.next_reminder) return false;
                    const reminderDate = new Date(lead.next_reminder);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    reminderDate.setHours(0, 0, 0, 0);
                    return reminderDate.getTime() === today.getTime();
                  }).length}
                </p>
                <p className="text-gray-500 text-sm mt-2">Due today</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {userLeads.filter((lead) => {
                    if (!lead.next_reminder) return false;
                    const reminderDate = new Date(lead.next_reminder);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    reminderDate.setHours(0, 0, 0, 0);
                    const sevenDaysFromNow = new Date(today);
                    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                    return reminderDate > today && reminderDate <= sevenDaysFromNow;
                  }).length}
                </p>
                <p className="text-gray-500 text-sm mt-2">Later</p>
              </div>
            </div>
          </div>

          {/* Recent Leads and Sales Persons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Leads */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Leads
                </h2>
                <button
                  onClick={() => navigate("/leads")}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  View All
                </button>
              </div>
              {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500">No leads yet</p>
                  <button
                    onClick={() => navigate("/leads/add")}
                    className="mt-4 text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    Add Your First Lead
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.slice(0, 3).map((lead) => {
                    const status = statuses.find(
                      (s) => s.id === lead.status_id,
                    );
                    return (
                      <div
                        key={lead.id}
                        className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {lead.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {lead.company}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded ${getStatusColor(
                            lead.status_id,
                          )}`}
                        >
                          {status?.name || "Unknown"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Sales Persons */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Sales Persons
                </h2>
                <button
                  onClick={() => navigate("/admin/sales-persons/add")}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  View All
                </button>
              </div>
              {salesPersons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500">No sales persons yet</p>
                  <button
                    onClick={() => navigate("/admin/sales-persons/add")}
                    className="mt-4 text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    Add Your First Sales Person
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {salesPersons.slice(0, 3).map((person) => {
                    const personLeads = leads.filter(
                      (l) => l.assigned_to === person.id,
                    ).length;
                    return (
                      <div
                        key={person.id}
                        className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {person.name}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {person.email}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {personLeads} leads
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {leads.length}
                </p>
                <p className="text-gray-500 text-sm mt-2">Total Leads</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {salesPersons.length}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Total Sales Persons
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {
                    leads.filter((l) =>
                      statuses.find(
                        (s) => s.id === l.status_id && s.name === "Email",
                      ),
                    ).length
                  }
                </p>
                <p className="text-gray-500 text-sm mt-2">Leads with Email</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {
                    leads.filter((l) =>
                      statuses.find(
                        (s) => s.id === l.status_id && s.name === "Phone",
                      ),
                    ).length
                  }
                </p>
                <p className="text-gray-500 text-sm mt-2">Leads with Phone</p>
              </div>
            </div>
          </div>

          {/* Assigned Leads Section */}
          {assignedLeads > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                My Assigned Leads ({assignedLeads})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Next Reminder
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Reassign To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userLeads.map((lead) => {
                      const status = statuses.find((s) => s.id === lead.status_id);
                      return (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {lead.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {lead.company}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                lead.status_id,
                              )}`}
                            >
                              {status?.name || "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {lead.next_reminder
                              ? new Date(lead.next_reminder).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {reassigningLeadId === lead.id ? (
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleReassignLead(lead.id, e.target.value);
                                  }
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select person...</option>
                                {salesPersons
                                  .filter((sp) => sp.id !== lead.assigned_to)
                                  .map((sp) => (
                                    <option key={sp.id} value={sp.id}>
                                      {sp.name}
                                    </option>
                                  ))}
                              </select>
                            ) : (
                              <button
                                onClick={() => setReassigningLeadId(lead.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              >
                                <ArrowRight className="w-3 h-3" />
                                Reassign
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
