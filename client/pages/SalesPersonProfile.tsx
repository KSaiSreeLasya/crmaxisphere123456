import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X, Mail, Phone } from "lucide-react";

interface SalesPersonData {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface OtherSalesPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function SalesPersonProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [salesPersonData, setSalesPersonData] =
    useState<SalesPersonData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<Partial<SalesPersonData>>({});
  const [otherSalesPersons, setOtherSalesPersons] = useState<
    OtherSalesPerson[]
  >([]);

  useEffect(() => {
    fetchSalesPersonData();
  }, [user?.id]);

  const fetchSalesPersonData = async () => {
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("sales_persons")
        .select("id, name, email, phone, created_at")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data) {
        setSalesPersonData(data);
        setEditForm(data);
      }

      const { data: allSalesPersons, error: allError } = await supabase
        .from("sales_persons")
        .select("id, name, email, phone")
        .neq("user_id", user.id)
        .order("name");

      if (!allError && allSalesPersons) {
        setOtherSalesPersons(allSalesPersons);
      }
    } catch (error) {
      console.error("Error fetching sales person data:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!salesPersonData) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("sales_persons")
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
        })
        .eq("id", salesPersonData.id);

      if (error) throw error;

      setSalesPersonData({
        ...salesPersonData,
        name: editForm.name || salesPersonData.name,
        email: editForm.email || salesPersonData.email,
        phone: editForm.phone || salesPersonData.phone,
      });

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (salesPersonData) {
      setEditForm(salesPersonData);
    }
  };

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="p-6">
        <div className="max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Sales Person</h1>
            <p className="text-muted-foreground mt-2">
              Manage your profile information and view team members
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              {salesPersonData ? (
                <div className="bg-white border border-border rounded-lg p-8 shadow-sm">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editForm.email || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="flex gap-3 justify-end pt-6 border-t border-border">
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-secondary font-medium transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground mb-1">
                            {salesPersonData.name}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            ID: {salesPersonData.id}
                          </p>
                        </div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                            Email
                          </h4>
                          <p className="text-foreground">
                            <a
                              href={`mailto:${salesPersonData.email}`}
                              className="text-primary hover:underline"
                            >
                              {salesPersonData.email}
                            </a>
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                            Phone
                          </h4>
                          <p className="text-foreground">
                            {salesPersonData.phone}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                            Added
                          </h4>
                          <p className="text-foreground">
                            {new Date(
                              salesPersonData.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">
                    Profile information not found
                  </p>
                </div>
              )}
            </div>

            {/* Other Sales Persons */}
            <div>
              <div className="bg-white border border-border rounded-lg p-6 shadow-sm h-full">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  Team Members
                </h2>
                {otherSalesPersons.length > 0 ? (
                  <div className="space-y-4">
                    {otherSalesPersons.map((person) => (
                      <div
                        key={person.id}
                        className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <p className="font-medium text-foreground text-sm mb-1">
                          {person.name}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {person.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {person.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No other team members
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
