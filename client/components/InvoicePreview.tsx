import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

interface Invoice {
  id: string;
  invoice_number: string;
  package_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string;
  selected_features: string[];
  package_price: number;
  gst_percentage: number;
  gst_amount: number;
  total_amount: number;
  notes: string;
  created_at: string;
}

interface Package {
  id: string;
  name: string;
  price_inr: number;
  features: string[];
}

interface InvoicePreviewProps {
  invoiceId: string;
  onBack?: () => void;
}

const COMPANY_LOGO =
  "https://cdn.builder.io/api/v1/image/assets%2F59bf3e928fc9473a97d5e87470c824bb%2Feff594fdcbbe4e938cf290266f147273?format=webp&width=800";
const COMPANY_NAME = "Axisphere Media Worx LLP";

export default function InvoicePreview({
  invoiceId,
  onBack,
}: InvoicePreviewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [pkg, setPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchInvoiceData();
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      setInvoice(invoiceData);

      if (invoiceData.package_id) {
        const { data: pkgData, error: pkgError } = await supabase
          .from("packages")
          .select("*")
          .eq("id", invoiceData.package_id)
          .single();

        if (!pkgError) {
          setPackage(pkgData);
        }
      }
    } catch (error) {
      toast.error("Failed to load invoice");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    setDownloading(true);
    try {
      const element = document.getElementById("invoice-pdf-content");
      if (!element) {
        toast.error("Could not generate PDF");
        return;
      }

      const options = {
        margin: 0,
        filename: `${invoice.invoice_number}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      html2pdf().set(options).from(element).save();
      toast.success("Invoice PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice || !pkg) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Invoice not found</p>
        {onBack && (
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <span className="text-sm text-gray-600">
            Page {currentPage} of 2
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setCurrentPage(1)}
            variant={currentPage === 1 ? "default" : "outline"}
            size="sm"
          >
            Page 1
          </Button>
          <Button
            onClick={() => setCurrentPage(2)}
            variant={currentPage === 2 ? "default" : "outline"}
            size="sm"
          >
            Page 2
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div
        id="invoice-pdf-content"
        className="bg-white"
        style={{ display: currentPage === 1 ? "block" : "none" }}
      >
        <InvoicePage1
          invoice={invoice}
          pkg={pkg}
          companyLogo={COMPANY_LOGO}
          companyName={COMPANY_NAME}
        />
      </div>

      <div
        id="invoice-pdf-content"
        className="bg-white"
        style={{ display: currentPage === 2 ? "block" : "none" }}
      >
        <InvoicePage2
          invoice={invoice}
          pkg={pkg}
          companyName={COMPANY_NAME}
        />
      </div>

      {/* Hidden full PDF container for download */}
      <div id="invoice-pdf-full" style={{ display: "none" }}>
        <InvoicePage1
          invoice={invoice}
          pkg={pkg}
          companyLogo={COMPANY_LOGO}
          companyName={COMPANY_NAME}
        />
        <div style={{ pageBreakAfter: "always" }}></div>
        <InvoicePage2
          invoice={invoice}
          pkg={pkg}
          companyName={COMPANY_NAME}
        />
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
        <Button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of 2
        </span>
        <Button
          onClick={() => setCurrentPage(Math.min(2, currentPage + 1))}
          disabled={currentPage === 2}
          variant="outline"
          size="sm"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function InvoicePage1({
  invoice,
  pkg,
  companyLogo,
  companyName,
}: {
  invoice: Invoice;
  pkg: Package;
  companyLogo: string;
  companyName: string;
}) {
  return (
    <div className="p-12 min-h-screen border border-gray-200 rounded-lg bg-white" style={{ pageBreakAfter: "always" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-200">
        <div className="flex items-center gap-4">
          <img
            src={companyLogo}
            alt="Company Logo"
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
            <p className="text-sm text-gray-600">Invoice Bill</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-600">
            {invoice.invoice_number}
          </p>
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            BILL TO:
          </h3>
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
            <p className="text-sm text-gray-600">{invoice.customer_email}</p>
            {invoice.customer_phone && (
              <p className="text-sm text-gray-600">{invoice.customer_phone}</p>
            )}
            {invoice.customer_company && (
              <p className="text-sm text-gray-600">{invoice.customer_company}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            INVOICE DETAILS:
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-semibold">Invoice #:</span>{" "}
              {invoice.invoice_number}
            </p>
            <p>
              <span className="font-semibold">Date:</span>{" "}
              {new Date(invoice.created_at).toLocaleDateString("en-IN")}
            </p>
            <p>
              <span className="font-semibold">Due Date:</span>{" "}
              {new Date(
                new Date(invoice.created_at).getTime() + 30 * 24 * 60 * 60 * 1000
              ).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Package Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Package Details
        </h3>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h4>
          <p className="text-gray-700 mb-4">{pkg.name}</p>
          <p className="text-2xl font-bold text-blue-600">
            ₹{invoice.package_price.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Selected Features */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Selected Features
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {invoice.selected_features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <span className="text-green-600 font-bold mr-3">✓</span>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      {invoice.notes && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Notes:</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function InvoicePage2({
  invoice,
  pkg,
  companyName,
}: {
  invoice: Invoice;
  pkg: Package;
  companyName: string;
}) {
  return (
    <div className="p-12 min-h-screen border border-gray-200 rounded-lg bg-white">
      {/* Header */}
      <div className="mb-8 pb-6 border-b-2 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">{companyName}</h2>
        <p className="text-sm text-gray-600 mt-1">Invoice Bill Details</p>
        <p className="text-sm font-semibold text-gray-900 mt-3">
          Invoice Number: {invoice.invoice_number}
        </p>
      </div>

      {/* Package Scope & Features */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Package Scope & Features
        </h3>
        <p className="text-sm text-gray-600 mb-4">{pkg.name}</p>
        <div className="grid grid-cols-2 gap-4">
          {invoice.selected_features.map((feature, idx) => (
            <div key={idx} className="flex items-start">
              <span className="text-green-600 font-bold mr-2 text-lg">✓</span>
              <span className="text-gray-800 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing & Payment */}
      <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Pricing & Payment
        </h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-3 text-gray-700">Package Price</td>
              <td className="py-3 text-right font-semibold text-gray-900">
                ₹{invoice.package_price.toLocaleString("en-IN")}
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-3 text-gray-700">
                GST ({invoice.gst_percentage}%)
              </td>
              <td className="py-3 text-right font-semibold text-gray-900">
                ₹{invoice.gst_amount?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) || "0.00"}
              </td>
            </tr>
            <tr className="bg-blue-100">
              <td className="py-4 font-bold text-gray-900">Total Amount</td>
              <td className="py-4 text-right font-bold text-xl text-blue-600">
                ₹{invoice.total_amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Additional Information */}
      {invoice.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Additional Information
          </h3>
          <p className="text-sm text-gray-700 bg-yellow-50 p-4 rounded border border-yellow-200 whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>© 2025 {companyName}. All rights reserved.</p>
      </div>
    </div>
  );
}
