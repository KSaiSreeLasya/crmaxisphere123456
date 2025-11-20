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

    // Define package specifications
    const packageSpecs = [
      {
        name: "AI Starter Package",
        price: 30000,
        description:
          "Scalable, results-driven solutions designed to grow with your business.",
        features: [
          "20 AI-generated social media posts per month",
          "2 AI-optimized blog articles (800–1200 words each)",
          "AI-driven content calendar and scheduling",
          "Basic AI copywriting for ads and emails",
          "Campaign strategy development and setup",
          "AI-personalized email marketing (up to 1,000 subscribers)",
          "Rule-based chatbot for website (FAQ automation up to 50 questions)",
          "Monthly AI-generated performance reports",
          "Monthly 2-hour AI strategy consultation",
          "Email support during business hours",
        ],
      },
      {
        name: "AI Growth Package",
        price: 75000,
        description:
          "Scalable, results-driven solutions designed to grow with your business.",
        features: [
          "50 AI-generated social media posts per month",
          "8 AI-optimized blog articles with SEO analysis",
          "Dynamic content personalization for different audience segments",
          "Comprehensive campaign strategy across Google, Facebook, LinkedIn",
          "Advanced audience modeling and targeting",
          "Automated bid optimization and budget allocation",
          "AI-personalized campaigns (up to 5,000 subscribers)",
          "Natural language processing chatbot capabilities",
          "Appointment booking and scheduling integrations",
          "E-commerce support and product recommendations",
          "Multi-language support (2 languages)",
          "Weekly strategy sessions with AI specialists",
        ],
      },
      {
        name: "AI Enterprise Package",
        price: 150000,
        description:
          "Scalable, results-driven solutions designed to grow with your business.",
        features: [
          "100+ AI-generated social media posts per month",
          "15 AI-optimized long-form content pieces with advanced SEO",
          "AI-powered customer journey optimization",
          "Advanced predictive analytics and forecasting",
          "Custom AI model training for your brand voice",
          "Advanced NLP chatbot with voice",
          "Integration with enterprise CRM and marketing automation",
          "Multi-language support (5+ languages)",
          "Dedicated AI account manager",
          "24/7 priority support with 1-hour response time",
          "Quarterly business reviews and strategy optimization",
        ],
      },
    ];

    // Create or update packages
    for (const spec of packageSpecs) {
      const { data: existingPackage, error: fetchError } = await supabase
        .from("packages")
        .select("id")
        .eq("name", spec.name)
        .single();

      if (existingPackage && !fetchError) {
        // Update existing package with new features
        await supabase
          .from("packages")
          .update({
            price: spec.price,
            description: spec.description,
            features: spec.features,
            is_active: true,
          })
          .eq("id", existingPackage.id);
      } else {
        // Create new package
        await supabase.from("packages").insert({
          name: spec.name,
          price: spec.price,
          description: spec.description,
          features: spec.features,
          is_active: true,
        });
      }
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
