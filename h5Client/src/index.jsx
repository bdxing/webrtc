import React from "react";
import { createRoot } from "react-dom/client";

// main 
import App from "./App";

// init
const root = createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);