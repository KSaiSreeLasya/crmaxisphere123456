import Layout from "@/components/Layout";
import { BarChart3, LineChart, PieChart, TrendingUp } from "lucide-react";

export default function AnalyticsDashboard() {
  const analyticsMetrics = [
    {
      label: "Total Revenue",
      value: "$325,000",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      label: "Avg Deal Value",
      value: "$15,625",
      icon: BarChart3,
      color: "text-blue-600",
    },
    {
      label: "Win Rate",
      value: "32%",
      icon: PieChart,
      color: "text-purple-600",
    },
    {
      label: "Avg Cycle Time",
      value: "45 days",
      icon: LineChart,
      color: "text-orange-600",
    },
  ];

  const funnelData = [
    { stage: "Leads", count: 240, percentage: 100 },
    { stage: "Contacted", count: 180, percentage: 75 },
    { stage: "Qualified", count: 108, percentage: 45 },
    { stage: "Proposal", count: 54, percentage: 22.5 },
    { stage: "Converted", count: 32, percentage: 13.3 },
  ];

  const conversionByIndustry = [
    { industry: "Technology", converted: 12, total: 45, rate: "26.7%" },
    { industry: "Finance", converted: 8, total: 32, rate: "25%" },
    { industry: "Retail", converted: 6, total: 28, rate: "21.4%" },
    { industry: "Manufacturing", converted: 4, total: 22, rate: "18.2%" },
    { industry: "Healthcare", converted: 5, total: 18, rate: "27.8%" },
  ];

  return (
    <Layout showSidebar={true}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            In-depth analysis of your sales pipeline and performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analyticsMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      {metric.value}
                    </p>
                  </div>
                  <Icon className={`w-10 h-10 ${metric.color} opacity-20`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sales Funnel */}
        <div className="bg-white border border-border rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Sales Funnel
          </h2>

          <div className="space-y-4">
            {funnelData.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">
                    {item.stage}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} leads ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full flex items-center justify-center text-white text-xs font-semibold transition-all"
                    style={{ width: `${item.percentage}%` }}
                  >
                    {item.percentage > 10 && `${item.percentage}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion by Industry */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Conversion Rate by Industry
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Industry
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Converted
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Total Leads
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Conversion Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {conversionByIndustry.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border hover:bg-secondary"
                  >
                    <td className="py-4 px-4 text-foreground font-medium">
                      {item.industry}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {item.converted}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-foreground">{item.total}</td>
                    <td className="py-4 px-4 text-foreground font-semibold">
                      {item.rate}
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
