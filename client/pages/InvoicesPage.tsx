import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  Search,
  Loader2,
  Download,
} from "lucide-react";
import InvoiceForm from "@/components/InvoiceForm";
import InvoicePreview from "@/components/InvoicePreview";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  package_id: string;
  total_amount: number;
  created_at: string;
}

interface Package {
  id: string;
  name: string;
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      const { data: packagesData, error: packagesError } = await supabase
        .from("packages")
        .select("id, name");

      if (!packagesError) {
        setPackages(packagesData || []);
      }
    } catch (error) {
      toast.error("Failed to load invoices");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (invoiceId: string) => {
    setShowCreateForm(false);
    setSelectedInvoiceId(invoiceId);
    fetchData();
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);

      if (error) throw error;

      toast.success("Invoice deleted successfully");
      setDeleteConfirmId(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete invoice");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const getPackageName = (packageId: string) => {
    return packages.find((p) => p.id === packageId)?.name || "Unknown Package";
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      invoice.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (selectedInvoiceId) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => setSelectedInvoiceId(null)}
              className="text-blue-600 hover:text-blue-700 font-medium mb-6 flex items-center gap-2"
            >
              ← Back to Invoices
            </button>
            <InvoicePreview
              invoiceId={selectedInvoiceId}
              onBack={() => setSelectedInvoiceId(null)}
            />
          </div>
        </div>
      </Layout>
    );
  }

  if (showCreateForm) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create Invoice
              </h1>
              <p className="text-gray-600">
                Fill in the details to create a new invoice
              </p>
            </div>
            <InvoiceForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
            <p className="text-gray-600">Manage and create invoices</p>
          </div>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full md:w-auto"
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            </div>
          </div>

          {/* Invoices Grid */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No invoices yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first invoice to get started
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invoice.invoice_number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getPackageName(invoice.package_id)}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{invoice.total_amount.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium text-gray-900">
                        {invoice.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">
                        {invoice.customer_email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium text-gray-900">
                        {new Date(invoice.created_at).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Dialog
                      open={deleteConfirmId === invoice.id}
                      onOpenChange={(open) =>
                        setDeleteConfirmId(open ? invoice.id : null)
                      }
                    >
                      <button
                        onClick={() => setDeleteConfirmId(invoice.id)}
                        className="p-2 hover:bg-red-50 rounded border border-gray-200 transition-colors"
                        title="Delete invoice"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Invoice</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete invoice{" "}
                            {invoice.invoice_number}? This action cannot be
                            undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-4">
                          <Button
                            onClick={() => setDeleteConfirmId(null)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() =>
                              handleDeleteInvoice(invoice.id)
                            }
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            disabled={deleting}
                          >
                            {deleting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
