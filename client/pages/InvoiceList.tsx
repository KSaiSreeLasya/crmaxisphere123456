import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Plus, Eye, Trash2 } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  company_name?: string;
  total_amount: number;
  created_at: string;
  packages?: {
    name: string;
  };
}

export default function InvoiceList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    fetchInvoices();
  }, [user?.id]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          id,
          invoice_number,
          customer_name,
          company_name,
          total_amount,
          created_at,
          packages(name)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id);

      if (error) throw error;

      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
              <button
                onClick={() => navigate("/admin/invoices/create")}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Invoice
              </button>
            </div>
            <p className="text-gray-600">
              Manage and view all invoices ({invoices.length} total)
            </p>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">
                  No invoices yet
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Create your first invoice to get started
                </p>
                <button
                  onClick={() => navigate("/admin/invoices/create")}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Invoice
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Invoice Number
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Customer Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Company
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Package
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {invoice.customer_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {invoice.company_name || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {invoice.packages?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDate(invoice.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                navigate(`/admin/invoices/${invoice.id}`)
                              }
                              className="p-2 hover:bg-blue-50 rounded transition-colors"
                              title="View invoice"
                            >
                              <Eye className="w-5 h-5 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(invoice.id)}
                              className="p-2 hover:bg-red-50 rounded transition-colors"
                              title="Delete invoice"
                            >
                              <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
