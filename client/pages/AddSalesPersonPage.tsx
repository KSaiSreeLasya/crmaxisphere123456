import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SalesPerson {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  status?: string;
}

interface ExistingSalesPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

export default function AddSalesPersonPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<SalesPerson>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [salesPersons, setSalesPersons] = useState<ExistingSalesPerson[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SalesPerson>>({});

  useEffect(() => {
    fetchSalesPersons();
  }, []);

  const fetchSalesPersons = async () => {
    try {
      setTableLoading(true);
      const { data, error } = await supabase
        .from("sales_persons")
        .select("id, name, email, phone, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSalesPersons(data || []);
    } catch (error) {
      console.error("Error fetching sales persons:", error);
      toast({
        title: "Error",
        description: "Failed to load sales persons",
        variant: "destructive",
      });
    } finally {
      setTableLoading(false);
    }
  };

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
      if (!user?.id) {
        throw new Error(
          "You must be logged in to add a sales person. Please refresh the page.",
        );
      }

      const firstName = formData.name.split(" ")[0];
      const lastName = formData.name.split(" ").slice(1).join(" ") || "";

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
        throw new Error(userError.message || "Failed to create user account");
      }

      if (!userData?.id) {
        throw new Error("User was created but no ID was returned");
      }

      const { error: spError } = await supabase.from("sales_persons").insert({
        user_id: userData.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: "active",
        created_by: user.id,
      });

      if (spError) {
        throw new Error(
          spError.message || "Failed to create sales person record",
        );
      }

      toast({
        title: "Success",
        description: "Sales person created successfully",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
      });
      setErrors({});

      await fetchSalesPersons();
    } catch (error) {
      let errorMessage = "Failed to add sales person. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        const err = error as any;
        if (err.message) {
          errorMessage = err.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sales_persons")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sales person deleted successfully",
      });

      await fetchSalesPersons();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting sales person:", error);
      toast({
        title: "Error",
        description: "Failed to delete sales person",
        variant: "destructive",
      });
    }
  };

  const handleEditStart = (person: ExistingSalesPerson) => {
    setEditingId(person.id);
    setEditForm({
      name: person.name,
      email: person.email,
      phone: person.phone,
      status: person.status,
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditSave = async (id: string) => {
    if (
      !editForm.name?.trim() ||
      !editForm.email?.trim() ||
      !editForm.phone?.trim()
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const updateData: Record<string, any> = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        status: editForm.status,
      };

      if (editForm.password && editForm.password.length >= 6) {
        const { data: spData } = await supabase
          .from("sales_persons")
          .select("user_id")
          .eq("id", id)
          .single();

        if (spData?.user_id) {
          const { error: userError } = await supabase
            .from("users")
            .update({ password_hash: editForm.password })
            .eq("id", spData.user_id);

          if (userError) throw userError;
        }
      }

      const { error } = await supabase
        .from("sales_persons")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sales person updated successfully",
      });

      setEditingId(null);
      setEditForm({});
      await fetchSalesPersons();
    } catch (error) {
      console.error("Error updating sales person:", error);
      toast({
        title: "Error",
        description: "Failed to update sales person",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Form Section */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sales Persons Management
            </h1>
            <p className="text-muted-foreground mb-8">
              Create new sales persons and manage existing team members
            </p>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Add New Sales Person
              </h2>

              {errors.submit && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="text-sm text-destructive mt-1">
                        {errors.name}
                      </p>
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
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => navigate("/admin")}
                    className="px-4 py-2 border border-input text-foreground rounded-lg hover:bg-secondary transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Add Sales Person"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Table Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Existing Sales Persons
            </h2>

            {tableLoading ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-muted-foreground">
                  Loading sales persons...
                </p>
              </div>
            ) : salesPersons.length > 0 ? (
              <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {salesPersons.map((person) => (
                        <tr
                          key={person.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {editingId === person.id ? (
                            <>
                              <td className="px-6 py-4 text-sm">
                                <input
                                  type="text"
                                  value={editForm.name || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      name: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 py-1 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <input
                                  type="email"
                                  value={editForm.email || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      email: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 py-1 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <input
                                  type="tel"
                                  value={editForm.phone || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      phone: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 py-1 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <select
                                  value={editForm.status || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      status: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 py-1 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-sm text-right space-x-2">
                                <button
                                  onClick={() => handleEditSave(person.id)}
                                  disabled={loading}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="inline-flex items-center gap-1 px-3 py-1 border border-input text-foreground rounded text-xs font-medium hover:bg-secondary"
                                >
                                  Cancel
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-sm font-medium text-foreground">
                                {person.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground">
                                {person.email}
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground">
                                {person.phone}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  {person.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-right space-x-2">
                                <button
                                  onClick={() => handleEditStart(person)}
                                  className="inline-flex items-center gap-1 px-3 py-1 border border-input text-foreground rounded hover:bg-secondary text-xs transition-colors font-medium"
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </button>
                                {deleteConfirm === person.id ? (
                                  <div className="inline-flex gap-2">
                                    <button
                                      onClick={() => handleDelete(person.id)}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-destructive text-white rounded text-xs font-medium hover:bg-destructive/90"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="inline-flex items-center gap-1 px-2 py-1 border border-input text-foreground rounded text-xs font-medium hover:bg-secondary"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(person.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 border border-destructive text-destructive rounded hover:bg-destructive/10 text-xs transition-colors font-medium"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-muted-foreground">
                  No sales persons created yet. Add one using the form above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
