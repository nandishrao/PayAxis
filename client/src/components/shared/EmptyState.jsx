const EmptyState = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <p className="text-sm font-medium text-foreground mb-1">{title}</p>
    {description && <p className="text-xs text-muted-foreground mb-4">{description}</p>}
    {action}
  </div>
)

export default EmptyState