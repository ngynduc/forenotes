import { Routes, Route } from "react-router";
import { LandingPage } from "@/pages/LandingPage";
import { DocsPage } from "@/pages/DocsPage";
import { DonatePage } from "@/pages/DonatePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/donate" element={<DonatePage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
