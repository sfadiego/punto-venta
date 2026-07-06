import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

// After a new deploy, cached index.html may reference chunks that no longer exist.
// Vite fires this event when a dynamic import fails to load; reloading fetches the new HTML.
window.addEventListener("vite:preloadError", () => {
    window.location.reload();
});

const container = document.getElementById("root");
const options = {};
createRoot(container!, options).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
