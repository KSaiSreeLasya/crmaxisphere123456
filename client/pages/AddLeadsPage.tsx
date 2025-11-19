import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Lead {
  id?: string;
  name: string;
  jobTitle: string;
  company: string;
  emails: string[];
  phones: string[];
  location: string;
  companySize: string;
  industries: string[];
  keywords: string[];
  links: string[];
  actions: string;
  statusId?: string;
  nextReminder?: string;
  note?: string;
}

interface LeadStatus {
  id: string;
  name: string;
  order_index: number;
  color: string;
}

export default function AddLeadsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Lead>({
    name: "",
    jobTitle: "",
    company: "",
    emails: [],
    phones: [],
    location: "",
    companySize: "",
    industries: [],
    keywords: [],
    links: [],
    actions: "",
    statusId: "",
    nextReminder: "",
    note: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const { data } = await supabase
        .from("lead_status_pipeline")
        .select("*")
        .order("order_index");
      if (data) setStatuses(data);
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Lead name is required";
    }

    if (!formData.company.trim()) {
      newErrors.company = "Company is required";
    }

    if (formData.emails.length === 0) {
      newErrors.emails = "At least one email is required";
    }

    if (formData.phones.length === 0) {
      newErrors.phones = "At least one phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const statusId =
        formData.statusId || statuses.find((s) => s.name === "No Stage")?.id;
      if (!statusId) return;

      // Create the lead
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: formData.name,
          company: formData.company,
          job_title: formData.jobTitle,
          location: formData.location,
          company_size: formData.companySize,
          industries: formData.industries,
          keywords: formData.keywords,
          links: formData.links,
          notes: formData.note || formData.actions,
          next_reminder: formData.nextReminder || null,
          status_id: statusId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Add emails
      for (const email of formData.emails) {
        await supabase.from("lead_emails").insert({
          lead_id: leadData.id,
          email,
        });
      }

      // Add phones
      for (const phone of formData.phones) {
        await supabase.from("lead_phones").insert({
          lead_id: leadData.id,
          phone,
        });
      }

      navigate("/leads");
    } catch (error) {
      console.error("Error adding lead:", error);
      setErrors({
        submit: "Failed to add lead. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmail = () => {
    if (emailInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setFormData({
        ...formData,
        emails: [...formData.emails, emailInput.trim()],
      });
      setEmailInput("");
    }
  };

  const addPhone = () => {
    if (phoneInput.trim() && /^\d{10,}$/.test(phoneInput.replace(/\D/g, ""))) {
      setFormData({
        ...formData,
        phones: [...formData.phones, phoneInput.trim()],
      });
      setPhoneInput("");
    }
  };

  const addIndustry = () => {
    if (industryInput.trim()) {
      setFormData({
        ...formData,
        industries: [...formData.industries, industryInput.trim()],
      });
      setIndustryInput("");
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const addLink = () => {
    if (linkInput.trim()) {
      setFormData({
        ...formData,
        links: [...formData.links, linkInput.trim()],
      });
      setLinkInput("");
    }
  };

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Add New Lead
            </h1>
            <p className="text-muted-foreground">
              Fill in the details to create a new lead
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
            {errors.submit && (
              <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Lead Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="John Smith"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="Sales Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Company <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="Acme Corp"
                  />
                  {errors.company && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.company}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="New York, USA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Company Size
                  </label>
                  <select
                    value={formData.companySize}
                    onChange={(e) =>
                      setFormData({ ...formData, companySize: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Contact Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Emails <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addEmail()}
                    className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="email@example.com"
                  />
                  <button
                    type="button"
                    onClick={addEmail}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.emails.map((email, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            emails: formData.emails.filter((_, i) => i !== idx),
                          })
                        }
                        className="hover:opacity-70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.emails && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.emails}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Numbers <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addPhone()}
                    className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="+1 (555) 000-0000"
                  />
                  <button
                    type="button"
                    onClick={addPhone}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.phones.map((phone, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg"
                    >
                      {phone}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            phones: formData.phones.filter((_, i) => i !== idx),
                          })
                        }
                        className="hover:opacity-70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.phones && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.phones}
                  </p>
                )}
              </div>
            </div>

            {/* Company Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Company Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Industries
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addIndustry()}
                    className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="e.g., Technology, Finance"
                  />
                  <button
                    type="button"
                    onClick={addIndustry}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.industries.map((industry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-lg"
                    >
                      {industry}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            industries: formData.industries.filter(
                              (_, i) => i !== idx,
                            ),
                          })
                        }
                        className="hover:opacity-70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Keywords
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                    className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="e.g., SaaS, Enterprise"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-lg"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            keywords: formData.keywords.filter(
                              (_, i) => i !== idx,
                            ),
                          })
                        }
                        className="hover:opacity-70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Links
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addLink()}
                    className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    placeholder="https://example.com"
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.links.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-lg max-w-xs"
                    >
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                      >
                        {link}
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            links: formData.links.filter((_, i) => i !== idx),
                          })
                        }
                        className="hover:opacity-70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lead Status and Reminder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Status
                </label>
                <select
                  value={formData.statusId}
                  onChange={(e) =>
                    setFormData({ ...formData, statusId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                >
                  <option value="">Select status</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Next Reminder
                </label>
                <input
                  type="date"
                  value={formData.nextReminder}
                  onChange={(e) =>
                    setFormData({ ...formData, nextReminder: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Note
              </label>
              <textarea
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="Add any notes about this lead"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Actions
              </label>
              <textarea
                value={formData.actions}
                onChange={(e) =>
                  setFormData({ ...formData, actions: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="Add notes about required actions or follow-ups"
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => navigate("/leads")}
                className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-secondary transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : "Add Lead"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
