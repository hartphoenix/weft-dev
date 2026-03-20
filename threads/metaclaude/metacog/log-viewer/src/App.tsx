import { useState, useEffect } from "react";
import { SessionList } from "./pages/SessionList";
import { ConversationView } from "./pages/ConversationView";

function useHashRoute(): [string, (hash: string) => void] {
  const [hash, setHash] = useState(window.location.hash || "#/");

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (newHash: string) => {
    window.location.hash = newHash;
  };

  return [hash, navigate];
}

export function App() {
  const [hash, navigate] = useHashRoute();

  // Parse route
  const sessionMatch = hash.match(/^#\/session\/(.+)$/);

  if (sessionMatch) {
    return (
      <div className="app">
        <div className="header">
          <span className="back-link" onClick={() => navigate("#/")}>
            ← sessions
          </span>
          <h1>Session</h1>
        </div>
        <ConversationView sessionId={sessionMatch[1]} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Weft — Session Log Viewer</h1>
      </div>
      <SessionList onSelectSession={(id) => navigate(`#/session/${id}`)} />
    </div>
  );
}
