const ErrorMessage = ({ error }) => {
  const message = error?.response?.data?.message || error?.message || 'Something went wrong.'
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  )
}

export default ErrorMessage