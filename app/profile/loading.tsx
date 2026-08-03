export default function ProfileLoading() {
  return (
    <div className="flex-grow bg-[#07080A] min-h-[calc(100vh-3.5rem)] relative">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div className="h-8 bg-[#0D0E12] border border-[#1F261F] w-48 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[#0D0E12] border border-[#1F261F] rounded-xl p-6 animate-pulse">
            <div className="size-20 bg-[#161820] rounded-full mb-4"></div>
            <div className="h-4 bg-[#161820] w-2/3 rounded mb-2"></div>
            <div className="h-3 bg-[#161820] w-1/2 rounded"></div>
          </div>
          <div className="lg:col-span-2 bg-[#0D0E12] border border-[#1F261F] rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-[#161820] w-1/3 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-[#161820] w-full rounded-lg"></div>
              <div className="h-10 bg-[#161820] w-full rounded-lg"></div>
              <div className="h-10 bg-[#161820] w-full rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}