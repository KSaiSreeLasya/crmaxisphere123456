import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LeadsKanbanView from "@/components/LeadsKanbanView";
import LeadActivityLog from "@/components/LeadActivityLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  LayoutGrid,
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

interface SalesPerson {
  id: string;
  name: string;
}

export default function LeadsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatuses();
    fetchLeads();
    fetchSalesPersons();
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

  const fetchSalesPersons = async () => {
    try {
      const { data } = await supabase
        .from("sales_persons")
        .select("id, name")
        .order("name");
      if (data) setSalesPersons(data);
    } catch (error) {
      console.error("Error fetching sales persons:", error);
    }
  };

  const fetchLeads = async () => {
    try {
      let query = supabase.from("leads").select("*");

      // Admins see all leads, sales persons see only their own
      if (user?.role !== "admin") {
        query = query.eq("created_by", user?.id);
      }

      const { data } = await query.order("created_at", { ascending: false });

      if (data) {
        setLeads(data);
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

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogOpen(true);
  };

  const handleStatusChange = async (leadId: string, statusId: string) => {
    try {
      await supabase
        .from("leads")
        .update({ status_id: statusId })
        .eq("id", leadId);

      setLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === leadId ? { ...l, status_id: statusId } : l,
        ),
      );

      setSelectedLead((prev) =>
        prev ? { ...prev, status_id: statusId } : null,
      );

      toast({
        title: "Success",
        description: "Lead status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
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

  const getStatusName = (statusId: string) => {
    return statuses.find((s) => s.id === statusId)?.name || "Unknown";
  };

  const getStatusBadgeClass = (statusId: string) => {
    const status = statuses.find((s) => s.id === statusId);
    return status ? getStatusColor(status.color) : "bg-gray-100 text-gray-800";
  };

  const getSalesPersonName = (spId?: string) => {
    if (!spId) return "Unassigned";
    return salesPersons.find((sp) => sp.id === spId)?.name || "Unknown";
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
      <div className="p-6 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Leads Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage all your leads
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

        {/* Tabs for switching between table and kanban views */}
        <Tabs defaultValue="kanban" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span>Leads Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Leads</span>
            </TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban" className="w-full">
            <LeadsKanbanView />
          </TabsContent>

          {/* Table View */}
          <TabsContent value="table" className="w-full">
            {leads.length > 0 ? (
              <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Note
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Next Reminder
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleSelectLead(lead)}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {lead.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {lead.company}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                                lead.status_id,
                              )}`}
                            >
                              {getStatusName(lead.status_id)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {getSalesPersonName(lead.assigned_to)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                            {lead.note || lead.notes || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {lead.next_reminder
                              ? new Date(
                                  lead.next_reminder,
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-right space-x-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => navigate(`/leads/edit/${lead.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1 border border-input text-foreground rounded hover:bg-secondary text-xs transition-colors font-medium"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 border border-destructive text-destructive rounded hover:bg-destructive/10 text-xs transition-colors font-medium"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
