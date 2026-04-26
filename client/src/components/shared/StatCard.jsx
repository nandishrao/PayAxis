import { cn } from '@/lib/utils'

const StatCard = ({ label, value, sub, className }) => (
  <div className={cn(
    'bg-card border rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:border-primary/20',
    className
  )}>
    <div className="flex flex-col space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline space-x-2">
        <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
      </div>
      {sub && (
        <p className="text-xs text-muted-foreground flex items-center font-medium">
          {sub}
        </p>
      )}
    </div>
  </div>
)

export default StatCard