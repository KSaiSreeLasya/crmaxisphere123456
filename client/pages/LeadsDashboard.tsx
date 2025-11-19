import Layout from "@/components/Layout";
import { TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function LeadsDashboard() {
  const leadStats = [
    { label: "New Leads", value: 24, icon: AlertCircle, color: "text-blue-600" },
    { label: "In Progress", value: 18, icon: Clock, color: "text-yellow-600" },
    { label: "Qualified", value: 12, icon: TrendingUp, color: "text-purple-600" },
    { label: "Converted", value: 8, icon: CheckCircle, color: "text-green-600" },
  ];

  const recentLeads = [
    {
      id: 1,
      name: "Acme Corp",
      contact: "John Smith",
      email: "john@acme.com",
      status: "Qualified",
      stage: "Proposal",
      value: "$50,000",
    },
    {
      id: 2,
      name: "Tech Solutions",
      contact: "Jane Doe",
      email: "jane@techsol.com",
      status: "In Progress",
      stage: "Discovery",
      value: "$35,000",
    },
    {
      id: 3,
      name: "Global Industries",
      contact: "Mike Johnson",
      email: "mike@global.com",
      status: "New",
      stage: "Contact",
      value: "$75,000",
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "New": "bg-blue-100 text-blue-800",
      "In Progress": "bg-yellow-100 text-yellow-800",
      "Qualified": "bg-green-100 text-green-800",
      "Converted": "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Layout showSidebar={true}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Leads Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage all your leads
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {leadStats.map((stat, idx) => {
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

        {/* Recent Leads */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Recent Leads
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Company
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Stage
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border hover:bg-secondary">
                    <td className="py-4 px-4 text-foreground font-medium">
                      {lead.name}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {lead.contact}
                    </td>
                    <td className="py-4 px-4 text-foreground text-sm">
                      {lead.email}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-foreground">{lead.stage}</td>
                    <td className="py-4 px-4 text-foreground font-semibold">
                      {lead.value}
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
