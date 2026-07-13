import { Search } from "lucide-react";
import { IMenuBusiness } from "@/models/IMenu";

interface MenuHeaderProps {
    business: IMenuBusiness;
    search: string;
    onSearch: (v: string) => void;
}

export const MenuHeader = ({ business, search, onSearch }: MenuHeaderProps) => (
    <header className="shrink-0 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-2 flex flex-col gap-2">
            <div className="flex items-center gap-3">
                {business.logo ? (
                    <img
                        src={`/api/files/${business.logo}`}
                        alt={business.business_name}
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                    />
                ) : (
                    <div
                        className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: business.primary_color }}
                    >
                        {business.business_name.charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="font-semibold text-stone-800 text-sm truncate flex-1">
                    {business.business_name}
                </span>
            </div>

            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Buscar producto…"
                    className="w-full pl-9 pr-3 py-2.5 text-base bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
            </div>
        </div>
    </header>
);
