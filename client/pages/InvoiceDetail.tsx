import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name: string;
  base_price: number;
  gst_percentage: number;
  gst_amount: number;
  total_amount: number;
  additional_notes: string;
  selected_features?: string[];
  created_at: string;
  created_by: string;
  packages?: {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
  };
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/admin/invoices");
      return;
    }
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          id,
          invoice_number,
          customer_name,
          customer_email,
          customer_phone,
          company_name,
          base_price,
          gst_percentage,
          gst_amount,
          total_amount,
          additional_notes,
          created_at,
          created_by,
          packages(id, name, price, description, features)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      });
      navigate("/admin/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    // Create a simple HTML template and print it
    const printWindow = window.open("", "", "height=600,width=800");
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window",
        variant: "destructive",
      });
      return;
    }

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
            }
            .page {
              background-color: white;
              width: 8.5in;
              height: 11in;
              margin: 20px auto;
              padding: 0.5in;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              page-break-after: always;
            }
            .page:last-child {
              margin-bottom: 20px;
            }
            .logo-header {
              display: flex;
              align-items: center;
              gap: 15px;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #f0f0f0;
            }
            .logo-circle {
              width: 50px;
              height: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 24px;
            }
            .company-header {
              flex: 1;
            }
            .company-header h1 {
              margin: 0;
              font-size: 24px;
              color: #333;
            }
            .company-header p {
              margin: 2px 0;
              color: #666;
              font-size: 12px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
            }
            .invoice-meta {
              text-align: right;
            }
            .invoice-meta p {
              margin: 3px 0;
              color: #666;
              font-size: 12px;
            }
            .invoice-number {
              font-size: 14px;
              font-weight: bold;
              color: #333;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 12px;
              font-weight: bold;
              color: #333;
              text-transform: uppercase;
              margin-bottom: 10px;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 8px;
            }
            .bill-to {
              display: flex;
              gap: 30px;
              font-size: 13px;
            }
            .bill-to-item {
              flex: 1;
            }
            .bill-to-item h3 {
              font-size: 11px;
              color: #999;
              text-transform: uppercase;
              margin: 0 0 5px 0;
              font-weight: bold;
            }
            .bill-to-item p {
              margin: 2px 0;
              color: #333;
            }
            .pricing-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            .pricing-table th {
              background-color: #f9f9f9;
              padding: 8px;
              text-align: right;
              font-weight: bold;
              color: #333;
              border-bottom: 2px solid #e0e0e0;
            }
            .pricing-table td {
              padding: 8px;
              text-align: right;
              color: #333;
              border-bottom: 1px solid #f0f0f0;
            }
            .pricing-label {
              text-align: left;
            }
            .total-row {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .total-amount {
              background-color: #6b46c1;
              color: white;
              font-size: 13px;
            }
            .total-amount-value {
              color: white;
            }
            .features-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              font-size: 12px;
            }
            .feature-item {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              padding: 10px;
              background-color: #f0f8f4;
              border-radius: 4px;
            }
            .feature-check {
              color: #22c55e;
              font-weight: bold;
              min-width: 20px;
              flex-shrink: 0;
            }
            .feature-text {
              color: #333;
              line-height: 1.3;
            }
            .footer {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 11px;
              text-align: center;
              position: absolute;
              bottom: 20px;
              width: calc(100% - 40px);
            }
            .page {
              position: relative;
              min-height: 11in;
            }
            .page-content {
              padding-bottom: 60px;
            }
            @media print {
              body {
                background-color: white;
                margin: 0;
                padding: 0;
              }
              .page {
                margin: 0;
                padding: 0.5in;
                box-shadow: none;
                page-break-after: always;
                width: 100%;
                height: auto;
              }
            }
          </style>
        </head>
        <body>
          <!-- PAGE 1: Invoice Details -->
          <div class="page">
            <div class="page-content">
              <!-- Logo and Company Header -->
              <div class="logo-header">
                <img src="https://cdn.builder.io/api/v1/image/assets%2Fd6ed3a58ddbf4178909cabbd3ef86178%2Ffaf45679b2484f3990bc21ddcb4a6e94?format=webp&width=100" alt="Axisphere Logo" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                <div class="company-header">
                  <h1>Axisphere</h1>
                  <p>Axisphere Sales CRM</p>
                  <p>Invoice Bill</p>
                </div>
              </div>

              <!-- Header with Invoice Meta -->
              <div class="header">
                <div></div>
                <div class="invoice-meta">
                  <p class="invoice-number">Invoice Number: ${invoice.invoice_number}</p>
                  <p><strong>Invoice Date:</strong> ${new Date(
                    invoice.created_at,
                  ).toLocaleDateString("en-IN")}</p>
                  <p><strong>Due Date:</strong> ${new Date(
                    new Date(invoice.created_at).getTime() +
                      30 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString("en-IN")}</p>
                  <p><strong>Payment Terms:</strong> Due within 30 days</p>
                </div>
              </div>

              <!-- Bill To Section -->
              <div class="section">
                <div class="section-title">BILL TO</div>
                <div class="bill-to">
                  <div class="bill-to-item">
                    <h3>Name</h3>
                    <p>${invoice.customer_name}</p>
                  </div>
                  <div class="bill-to-item">
                    <h3>Email</h3>
                    <p>${invoice.customer_email || "N/A"}</p>
                  </div>
                  <div class="bill-to-item">
                    <h3>Phone</h3>
                    <p>${invoice.customer_phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              <!-- Package Details -->
              <div class="section">
                <div class="section-title">Description</div>
                <table class="pricing-table">
                  <thead>
                    <tr>
                      <th style="text-align: left;">Description</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="text-align: left;">${
                        invoice.packages?.name || "Package"
                      } - Full Package</td>
                      <td>1</td>
                      <td>₹${invoice.base_price.toLocaleString("en-IN")}</td>
                      <td>₹${invoice.base_price.toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pricing -->
              <div class="section">
                <table class="pricing-table">
                  <tbody>
                    <tr>
                      <td class="pricing-label">Subtotal</td>
                      <td>₹${invoice.base_price.toLocaleString("en-IN")}</td>
                    </tr>
                    <tr>
                      <td class="pricing-label">Tax (${invoice.gst_percentage}% GST)</td>
                      <td>₹${invoice.gst_amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</td>
                    </tr>
                    <tr class="total-row total-amount">
                      <td class="pricing-label total-amount-value">Total Amount Due</td>
                      <td class="total-amount-value">₹${invoice.total_amount.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              ${
                invoice.additional_notes
                  ? `
              <div class="section">
                <div class="section-title">Additional Notes</div>
                <p style="color: #666; line-height: 1.5; font-size: 12px;">${invoice.additional_notes}</p>
              </div>
              `
                  : ""
              }
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>Thank you for your business! For inquiries, contact hello@axisphere.in</p>
              <p style="margin-top: 5px;">© 2025 Axisphere. All rights reserved.</p>
            </div>
          </div>

          <!-- PAGE 2: Features (if there are features) -->
          ${
            invoice.packages && invoice.packages.features.length > 0
              ? `
          <div class="page">
            <div class="page-content">
              <!-- Logo and Company Header -->
              <div class="logo-header">
                <img src="https://cdn.builder.io/api/v1/image/assets%2Fd6ed3a58ddbf4178909cabbd3ef86178%2Ffaf45679b2484f3990bc21ddcb4a6e94?format=webp&width=100" alt="Axisphere Logo" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                <div class="company-header">
                  <h1>Axisphere</h1>
                  <p>Axisphere Sales CRM</p>
                  <p>Invoice Bill</p>
                </div>
              </div>

              <!-- Invoice Number Reference -->
              <div style="font-size: 12px; color: #666; margin-bottom: 20px;">
                <strong>Invoice Number:</strong> ${invoice.invoice_number}
              </div>

              <!-- Features Section -->
              <div class="section">
                <div class="section-title">Package Scope & Features</div>
                <div class="features-grid">
                  ${invoice.packages.features
                    .map(
                      (feature) => `
                    <div class="feature-item">
                      <div class="feature-check">✓</div>
                      <div class="feature-text">${feature}</div>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>Thank you for your business! For inquiries, contact hello@axisphere.in</p>
              <p style="margin-top: 5px;">© 2025 Axisphere. All rights reserved.</p>
            </div>
          </div>
          `
              : ""
          }
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();

    // Trigger print dialog
    printWindow.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Invoice not found</p>
        </div>
      </Layout>
    );
  }

  const dueDate = new Date(invoice.created_at);
  dueDate.setDate(dueDate.getDate() + 30);

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/admin/invoices")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Invoices
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>

          {/* Invoice Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-12">
              {/* Header Section */}
              <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-gray-200">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    Axisphere
                  </h1>
                  <p className="text-gray-600">Axisphere Sales CRM</p>
                  <p className="text-gray-600">Invoice Bill</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Invoice Number: {invoice.invoice_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Invoice Date:</strong>{" "}
                    {formatDate(invoice.created_at)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Due Date:</strong>{" "}
                    {formatDate(dueDate.toISOString())}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Payment Terms:</strong> Due within 30 days
                  </p>
                </div>
              </div>

              {/* Bill To Section */}
              <div className="mb-12">
                <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200">
                  BILL TO
                </h3>
                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">
                      Name
                    </h4>
                    <p className="text-gray-900">{invoice.customer_name}</p>
                  </div>
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">
                      Email
                    </h4>
                    <p className="text-gray-900">
                      {invoice.customer_email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">
                      Phone
                    </h4>
                    <p className="text-gray-900">
                      {invoice.customer_phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="mb-12">
                <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200">
                  Description
                </h3>
                <table className="w-full mb-6">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left px-4 py-3 font-semibold text-gray-900">
                        Description
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">
                        Qty
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">
                        Rate
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-900">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="px-4 py-3 text-gray-900">
                        {invoice.packages?.name || "Package"} - Full Package
                      </td>
                      <td className="text-right px-4 py-3 text-gray-900">1</td>
                      <td className="text-right px-4 py-3 text-gray-900">
                        ₹{invoice.base_price.toLocaleString("en-IN")}
                      </td>
                      <td className="text-right px-4 py-3 text-gray-900">
                        ₹{invoice.base_price.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Features */}
              {invoice.packages && invoice.packages.features.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200">
                    Package Scope & Features
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {invoice.packages.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                      >
                        <span className="text-green-600 font-bold mt-1">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Section */}
              <div className="mb-12">
                <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200">
                  Pricing & Payment
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      ₹{invoice.base_price.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-700">
                      Tax ({invoice.gst_percentage}% GST)
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹
                      {invoice.gst_amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                    <span className="font-bold text-gray-900">
                      Total Amount Due
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      ₹
                      {invoice.total_amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              {invoice.additional_notes && (
                <div className="mb-12">
                  <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200">
                    Additional Notes
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {invoice.additional_notes}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-8 border-t border-gray-200 text-sm text-gray-600">
                <p>
                  Thank you for your business! For inquiries, contact
                  hello@axisphere.in
                </p>
                <p className="mt-2">© 2025 Axisphere. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
