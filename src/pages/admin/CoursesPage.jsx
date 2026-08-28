import { useState } from 'react';
import { Link } from 'react-router-dom';

import { courses as coursesApi } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { useAction } from '../../hooks/useAction';
import { plural } from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function CoursesPage() {
  const { data, error, loading, reload } = useResource(
    ({ signal }) => coursesApi.list({ signal }),
    [],
  );

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const action = useAction();

  const list = data ?? [];

  async function handleDelete() {
    const outcome = await action.run(() => coursesApi.remove(deleting.id));
    if (!outcome.ok) return;

    setDeleting(null);
    setFeedback(`Cours « ${deleting.code} » supprimé.`);
    reload();
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Cours"
        description="Chaque examen appartient à un cours. Le code sert d’identifiant dans l’école et doit être unique."
        actions={
          <button
            type="button"
            className="button"
            onClick={() => {
              action.clearError();
              setEditing({ mode: 'create', course: null });
            }}
          >
            Créer un cours
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

      <div className="sheet">
        {loading ? (
          <LoadingBlock label="Chargement des cours" />
        ) : list.length === 0 ? (
          <EmptyState
            title="Aucun cours"
            description="Créez un cours avant de préparer des examens : un examen ne peut pas exister sans cours."
            action={
              <button
                type="button"
                className="button"
                onClick={() => setEditing({ mode: 'create', course: null })}
              >
                Créer un cours
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Intitulé</th>
                  <th scope="col" className="is-numeric">
                    Examens
                  </th>
                  <th scope="col" className="is-numeric">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((course) => {
                  const locked = course.examCount > 0;

                  return (
                    <tr key={course.id}>
                      <td>
                        <span className="table__main numeric">{course.code}</span>
                      </td>
                      <td>
                        <span className="table__main">{course.name}</span>
                        {course.description && (
                          <span className="table__sub">{course.description}</span>
                        )}
                      </td>
                      <td className="is-numeric">
                        {locked ? (
                          <Link className="button button--link" to={`/admin/exams?courseId=${course.id}`}>
                            {course.examCount}
                          </Link>
                        ) : (
                          <span className="table__sub">0</span>
                        )}
                      </td>
                      <td>
                        <div className="table__actions">
                          <button
                            type="button"
                            className="button button--quiet button--small"
                            onClick={() => {
                              action.clearError();
                              setEditing({ mode: 'edit', course });
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="button button--danger button--small"
                            disabled={locked}
                            title={
                              locked
                                ? `Impossible : ${plural(course.examCount, 'examen', 'examens')} y sont rattachés.`
                                : undefined
                            }
                            onClick={() => {
                              action.clearError();
                              setDeleting(course);
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <CourseForm
          mode={editing.mode}
          course={editing.course}
          action={action}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setFeedback(message);
            reload();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer ce cours ?"
          message={`Le cours « ${deleting.code} — ${deleting.name} » sera définitivement supprimé. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          pending={action.pending}
          error={action.error?.message}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}

function CourseForm({ mode, course, action, onClose, onSaved }) {
  const isCreate = mode === 'create';

  const [code, setCode] = useState(course?.code ?? '');
  const [name, setName] = useState(course?.name ?? '');
  const [description, setDescription] = useState(course?.description ?? '');

  async function handleSubmit(event) {
    event.preventDefault();
    if (action.pending) return;

    if (isCreate) {
      const outcome = await action.run(() => coursesApi.create({ code, name, description }));
      if (outcome.ok) onSaved(`Cours « ${outcome.result.code} » créé.`);
      return;
    }

    const changes = {};
    if (code !== course.code) changes.code = code;
    if (name !== course.name) changes.name = name;
    if (description !== course.description) changes.description = description;

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    const outcome = await action.run(() => coursesApi.update(course.id, changes));
    if (outcome.ok) onSaved(`Cours « ${outcome.result.code} » mis à jour.`);
  }

  return (
    <Modal
      title={isCreate ? 'Créer un cours' : 'Modifier le cours'}
      onClose={action.pending ? () => {} : onClose}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="code">Code</label>
          <input
            id="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
          <span className="field__hint">
            De 2 à 20 caractères : lettres, chiffres, tirets ou soulignés. Exemple : PROG2.
          </span>
        </div>

        <div className="field">
          <label htmlFor="name">Intitulé</label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <span className="field__hint">Facultative.</span>
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
            {action.pending ? 'Enregistrement…' : isCreate ? 'Créer le cours' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
