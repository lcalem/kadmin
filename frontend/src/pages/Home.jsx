import { Link } from "react-router-dom";

const bubbles = [
  {
    title: "Participants",
    to: "/participants",
    image: "/images/participants.jpeg",
  },
  {
    title: "Descentes",
    to: "/events",
    image: "/images/descentes.jpg",
  },
  {
    title: "Speakers",
    to: "/speakers",
    image: "/images/speakers.jpeg",
  },
  {
    title: "Prospects",
    to: "/prospects",
    image: "/images/prospects.png",
  },
];

export default function Home() {
  return (
    <div className="home">
      <div className="bubble-grid">
        {bubbles.map((b) => (
          <Link key={b.title} to={b.to} className="nav-bubble">
            <div
              className="bubble-image"
              style={{ backgroundImage: `url(${b.image})` }}
            />
            <div className="bubble-title">{b.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}