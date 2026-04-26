import { Link } from 'react-router-dom'

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-semibold mb-2">Access denied</h1>
      <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
      <Link to="/login" className="text-primary underline text-sm">Back to login</Link>
    </div>
  </div>
)

export default Unauthorized


