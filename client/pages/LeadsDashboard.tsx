import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Users,
} from "lucide-react";

interface LeadStatus {
  id: string;
  name: string;
  order_index: number;
  color: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  job_title: string;
  email: string;
  phone: string;
  status_id: string;
  assigned_to?: string;
  notes?: string;
  next_reminder?: string;
  note?: string;
}

interface LeadsByStatus {
  [key: string]: Lead[];
}

export default function LeadsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<LeadsByStatus>({});
  const [loading, setLoading] = useState(true);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatuses();
    fetchLeads();
  }, [user?.id]);

  const fetchStatuses = async () => {
    try {
      const { data } = await supabase
        .from("lead_status_pipeline")
        .select("*")
        .order("order_index");
      if (data) setStatuses(data);
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (data) {
        setLeads(data);
        // Group leads by status
        const grouped: LeadsByStatus = {};
        data.forEach((lead) => {
          if (!grouped[lead.status_id]) {
            grouped[lead.status_id] = [];
          }
          grouped[lead.status_id].push(lead);
        });
        setLeadsByStatus(grouped);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await supabase.from("leads").delete().eq("id", leadId);
      fetchLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const handleAutoAssign = async () => {
    setAutoAssignLoading(true);
    try {
      // Fetch all sales persons
      const { data: salesPersons, error: spError } = await supabase
        .from("sales_persons")
        .select("id");

      if (spError || !salesPersons || salesPersons.length === 0) {
        toast({
          title: "Error",
          description:
            "No sales persons found. Please add sales persons first.",
          variant: "destructive",
        });
        setAutoAssignLoading(false);
        return;
      }

      // Fetch all unassigned leads
      const { data: unassignedLeads, error: leadsError } = await supabase
        .from("leads")
        .select("id")
        .is("assigned_to", null);

      if (leadsError) {
        throw new Error("Failed to fetch unassigned leads");
      }

      if (!unassignedLeads || unassignedLeads.length === 0) {
        toast({
          title: "Info",
          description: "No unassigned leads found.",
        });
        setAutoAssignLoading(false);
        return;
      }

      // Fetch current lead assignments to calculate load
      const { data: allLeads } = await supabase
        .from("leads")
        .select("assigned_to");

      // Count leads per sales person
      const leadCountPerPerson: Record<string, number> = {};
      salesPersons.forEach((sp) => {
        leadCountPerPerson[sp.id] = 0;
      });

      if (allLeads) {
        allLeads.forEach((lead) => {
          if (lead.assigned_to && leadCountPerPerson[lead.assigned_to]) {
            leadCountPerPerson[lead.assigned_to]++;
          }
        });
      }

      // Assign leads to sales persons with fewest leads
      let assignmentCount = 0;
      for (const unassignedLead of unassignedLeads) {
        // Find sales person with fewest leads
        let minLeads = Infinity;
        let assignToId = salesPersons[0].id;

        for (const sp of salesPersons) {
          if ((leadCountPerPerson[sp.id] || 0) < minLeads) {
            minLeads = leadCountPerPerson[sp.id] || 0;
            assignToId = sp.id;
          }
        }

        // Assign the lead
        const { error } = await supabase
          .from("leads")
          .update({ assigned_to: assignToId })
          .eq("id", unassignedLead.id);

        if (!error) {
          leadCountPerPerson[assignToId]++;
          assignmentCount++;
        }
      }

      toast({
        title: "Success",
        description: `${assignmentCount} lead(s) assigned successfully.`,
      });

      // Refresh leads
      fetchLeads();
    } catch (error) {
      console.error("Error auto-assigning leads:", error);
      toast({
        title: "Error",
        description: "Failed to auto-assign leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  const getStatusColor = (color: string) => {
    const colorMap: Record<string, string> = {
      gray: "bg-gray-100 text-gray-800",
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      pink: "bg-pink-100 text-pink-800",
      green: "bg-green-100 text-green-800",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading leads...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Leads Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              View all leads grouped by status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoAssign}
              disabled={autoAssignLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              <Users className="w-5 h-5" />
              {autoAssignLoading ? "Assigning..." : "Auto Assign Leads"}
            </button>
            <button
              onClick={() => navigate("/leads/add")}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {statuses.map((status) => (
            <div
              key={status.id}
              className={`p-4 rounded-lg text-center cursor-pointer transition-all border-2 ${
                leadsByStatus[status.id]?.length > 0
                  ? `border-${status.color} ${getStatusColor(status.color)}`
                  : "border-border bg-secondary"
              }`}
            >
              <p className="text-xs font-semibold">{status.name}</p>
              <p className="text-2xl font-bold mt-1">
                {leadsByStatus[status.id]?.length || 0}
              </p>
            </div>
          ))}
        </div>

        {/* Leads by Status */}
        <div className="space-y-6">
          {statuses.map((status) => {
            const statusLeads = leadsByStatus[status.id] || [];
            if (statusLeads.length === 0) return null;

            return (
              <div key={status.id}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {status.name}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status.color)}`}
                  >
                    {statusLeads.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white border border-border rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <h3 className="font-semibold text-foreground mb-1">
                        {lead.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {lead.company}
                      </p>

                      <div className="space-y-2 text-sm mb-4">
                        {lead.job_title && (
                          <p className="text-foreground">
                            <span className="font-medium">Title:</span>{" "}
                            {lead.job_title}
                          </p>
                        )}
                        {lead.email && (
                          <p className="text-foreground">
                            <span className="font-medium">Email:</span>{" "}
                            {lead.email}
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-foreground">
                            <span className="font-medium">Phone:</span>{" "}
                            {lead.phone}
                          </p>
                        )}
                        {lead.note && (
                          <p className="text-foreground">
                            <span className="font-medium">Note:</span>{" "}
                            {lead.note}
                          </p>
                        )}
                        {lead.next_reminder && (
                          <p className="text-foreground flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              Next Reminder:
                            </span>{" "}
                            {new Date(lead.next_reminder).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1 border border-input text-foreground rounded hover:bg-secondary text-sm transition-colors">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1 border border-destructive text-destructive rounded hover:bg-destructive/10 text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {Object.keys(leadsByStatus).length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No leads yet</p>
            <button
              onClick={() => navigate("/leads/add")}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <Plus className="w-5 h-5" />
              Add Your First Lead
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
