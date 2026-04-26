import { cn } from '@/lib/utils'

const LoadingSpinner = ({ className }) => (
  <div className={cn('flex items-center justify-center py-12', className)}>
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

export default LoadingSpinner