import { useState } from "react";
import Layout from "@/components/Layout";
import SalesPersonForm from "@/components/SalesPersonForm";
import LeadsForm from "@/components/LeadsForm";
import { Edit, Trash2, Plus, BarChart3, Users, TrendingUp } from "lucide-react";

interface SalesPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  leadsCount: number;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  jobTitle: string;
  status: "new" | "contacted" | "qualified" | "converted";
  assignedTo?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "leads">(
    "overview"
  );
  const [showSalesPersonForm, setShowSalesPersonForm] = useState(false);
  const [showLeadsForm, setShowLeadsForm] = useState(false);
  const [editingSalesPerson, setEditingSalesPerson] = useState<SalesPerson | undefined>();
  const [editingLead, setEditingLead] = useState<Lead | undefined>();

  // Mock data
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+1 (555) 123-4567",
      leadsCount: 12,
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael@example.com",
      phone: "+1 (555) 234-5678",
      leadsCount: 8,
    },
    {
      id: "3",
      name: "Emma Williams",
      email: "emma@example.com",
      phone: "+1 (555) 345-6789",
      leadsCount: 15,
    },
  ]);

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "1",
      name: "Acme Corp",
      company: "Acme Corporation",
      jobTitle: "Sales Director",
      status: "qualified",
      assignedTo: "Sarah Johnson",
    },
    {
      id: "2",
      name: "Tech Solutions Ltd",
      company: "Tech Solutions",
      jobTitle: "Manager",
      status: "contacted",
      assignedTo: "Michael Chen",
    },
    {
      id: "3",
      name: "Global Industries",
      company: "Global Industries Inc",
      jobTitle: "VP Sales",
      status: "new",
    },
    {
      id: "4",
      name: "StartUp Ventures",
      company: "StartUp Ventures",
      jobTitle: "Founder",
      status: "converted",
      assignedTo: "Emma Williams",
    },
  ]);

  const handleAddSalesPerson = (data: any) => {
    const newSalesPerson: SalesPerson = {
      id: Date.now().toString(),
      ...data,
      leadsCount: 0,
    };
    setSalesPersons([...salesPersons, newSalesPerson]);
  };

  const handleUpdateSalesPerson = (data: any) => {
    setSalesPersons(
      salesPersons.map((sp) =>
        sp.id === editingSalesPerson?.id ? { ...sp, ...data } : sp
      )
    );
    setEditingSalesPerson(undefined);
  };

  const handleDeleteSalesPerson = (id: string) => {
    setSalesPersons(salesPersons.filter((sp) => sp.id !== id));
  };

  const handleAddLead = (data: any) => {
    const newLead: Lead = {
      id: Date.now().toString(),
      name: data.name,
      company: data.company,
      jobTitle: data.jobTitle,
      status: "new",
    };
    setLeads([...leads, newLead]);
  };

  const handleDeleteLead = (id: string) => {
    setLeads(leads.filter((l) => l.id !== id));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      converted: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
      value: leads.filter((l) => l.status === "converted").length,
      icon: BarChart3,
      color: "text-green-600",
    },
  ];

  return (
    <Layout showSidebar={true}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
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
                onClick={() => {
                  setEditingSalesPerson(undefined);
                  setShowSalesPersonForm(true);
                }}
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
                      {person.leadsCount} leads assigned
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSalesPerson(person);
                        setShowSalesPersonForm(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-input text-foreground rounded-lg hover:bg-secondary transition-colors"
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
                  setEditingLead(undefined);
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
                      Assigned To
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border hover:bg-secondary">
                      <td className="py-4 px-4 text-foreground font-medium">
                        {lead.name}
                      </td>
                      <td className="py-4 px-4 text-foreground">
                        {lead.company}
                      </td>
                      <td className="py-4 px-4 text-foreground">
                        {lead.jobTitle}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            lead.status
                          )}`}
                        >
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-foreground">
                        {lead.assignedTo || "-"}
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
                  ))}
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
                      <p className="font-medium text-foreground">{person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {person.email}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {person.leadsCount} leads
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
                {leads.slice(0, 3).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.company}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forms */}
      {showSalesPersonForm && (
        <SalesPersonForm
          initialData={editingSalesPerson}
          onSubmit={
            editingSalesPerson
              ? handleUpdateSalesPerson
              : handleAddSalesPerson
          }
          onClose={() => {
            setShowSalesPersonForm(false);
            setEditingSalesPerson(undefined);
          }}
        />
      )}

      {showLeadsForm && (
        <LeadsForm
          initialData={editingLead as any}
          onSubmit={handleAddLead}
          onClose={() => {
            setShowLeadsForm(false);
            setEditingLead(undefined);
          }}
        />
      )}
    </Layout>
  );
}
