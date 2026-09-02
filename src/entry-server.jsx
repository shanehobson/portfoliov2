import { renderToString } from "react-dom/server";
import App from "./App.jsx";

// Called once at build time by scripts/prerender.mjs; the result goes into
// dist/index.html and src/main.jsx hydrates it. No StrictMode here — it is a
// dev-only wrapper and does nothing on the server.
export const render = () => renderToString(<App />);
