export default function MissionLoading() {
  return (
    <div className="flex-grow bg-[#07080A] min-h-[calc(100vh-3.5rem)] relative">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div className="h-8 bg-[#0D0E12] border border-[#1F261F] w-64 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0D0E12] border border-[#1F261F] rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-[#161820] w-3/4 rounded mb-4"></div>
            <div className="h-3 bg-[#161820] w-1/2 rounded mb-6"></div>
            <div className="h-40 bg-[#161820] rounded-lg"></div>
          </div>
          <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-[#161820] w-1/2 rounded mb-4"></div>
            <div className="h-3 bg-[#161820] w-3/4 rounded mb-3"></div>
            <div className="h-3 bg-[#161820] w-1/2 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}