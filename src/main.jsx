import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'

const container = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// The production index.html is prerendered (scripts/prerender.mjs), so the
// root already holds the page and only needs hydrating. In `vite dev` it is
// the empty div from the source index.html, and hydrating that would only
// produce a mismatch warning and a re-render.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
