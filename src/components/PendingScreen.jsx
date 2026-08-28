import { useLocation } from 'react-router-dom';

export default function PendingScreen({ title, description, phase }) {
  const location = useLocation();

  return (
    <section className="pending sheet">
      <p className="eyebrow">Phase {phase}</p>
      <h1 className="pending__title display">{title}</h1>
      <p className="pending__text">{description}</p>
      <code className="pending__route">{location.pathname}</code>
    </section>
  );
}
