-- Create packages table
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price_inr DECIMAL(10, 2) NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  success_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  package_id UUID REFERENCES packages(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,
  selected_features TEXT[] DEFAULT ARRAY[]::TEXT[],
  package_price DECIMAL(10, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) DEFAULT 18.00,
  gst_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default packages
INSERT INTO packages (name, price_inr, description, features, success_metrics) VALUES
(
  'AI Starter Package',
  30000,
  'Scalable, results-driven solutions designed to grow with your business.',
  ARRAY[
    '20 AI-generated social media posts per month',
    '2 AI-optimized blog articles (800-1000 words each)',
    'AI-driven content calendar and scheduling',
    'Basic AI copywriting for ads and emails',
    'AI email support for ads and emails',
    '+5 more features'
  ],
  '{"marketing_improvement": "25-40%", "engagement_rate": "35-45%", "content_roi": "20-28%", "customer_support_needs": "40-60% reduction in manual content creation", "cost_per_lead": "Uplift value"}'::jsonb
),
(
  'AI Growth Package',
  75000,
  'Scalable, results-driven solutions designed to grow with your business.',
  ARRAY[
    '50 AI-generated social media posts per month',
    '8 AI-optimized blog articles with SEO analysis',
    'Dynamic content personalization for different audience segments',
    'Comprehensive campaign strategy across Google, Facebook, LinkedIn',
    'Advanced audience modeling and targeting',
    'Automated bot optimization and budget allocation',
    'Natural language processing chatbot (up to 5000 subscriber limit)',
    '+7 more features'
  ],
  '{"marketing_improvement": "40-60%", "engagement_rate": "45-60%", "content_roi": "35-50%", "customer_support_needs": "60-75% reduction in manual content creation", "lifetime_value": "Uplift value"}'::jsonb
),
(
  'AI Enterprise Package',
  150000,
  'Scalable, results-driven solutions designed to grow with your business.',
  ARRAY[
    '100+ AI-generated social media posts per month',
    '15 AI-optimized long-form content pieces with advanced SEO',
    'AI-powered customer journey optimization',
    'Advanced predictive analytics and forecasting',
    'Custom AI model training for your brand voice',
    'Integration with enterprise CRM and marketing automation',
    'Multi-language support (21+ languages)',
    'Dedicated account manager',
    '24/7 priority support with 1-hour response time',
    'Quarterly business reviews and strategy optimization',
    '+5 more features'
  ],
  '{"marketing_improvement": "60-80%", "engagement_rate": "60-75%", "content_roi": "50-70%", "customer_support_needs": "80-95% reduction in manual content creation", "customer_engagement_score": "Significant Uplift value"}'::jsonb
);

-- Create function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices;
  
  RETURN 'INV-AXI-' || LPAD(next_num::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := generate_invoice_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_number_trigger
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();

-- Calculate GST amount automatically
CREATE OR REPLACE FUNCTION calculate_gst()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gst_amount := (NEW.package_price * NEW.gst_percentage) / 100;
  NEW.total_amount := NEW.package_price + NEW.gst_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gst_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_gst();
