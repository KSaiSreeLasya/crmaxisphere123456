# Invoice Feature Setup Guide

The invoice feature has been integrated into your Axisphere CRM application. Follow these steps to set it up:

## Step 1: Create Database Tables in Supabase

You need to create two tables in your Supabase project:

1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to your project: `mziquefoqaubxhrchkft`
3. Go to the **SQL Editor** section
4. Create a new query and paste the following SQL:

```sql
-- Create packages table
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

-- Create invoices table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_package_id ON invoices(package_id);
```

5. Click **Run** to execute the SQL

## Step 2: Set Up Default Packages

The default packages will be created automatically when the app's seeding process runs. When you load the application, it will:

- Create three default packages:
  - **AI Starter Package** - ₹30,000
  - **AI Growth Package** - ₹75,000
  - **AI Enterprise Package** - ₹150,000

These are created automatically by the seed script if they don't exist.

## Step 3: Verify the Setup

1. Navigate to your admin dashboard
2. You should see a new **Invoices** menu item in the sidebar (admin only)
3. Click on it to access the invoices page
4. Click **Create Invoice** to start creating invoices

## Features Included

✅ **Create Invoices**: Create new invoices with customer details and package selection
✅ **View All Invoices**: See a list of all created invoices
✅ **View Invoice Details**: View complete invoice details with all package features
✅ **Download as PDF**: Download invoices as PDF documents
✅ **Delete Invoices**: Remove invoices from the system
✅ **Admin Only**: Only users with admin role can create and manage invoices

## Invoice Features

Each invoice includes:

- Unique invoice number (format: AXI-YYYYMMDD-XXXX)
- Customer information (name, email, phone, company)
- Package details with all features listed
- Automatic GST calculation (configurable)
- Total amount due
- Additional notes field
- Professional invoice layout

## Troubleshooting

### If you get "Invalid Request" errors:

- Make sure the database tables are created (check Supabase SQL Editor)
- Verify the foreign key constraints are set up correctly
- Check that your Supabase environment variables are set

### If the Invoice menu doesn't appear:

- You must be logged in as an admin user
- Only admin users can access the invoices feature
- Refresh the page after setting up the database tables

### If you can't create invoices:

- Ensure the packages table is populated (run the seed again or manually insert packages)
- Verify the foreign key relationship between invoices and packages

## Environment Variables

The following environment variables are required (should already be set):

```
VITE_SUPABASE_URL=https://mziquefoqaubxhrchkft.supabase.co
VITE_SUPABASE_ANON_KEY=Uu4d8CyyxJinOM
```

## Next Steps

After setup:

1. Log in as an admin user
2. Navigate to the Invoices section
3. Create your first invoice
4. View, download, and manage invoices

For any issues, check the browser console for error messages and ensure all database tables are properly created.
