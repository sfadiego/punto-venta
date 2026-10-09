// Pruebas del análisis de la cola de CUPS. Se ejecutan con: node --test
const test   = require("node:test");
const assert = require("node:assert");
const { parseQueueStatus, parseJobId, disabledMessage, printViaCups, deps } = require("./queue");

test("cola inactiva y habilitada", () => {
    const status = parseQueueStatus("printer POS58 is idle.  enabled since Thu Oct  8 19:02:55 2026\n");
    assert.deepStrictEqual(status, { enabled: true, reason: null });
});

test("cola imprimiendo se considera habilitada", () => {
    const status = parseQueueStatus("printer POS58 now printing POS58-12.  enabled since Thu Oct  8 19:02:55 2026\n");
    assert.strictEqual(status.enabled, true);
});

test("cola deshabilitada con el motivo en la línea siguiente (salida real de macOS)", () => {
    const stdout = "printer IMPRESORA_chucherias disabled since Thu Oct  8 19:13:17 2026 -\n\tUnable to send data to printer.\n";
    assert.deepStrictEqual(parseQueueStatus(stdout), { enabled: false, reason: "Unable to send data to printer" });
});

test("cola deshabilitada con el motivo en la misma línea", () => {
    const stdout = "printer POS58 disabled since Thu Oct  8 19:13:17 2026 - Paused\n";
    assert.deepStrictEqual(parseQueueStatus(stdout), { enabled: false, reason: "Paused" });
});

test("cola deshabilitada sin motivo", () => {
    const stdout = "printer POS58 disabled since Thu Oct  8 19:13:17 2026 -\n";
    assert.deepStrictEqual(parseQueueStatus(stdout), { enabled: false, reason: null });
});

test("identificador del trabajo que devuelve lp", () => {
    assert.strictEqual(parseJobId("request id is IMPRESORA_chucherias-533 (1 file(s))\n"), "IMPRESORA_chucherias-533");
    assert.strictEqual(parseJobId(""), null);
});

test("mensaje para el usuario es claro y sin jerga técnica", () => {
    const message = disabledMessage();
    assert.match(message, /no responde/);
    assert.doesNotMatch(message, /cupsenable|config\.json|Unable to send|POS58/);
});

// ─── printViaCups con CUPS simulado ───────────────────────────────────────────

const ENABLED  = "printer POS58 is idle.  enabled since Thu Oct  8 19:02:55 2026\n";
const DISABLED = "printer POS58 disabled since Thu Oct  8 19:13:17 2026 -\n\tUnable to send data to printer.\n";

// Simula los comandos: `states` es la secuencia de respuestas de `lpstat -p` y `jobs` la de `lpstat -o`.
function fakeCups({ states, jobs = [], lpError = null }) {
    const calls = [];
    deps.execFile = (cmd, args, cb) => {
        calls.push(`${cmd.split("/").pop()} ${args.join(" ")}`);
        const name = cmd.split("/").pop();
        if (name === "lpstat" && args[0] === "-p") return cb(null, states.length > 1 ? states.shift() : states[0], "");
        if (name === "lpstat" && args[0] === "-o") return cb(null, jobs.length > 1 ? jobs.shift() : (jobs[0] ?? ""), "");
        if (name === "lp") return lpError ? cb(new Error("lp falló"), "", lpError) : cb(null, "request id is POS58-7 (1 file(s))\n", "");
        if (name === "cancel") return cb(null, "", "");
        cb(new Error(`comando inesperado ${name}`), "", "");
    };
    return calls;
}

const run = (printer = "POS58") => new Promise((resolve) => printViaCups(printer, "/tmp/x.bin", (err) => resolve(err)));

test("cola deshabilitada antes de enviar: error y no se manda ningún trabajo", async () => {
    const calls = fakeCups({ states: [DISABLED] });
    const err = await run();
    assert.match(err.message, /no responde/);
    assert.match(err.detail, /deshabilitada \(Unable to send data to printer\)/);
    assert.match(err.detail, /cupsenable POS58/);
    assert.ok(!calls.some((c) => c.startsWith("lp ")), "no debe ejecutar lp");
});

test("cola inexistente: error claro", async () => {
    deps.execFile = (cmd, args, cb) => cb(new Error("x"), "", 'lpstat: Invalid destination name in list "POS58".');
    const err = await run();
    assert.match(err.message, /No se encontró la impresora/);
    assert.doesNotMatch(err.message, /config\.json/);
    assert.match(err.detail, /no existe en este equipo/);
});

test("la cola se deshabilita después de enviar: cancela el trabajo y avisa", async () => {
    const calls = fakeCups({ states: [ENABLED, DISABLED], jobs: ["POS58-7 diego 1024 fecha\n"] });
    const err = await run();
    assert.match(err.message, /no responde/);
    assert.ok(calls.includes("cancel POS58-7"), "debe cancelar el trabajo para que no salga de golpe al reactivar");
});

test("el trabajo sale de la cola: se considera impreso", async () => {
    fakeCups({ states: [ENABLED], jobs: ["POS58-7 diego 1024 fecha\n", ""] });
    assert.strictEqual(await run(), null);
});

test("el trabajo sigue en curso al vencer el plazo con la cola habilitada: se da por bueno", async () => {
    fakeCups({ states: [ENABLED], jobs: ["POS58-7 diego 1024 fecha\n"] });
    const original = Date.now;
    const start = original();
    let step = 0;
    Date.now = () => start + (step++ === 0 ? 0 : 10_000); // tras el primer sondeo ya pasó el plazo
    try {
        assert.strictEqual(await run(), null);
    } finally {
        Date.now = original;
    }
});

test("lp falla: mensaje claro al usuario y el error de lp solo como detalle", async () => {
    fakeCups({ states: [ENABLED], lpError: "lp: Error - no default destination available." });
    const err = await run();
    assert.match(err.message, /No se pudo enviar el ticket/);
    assert.doesNotMatch(err.message, /lp:|destination/);
    assert.match(err.detail, /no default destination/);
});
