import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  packageId: string;
  gstPercentage: number;
  additionalNotes: string;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    companyName: "",
    packageId: "",
    gstPercentage: 18,
    additionalNotes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (user.role !== "admin") {
      navigate("/unauthorized");
      return;
    }
    fetchPackages();
  }, [user?.id]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
      let errorMessage = "Failed to load packages";

      if (typeof error === "object" && error !== null) {
        if ("message" in error) {
          errorMessage = String(error.message);
        } else if ("error_description" in error) {
          errorMessage = String(error.error_description);
        } else if ("detail" in error) {
          errorMessage = String(error.detail);
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Invalid email format";
    }
    if (!selectedPackage) {
      newErrors.packageId = "Please select a package";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `AXI-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (!selectedPackage) {
        throw new Error("Package not selected");
      }

      const basePrice = selectedPackage.price;
      const gstAmount = (basePrice * formData.gstPercentage) / 100;
      const totalAmount = basePrice + gstAmount;

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          invoice_number: generateInvoiceNumber(),
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          company_name: formData.companyName,
          package_id: selectedPackage.id,
          base_price: basePrice,
          gst_percentage: formData.gstPercentage,
          gst_amount: gstAmount,
          total_amount: totalAmount,
          additional_notes: formData.additionalNotes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      navigate(`/admin/invoices/${data.id}`);
    } catch (error) {
      console.error("Error creating invoice:", error);
      let errorMessage = "Failed to create invoice";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        if ("message" in error) {
          errorMessage = String(error.message);
        } else if ("error_description" in error) {
          errorMessage = String(error.error_description);
        } else if ("detail" in error) {
          errorMessage = String(error.detail);
        } else {
          errorMessage = JSON.stringify(error);
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const basePrice = selectedPackage?.price || 0;
  const gstAmount = (basePrice * formData.gstPercentage) / 100;
  const totalAmount = basePrice + gstAmount;

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Invoice
            </h1>
            <p className="text-gray-600">Create a new invoice for a customer</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Package Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Step 1: Choose Your AI Marketing Package
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setFormData((prev) => ({
                        ...prev,
                        packageId: pkg.id,
                      }));
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.packageId;
                        return newErrors;
                      });
                    }}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPackage?.id === pkg.id
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {pkg.name}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 mb-3">
                      ₹{pkg.price.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">/month</p>
                    <p className="text-sm text-gray-600 mb-4">
                      {pkg.description}
                    </p>
                    <div className="mb-4 space-y-2">
                      {pkg.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 text-sm font-bold mt-0.5">
                            ✓
                          </span>
                          <span className="text-xs text-gray-600">
                            {feature}
                          </span>
                        </div>
                      ))}
                      {pkg.features.length > 3 && (
                        <p className="text-xs text-gray-500 mt-2">
                          +{pkg.features.length - 3} more features
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPackage(pkg);
                        setFormData((prev) => ({
                          ...prev,
                          packageId: pkg.id,
                        }));
                      }}
                      className={`w-full py-2 rounded-lg font-medium transition-colors ${
                        selectedPackage?.id === pkg.id
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {selectedPackage?.id === pkg.id
                        ? "Selected"
                        : "Select Package"}
                    </button>
                  </div>
                ))}
              </div>

              {errors.packageId && (
                <p className="text-red-500 text-sm">{errors.packageId}</p>
              )}
            </div>

            {/* Step 2: Package Features and Details */}
            {selectedPackage && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Scope / Features
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Select features from {selectedPackage.name} to include in this invoice
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(selectedPackage.features) &&
                  selectedPackage.features.length > 0 ? (
                    selectedPackage.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          readOnly
                          className="mt-1 w-5 h-5 text-green-600 rounded cursor-default flex-shrink-0"
                        />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm col-span-2">
                      No features available for this package
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Customer Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Customer Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.customerName
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    } focus:outline-none focus:ring-2`}
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customerName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.customerEmail
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    } focus:outline-none focus:ring-2`}
                  />
                  {errors.customerEmail && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customerEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Your Company (Optional)"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Pricing & Payment */}
            {selectedPackage && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Pricing & Payment
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <span className="text-gray-700">Package Price</span>
                    <span className="font-medium text-gray-900">
                      ₹{basePrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">GST Percentage (%)</span>
                      <span className="text-sm text-gray-500">
                        (currently {formData.gstPercentage}%)
                      </span>
                    </div>
                    <input
                      type="number"
                      name="gstPercentage"
                      value={formData.gstPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <span className="text-gray-700">
                      GST Amount ({formData.gstPercentage}%)
                    </span>
                    <span className="font-medium text-gray-900">
                      ₹
                      {gstAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 bg-purple-50 px-4 py-3 rounded-lg border border-purple-200">
                    <span className="font-semibold text-gray-900">
                      Total Amount Due
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      ₹
                      {totalAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Additional Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Step 5: Additional Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes for the invoice"
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-between">
              <button
                type="button"
                onClick={() => navigate("/admin/invoices")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-purple-600 text-white px-8 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create & View Invoice"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
