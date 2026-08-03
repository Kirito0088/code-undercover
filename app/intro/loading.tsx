export default function IntroLoading() {
  return (
    <div className="flex-grow bg-[#07080A] min-h-[calc(100vh-3.5rem)] relative">
      <div className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center gap-6">
        <div className="h-10 bg-[#0D0E12] border border-[#1F261F] w-64 rounded-md animate-pulse"></div>
        <div className="h-4 bg-[#0D0E12] border border-[#1F261F] w-96 rounded-md animate-pulse"></div>
        <div className="h-64 bg-[#0D0E12] border border-[#1F261F] w-full max-w-lg rounded-xl animate-pulse"></div>
      </div>
    </div>
  )
}