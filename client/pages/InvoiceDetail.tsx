import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Download, ChevronRight, ChevronLeft } from "lucide-react";
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

const COMPANY_NAME = "Axisphere Media Worx LLP";
const COMPANY_ADDRESS =
  "Plot no.102, 103, Temple Lane, Mythri Nagar, Mathrusri Nagar, Madinaguda, Serilingampally, K.V.Rangareddy-500049, Telangana, India";
const LOGO_URL =
  "https://cdn.builder.io/api/v1/image/assets%2F2f195b82614d46a0b777d649ad418b24%2Fdb52c08441eb4930b2e01a7176f2e33b?format=webp&width=800";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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
          selected_features,
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
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
              align-items: flex-start;
              gap: 15px;
              margin-bottom: 10px;
              padding-bottom: 10px;
            }
            .logo-img {
              height: 50px;
              flex-shrink: 0;
              object-fit: contain;
            }
            .company-header {
              flex: 1;
            }
            .company-header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
              color: #333;
            }
            .company-header .company-name {
              font-size: 14px;
              font-weight: 500;
              color: #555;
              margin-top: 4px;
            }
            .company-header .invoice-title {
              font-size: 12px;
              font-weight: 400;
              color: #666;
              margin: 2px 0;
            }
            .company-address {
              font-size: 11px;
              color: #666;
              line-height: 1.4;
              margin-top: 8px;
            }
            .header {
              display: flex;
              align-items: flex-start;
              gap: 30px;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #d1d5db;
            }
            .header-right {
              margin-left: auto;
              text-align: right;
            }
            .invoice-meta {
              text-align: right;
            }
            .invoice-meta p {
              margin: 4px 0;
              color: #666;
              font-size: 12px;
            }
            .invoice-number {
              font-size: 12px;
              font-weight: bold;
              color: #333;
              margin-bottom: 8px;
            }
            .section {
              margin-bottom: 16px;
            }
            .section-title {
              font-size: 10px;
              font-weight: bold;
              color: #333;
              text-transform: uppercase;
              margin-bottom: 10px;
              border-bottom: 1px solid #d1d5db;
              padding-bottom: 6px;
              letter-spacing: 0.5px;
            }
            .bill-to {
              display: flex;
              gap: 40px;
              font-size: 12px;
            }
            .bill-to-item {
              flex: 1;
            }
            .bill-to-item h3 {
              font-size: 10px;
              color: #888;
              text-transform: uppercase;
              margin: 0 0 4px 0;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            .bill-to-item p {
              margin: 1px 0;
              color: #333;
              font-size: 12px;
            }
            .divider {
              border-top: 1px solid #d1d5db;
              margin: 12px 0;
            }
            .pricing-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin-bottom: 12px;
            }
            .pricing-table th {
              background-color: transparent;
              padding: 8px;
              text-align: left;
              font-weight: 600;
              color: #333;
              border-bottom: 2px solid #d1d5db;
              font-size: 11px;
            }
            .pricing-table th:not(:first-child) {
              text-align: right;
            }
            .pricing-table td {
              padding: 8px;
              text-align: left;
              color: #333;
              border-bottom: 1px solid #e5e7eb;
              font-size: 11px;
            }
            .pricing-table td:not(:first-child) {
              text-align: right;
            }
            .pricing-label {
              text-align: left;
              font-size: 11px;
              color: #333;
            }
            .pricing-value {
              text-align: right;
              font-size: 11px;
              color: #333;
            }
            .total-row {
              background-color: #f3e8ff;
              font-weight: 600;
            }
            .total-amount {
              background-color: #f3e8ff;
              font-size: 12px;
            }
            .total-amount-label {
              color: #333;
              font-weight: 600;
            }
            .total-amount-value {
              color: #9333ea;
              font-weight: 700;
              font-size: 13px;
            }
            .features-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              font-size: 11px;
            }
            .feature-item {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              padding: 14px 12px;
              background-color: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 4px;
            }
            .feature-check {
              color: #16a34a;
              font-weight: bold;
              font-size: 16px;
              min-width: 18px;
              flex-shrink: 0;
              margin-top: 1px;
            }
            .feature-text {
              color: #333;
              line-height: 1.5;
              font-size: 12px;
              font-weight: 500;
            }
            .footer {
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid #d1d5db;
              color: #666;
              font-size: 10px;
              text-align: center;
            }
            .page {
              position: relative;
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: avoid;
            }
            .page-content {
              padding-bottom: 20px;
            }
            .divider-line {
              border-top: 1px solid #d1d5db;
              margin: 12px 0;
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
                <img src="${LOGO_URL}" alt="Axisphere Logo" class="logo-img">
                <div class="company-header">
                  <h1>Axisphere</h1>
                  <div class="company-name">${COMPANY_NAME}</div>
                  <div class="invoice-title">Invoice Bill</div>
                  <div class="company-address">${COMPANY_ADDRESS}</div>
                </div>
              </div>

              <!-- Header with Invoice Meta -->
              <div class="header">
                <div class="flex-1">
                </div>
                <div class="invoice-meta">
                  <p class="invoice-number">Invoice Number: ${invoice.invoice_number}</p>
                  <p><strong>Date:</strong> ${new Date(
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

              <!-- Divider -->
              <div class="divider-line"></div>

              <!-- Package Details -->
              <div class="section">
                <div class="section-title">Description</div>
                <table class="pricing-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style="text-align: center;">Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${
                        invoice.packages?.name || "Package"
                      } - Full Package</td>
                      <td style="text-align: center;">1</td>
                      <td class="pricing-value">₹${invoice.base_price.toLocaleString("en-IN")}</td>
                      <td class="pricing-value">₹${invoice.base_price.toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pricing -->
              <div class="section">
                <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
                  <div style="width: 350px;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #d1d5db; padding: 8px 0; margin-bottom: 8px;">
                      <span class="pricing-label">Subtotal:</span>
                      <span class="pricing-value">₹${invoice.base_price.toLocaleString("en-IN")}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #d1d5db; padding: 8px 0; margin-bottom: 8px;">
                      <span class="pricing-label">Tax (${invoice.gst_percentage}% GST):</span>
                      <span class="pricing-value">₹${invoice.gst_amount.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}</span>
                    </div>
                    <div class="total-row total-amount" style="display: flex; justify-content: space-between; padding: 8px; border-radius: 3px;">
                      <span class="total-amount-label">Total Amount Due</span>
                      <span class="total-amount-value">₹${invoice.total_amount.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}</span>
                    </div>
                  </div>
                </div>
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
              <p>Thank you for your business! For inquiries, contact hello@ai-marketing.studio</p>
            </div>
          </div>

          <!-- PAGE 2: Features (if there are features) -->
          ${
            invoice.packages &&
            (invoice.selected_features?.length > 0 ||
              invoice.packages.features.length > 0)
              ? `
          <div class="page">
            <div class="page-content">
              <!-- Logo and Company Header -->
              <div class="header">
                <div class="logo-header">
                  <img src="${LOGO_URL}" alt="Axisphere Logo" class="logo-img">
                  <div class="company-header">
                    <h1>Axisphere</h1>
                    <div class="company-name">${COMPANY_NAME}</div>
                    <div class="invoice-title">Invoice Bill</div>
                    <div class="company-address">${COMPANY_ADDRESS}</div>
                  </div>
                </div>
                <div class="invoice-meta">
                  <p class="invoice-number">Invoice Number: ${invoice.invoice_number}</p>
                  <p><strong>Date:</strong> ${new Date(
                    invoice.created_at,
                  ).toLocaleDateString("en-IN")}</p>
                  <p><strong>Due Date:</strong> ${new Date(
                    new Date(invoice.created_at).getTime() +
                      30 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              <!-- Features Page Content -->
              <div style="margin-bottom: 30px;">
                <h2 style="font-size: 24px; font-weight: 700; color: #333; margin-bottom: 20px;">Package Scope & Features</h2>

                <h3 style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 24px;">${invoice.packages?.name || "Package"}</h3>

                <div class="features-grid">
                  ${(invoice.selected_features &&
                  invoice.selected_features.length > 0
                    ? invoice.selected_features
                    : invoice.packages?.features || []
                  )
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
              <p>Thank you for your business! For inquiries, contact hello@ai-marketing.studio</p>
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

  const hasFeatures =
    invoice.packages &&
    (invoice.selected_features?.length > 0 ||
      invoice.packages.features.length > 0);

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
            {/* Page 1: Invoice Details */}
            {currentPage === 1 && (
              <div className="p-12">
                {/* Header Section */}
                <div className="flex items-start gap-6 mb-8 pb-6 border-b border-gray-300">
                  <img
                    src={LOGO_URL}
                    alt="Axisphere Logo"
                    className="h-16 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900">
                      Axisphere
                    </h1>
                    <p className="text-sm font-medium text-gray-700 mt-2">
                      {COMPANY_NAME}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Invoice Bill</p>
                    <p className="text-xs text-gray-600 mt-3 max-w-sm leading-relaxed">
                      {COMPANY_ADDRESS}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      Invoice Number: {invoice.invoice_number}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>Date:</strong> {formatDate(invoice.created_at)}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>Due Date:</strong>{" "}
                      {formatDate(dueDate.toISOString())}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Payment Terms:</strong> Due within 30 days
                    </p>
                  </div>
                </div>

                {/* Bill To Section */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200">
                    BILL TO
                  </h3>
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">
                        Name
                      </h4>
                      <p className="text-gray-900 text-sm">
                        {invoice.customer_name}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">
                        Email
                      </h4>
                      <p className="text-gray-900 text-sm">
                        {invoice.customer_email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">
                        Phone
                      </h4>
                      <p className="text-gray-900 text-sm">
                        {invoice.customer_phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-300 my-8"></div>

                {/* Package Details */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200">
                    Description
                  </h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left px-4 py-3 font-semibold text-gray-900 text-sm">
                          Description
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-900 text-sm">
                          Qty
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-900 text-sm">
                          Rate
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-900 text-sm">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-4 py-3 text-gray-900 text-sm">
                          {invoice.packages?.name || "Package"} - Full Package
                        </td>
                        <td className="text-center px-4 py-3 text-gray-900 text-sm">
                          1
                        </td>
                        <td className="text-right px-4 py-3 text-gray-900 text-sm">
                          ₹{invoice.base_price.toLocaleString("en-IN")}
                        </td>
                        <td className="text-right px-4 py-3 text-gray-900 text-sm">
                          ₹{invoice.base_price.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Pricing Section */}
                <div className="mb-8">
                  <div className="space-y-2">
                    <div className="flex justify-end gap-8">
                      <span className="text-gray-700 text-sm">Subtotal:</span>
                      <span className="text-gray-900 font-semibold text-sm w-32 text-right">
                        ₹{invoice.base_price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-end gap-8 pb-3 border-b border-gray-200">
                      <span className="text-gray-700 text-sm">
                        Tax ({invoice.gst_percentage}% GST):
                      </span>
                      <span className="text-gray-900 font-semibold text-sm w-32 text-right">
                        ₹
                        {invoice.gst_amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-end gap-8 pt-3 bg-purple-100 -mx-12 px-12 py-4">
                      <span className="text-gray-900 font-bold text-lg">
                        Total Amount Due
                      </span>
                      <span className="text-purple-600 font-bold text-lg w-32 text-right">
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
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200">
                      Additional Notes
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {invoice.additional_notes}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center pt-8 border-t border-gray-200 text-xs text-gray-600">
                  <p>
                    Thank you for your business! For inquiries, contact
                    hello@ai-marketing.studio
                  </p>
                </div>
              </div>
            )}

            {/* Page 2: Features */}
            {currentPage === 2 && hasFeatures && (
              <div className="p-12">
                {/* Header Section */}
                <div className="flex items-start gap-6 mb-8 pb-6 border-b border-gray-300">
                  <img
                    src={LOGO_URL}
                    alt="Axisphere Logo"
                    className="h-16 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900">
                      Axisphere
                    </h1>
                    <p className="text-sm font-medium text-gray-700 mt-2">
                      {COMPANY_NAME}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Invoice Bill</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      <strong>Invoice Number:</strong> {invoice.invoice_number}
                    </p>
                  </div>
                </div>

                {/* Features Section */}
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Package Scope & Features
                  </h2>
                  <h3 className="text-lg font-semibold text-gray-900 mb-8">
                    {invoice.packages?.name || "Package"}
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {(invoice.selected_features &&
                    invoice.selected_features.length > 0
                      ? invoice.selected_features
                      : invoice.packages?.features || []
                    ).map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
                      >
                        <span className="text-green-600 font-bold flex-shrink-0 text-lg mt-1">
                          ✓
                        </span>
                        <span className="text-gray-700 text-sm font-medium leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-gray-200 text-xs text-gray-600">
                  <p>
                    Thank you for your business! For inquiries, contact
                    hello@ai-marketing.studio
                  </p>
                </div>
              </div>
            )}

            {/* Page Navigation */}
            {hasFeatures && (
              <div className="border-t border-gray-200 px-12 py-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of 2
                </span>
                <button
                  onClick={() => setCurrentPage(2)}
                  disabled={currentPage === 2}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
