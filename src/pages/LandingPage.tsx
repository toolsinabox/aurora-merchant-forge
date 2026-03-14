import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Store, Zap, Globe, ShieldCheck, BarChart3, Package,
  ArrowRight, CheckCircle2, ChevronRight, Layers, Truck,
  CreditCard, Users, Star, Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Branded Storefront",
    desc: "Launch a fully branded online store with your own subdomain — ready to sell in minutes, not weeks.",
  },
  {
    icon: Globe,
    title: "Custom Domain",
    desc: "Connect your own domain for a fully professional presence. SSL included, zero config required.",
  },
  {
    icon: Package,
    title: "Product Management",
    desc: "Unlimited products, variants, kits, and inventory across multiple warehouses with barcode scanning.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Revenue, conversion funnels, customer lifetime value, and custom report builder — all built in.",
  },
  {
    icon: Truck,
    title: "Shipping & Fulfillment",
    desc: "Multi-carrier rates, pick-pack-ship workflows, tracking emails, and dropship routing out of the box.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    desc: "Data isolation per store, role-based access, 2FA, API key scoping, and audit trails.",
  },
];

const stats = [
  { value: "500+", label: "Features Built" },
  { value: "40+", label: "Modules" },
  { value: "6", label: "Payment Gateways" },
  { value: "10+", label: "Marketplaces" },
];

const steps = [
  { num: "01", title: "Create Account", desc: "Sign up in 30 seconds. No credit card required.", icon: Users },
  { num: "02", title: "Set Up Your Store", desc: "Name your store, add products, configure shipping and payments.", icon: Layers },
  { num: "03", title: "Start Selling", desc: "Go live instantly. Share your link and start processing orders.", icon: Zap },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "Perfect for getting started",
    features: ["Up to 50 products", "Custom subdomain", "Basic analytics", "Email support", "POS included"],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$29",
    period: "/mo",
    desc: "For growing businesses",
    features: ["Unlimited products", "Custom domain", "Advanced analytics", "Priority support", "Multi-warehouse", "Marketplace integrations", "API access"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For high-volume merchants",
    features: ["Everything in Growth", "Dedicated support", "Custom integrations", "SLA guarantee", "White-label options", "Unlimited staff"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const testimonials = [
  { name: "Sarah Chen", role: "Founder, Luxe Home AU", quote: "We migrated from Shopify and haven't looked back. The B2B features alone saved us thousands.", stars: 5 },
  { name: "Marcus Wright", role: "CEO, TechGear NZ", quote: "The POS + online store integration is seamless. One platform for everything.", stars: 5 },
  { name: "Priya Sharma", role: "Operations, Fresh Organics", quote: "Multi-warehouse inventory tracking with barcode scanning — it just works.", stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 glass">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Store className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">Commerce Cloud</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors duration-200">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors duration-200">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors duration-200">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors duration-200">Testimonials</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="text-xs shadow-sm" asChild>
              <Link to="/signup">Get Started <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero — dark gradient */}
      <section className="relative overflow-hidden bg-gradient-animated text-primary-foreground">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl" />
          <div className="absolute top-1/4 right-1/3 w-[200px] h-[200px] rounded-full bg-primary/10 blur-2xl animate-float" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-28 pb-20 sm:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/20 px-3.5 py-1 text-xs font-medium text-primary-foreground/90 mb-6 animate-fade-in">
              <Sparkles className="h-3 w-3" /> 500+ features · 40 modules · 100% complete
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] animate-fade-in">
              The Commerce Platform<br />
              Built for <span className="text-primary">Scale</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-primary-foreground/70 max-w-xl leading-relaxed animate-fade-in" style={{ animationDelay: '100ms' }}>
              Multi-store, multi-warehouse, multi-currency commerce with B2B, POS, 
              marketplace integrations, and enterprise-grade admin — all in one platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Button size="lg" className="text-sm px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" asChild>
                <Link to="/signup">Start Selling Free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="text-sm px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                <a href="#features">Explore Features <ChevronRight className="ml-1 h-4 w-4" /></a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-primary-foreground/40">
              No credit card required · Free plan available · Set up in under 2 minutes
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 stagger-children">
            {stats.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-extrabold text-primary-foreground">{s.value}</div>
                <div className="text-xs text-primary-foreground/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
              <Package className="h-3 w-3" /> Platform Features
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              Everything You Need to Sell Online
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
              From product management to warehouse operations — we handle the tech so you can focus on growth.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {features.map((f) => (
              <Card key={f.title} className="group border-border/60 hover:border-primary/30 transition-all duration-300 card-hover">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors duration-300">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              Go Live in 3 Steps
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">From signup to your first sale — it's that simple.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="relative text-center group">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1.5">Step {s.num}</div>
                <h3 className="font-semibold text-sm text-foreground mb-1.5">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              Loved by Merchants
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">Hear from businesses already selling on Commerce Cloud.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 stagger-children">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/60 card-hover">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-xs text-foreground leading-relaxed mb-4 italic">"{t.quote}"</p>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">Start free, upgrade as you grow. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto stagger-children">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative transition-all duration-300 card-hover ${
                  plan.highlighted 
                    ? "border-primary shadow-lg ring-1 ring-primary/20" 
                    : "border-border/60"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-semibold text-sm text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-5">{plan.desc}</p>
                  <div className="mb-5">
                    <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full text-xs"
                    variant={plan.highlighted ? "default" : "outline"}
                    size="sm"
                    asChild
                  >
                    <Link to="/signup">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-animated text-primary-foreground py-20 sm:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl animate-float" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            Ready to Launch Your Store?
          </h2>
          <p className="text-sm text-primary-foreground/60 max-w-md mx-auto mb-8">
            Join merchants selling on Commerce Cloud. Get your own branded 
            storefront with 500+ features — completely free to start.
          </p>
          <Button size="lg" className="text-sm px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" asChild>
            <Link to="/signup">Create Your Store Now <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Store className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">Commerce Cloud</span>
          </div>
          <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} Commerce Cloud. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors duration-200">Sign In</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors duration-200">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
