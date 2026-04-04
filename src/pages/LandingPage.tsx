import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Send, Users, BarChart3, ArrowRight, CheckCircle2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import promo1 from "@/assets/promo-1.jpeg";
import promo2 from "@/assets/promo-2.jpeg";
import promo3 from "@/assets/promo-3.jpeg";
import promo4 from "@/assets/promo-4.jpeg";
import { useAuth } from "@/contexts/AuthContext";

const services = [
  { label: "Bulk SMS", icon: Send, description: "Send thousands of messages instantly to your audience" },
  { label: "Contacts", icon: Users, description: "Manage and organize your contact lists effortlessly" },
  { label: "Campaigns", icon: BarChart3, description: "Create targeted SMS campaigns that convert" },
  { label: "Analytics", icon: BarChart3, description: "Track delivery rates and campaign performance" },
];

const features = [
  "99.9% delivery rate guarantee",
  "Send to 50+ countries worldwide",
  "Real-time delivery reports",
  "Import contacts via CSV",
  "Smart scheduling & automation",
  "Dedicated sender IDs",
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      setShowAuthModal(false);
      navigate("/dashboard");
    } catch (error: any) {
      alert(error.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top Bar */}
      <div className="bg-[hsl(174,72%,46%)] text-[hsl(0,0%,100%)] text-center text-sm py-2 px-4 font-medium">
        Empowering Business Communication Across <span className="bg-[hsl(340,82%,52%)] text-[hsl(0,0%,100%)] px-2 py-0.5 rounded-full text-xs font-bold ml-1">KENYA</span>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(174,72%,46%)]">
              <MessageSquare className="h-5 w-5 text-[hsl(0,0%,100%)]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">TumaPrime SMS</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {["Solutions", "Pricing", "Developer", "About", "Contact"].map((item) => (
              <a key={item} href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setIsLogin(true); setShowAuthModal(true); }}>
              Login
            </Button>
            <Button size="sm" className="bg-[hsl(174,72%,46%)] hover:bg-[hsl(174,72%,40%)] text-[hsl(0,0%,100%)] rounded-full px-6" onClick={() => { setIsLogin(false); setShowAuthModal(true); }}>
              Get Started Now
            </Button>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
            {["Solutions", "Pricing", "Developer", "About", "Contact"].map((item) =>(
              <a key={item} href="#" className="block text-sm font-medium text-muted-foreground py-2">
                {item}
              </a>
            ))}
            <Button className="w-full bg-[hsl(174,72%,46%)] hover:bg-[hsl(174,72%,40%)] text-[hsl(0,0%,100%)] rounded-full" onClick={() => { setIsLogin(false); setShowAuthModal(true); }}>
              Get Started Now
            </Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div className="space-y-8">
              <p className="text-muted-foreground text-lg">Seamless Communication Solutions &</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
                <span className="text-[hsl(174,72%,46%)]">Easy</span>
                <br />
                <span className="text-[hsl(174,72%,46%)]">Bulk SMS</span>
                <br />
                <span className="text-[hsl(340,82%,52%)]">Reach</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md">
                Reach thousands of customers instantly at a fixed rate of only <span className="font-bold text-[hsl(174,72%,46%)]">Kshs 0.46</span> per SMS. Cross-network delivery, no monthly charges, no setup fee.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-[hsl(340,82%,52%)] hover:bg-[hsl(340,82%,45%)] text-[hsl(0,0%,100%)] rounded-full px-8 text-base h-12" onClick={() => { setIsLogin(false); setShowAuthModal(true); }}>
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-12 border-[hsl(340,82%,52%)] text-[hsl(340,82%,52%)] hover:bg-[hsl(340,82%,52%)]/10">
                  Free Demo
                </Button>
              </div>
            </div>

            {/* Right - Images */}
            <div className="relative hidden lg:block">
              <div className="absolute -top-8 -right-8 w-72 h-72 bg-[hsl(340,82%,52%)]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[hsl(174,72%,46%)]/10 rounded-full blur-3xl" />
              
              <div className="relative grid grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-[hsl(174,72%,46%)]/20">
                  <img src={promo1} alt="TumaPrime SMS - Bulk SMS Solutions" className="w-full h-72 object-cover" />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-[hsl(340,82%,52%)]/20 mt-8">
                  <img src={promo2} alt="TumaPrime SMS - Affordable Messaging" className="w-full h-72 object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to communicate with your audience at scale</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div key={service.label} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border group">
                <div className="h-12 w-12 rounded-xl bg-[hsl(174,72%,46%)]/10 flex items-center justify-center mb-4 group-hover:bg-[hsl(174,72%,46%)]/20 transition-colors">
                  <service.icon className="h-6 w-6 text-[hsl(174,72%,46%)]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{service.label}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* Promo Gallery */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Trusted Across Kenya</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Fixed rate of only Kshs 0.46 per SMS — cross-network delivery, no monthly charges, no setup fee.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[promo1, promo2, promo3, promo4].map((img, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-lg border border-border hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
                <img src={img} alt={`TumaPrime SMS promo ${i + 1}`} className="w-full h-64 object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Why Choose <span className="text-[hsl(174,72%,46%)]">TumaPrime SMS</span>?
              </h2>
              <p className="text-muted-foreground mb-8">
                Built for businesses that need reliable, scalable messaging infrastructure.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[hsl(174,72%,46%)] shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="bg-[hsl(174,72%,46%)] hover:bg-[hsl(174,72%,40%)] text-[hsl(0,0%,100%)] rounded-full px-8 mt-8" onClick={() => { setIsLogin(false); setShowAuthModal(true); }}>
                Start Sending Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <div className="bg-card rounded-2xl border border-border shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-[hsl(174,72%,46%)]/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-[hsl(174,72%,46%)]" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Enterprise Grade</div>
                    <div className="text-sm text-muted-foreground">Secure & Reliable</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Delivery Rate</span>
                    <span className="text-sm font-bold text-[hsl(174,72%,46%)]">99.9%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-[hsl(174,72%,46%)] h-2 rounded-full" style={{ width: "99.9%" }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Messages Sent Today</span>
                    <span className="text-sm font-bold text-[hsl(340,82%,52%)]">1.2M+</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-[hsl(340,82%,52%)] h-2 rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[hsl(174,72%,46%)] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(0,0%,100%)] mb-4">
            Ready to reach your audience?
          </h2>
          <p className="text-[hsl(0,0%,100%)]/80 mb-8 text-lg">
            Join thousands of businesses using TumaPrime SMS to communicate effectively.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-[hsl(0,0%,100%)] text-[hsl(174,72%,46%)] hover:bg-[hsl(0,0%,95%)] rounded-full px-8 text-base h-12 font-semibold" onClick={() => { setIsLogin(false); setShowAuthModal(true); }}>
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-12 border-[hsl(0,0%,100%)] text-[hsl(0,0%,100%)] hover:bg-[hsl(0,0%,100%)]/10">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(174,72%,46%)]">
                  <MessageSquare className="h-4 w-4 text-[hsl(0,0%,100%)]" />
                </div>
                <span className="text-lg font-bold text-foreground">TumaPrime SMS</span>
              </div>
              <p className="text-sm text-muted-foreground">Powered by 254 Convex Communication LTD</p>
            </div>
            {[
              { title: "Product", links: ["Bulk SMS", "Campaigns", "Analytics", "API"] },
              { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
              { title: "Support", links: ["Documentation", "API Reference", "Status", "Help Center"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-foreground mb-3">{col.title}</h4>
                <div className="space-y-2">
                  {col.links.map((link) => (
                    <a key={link} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 TumaPrime SMS. Powered by 254 Convex Communication LTD. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-center">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label>Full Name</Label>
                  <Input 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    required={!isLogin}
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input 
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              {isLogin ? (
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <button className="text-primary font-medium" onClick={() => setIsLogin(false)}>Sign up</button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button className="text-primary font-medium" onClick={() => setIsLogin(true)}>Login</button>
                </p>
              )}
            </div>
            <button className="absolute top-4 right-4" onClick={() => setShowAuthModal(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
