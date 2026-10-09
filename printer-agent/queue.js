// Impresión por CUPS (macOS / Linux) con verificación del estado de la cola.
//
// `lp` responde "OK" en cuanto el trabajo ENTRA a la cola — no cuando se imprime. Si después CUPS no puede
// enviar los datos a la impresora (apagada, sin papel, USB), deshabilita la cola y el trabajo queda
// esperando, pero el agente ya había contestado que todo salió bien. Aquí se revisa la cola antes de enviar
// (para no acumular trabajos en una cola parada) y unos segundos después (para detectar el fallo asíncrono).

const childProcess = require("child_process");

// Las pruebas sustituyen `deps.execFile` para simular los comandos de CUPS sin tocar la impresora.
const deps = { execFile: (...args) => childProcess.execFile(...args) };

const LP       = "/usr/bin/lp";
const LPSTAT   = "/usr/bin/lpstat";
const CANCEL   = "/usr/bin/cancel";

// Tiempo que se vigila la cola tras enviar, y cada cuánto se revisa. CUPS marca el fallo de envío en
// 1-2 segundos; pasado el plazo con la cola habilitada se da por buena (el trabajo sigue imprimiéndose).
const VERIFY_TIMEOUT_MS = 4000;
const VERIFY_POLL_MS    = 400;

/**
 * Interpreta la salida de `lpstat -p <cola>`:
 *   "printer X is idle.  enabled since ..."                       → habilitada
 *   "printer X now printing X-12.  enabled since ..."              → habilitada
 *   "printer X disabled since ... -\n\tUnable to send data ..."    → deshabilitada, con su motivo
 */
function parseQueueStatus(stdout) {
    const text = String(stdout || "").trim();
    if (!/\bdisabled\b/.test(text)) {
        return { enabled: true, reason: null };
    }

    const lines  = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const inline = lines[0].match(/disabled since .*? - (.+)$/);
    const reason = inline ? inline[1] : (lines[1] || null);

    return { enabled: false, reason: reason ? reason.replace(/\.$/, "") : null };
}

const MSG_NOT_FOUND = "No se encontró la impresora. Verifica que esté conectada y encendida; si el problema continúa, contacta a soporte.";
const MSG_DISABLED  = "La impresora no responde. Revisa que esté encendida, con papel y bien conectada, e inténtalo de nuevo.";
const MSG_SEND_FAIL = "No se pudo enviar el ticket a la impresora. Revisa que esté encendida y conectada.";

/** Error con mensaje para el usuario; `detail` conserva el motivo técnico (solo para la consola del agente). */
function userError(message, detail) {
    const err = new Error(message);
    err.detail = detail;
    return err;
}

/** Mensaje para el usuario cuando la cola está deshabilitada (el motivo técnico va en `detail`, no aquí). */
function disabledMessage() {
    return MSG_DISABLED;
}

/** Estado de la cola: { exists, enabled, reason }. `exists` es falso si el sistema no conoce esa impresora. */
function checkQueue(printer, callback) {
    deps.execFile(LPSTAT, ["-p", printer], (err, stdout, stderr) => {
        if (err) {
            // lpstat falla con "Invalid destination name" cuando la cola no existe.
            return callback(null, { exists: false, enabled: false, reason: String(stderr || err.message).trim() });
        }
        callback(null, { exists: true, ...parseQueueStatus(stdout) });
    });
}

/** ¿Sigue el trabajo en la cola de esa impresora? */
function jobPending(printer, jobId, callback) {
    deps.execFile(LPSTAT, ["-o", printer], (err, stdout) => {
        if (err) return callback(false);
        callback(String(stdout).split("\n").some((line) => line.startsWith(`${jobId} `)));
    });
}

function cancelJob(jobId, callback) {
    deps.execFile(CANCEL, [jobId], () => callback());
}

/** "request id is IMPRESORA_chucherias-533 (1 file(s))" → "IMPRESORA_chucherias-533" */
function parseJobId(stdout) {
    const match = String(stdout || "").match(/request id is (\S+)/);
    return match ? match[1] : null;
}

// Vigila el trabajo recién enviado: si la cola se deshabilita lo cancela y avisa; si sale de la cola, se
// envió; si pasa el plazo con la cola habilitada, se da por buena.
function verifyJob(printer, jobId, deadline, callback) {
    checkQueue(printer, (_, status) => {
        if (status.exists && !status.enabled) {
            // El trabajo no se va a imprimir: se quita para que no salga de golpe al reactivar la cola.
            return cancelJob(jobId, () => callback(userError(MSG_DISABLED, `La impresora "${printer}" se deshabilitó después de enviar el trabajo${status.reason ? ` (${status.reason})` : ""}. Reactívala con: cupsenable ${printer}`)));
        }

        jobPending(printer, jobId, (pending) => {
            if (!pending || Date.now() >= deadline) return callback(null);
            setTimeout(() => verifyJob(printer, jobId, deadline, callback), VERIFY_POLL_MS);
        });
    });
}

/**
 * Envía el archivo a la cola `printer` en modo raw y confirma que la cola lo está aceptando.
 * callback(err): err describe por qué no se va a imprimir (cola inexistente o deshabilitada, o `lp` falló).
 */
function printViaCups(printer, file, callback) {
    checkQueue(printer, (_, status) => {
        if (!status.exists) {
            return callback(userError(MSG_NOT_FOUND, `La impresora "${printer}" no existe en este equipo. Revisa el nombre en config.json.`));
        }
        if (!status.enabled) {
            // No se manda: acumularía trabajos en una cola parada que saldrían todos juntos al reactivarla.
            return callback(userError(MSG_DISABLED, `La impresora "${printer}" está deshabilitada${status.reason ? ` (${status.reason})` : ""}. Reactívala con: cupsenable ${printer}`));
        }

        deps.execFile(LP, ["-d", printer, "-o", "raw", file], (err, stdout, stderr) => {
            if (err) return callback(userError(MSG_SEND_FAIL, String(stderr || err.message).trim()));

            const jobId = parseJobId(stdout);
            if (!jobId) return callback(null);

            verifyJob(printer, jobId, Date.now() + VERIFY_TIMEOUT_MS, callback);
        });
    });
}

module.exports = { printViaCups, parseQueueStatus, parseJobId, disabledMessage, userError, checkQueue, deps, VERIFY_TIMEOUT_MS };
