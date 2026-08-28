import { useState } from 'react';

import { students as studentsApi } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { useAction } from '../../hooks/useAction';
import { formatDate } from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function StudentsPage() {
  const [filter, setFilter] = useState('all');
  const { data, error, loading, reload } = useResource(
    ({ signal }) => studentsApi.list({ signal }),
    [],
  );

  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const action = useAction();

  const list = data ?? [];
  const visible = list.filter((student) => {
    if (filter === 'active') return student.isActive;
    if (filter === 'inactive') return !student.isActive;
    return true;
  });

  async function handleToggleActive() {
    const { student, action: kind } = confirming;

    const outcome = await action.run(() =>
      kind === 'deactivate'
        ? studentsApi.deactivate(student.id)
        : studentsApi.reactivate(student.id),
    );

    if (!outcome.ok) return;

    setConfirming(null);
    setFeedback(
      kind === 'deactivate'
        ? `${student.fullName} ne peut plus se connecter. Ses résultats restent consultables.`
        : `${student.fullName} peut à nouveau se connecter.`,
    );
    reload();
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Étudiants"
        description="Les comptes sont créés ici : il n’existe pas d’inscription libre. Un étudiant désactivé conserve ses résultats."
        actions={
          <button
            type="button"
            className="button"
            onClick={() => {
              action.clearError();
              setEditing({ mode: 'create', student: null });
            }}
          >
            Créer un compte
          </button>
        }
      />

      <StatusMessage tone="success" onDismiss={() => setFeedback(null)}>
        {feedback}
      </StatusMessage>

      {error && (
        <StatusMessage tone="error">
          {error.message}{' '}
          <button type="button" className="button button--link" onClick={reload}>
            Réessayer
          </button>
        </StatusMessage>
      )}

      <div className="filters" role="group" aria-label="Filtrer les étudiants">
        {[
          ['all', 'Tous'],
          ['active', 'Actifs'],
          ['inactive', 'Désactivés'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`filter${filter === value ? ' filter--on' : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="sheet">
        {loading ? (
          <LoadingBlock label="Chargement des étudiants" />
        ) : visible.length === 0 ? (
          <EmptyState
            title={list.length === 0 ? 'Aucun compte étudiant' : 'Aucun étudiant dans ce filtre'}
            description={
              list.length === 0
                ? 'Créez le premier compte pour que des étudiants puissent se connecter et composer.'
                : 'Changez de filtre pour voir les autres comptes.'
            }
            action={
              list.length === 0 ? (
                <button
                  type="button"
                  className="button"
                  onClick={() => setEditing({ mode: 'create', student: null })}
                >
                  Créer un compte
                </button>
              ) : null
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Étudiant</th>
                  <th scope="col">État</th>
                  <th scope="col">Compte créé le</th>
                  <th scope="col" className="is-numeric">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((student) => (
                  <tr key={student.id} className={student.isActive ? undefined : 'row--muted'}>
                    <td>
                      <span className="table__main">{student.fullName}</span>
                      <span className="table__sub">{student.email}</span>
                    </td>
                    <td>
                      {student.isActive ? (
                        <Badge tone="open">Actif</Badge>
                      ) : (
                        <Badge tone="danger">Désactivé</Badge>
                      )}
                    </td>
                    <td>{formatDate(student.createdAt)}</td>
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="button button--quiet button--small"
                          onClick={() => {
                            action.clearError();
                            setEditing({ mode: 'edit', student });
                          }}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="button button--quiet button--small"
                          onClick={() => {
                            action.clearError();
                            setResetting(student);
                          }}
                        >
                          Réinitialiser le mot de passe
                        </button>
                        <button
                          type="button"
                          className={`button button--small${
                            student.isActive ? ' button--danger' : ' button--quiet'
                          }`}
                          onClick={() => {
                            action.clearError();
                            setConfirming({
                              student,
                              action: student.isActive ? 'deactivate' : 'reactivate',
                            });
                          }}
                        >
                          {student.isActive ? 'Désactiver' : 'Réactiver'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <StudentForm
          mode={editing.mode}
          student={editing.student}
          action={action}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setFeedback(message);
            reload();
          }}
        />
      )}

      {resetting && (
        <PasswordResetForm
          student={resetting}
          action={action}
          onClose={() => setResetting(null)}
          onSaved={(message) => {
            setResetting(null);
            setFeedback(message);
          }}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title={
            confirming.action === 'deactivate' ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'
          }
          message={
            confirming.action === 'deactivate'
              ? `${confirming.student.fullName} ne pourra plus se connecter. Le compte n’est pas supprimé : ses tentatives et ses notes restent consultables.`
              : `${confirming.student.fullName} pourra de nouveau se connecter avec son mot de passe actuel.`
          }
          confirmLabel={confirming.action === 'deactivate' ? 'Désactiver' : 'Réactiver'}
          tone={confirming.action === 'deactivate' ? 'danger' : 'neutral'}
          pending={action.pending}
          error={action.error?.message}
          onConfirm={handleToggleActive}
          onCancel={() => setConfirming(null)}
        />
      )}
    </>
  );
}

function StudentForm({ mode, student, action, onClose, onSaved }) {
  const isCreate = mode === 'create';

  const [fullName, setFullName] = useState(student?.fullName ?? '');
  const [email, setEmail] = useState(student?.email ?? '');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (action.pending) return;

    if (isCreate) {
      const outcome = await action.run(() => studentsApi.create({ fullName, email, password }));
      if (outcome.ok) onSaved(`Compte créé pour ${outcome.result.fullName}.`);
      return;
    }

    const changes = {};
    if (fullName !== student.fullName) changes.fullName = fullName;
    if (email !== student.email) changes.email = email;

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    const outcome = await action.run(() => studentsApi.update(student.id, changes));
    if (outcome.ok) onSaved(`Compte de ${outcome.result.fullName} mis à jour.`);
  }

  return (
    <Modal
      title={isCreate ? 'Créer un compte étudiant' : 'Modifier le compte'}
      description={isCreate ? 'L’étudiant se connectera avec cette adresse.' : student.email}
      onClose={action.pending ? () => {} : onClose}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="fullName">Nom complet</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="email">Adresse email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        {isCreate && (
          <div className="field">
            <label htmlFor="password">Mot de passe initial</label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <span className="field__hint">
              Au moins 8 caractères. Il est affiché en clair pour que vous puissiez le
              transmettre à l’étudiant ; il ne sera plus jamais lisible ensuite.
            </span>
          </div>
        )}

        <StatusMessage tone="error">{action.error?.message}</StatusMessage>

        <div className="modal__actions">
          <button
            type="button"
            className="button button--quiet"
            onClick={onClose}
            disabled={action.pending}
          >
            Annuler
          </button>
          <button type="submit" className="button" disabled={action.pending}>
            {action.pending ? 'Enregistrement…' : isCreate ? 'Créer le compte' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordResetForm({ student, action, onClose, onSaved }) {
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (action.pending) return;

    const outcome = await action.run(() => studentsApi.resetPassword(student.id, password));
    if (outcome.ok) {
      onSaved(`Mot de passe de ${student.fullName} réinitialisé. Communiquez-le-lui.`);
    }
  }

  return (
    <Modal
      title="Réinitialiser le mot de passe"
      description={`${student.fullName} — ${student.email}`}
      onClose={action.pending ? () => {} : onClose}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="newPassword">Nouveau mot de passe</label>
          <input
            id="newPassword"
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <span className="field__hint">
            Au moins 8 caractères. L’ancien mot de passe cessera immédiatement de fonctionner.
          </span>
        </div>

        <StatusMessage tone="error">{action.error?.message}</StatusMessage>

        <div className="modal__actions">
          <button
            type="button"
            className="button button--quiet"
            onClick={onClose}
            disabled={action.pending}
          >
            Annuler
          </button>
          <button type="submit" className="button" disabled={action.pending}>
            {action.pending ? 'Enregistrement…' : 'Réinitialiser'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
