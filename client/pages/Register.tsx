import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, AlertCircle } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"sales" | "admin">("sales");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      await register(email, password, firstName, lastName, role);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-lg mb-4">
            <div className="text-xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              AS
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Axisphere CRM</h1>
          <p className="text-white/80 mt-2">Create Your Account</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Sign Up</h2>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder-muted-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder-muted-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder-muted-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder-muted-foreground"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                At least 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "sales" | "admin")}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="sales">Sales Person</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Creating account..." : <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
