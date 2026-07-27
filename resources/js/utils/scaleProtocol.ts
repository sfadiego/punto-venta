// Protocolo confirmado para la báscula Torrey L-PCR (ver bascula-test/README.md):
// request/response — se envía "P" y responde algo como "  1.872 kg\r".
// La respuesta puede llegar partida en varios chunks de lectura, así que el
// buffer acumulado puede traer espacios/orden distinto — se extrae el número
// con una regex tolerante en vez de asumir un formato fijo por posición.
export const parseScaleWeightKg = (raw: string): number | null => {
    const match = raw.match(/(-?\d+(?:\.\d+)?)\s*kg/i);
    if (!match) return null;

    const value = parseFloat(match[1]);
    return isNaN(value) ? null : value;
};
