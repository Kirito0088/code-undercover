export default function AuthLoading() {
  return (
    <div className="flex-grow bg-[#07080A] min-h-[calc(100vh-3.5rem)] relative flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5e6ad2] border-t-transparent"></div>
        <p className="text-sm text-[#8a8f98]">Loading...</p>
      </div>
    </div>
  )
}