export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {description && <p className="empty__description">{description}</p>}
      {action}
    </div>
  );
}
