import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handleSeed: RequestHandler = async (req, res) => {
  try {
    // Create tables using raw SQL if they don't exist
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS packages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        features JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        company_name VARCHAR(255),
        package_id UUID NOT NULL REFERENCES packages(id),
        base_price DECIMAL(10, 2) NOT NULL,
        gst_percentage DECIMAL(5, 2) DEFAULT 18,
        gst_amount DECIMAL(10, 2),
        total_amount DECIMAL(10, 2) NOT NULL,
        additional_notes TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
      CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
      CREATE INDEX IF NOT EXISTS idx_invoices_package_id ON invoices(package_id);
    `;

    // Try to execute the SQL using Supabase RPC or direct query
    // Since Supabase RPC might not support raw SQL, we'll try it
    try {
      await supabase.rpc("create_tables", {
        sql: createTablesSQL,
      });
    } catch (rpcError) {
      // RPC might not exist, so we'll skip it and let manual SQL migration happen
      console.warn(
        "Could not execute table creation via RPC. Please run SQL migration manually.",
      );
    }

    // Check if admin user already exists
    const { data: existingAdmins, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", "admin@axisphere.in");

    if (!checkError && existingAdmins && existingAdmins.length > 0) {
      return res.json({
        message: "Admin user already exists",
        admin: existingAdmins[0],
      });
    }

    // Create admin user
    const { data: newAdmin, error: userError } = await supabase
      .from("users")
      .insert({
        email: "admin@axisphere.in",
        password_hash: "admin2024",
        first_name: "Admin",
        last_name: "User",
        role: "admin",
        is_active: true,
      })
      .select()
      .single();

    if (userError || !newAdmin) {
      throw new Error(userError?.message || "Failed to create admin user");
    }

    // Create admin sales person record
    await supabase.from("sales_persons").insert({
      user_id: newAdmin.id,
      name: "Admin User",
      email: "admin@axisphere.in",
      phone: "",
      status: "active",
      created_by: newAdmin.id,
    });

    // Create lead status pipeline if it doesn't exist
    const { data: existingStatuses } = await supabase
      .from("lead_status_pipeline")
      .select("id");

    if (!existingStatuses || existingStatuses.length === 0) {
      const statuses = [
        { name: "No Stage", order_index: 0, color: "gray" },
        { name: "Lead", order_index: 1, color: "blue" },
        { name: "Qualified", order_index: 2, color: "purple" },
        { name: "Negotiation", order_index: 3, color: "yellow" },
        { name: "Result", order_index: 4, color: "green" },
      ];

      await supabase.from("lead_status_pipeline").insert(statuses);
    }

    // Create default packages if they don't exist
    const { data: existingPackages } = await supabase
      .from("packages")
      .select("id");

    if (!existingPackages || existingPackages.length === 0) {
      const packages = [
        {
          name: "AI Starter Package",
          price: 30000,
          description:
            "Scalable, results-driven solutions designed to grow with your business.",
          features: [
            "20 AI-generated social media posts per month",
            "24 optimized blog articles (800-1200 words each)",
            "AI-driven content calendar and scheduling",
            "Basic AI copywriting for ads and emails",
            "Campaign strategy development and setup",
            "5 more features",
          ],
          is_active: true,
        },
        {
          name: "AI Growth Package",
          price: 75000,
          description:
            "Scalable, results-driven solutions designed to grow with your business.",
          features: [
            "50 AI-generated social media posts per month",
            "8 optimized blog articles (800-1200 words each)",
            "Dynamic content personalization for different audience segments",
            "Advanced audience modeling and targeting",
            "Comprehensive campaign strategy across Google, Facebook, LinkedIn",
            "Advanced predictive analytics and forecasting",
            "7 more features",
          ],
          is_active: true,
        },
        {
          name: "AI Enterprise Package",
          price: 150000,
          description:
            "Scalable, results-driven solutions designed to grow with your business.",
          features: [
            "100+ AI-generated social media posts per month",
            "15 AI-optimized long-form content with advanced SEO",
            "Advanced predictive analytics and forecasting",
            "Custom AI model training for your brand voice",
            "Integration with enterprise CRM and marketing automation",
            "Multi-language support (71+ languages)",
            "24/7 priority support with 1-hour response time",
            "Quarterly business reviews and strategy consultation",
            "5 more features",
          ],
          is_active: true,
        },
      ];

      await supabase.from("packages").insert(packages);
    }

    res.json({
      message: "Database seeded successfully",
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to seed database",
    });
  }
};
