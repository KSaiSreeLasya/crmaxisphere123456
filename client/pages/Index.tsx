import { Link } from "react-router-dom";
import { ArrowRight, Users, TrendingUp, BarChart3, Zap, Shield, Clock } from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: Users,
      title: "Sales Team Management",
      description: "Manage your sales team with ease. Add, edit, and remove sales persons with comprehensive profiles.",
    },
    {
      icon: TrendingUp,
      title: "Lead Management",
      description: "Track and manage leads effectively with detailed information including company details and contact methods.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Get real-time insights into your sales performance and lead conversion metrics.",
    },
    {
      icon: Zap,
      title: "Quick Actions",
      description: "Streamline your workflow with quick actions for lead assignment and follow-ups.",
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Keep your data safe with secure authentication and role-based access controls.",
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Stay updated with real-time notifications and activity tracking.",
    },
  ];

  const stats = [
    { number: "500+", label: "Active Users" },
    { number: "10K+", label: "Leads Managed" },
    { number: "95%", label: "Conversion Rate" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-sm">
                AS
              </div>
              <span className="font-bold text-lg text-foreground hidden sm:block">
                Axisphere CRM
              </span>
            </Link>
            
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Modern CRM for Growing Teams
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage your sales team, track leads, and analyze performance with our powerful and intuitive CRM platform designed for modern businesses.
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold text-lg"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-primary mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Powerful Features
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to manage your sales process effectively
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-xl border border-border bg-white hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join hundreds of teams already using Axisphere CRM to manage their sales pipeline and grow their business.
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary rounded-lg hover:bg-opacity-90 transition-all font-semibold text-lg"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-sm">
              AS
            </div>
            <span className="font-bold text-foreground">Axisphere CRM</span>
          </div>
          <p className="text-center text-muted-foreground">
            © 2024 Axisphere CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
