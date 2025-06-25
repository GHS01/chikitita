import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// 🌐 Configurar i18n ANTES de renderizar la app
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);
