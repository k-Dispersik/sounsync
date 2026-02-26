import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

const container = document.getElementById("root");

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    <Route path="/*" element={<HomePage />} />
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );
}
