import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: "admin" | "sales";
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role: "admin" | "sales") => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Query users table to find matching user
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !users) {
        throw new Error("Invalid email or password");
      }

      // Simple password check (in production, use bcrypt)
      // For demo purposes, we'll just compare plain text
      if (users.password_hash !== password) {
        throw new Error("Invalid email or password");
      }

      if (!users.is_active) {
        throw new Error("Account is inactive");
      }

      const userData: User = {
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        is_active: users.is_active,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: "admin" | "sales"
  ) => {
    try {
      // Insert new user
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          email,
          password_hash: password, // In production, use bcrypt
          first_name: firstName,
          last_name: lastName,
          role,
          is_active: true,
        })
        .select()
        .single();

      if (error || !newUser) {
        throw new Error(error?.message || "Registration failed");
      }

      const userData: User = {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        is_active: newUser.is_active,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
