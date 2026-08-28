import Modal from './Modal';
import StatusMessage from './StatusMessage';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = 'danger',
  pending,
  error,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={pending ? () => {} : onCancel}>
      <p className="confirm__message">{message}</p>
      <StatusMessage tone="error">{error}</StatusMessage>

      <div className="modal__actions">
        <button type="button" className="button button--quiet" onClick={onCancel} disabled={pending}>
          Annuler
        </button>
        <button
          type="button"
          className={`button${tone === 'danger' ? ' button--danger' : ''}`}
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? 'En cours…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
