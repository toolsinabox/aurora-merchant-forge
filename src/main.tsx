import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Expose Supabase URL globally for the B@SE template engine's storage URL resolution
(window as any).__VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

createRoot(document.getElementById("root")!).render(<App />);
