import { cn } from '@/lib/utils'

const colorMap = {
  success:   'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  warning:   'bg-amber-500/10   text-amber-700   border-amber-500/20',
  error:     'bg-rose-500/10    text-rose-700    border-rose-500/20',
  info:      'bg-sky-500/10     text-sky-700     border-sky-500/20',
  secondary: 'bg-slate-500/10   text-slate-700   border-slate-500/20',
}

const dotColorMap = {
  success:   'bg-emerald-500',
  warning:   'bg-amber-500',
  error:     'bg-rose-500',
  info:      'bg-sky-500',
  secondary: 'bg-slate-500',
}

const StatusBadge = ({ label, color = 'secondary', className }) => (
  <span className={cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
    colorMap[color],
    className,
  )}>
    <span className={cn('h-1.5 w-1.5 rounded-full', dotColorMap[color])} />
    {label}
  </span>
)

export default StatusBadge