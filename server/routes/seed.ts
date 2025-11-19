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
      error:
        error instanceof Error ? error.message : "Failed to seed database",
    });
  }
};
