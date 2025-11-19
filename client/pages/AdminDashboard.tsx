import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Edit, Trash2, Plus, BarChart3, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

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
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "leads">(
    "overview",
  );
  const [editingSalesPerson, setEditingSalesPerson] = useState<
    SalesPerson | undefined
  >();
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") {
      // Redirect non-admins to leads
      window.location.href = "/leads";
      return;
    }
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // Fetch sales persons
      const { data: sp } = await supabase.from("sales_persons").select("*");
      if (sp) setSalesPersons(sp);

      // Fetch leads
      const { data: leadsData } = await supabase.from("leads").select("*");
      if (leadsData) setLeads(leadsData);

      // Fetch statuses
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


  const handleDeleteSalesPerson = async (id: string) => {
    try {
      await supabase.from("sales_persons").delete().eq("id", id);
      fetchData();
    } catch (error) {
      console.error("Error deleting sales person:", error);
    }
  };


  const handleDeleteLead = async (id: string) => {
    try {
      await supabase.from("leads").delete().eq("id", id);
      fetchData();
    } catch (error) {
      console.error("Error deleting lead:", error);
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

  const stats = [
    {
      label: "Sales Persons",
      value: salesPersons.length,
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: "Total Leads",
      value: leads.length,
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      label: "Converted",
      value: leads.filter((l) =>
        statuses.find((s) => s.id === l.status_id && s.name === "Result"),
      ).length,
      icon: BarChart3,
      color: "text-green-600",
    },
  ];

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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your sales team and leads
          </p>
        </div>

        {/* Stats */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, idx) => {
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
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <Icon className={`w-10 h-10 ${stat.color} opacity-20`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "sales"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            Sales Persons
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "leads"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            Leads
          </button>
        </div>

        {/* Sales Persons Tab */}
        {activeTab === "sales" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Sales Persons
              </h2>
              <button
                onClick={() => navigate("/admin/sales-persons/add")}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Sales Person
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salesPersons.map((person) => (
                <div
                  key={person.id}
                  className="bg-white border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    {person.name}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <p>📧 {person.email}</p>
                    <p>📱 {person.phone}</p>
                    <p className="text-primary font-medium">
                      {leads.filter((l) => l.assigned_to === person.id).length}{" "}
                      leads assigned
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-input text-foreground rounded-lg hover:bg-secondary transition-colors opacity-50 cursor-not-allowed"
                      title="Edit functionality coming soon"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSalesPerson(person.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Leads</h2>
              <button
                onClick={() => {
                  setShowLeadsForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Lead
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Lead Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Company
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Job Title
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const status = statuses.find(
                      (s) => s.id === lead.status_id,
                    );
                    return (
                      <tr
                        key={lead.id}
                        className="border-b border-border hover:bg-secondary"
                      >
                        <td className="py-4 px-4 text-foreground font-medium">
                          {lead.name}
                        </td>
                        <td className="py-4 px-4 text-foreground">
                          {lead.company}
                        </td>
                        <td className="py-4 px-4 text-foreground">
                          {lead.job_title || "-"}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              lead.status_id,
                            )}`}
                          >
                            {status?.name || "Unknown"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Sales Persons */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recent Sales Persons
              </h3>
              <div className="space-y-3">
                {salesPersons.slice(0, 3).map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {person.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {person.email}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {leads.filter((l) => l.assigned_to === person.id).length}{" "}
                      leads
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recent Leads
              </h3>
              <div className="space-y-3">
                {leads.slice(0, 3).map((lead) => {
                  const status = statuses.find((s) => s.id === lead.status_id);
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {lead.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.company}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(
                          lead.status_id,
                        )}`}
                      >
                        {status?.name || "Unknown"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forms */}
      {showSalesPersonForm && (
        <SalesPersonForm
          initialData={editingSalesPerson}
          onSubmit={handleAddSalesPerson}
          onClose={() => {
            setShowSalesPersonForm(false);
            setEditingSalesPerson(undefined);
          }}
        />
      )}

      {showLeadsForm && (
        <LeadsForm
          onSubmit={handleAddLead}
          onClose={() => {
            setShowLeadsForm(false);
          }}
        />
      )}
    </Layout>
  );
}
