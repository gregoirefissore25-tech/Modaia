import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Explore from "./pages/Explore";
import Saved from "./pages/Saved";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import TabBar from "./components/TabBar";
import ConsentBanner from "./components/ConsentBanner";

export default function App() {
  const loc = useLocation();
  const onboarded = localStorage.getItem("modaia_onboarded") === "1";
  const showTabs = !["/onboarding", "/admin"].includes(loc.pathname);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      <Routes>
        <Route path="/" element={onboarded ? <Navigate to="/explore" /> : <Navigate to="/onboarding" />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/confidentialite" element={<Privacy />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      {showTabs && <TabBar />}
      <ConsentBanner />
    </div>
  );
}
