import { BarChart2, Award } from "lucide-react";
import { IBestSellerItem } from "@/services/useStatisticsService";
import { BestSellerChart, BestSellerRanking } from "./BestSellerChart";

interface BestSellerSectionProps {
    data: IBestSellerItem[];
}

export const BestSellerSection = ({ data }: BestSellerSectionProps) => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
                <BarChart2 size={20} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-stone-800">
                    Productos más vendidos
                </h2>
            </div>
            <BestSellerChart data={data} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
                <Award size={20} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-stone-800">Ranking</h2>
            </div>
            <BestSellerRanking data={data} />
        </div>
    </div>
);
