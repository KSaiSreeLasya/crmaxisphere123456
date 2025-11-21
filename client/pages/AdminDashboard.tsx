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
}

interface LeadStatus {
  id: string;
  name: string;
  order_index: number;
  color: string;
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

  const assignedLeads = leads.filter((l) => l.assigned_to === user?.id).length;
  const upcomingReminders = 0;

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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming Reminders
              </h2>
              <span className="text-sm text-gray-500">0 total</span>
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

          {/* Next 7 Days Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Next 7 Days Summary
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-gray-500 text-sm mt-2">Overdue</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-gray-500 text-sm mt-2">Due today</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">0</p>
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
        </div>
      </div>
    </Layout>
  );
}
