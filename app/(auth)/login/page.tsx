"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { ZyOpsLogo } from "@/components/ui/ZyOpsLogo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError((err as any).errors[0].message);
        setLoading(false);
        return;
      }
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex font-sans relative" 
      style={{ 
        background: '#F2F1E8' 
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(24,167,173,0.10) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(194,169,128,0.15) 0%, transparent 45%)'
        }}
      />
      
      {/* CENTER PANEL - LOGIN FORM */}
      <div className="w-full flex flex-col justify-center items-center p-6 relative z-10 animate-in">
        <div 
          className="w-full max-w-[420px] bg-[#FAFAF2] flex flex-col"
          style={{ 
            borderRadius: 'var(--radius-xl)', 
            border: '1px solid rgba(194,169,128,0.30)',
            boxShadow: 'var(--shadow-lg), 0 0 40px rgba(194,169,128,0.12)',
            padding: '44px 40px'
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="mb-[6px]">
              <ZyOpsLogo size="lg" theme="light" />
            </div>
            <p className="text-[13px] text-[#6B6550] font-sans">
              Operate smarter. Deliver faster.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 flex flex-col gap-4">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-[13px] font-semibold text-text-body"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                className={`input w-full ${error ? 'border-[#EF4444] ring-1 ring-[#EF4444]' : ''}`}
                placeholder="name@zyops.com"
                required
              />
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <label 
                  htmlFor="password" 
                  className="block text-[13px] font-semibold text-text-body"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={`input w-full pr-12 ${error ? 'border-[#EF4444] ring-1 ring-[#EF4444]' : ''}`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {error && (
               <div className="text-[#B91C1C] text-[13px] font-medium mt-2 flex items-center justify-center bg-[#FEE2E2] p-3 rounded-lg border border-[#EF4444]/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 transition-all duration-200 rounded-md flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed hover:brightness-[1.08] hover:shadow-[var(--shadow-accent-glow)]"
              style={{
                height: '44px',
                background: 'linear-gradient(135deg, #18A7AD 0%, #0F8A8F 100%)',
                color: 'white',
                fontFamily: 'var(--font-display)',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: 'var(--btn-accent-shadow)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-white" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[#9C9478] text-[11px]">
              © 2025 ZyOps
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
