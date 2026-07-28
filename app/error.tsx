"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <div className="rounded-lg bg-[#0f1011] p-8 text-center border border-[#23252a] max-w-md w-full">
        <h2 className="text-xl font-semibold text-[#f7f8f8] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#8a8f98] mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-[#5e6ad2] px-4 py-2 text-sm font-medium text-white hover:bg-[#828fff] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
