import { Loader } from "lucide-react";

export const TakeOrderSkeleton = () => (
    <>
        {/* Desktop skeleton */}
        <div className="hidden lg:flex flex-col h-full overflow-hidden">
            <div className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-stone-100 animate-pulse" />
                <div className="h-4 w-40 rounded-lg bg-stone-100 animate-pulse" />
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 bg-stone-50 p-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-stone-200 animate-pulse" />
                    ))}
                </div>
                <div className="w-80 xl:w-96 flex-shrink-0 bg-white border-l border-stone-200 flex flex-col">
                    <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3">
                        <div className="h-4 w-28 rounded-lg bg-stone-100 animate-pulse" />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <Loader size={22} className="animate-spin text-stone-300" />
                    </div>
                </div>
            </div>
        </div>

        {/* Mobile skeleton */}
        <div className="lg:hidden fixed inset-0 z-10 flex flex-col bg-stone-50">
            <div className="bg-white border-b border-stone-200 px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
                <div className="w-7 h-7 rounded-lg bg-stone-100 animate-pulse" />
                <div className="h-4 w-32 rounded-lg bg-stone-100 animate-pulse" />
            </div>
            <div className="flex-1 p-4 grid grid-cols-2 gap-3 content-start">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl bg-stone-200 animate-pulse" />
                ))}
            </div>
            <div className="bg-white border-t border-stone-200 flex flex-shrink-0">
                <div className="flex-1 flex flex-col items-center py-3 gap-1">
                    <div className="w-5 h-5 rounded bg-stone-100 animate-pulse" />
                    <div className="w-14 h-3 rounded bg-stone-100 animate-pulse" />
                </div>
                <div className="flex-1 flex flex-col items-center py-3 gap-1">
                    <div className="w-5 h-5 rounded bg-stone-100 animate-pulse" />
                    <div className="w-10 h-3 rounded bg-stone-100 animate-pulse" />
                </div>
            </div>
        </div>
    </>
);
