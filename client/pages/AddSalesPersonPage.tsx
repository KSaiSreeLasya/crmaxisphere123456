import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface SalesPerson {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export default function AddSalesPersonPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<SalesPerson>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Verify admin is authenticated
      if (!user?.id) {
        throw new Error(
          "You must be logged in to add a sales person. Please refresh the page.",
        );
      }

      const firstName = formData.name.split(" ")[0];
      const lastName = formData.name.split(" ").slice(1).join(" ") || "";

      console.log("Creating sales person:", {
        email: formData.email,
        name: formData.name,
      });

      // Create user account first
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          email: formData.email,
          password_hash: formData.password,
          first_name: firstName,
          last_name: lastName,
          role: "sales",
          is_active: true,
        })
        .select()
        .single();

      if (userError) {
        console.error("User creation error:", {
          message: userError.message,
          code: (userError as any).code,
          details: (userError as any).details,
        });
        throw new Error(userError.message || "Failed to create user account");
      }

      if (!userData?.id) {
        throw new Error("User was created but no ID was returned");
      }

      // Create sales person record
      const { error: spError } = await supabase.from("sales_persons").insert({
        user_id: userData.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: "active",
        created_by: user.id,
      });

      if (spError) {
        console.error("Sales person creation error:", {
          message: spError.message,
          code: (spError as any).code,
          details: (spError as any).details,
        });
        throw new Error(
          spError.message || "Failed to create sales person record",
        );
      }

      console.log("Sales person created successfully");
      navigate("/admin");
    } catch (error) {
      let errorMessage = "Failed to add sales person. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        const err = error as any;
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error_description) {
          errorMessage = err.error_description;
        } else if (err.hint) {
          errorMessage = err.hint;
        } else {
          errorMessage = JSON.stringify(err);
        }
      }

      console.error("Full error object:", error);
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Add New Sales Person
            </h1>
            <p className="text-muted-foreground">
              Create a new sales person account with login credentials
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {errors.submit && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="+1 (555) 000-0000"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="Enter a secure password (min 6 characters)"
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-secondary transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Add Sales Person"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
