// ESC p 0 60 120: pulso de 120 ms encendido / 240 ms apagado en el pin 2 del cajón. Son los mismos bytes
// que genera Printer::pulse() en el backend (PrintTest los verifica) — se envían directo al agente
// local o a la impresora Bluetooth, sin pasar por la API.
export const CASH_DRAWER_PULSE = new Uint8Array([0x1b, 0x70, 0x30, 0x3c, 0x78]);
