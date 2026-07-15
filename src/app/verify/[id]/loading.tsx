export default function VerifyLoading() {
  return (
    <div className="max-w-lg mx-auto space-y-5 animate-pulse">
      <div className="text-center space-y-3">
        <div className="h-3 w-32 mx-auto rounded bg-[#1E2028]" />
        <div className="h-8 w-48 mx-auto rounded bg-[#1E2028]" />
        <div className="h-3 w-64 mx-auto rounded bg-[#1E2028]" />
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="h-3 w-20 rounded bg-[#1E2028]" />
            <div className="h-3 w-full rounded bg-[#1E2028]" />
          </div>
          <div className="h-8 w-16 rounded bg-[#1E2028]" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="h-3 w-28 rounded bg-[#1E2028]" />
            <div className="h-3 w-full rounded bg-[#1E2028]" />
          </div>
          <div className="h-8 w-16 rounded bg-[#1E2028]" />
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-[#1E2028]" />
          <div className="h-6 w-20 rounded bg-[#1E2028]" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 rounded bg-[#1E2028]" />
              <div className="h-4 w-28 rounded bg-[#1E2028]" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded bg-[#1E2028]" />
            <div className="h-3 w-8 rounded bg-[#1E2028]" />
          </div>
          <div className="h-2 w-full rounded bg-[#1E2028]" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-[#1E2028]" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="h-4 w-32 rounded bg-[#1E2028]" />
              <div className="h-4 w-20 rounded bg-[#1E2028]" />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-[#1E2028]" />
          <div className="h-5 w-24 rounded bg-[#1E2028]" />
        </div>
        <div className="h-3 w-full rounded bg-[#1E2028]" />
        <div className="flex items-center gap-2">
          <div className="h-3 flex-1 rounded bg-[#1E2028]" />
          <div className="h-8 w-16 rounded bg-[#1E2028]" />
        </div>
      </div>
    </div>
  );
}
