import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export default function SelectPackage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "Failed to load packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = (packageId: string) => {
    navigate(`/admin/invoices/create?packageId=${packageId}`);
  };

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading packages...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Choose Your AI Marketing Package
            </h1>
            <p className="text-gray-600 text-lg">
              Scalable, results-driven solutions designed to grow with your business.
            </p>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="p-8 pb-6 flex-1 flex flex-col">
                  {/* Package Name */}
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {pkg.name}
                    </h2>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <p className="text-4xl font-bold text-gray-900">
                      ₹{pkg.price.toLocaleString("en-IN")}
                    </p>
                    <p className="text-gray-500 text-sm">/month</p>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-6">
                    {pkg.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-8 flex-1">
                    {pkg.features.slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                    {pkg.features.length > 6 && (
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm font-medium">
                          +{pkg.features.length - 6} more features
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Create Invoice Button */}
                  <button
                    onClick={() => handleCreateInvoice(pkg.id)}
                    className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
