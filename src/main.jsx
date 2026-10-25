import "@fontsource-variable/inter";
import React from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import "./index.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={250}>
      <App />
      <Toaster theme="light" position="bottom-right" closeButton />
    </TooltipProvider>
  </React.StrictMode>,
);
