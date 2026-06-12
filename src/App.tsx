import { BrowserRouter, Routes, Route } from "react-router-dom";
import CitizenView from "./pages/CitizenView";
import AdminView from "./pages/AdminView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CitizenView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </BrowserRouter>
  );
}
