import { Link } from 'react-router-dom'
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Users2, 
  Clock, 
  Globe 
} from 'lucide-react'

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-md">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">PayAxis</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <a href="#architecture" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Architecture</a>
        <a href="#compliance" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Compliance</a>
        <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Security</a>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
        <Link to="/register" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
          Launch App
        </Link>
      </div>
    </div>
  </nav>
)

const Feature = ({ icon: Icon, title, description }) => (
  <div className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 group">
    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
  </div>
)

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">HMRC 2024/25 RTI COMPLIANT ENGINE</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            Payment-Gated <span className="text-primary">Payroll Infrastructure</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            A production-grade B2B platform automating the contractor payment lifecycle through Finite State Machines and row-scoped multi-tenant architecture.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Link to="/register" className="w-full sm:w-auto bg-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
              Explore Live Demo
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-semibold border hover:bg-muted transition-colors flex items-center justify-center gap-2">
              View Source
            </a>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-20 relative animate-in fade-in zoom-in-95 duration-1000 delay-700">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="rounded-2xl border shadow-2xl overflow-hidden bg-muted/50 p-4">
              <div className="aspect-[16/9] rounded-xl bg-card border shadow-sm flex items-center justify-center overflow-hidden relative">
                {/* Mock UI Overlay */}
                <div className="w-full h-full p-8 flex flex-col gap-6">
                   <div className="flex items-center justify-between border-b pb-4">
                     <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-400" />
                        <div className="h-3 w-3 rounded-full bg-amber-400" />
                        <div className="h-3 w-3 rounded-full bg-emerald-400" />
                     </div>
                     <div className="text-[10px] font-mono text-muted-foreground px-3 py-1 rounded bg-muted">STATE_MACHINE: RECONCILIATION_PENDING</div>
                   </div>
                   <div className="grid grid-cols-4 gap-6 flex-1">
                      <div className="col-span-3 rounded-xl border bg-background/50 p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                           <div className="h-4 w-1/3 bg-muted rounded" />
                           <div className="h-6 w-20 bg-emerald-500/10 rounded-full border border-emerald-500/20" />
                        </div>
                        <div className="h-48 w-full bg-primary/5 rounded-lg border border-dashed border-primary/20 flex flex-col items-center justify-center gap-4">
                           <BarChart3 className="h-12 w-12 text-primary/20" />
                           <div className="text-[10px] font-mono text-primary/40">APPEND_ONLY_AUDIT_LOG_INITIALIZED</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="h-12 bg-muted rounded-lg" />
                           <div className="h-12 bg-muted rounded-lg" />
                        </div>
                      </div>
                      <div className="rounded-xl border bg-background/50 p-6 flex flex-col gap-4">
                         <div className="h-4 w-1/2 bg-muted rounded" />
                         <div className="flex-1 flex flex-col gap-3">
                            {[1,2,3,4,5,6].map(i => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
                                <div className="h-2 flex-1 bg-muted rounded" />
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Tech Stack */}
      <section className="py-20 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-12">
            Engineered with Modern Enterprise Architecture
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-70 transition-all duration-500 font-mono text-sm">
             {['Node.js', 'PostgreSQL', 'Prisma ORM', 'React', 'TanStack Query', 'Zustand', 'Tailwind CSS'].map(tech => (
               <div key={tech} className="flex items-center gap-2 group cursor-default">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{tech}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="architecture" className="py-32 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-bold mb-6">Technical Specifications</h2>
            <p className="text-lg text-muted-foreground">
              Built to solve real-world payroll complexities through rigorous engineering decisions and robust state management.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Feature 
              icon={ShieldCheck}
              title="Payment-Gated FSM"
              description="A strict Finite State Machine governs the entire lifecycle. Payroll cannot be triggered until bank payments are reconciled, preventing cashflow mismatches."
            />
            <Feature 
              icon={Zap}
              title="HMRC RTI Engine"
              description="Full 2024/25 tax year calculation engine handling PAYE, National Insurance (EE & ER), pension auto-enrolment, and student loan deductions."
            />
            <Feature 
              icon={BarChart3}
              title="Immutable Audit Log"
              description="An append-only immutable audit trail records every state transition and manual override, ensuring 100% regulatory compliance and traceability."
            />
            <Feature 
              icon={Users2}
              title="Multi-Tenant RBAC"
              description="Row-scoped data access with role-based permissions across 6 distinct roles, ensuring strict data isolation between agencies, contractors, and operators."
            />
            <Feature 
              icon={Clock}
              title="Optimistic Locking"
              description="Implemented optimistic locking on timesheet records to prevent race conditions during concurrent approval workflows in high-volume environments."
            />
            <Feature 
              icon={Globe}
              title="Exception Handling"
              description="Automated system raises and blocks workflows on payment mismatches or invalid tax codes, requiring manual justification with a permanent record."
            />
          </div>
        </div>
      </section>

      {/* Engineering Philosophy Section */}
      <section className="py-32 px-4 bg-muted/20 border-y">
        <div className="container mx-auto">
           <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="text-3xl font-bold mb-6">Data Integrity First</h2>
                 <p className="text-muted-foreground leading-relaxed mb-6">
                    PayAxis isn't just a UI; it's a financial engine. By leveraging PostgreSQL's transactional guarantees and Prisma's type-safety, the platform ensures that every penny is accounted for.
                 </p>
                 <ul className="space-y-4">
                    {[
                      'Atomic database transactions for payroll runs',
                      'Automated payslip generation with itemised deductions',
                      'Strict reconciliation between bank feeds and timesheets',
                      'Real-time compliance validation for RTW docs'
                    ].map(item => (
                      <li key={item} className="flex items-center gap-3 text-sm font-medium">
                         <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                         {item}
                      </li>
                    ))}
                 </ul>
              </div>
              <div className="bg-card border rounded-2xl p-8 shadow-sm">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                       <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                       <h4 className="font-bold">Security & Isolation</h4>
                       <p className="text-xs text-muted-foreground">Tenant-level data scoping</p>
                    </div>
                 </div>
                 <div className="space-y-4 font-mono text-[11px] bg-muted/50 p-4 rounded-lg overflow-hidden">
                    <div className="text-primary opacity-80">// Middleware enforcement</div>
                    <div className="text-foreground">await prisma.timesheet.findMany(&#123;</div>
                    <div className="pl-4">where: &#123;</div>
                    <div className="pl-8 text-emerald-600">organisationId: currentUser.orgId,</div>
                    <div className="pl-8 text-emerald-600">role: &#123; in: ['APPROVER'] &#125;</div>
                    <div className="pl-4">&#125;</div>
                    <div className="text-foreground">&#125;);</div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="container mx-auto">
          <div className="bg-primary rounded-3xl p-12 md:p-20 text-center text-primary-foreground relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-48 -mb-48" />
            
            <h2 className="text-4xl md:text-6xl font-bold mb-8 relative z-10">Experience the Infrastructure</h2>
            <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">
              Explore the full MERN-stack implementation with multi-portal workflows and HMRC-compliant calculations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              <Link to="/register" className="w-full sm:w-auto bg-background text-foreground px-10 py-5 rounded-2xl text-lg font-bold hover:bg-background/90 transition-all shadow-xl">
                Open Dashboard
              </Link>
              <Link to="/login" className="text-lg font-semibold hover:underline underline-offset-4">
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">PayAxis</span>
            </div>
            <p>© 2026 PayAxis Portfolio Project. Built for demonstration purposes.</p>
            <div className="flex gap-8">
               <span className="font-mono text-xs">MERN + POSTGRESQL + PRISMA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

