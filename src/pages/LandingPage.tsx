import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Store, Zap, Globe, ShieldCheck, BarChart3, Package,
  ArrowRight, CheckCircle2, ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Your Own Storefront",
    desc: "Get a fully branded online store with your own custom subdomain — ready to sell in minutes.",
  },
  {
    icon: Globe,
    title: "Custom Domain",
    desc: "Launch on your-store.commerce.cloud or connect your own domain for a fully professional presence.",
  },
  {
    icon: Package,
    title: "Product Management",
    desc: "Manage unlimited products, variants, inventory, and categories with a powerful admin dashboard.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    desc: "Track sales, revenue, customer behavior, and growth with real-time analytics built in.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Scalable",
    desc: "Enterprise-grade security with data isolation per store. Your data stays yours, always.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Built for speed. Sub-second page loads and instant admin interactions — no lag, ever.",
  },
];

const steps = [
  { num: "1", title: "Sign Up", desc: "Create your free merchant account in under a minute." },
  { num: "2", title: "Set Up Your Store", desc: "Name your store, pick a slug, add products and categories." },
  { num: "3", title: "Start Selling", desc: "Share your store link and start accepting orders immediately." },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "Perfect for getting started",
    features: ["Up to 50 products", "Custom subdomain", "Basic analytics", "Email support"],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$29",
    period: "/mo",
    desc: "For growing businesses",
    features: ["Unlimited products", "Custom domain", "Advanced analytics", "Priority support", "Discount codes", "Multi-location inventory"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For high-volume merchants",
    features: ["Everything in Growth", "Dedicated support", "Custom integrations", "SLA guarantee", "White-label options"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base text-foreground">Commerce Cloud</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Get Started <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
            <Zap className="h-3 w-3" /> Launch your store in minutes
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Your Online Store,<br />
            <span className="text-primary">Your Custom Domain</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Commerce Cloud gives every merchant a powerful, fully-branded storefront
            with their own subdomain. Set up in minutes, scale without limits.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="w-full sm:w-auto text-sm px-8" asChild>
              <Link to="/signup">Start Selling for Free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm px-8" asChild>
              <a href="#features">See Features <ChevronRight className="ml-1 h-4 w-4" /></a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · Free plan available · Set up in under 2 minutes
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Everything You Need to Sell Online</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              From product management to analytics, we handle the tech so you can focus on your business.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-border/60 hover:border-primary/30 transition-colors">
                <CardContent className="p-5 sm:p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Get Started in 3 Easy Steps</h2>
            <p className="mt-2 text-sm text-muted-foreground">From signup to your first sale — it's that simple.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Simple, Transparent Pricing</h2>
            <p className="mt-2 text-sm text-muted-foreground">Start free, upgrade as you grow.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.highlighted ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20" : "border-border/60"}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-5 sm:p-6">
                  <h3 className="font-semibold text-sm text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
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

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Ready to Launch Your Store?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Join hundreds of merchants already selling on Commerce Cloud. 
            Get your own branded storefront with a custom domain today.
          </p>
          <Button size="lg" className="text-sm px-8" asChild>
            <Link to="/signup">Create Your Store Now <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Store className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">Commerce Cloud</span>
          </div>
          <p className="text-2xs text-muted-foreground">© {new Date().getFullYear()} Commerce Cloud. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
