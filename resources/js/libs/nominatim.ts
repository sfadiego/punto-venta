const BASE_URL = "https://nominatim.openstreetmap.org/search";

export interface INominatimResult {
    place_id: number;
    display_name: string;
    address: {
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

export const searchAddress = async (
    query: string,
    signal?: AbortSignal,
    limit = 5,
): Promise<INominatimResult[]> => {
    const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: String(limit),
    });

    const res = await fetch(`${BASE_URL}?${params}`, {
        signal,
        headers: { "Accept-Language": "es" },
    });

    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

    return res.json();
};
