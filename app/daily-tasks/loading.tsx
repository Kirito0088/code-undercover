export default function DailyTasksLoading() {
  return (
    <div className="flex-grow bg-[#07080A] min-h-[calc(100vh-3.5rem)] relative">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div className="h-8 bg-[#0D0E12] border border-[#1F261F] w-48 rounded-md animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0D0E12] border border-[#1F261F] h-32 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  )
}