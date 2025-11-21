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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
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

  const handleDeleteLead = (leadId: string) => {
    setLeadToDelete(leadId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;

    try {
      await supabase.from("leads").delete().eq("id", leadToDelete);
      toast({
        title: "Success",
        description: "Lead deleted successfully.",
      });
      fetchLeads();
      if (selectedLead?.id === leadToDelete) {
        setDialogOpen(false);
        setSelectedLead(null);
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Error",
        description: "Failed to delete lead.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
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
          <TabsContent value="table" className="w-full" onClick={() => setDialogOpen(false)}>
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
                              onClick={() => handleEditLead(lead)}
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

        {/* Lead Detail Dialog */}
        <LeadDetailDialog
          lead={selectedLead}
          statuses={statuses}
          salesPersons={salesPersons}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onStatusChange={handleStatusChange}
          onLeadsChange={fetchLeads}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this lead? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}

function LeadDetailDialog({
  lead,
  statuses,
  salesPersons,
  open,
  onOpenChange,
  onStatusChange,
}: {
  lead: Lead | null;
  statuses: LeadStatus[];
  salesPersons: SalesPerson[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (leadId: string, statusId: string) => Promise<void>;
}) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const { toast } = useToast();

  if (!lead) return null;

  const currentStatus = statuses.find((s) => s.id === lead.status_id);
  const assignedTo = salesPersons.find((sp) => sp.id === lead.assigned_to);

  const handleStatusChange = async (newStatusId: string) => {
    setIsChangingStatus(true);
    try {
      await onStatusChange(lead.id, newStatusId);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      job_title: lead.job_title,
      notes: lead.notes,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          company: editForm.company,
          job_title: editForm.job_title,
          notes: editForm.notes,
        })
        .eq("id", lead.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead updated successfully.",
      });

      setIsEditing(false);
      // Refresh the dialog with updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{lead.name}</DialogTitle>
              <DialogDescription>{lead.company}</DialogDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={handleEditClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDialogOpen(false);
                      setTimeout(
                        () => handleDeleteLead(lead.id),
                        300
                      );
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                        Company
                      </label>
                      <input
                        type="text"
                        value={editForm.company || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, company: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={editForm.job_title || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            job_title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      Notes
                    </label>
                    <textarea
                      value={editForm.notes || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-input text-foreground rounded-lg hover:bg-secondary font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      Job Title
                    </h4>
                    <p className="text-foreground">{lead.job_title || "-"}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      Email
                    </h4>
                    <p className="text-foreground break-all">
                      {lead.email || "-"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      Phone
                    </h4>
                    <p className="text-foreground">{lead.phone || "-"}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      Assigned To
                    </h4>
                    <p className="text-foreground">
                      {assignedTo?.name || "Unassigned"}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      Status
                    </h4>
                    <select
                      disabled={isChangingStatus}
                      defaultValue={lead.status_id}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-white text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {lead.next_reminder && (
                    <div className="col-span-2">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                        Next Reminder
                      </h4>
                      <p className="text-foreground">
                        {new Date(lead.next_reminder).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Activity Log Tab */}
            <TabsContent value="activity" className="mt-6">
              <LeadActivityLog
                key={refreshKey}
                leadId={lead.id}
                initialNote={lead.notes}
                onNoteAdded={() => setRefreshKey((prev) => prev + 1)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
