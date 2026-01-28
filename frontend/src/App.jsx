import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Participants from "./pages/Participants";
import Speakers from "./pages/Speakers";
import Events from "./pages/Events";
import Prospects from "./pages/Prospects";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 16 }}>
        <h1>Kadmin</h1>

        <nav style={{ marginBottom: 16 }}>
          <Link to="/participants">Participants</Link>{" | "}
          <Link to="/speakers">Speakers</Link>{" | "}
          <Link to="/events">Events</Link>{" | "}
          <Link to="/prospects">Prospects</Link>
        </nav>

        <Routes>
          <Route path="/participants" element={<Participants />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/events" element={<Events />} />
          <Route path="/" element={<p>Select a list.</p>} />
          <Route path="/prospects" element={<Prospects />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}