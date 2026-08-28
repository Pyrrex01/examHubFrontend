export default function LoadingBlock({ label = 'Chargement en cours' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__mark" aria-hidden="true" />
      <span className="loading__label">{label}…</span>
    </div>
  );
}
