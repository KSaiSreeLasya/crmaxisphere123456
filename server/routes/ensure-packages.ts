import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_PACKAGES = [
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

export const handleEnsurePackages: RequestHandler = async (req, res) => {
  try {
    // Check if packages exist
    const { data: existingPackages, error: selectError } = await supabase
      .from("packages")
      .select("id")
      .limit(1);

    // If table doesn't exist or no packages, insert defaults
    if (selectError || !existingPackages || existingPackages.length === 0) {
      const { data: insertedPackages, error: insertError } = await supabase
        .from("packages")
        .insert(DEFAULT_PACKAGES)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert packages: ${insertError.message}`);
      }

      return res.json({
        message: "Packages ensured successfully",
        packagesCreated: insertedPackages?.length || 0,
      });
    }

    res.json({
      message: "Packages already exist",
      packagesExist: existingPackages.length > 0,
    });
  } catch (error) {
    console.error("Ensure packages error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to ensure packages",
    });
  }
};
