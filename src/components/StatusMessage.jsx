export default function StatusMessage({ tone = 'error', children, onDismiss }) {
  if (!children) return null;

  return (
    <p className={`status status--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onDismiss && (
        <button type="button" className="status__close" onClick={onDismiss} aria-label="Masquer">
          ×
        </button>
      )}
    </p>
  );
}
