import { useEffect, useState } from "react";

export default function Speakers() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/speakers")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  return (
    <>
      <h2>Speakers</h2>
      <ul>
        {items.map((s) => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
    </>
  );
}