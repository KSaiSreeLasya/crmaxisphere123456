import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { X, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  created_at?: string;
  created_by?: string;
}

interface SalesPerson {
  id: string;
  name: string;
}

function DraggableLeadCard({
  lead,
  statuses,
  salesPersons,
  onSelect,
}: {
  lead: Lead;
  statuses: LeadStatus[];
  salesPersons: SalesPerson[];
  onSelect: (lead: Lead) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusName =
    statuses.find((s) => s.id === lead.status_id)?.name || "Unknown";
  const salesPersonName =
    salesPersons.find((sp) => sp.id === lead.assigned_to)?.name ||
    "Unassigned";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 rounded-lg border-2 border-gray-200 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={() => onSelect(lead)}
        className="cursor-pointer hover:text-blue-600 transition-colors"
      >
        <h3 className="font-semibold text-sm text-foreground truncate mb-1">
          {lead.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate mb-2">
          {lead.company}
        </p>
        {lead.job_title && (
          <p className="text-xs text-muted-foreground truncate mb-2">
            {lead.job_title}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-muted-foreground truncate flex-1">
          {salesPersonName}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  leads,
  statuses,
  salesPersons,
  onSelectLead,
}: {
  status: LeadStatus;
  leads: Lead[];
  statuses: LeadStatus[];
  salesPersons: SalesPerson[];
  onSelectLead: (lead: Lead) => void;
}) {
  const { setNodeRef } = useSortable({ id: status.id });

  const getStatusColor = (color: string) => {
    const colorMap: Record<string, string> = {
      gray: "bg-gray-50 border-gray-300",
      blue: "bg-blue-50 border-blue-300",
      purple: "bg-purple-50 border-purple-300",
      yellow: "bg-yellow-50 border-yellow-300",
      orange: "bg-orange-50 border-orange-300",
      pink: "bg-pink-50 border-pink-300",
      green: "bg-green-50 border-green-300",
    };
    return colorMap[color] || "bg-gray-50 border-gray-300";
  };

  const getHeaderBgColor = (color: string) => {
    const colorMap: Record<string, string> = {
      gray: "bg-gray-200",
      blue: "bg-blue-200",
      purple: "bg-purple-200",
      yellow: "bg-yellow-200",
      orange: "bg-orange-200",
      pink: "bg-pink-200",
      green: "bg-green-200",
    };
    return colorMap[color] || "bg-gray-200";
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 rounded-lg border-2 ${getStatusColor(
        status.color,
      )} flex flex-col`}
    >
      <div className={`${getHeaderBgColor(status.color)} p-4 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">
            {status.name}
          </h2>
          <span className="bg-white px-2 py-1 rounded text-xs font-bold text-foreground">
            {leads.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-96">
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length > 0 ? (
            leads.map((lead) => (
              <DraggableLeadCard
                key={lead.id}
                lead={lead}
                statuses={statuses}
                salesPersons={salesPersons}
                onSelect={onSelectLead}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
              No leads
            </div>
          )}
        </SortableContext>
      </div>
    </div>
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

  if (!lead) return null;

  const currentStatus = statuses.find((s) => s.id === lead.status_id);
  const assignedTo = salesPersons.find((sp) => sp.id === lead.assigned_to);

  const handleStatusChange = async (newStatusId: string) => {
    setIsChangingStatus(true);
    try {
      await onStatusChange(lead.id, newStatusId);
      onOpenChange(false);
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{lead.name}</DialogTitle>
          <DialogDescription>{lead.company}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-6">
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
            <p className="text-foreground break-all">{lead.email || "-"}</p>
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
            <p className="text-foreground">{assignedTo?.name || "Unassigned"}</p>
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

          {lead.notes && (
            <div className="col-span-2">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                Notes
              </h4>
              <p className="text-foreground whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          )}

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
      </DialogContent>
    </Dialog>
  );
}

export default function LeadsKanbanView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
  );

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const [statusesRes, leadsRes, personRes] = await Promise.all([
        supabase
          .from("lead_status_pipeline")
          .select("*")
          .order("order_index"),
        supabase.from("leads").select("*"),
        supabase.from("sales_persons").select("id, name"),
      ]);

      if (statusesRes.data) setStatuses(statusesRes.data);
      if (leadsRes.data) {
        if (user?.role !== "admin") {
          setLeads(
            leadsRes.data.filter((lead) => lead.created_by === user?.id),
          );
        } else {
          setLeads(leadsRes.data);
        }
      }
      if (personRes.data) setSalesPersons(personRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const leadId = active.id as string;
    const newStatusId = over.id as string;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status_id === newStatusId) return;

    try {
      await supabase
        .from("leads")
        .update({ status_id: newStatusId })
        .eq("id", leadId);

      setLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === leadId ? { ...l, status_id: newStatusId } : l,
        ),
      );

      toast({
        title: "Success",
        description: `Lead moved successfully.`,
      });
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
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

  const getStatusStats = (statusId: string) => {
    return leads.filter((l) => l.status_id === statusId).length;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading kanban board...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Leads Summary
        </h2>
        <p className="text-muted-foreground mb-6">
          View all leads grouped by status
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {statuses.map((status) => {
            const count = getStatusStats(status.id);
            const colorMap: Record<string, string> = {
              gray: "bg-gray-100 border-gray-300 text-gray-800",
              blue: "bg-blue-100 border-blue-300 text-blue-800",
              purple: "bg-purple-100 border-purple-300 text-purple-800",
              yellow: "bg-yellow-100 border-yellow-300 text-yellow-800",
              orange: "bg-orange-100 border-orange-300 text-orange-800",
              pink: "bg-pink-100 border-pink-300 text-pink-800",
              green: "bg-green-100 border-green-300 text-green-800",
            };

            return (
              <div
                key={status.id}
                className={`border-2 rounded-lg p-4 text-center ${
                  colorMap[status.color] || colorMap.gray
                }`}
              >
                <p className="text-sm font-medium mb-2">{status.name}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Kanban Board
        </h2>
        <p className="text-muted-foreground mb-6">
          Drag and drop leads to change their status
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        onDragStart={(event) => {
          setActiveId(event.active.id as string);
        }}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const statusLeads = leads.filter((l) => l.status_id === status.id);
            return (
              <KanbanColumn
                key={status.id}
                status={status}
                leads={statusLeads}
                statuses={statuses}
                salesPersons={salesPersons}
                onSelectLead={handleSelectLead}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeId
            ? leads.find((l) => l.id === activeId) && (
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-xl opacity-75 w-80">
                  <h3 className="font-semibold text-sm text-foreground">
                    {leads.find((l) => l.id === activeId)?.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {leads.find((l) => l.id === activeId)?.company}
                  </p>
                </div>
              )
            : null}
        </DragOverlay>
      </DndContext>

      <LeadDetailDialog
        lead={selectedLead}
        statuses={statuses}
        salesPersons={salesPersons}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
