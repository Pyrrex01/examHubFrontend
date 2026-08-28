import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { courses as coursesApi, exams as examsApi } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { useAction } from '../../hooks/useAction';
import {
  EXAM_STATUS,
  formatWindow,
  fromLocalInputValue,
  plural,
  toLocalInputValue,
} from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ExamsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const courseFilter = searchParams.get('courseId') ?? '';

  const examsQuery = useResource(
    ({ signal }) =>
      examsApi.list({ signal }).then((all) =>
        courseFilter ? all.filter((exam) => String(exam.courseId) === courseFilter) : all,
      ),
    [courseFilter],
  );

  const coursesQuery = useResource(({ signal }) => coursesApi.list({ signal }), []);

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const action = useAction();

  const list = examsQuery.data ?? [];
  const courseList = coursesQuery.data ?? [];

  async function handleDelete() {
    const outcome = await action.run(() => examsApi.remove(deleting.id));
    if (!outcome.ok) return;

    setDeleting(null);
    setFeedback(`Examen « ${deleting.title} » supprimé.`);
    examsQuery.reload();
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Examens"
        description="Un examen n’est visible par les étudiants que pendant sa période de disponibilité, et seulement s’il comporte au moins une question."
        actions={
          <button
            type="button"
            className="button"
            disabled={courseList.length === 0}
            title={courseList.length === 0 ? 'Créez d’abord un cours.' : undefined}
            onClick={() => {
              action.clearError();
              setEditing({ mode: 'create', exam: null });
            }}
          >
            Créer un examen
          </button>
        }
      />

      <StatusMessage tone="success" onDismiss={() => setFeedback(null)}>
        {feedback}
      </StatusMessage>

      {examsQuery.error && (
        <StatusMessage tone="error">
          {examsQuery.error.message}{' '}
          <button type="button" className="button button--link" onClick={examsQuery.reload}>
            Réessayer
          </button>
        </StatusMessage>
      )}

      {!coursesQuery.loading && courseList.length === 0 && (
        <StatusMessage tone="warning">
          Aucun cours n’existe encore. Un examen doit être rattaché à un cours :{' '}
          <Link to="/admin/courses">créez-en un d’abord</Link>.
        </StatusMessage>
      )}

      {courseList.length > 0 && (
        <div className="filters">
          <label className="filters__label" htmlFor="courseFilter">
            Cours
          </label>
          <select
            id="courseFilter"
            className="filters__select"
            value={courseFilter}
            onChange={(event) => {
              const value = event.target.value;
              setSearchParams(value ? { courseId: value } : {});
            }}
          >
            <option value="">Tous les cours</option>
            {courseList.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="sheet">
        {examsQuery.loading ? (
          <LoadingBlock label="Chargement des examens" />
        ) : list.length === 0 ? (
          <EmptyState
            title={courseFilter ? 'Aucun examen pour ce cours' : 'Aucun examen'}
            description="Créez un examen, puis ajoutez-lui des questions pour qu’il devienne accessible aux étudiants."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Examen</th>
                  <th scope="col">Disponibilité</th>
                  <th scope="col">État</th>
                  <th scope="col" className="is-numeric">
                    Questions
                  </th>
                  <th scope="col" className="is-numeric">
                    Barème
                  </th>
                  <th scope="col" className="is-numeric">
                    Copies
                  </th>
                  <th scope="col" className="is-numeric">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((exam) => {
                  const status = EXAM_STATUS[exam.status] ?? EXAM_STATUS.UPCOMING;
                  const started = exam.attemptCount > 0;

                  return (
                    <tr key={exam.id}>
                      <td>
                        <span className="table__main">{exam.title}</span>
                        <span className="table__sub">
                          {exam.courseCode} — {exam.courseName}
                        </span>
                      </td>
                      <td>
                        <span className="table__sub" style={{ fontSize: 'var(--step--1)' }}>
                          {formatWindow(exam.availableFrom, exam.availableTo)}
                        </span>
                      </td>
                      <td>
                        <Badge tone={status.tone}>{status.label}</Badge>
                        {started && (
                          <>
                            {' '}
                            <Badge tone="locked">Verrouillé</Badge>
                          </>
                        )}
                      </td>
                      <td className="is-numeric">{exam.questionCount}</td>
                      <td className="is-numeric">{exam.totalPoints}</td>
                      <td className="is-numeric">{exam.attemptCount}</td>
                      <td>
                        <div className="table__actions">
                          <Link
                            className="button button--quiet button--small"
                            to={`/admin/exams/${exam.id}/questions`}
                          >
                            Questions
                          </Link>
                          <Link
                            className="button button--quiet button--small"
                            to={`/admin/exams/${exam.id}/results`}
                          >
                            Résultats
                          </Link>
                          <button
                            type="button"
                            className="button button--quiet button--small"
                            onClick={() => {
                              action.clearError();
                              setEditing({ mode: 'edit', exam });
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="button button--danger button--small"
                            disabled={started}
                            title={
                              started
                                ? `Impossible : ${plural(exam.attemptCount, 'copie rendue', 'copies rendues')}.`
                                : undefined
                            }
                            onClick={() => {
                              action.clearError();
                              setDeleting(exam);
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
        <ExamForm
          mode={editing.mode}
          exam={editing.exam}
          courses={courseList}
          action={action}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setFeedback(message);
            examsQuery.reload();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Supprimer cet examen ?"
          message={
            deleting.questionCount > 0
              ? `« ${deleting.title} » sera supprimé, ainsi que ses ${plural(deleting.questionCount, 'question')}. Cette action est irréversible.`
              : `« ${deleting.title} » sera définitivement supprimé.`
          }
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

function ExamForm({ mode, exam, courses, action, onClose, onSaved }) {
  const isCreate = mode === 'create';

  const [courseId, setCourseId] = useState(String(exam?.courseId ?? courses[0]?.id ?? ''));
  const [title, setTitle] = useState(exam?.title ?? '');
  const [description, setDescription] = useState(exam?.description ?? '');
  const [from, setFrom] = useState(toLocalInputValue(exam?.availableFrom));
  const [to, setTo] = useState(toLocalInputValue(exam?.availableTo));

  const windowInvalid = from && to && new Date(to) <= new Date(from);

  async function handleSubmit(event) {
    event.preventDefault();
    if (action.pending || windowInvalid) return;

    const payload = {
      courseId: Number(courseId),
      title,
      description,
      availableFrom: fromLocalInputValue(from),
      availableTo: fromLocalInputValue(to),
    };

    if (isCreate) {
      const outcome = await action.run(() => examsApi.create(payload));
      if (outcome.ok) onSaved(`Examen « ${outcome.result.title} » créé.`);
      return;
    }

    const outcome = await action.run(() => examsApi.update(exam.id, payload));
    if (outcome.ok) onSaved(`Examen « ${outcome.result.title} » mis à jour.`);
  }

  return (
    <Modal
      title={isCreate ? 'Créer un examen' : 'Modifier l’examen'}
      description={
        !isCreate && exam.attemptCount > 0
          ? 'Cet examen a déjà été passé. Son intitulé et sa période restent modifiables, mais pas ses questions.'
          : undefined
      }
      onClose={action.pending ? () => {} : onClose}
      wide
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="courseId">Cours</label>
          <select
            id="courseId"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            required
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="examDescription">Description</label>
          <textarea
            id="examDescription"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <span className="field__hint">Facultative. Visible par les étudiants.</span>
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="availableFrom">Ouverture</label>
            <input
              id="availableFrom"
              type="datetime-local"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="availableTo">Fermeture</label>
            <input
              id="availableTo"
              type="datetime-local"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              aria-invalid={windowInvalid ? 'true' : undefined}
              required
            />
          </div>
        </div>

        <span className="field__hint">
          Les horaires sont exprimés dans votre fuseau. En dehors de cette période, l’examen
          disparaît de la liste des étudiants et toute soumission est refusée.
        </span>

        {windowInvalid && (
          <StatusMessage tone="error">
            La fermeture doit être postérieure à l’ouverture.
          </StatusMessage>
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
          <button type="submit" className="button" disabled={action.pending || windowInvalid}>
            {action.pending ? 'Enregistrement…' : isCreate ? 'Créer l’examen' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
