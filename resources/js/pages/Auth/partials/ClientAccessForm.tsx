import { ArrowRight } from "lucide-react";

interface ClientAccessFormProps {
    slug: string;
    setSlug: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const ClientAccessForm = ({ slug, setSlug, onSubmit }: ClientAccessFormProps) => (
    <div>
        <h2 className="text-xl font-bold text-stone-900 mb-1">Accede a tu negocio</h2>
        <p className="text-stone-500 text-sm mb-4">Ingresa el identificador de tu negocio</p>

        <form onSubmit={onSubmit} className="flex gap-2">
            <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="mi-negocio"
                className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
            <button
                type="submit"
                disabled={!slug.trim()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40
                    text-white rounded-xl transition-colors"
            >
                <ArrowRight size={18} />
            </button>
        </form>
    </div>
);
