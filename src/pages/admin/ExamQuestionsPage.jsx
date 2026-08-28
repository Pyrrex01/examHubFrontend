import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { questions as questionsApi } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { useAction } from '../../hooks/useAction';
import { plural } from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

const MIN_CHOICES = 2;
const MAX_CHOICES = 6;

export default function ExamQuestionsPage() {
  const { examId } = useParams();

  const { data, error, loading, reload } = useResource(
    ({ signal }) => questionsApi.listForExam(examId, { signal }),
    [examId],
  );

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const action = useAction();

  const locked = data?.locked ?? false;
  const list = data?.questions ?? [];

  async function handleDelete() {
    const outcome = await action.run(() => questionsApi.remove(deleting.id));
    if (!outcome.ok) return;

    setDeleting(null);
    setFeedback('Question supprimée. Les suivantes ont été renumérotées.');
    reload();
  }

  return (
    <>
      <PageHeader
        eyebrow={data ? `${data.examId} · ${data.examTitle}` : 'Examen'}
        title="Questions"
        description="Chaque question comporte de 2 à 6 propositions, dont exactement une correcte."
        actions={
          <>
            <Link className="button button--quiet" to="/admin/exams">
              Retour aux examens
            </Link>
            <button
              type="button"
              className="button"
              disabled={locked || loading}
              title={locked ? 'L’examen a déjà été passé : le sujet est figé.' : undefined}
              onClick={() => {
                action.clearError();
                setEditing({ mode: 'create', question: null });
              }}
            >
              Ajouter une question
            </button>
          </>
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

      {locked && (
        <StatusMessage tone="warning">
          <strong>Sujet verrouillé.</strong>{' '}
          {plural(data.attemptCount, 'copie a été rendue', 'copies ont été rendues')} : les
          questions et les propositions ne sont plus modifiables, afin de ne pas fausser les
          notes déjà attribuées. La consultation reste possible.
        </StatusMessage>
      )}

      {data && !loading && (
        <p className="summary-line">
          {plural(list.length, 'question')} · barème total{' '}
          <strong className="numeric">{data.totalPoints}</strong> point
          {data.totalPoints > 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div className="sheet">
          <LoadingBlock label="Chargement du sujet" />
        </div>
      ) : list.length === 0 ? (
        <div className="sheet">
          <EmptyState
            title="Aucune question"
            description="Un examen sans question reste invisible pour les étudiants. Ajoutez-en une pour l’ouvrir."
            action={
              locked ? null : (
                <button
                  type="button"
                  className="button"
                  onClick={() => setEditing({ mode: 'create', question: null })}
                >
                  Ajouter une question
                </button>
              )
            }
          />
        </div>
      ) : (
        <ol className="questions">
          {list.map((question) => (
            <li key={question.id} className="question sheet">
              <div className="question__head">
                <div>
                  <p className="eyebrow">
                    Question {question.position} · {plural(question.points, 'point')}
                  </p>
                  <h2 className="question__statement">{question.statement}</h2>
                </div>

                <div className="table__actions">
                  <button
                    type="button"
                    className="button button--quiet button--small"
                    disabled={locked}
                    title={locked ? 'Sujet verrouillé.' : undefined}
                    onClick={() => {
                      action.clearError();
                      setEditing({ mode: 'edit', question });
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="button button--danger button--small"
                    disabled={locked}
                    title={locked ? 'Sujet verrouillé.' : undefined}
                    onClick={() => {
                      action.clearError();
                      setDeleting(question);
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <ul className="choices">
                {question.choices.map((choice) => (
                  <li
                    key={choice.id}
                    className={`choice${choice.isCorrect ? ' choice--correct' : ''}`}
                  >
                    <span className="choice__mark" aria-hidden="true">
                      {choice.isCorrect ? '✓' : ''}
                    </span>
                    <span className="choice__label">{choice.label}</span>
                    {choice.isCorrect && <Badge tone="open">Bonne réponse</Badge>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {editing && (
        <QuestionForm
          mode={editing.mode}
          examId={examId}
          question={editing.question}
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
          title="Supprimer cette question ?"
          message={`« ${deleting.statement} » et ses ${plural(deleting.choices.length, 'proposition')} seront supprimées. Les questions suivantes seront renumérotées.`}
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

function QuestionForm({ mode, examId, question, action, onClose, onSaved }) {
  const isCreate = mode === 'create';

  const [statement, setStatement] = useState(question?.statement ?? '');
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const [choices, setChoices] = useState(() =>
    question
      ? question.choices.map((choice) => ({ label: choice.label, isCorrect: choice.isCorrect }))
      : [
          { label: '', isCorrect: true },
          { label: '', isCorrect: false },
        ],
  );

  const correctCount = choices.filter((choice) => choice.isCorrect).length;
  const emptyLabels = choices.some((choice) => choice.label.trim() === '');

  const problems = [];
  if (statement.trim().length < 3) problems.push('L’énoncé doit comporter au moins 3 caractères.');
  if (emptyLabels) problems.push('Chaque proposition doit avoir un intitulé.');
  if (correctCount !== 1) {
    problems.push(
      correctCount === 0
        ? 'Désignez la bonne réponse.'
        : 'Une seule proposition peut être correcte.',
    );
  }
  if (!Number.isInteger(Number(points)) || Number(points) < 1) {
    problems.push('Le barème doit être un entier d’au moins 1 point.');
  }

  function updateChoice(index, patch) {
    setChoices((current) =>
      current.map((choice, position) => (position === index ? { ...choice, ...patch } : choice)),
    );
  }

  function markCorrect(index) {
    setChoices((current) =>
      current.map((choice, position) => ({ ...choice, isCorrect: position === index })),
    );
  }

  function addChoice() {
    if (choices.length >= MAX_CHOICES) return;
    setChoices((current) => [...current, { label: '', isCorrect: false }]);
  }

  function removeChoice(index) {
    if (choices.length <= MIN_CHOICES) return;

    setChoices((current) => {
      const next = current.filter((_, position) => position !== index);
      return next.some((choice) => choice.isCorrect)
        ? next
        : next.map((choice, position) => ({ ...choice, isCorrect: position === 0 }));
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (action.pending || problems.length > 0) return;

    const payload = {
      statement,
      points: Number(points),
      choices: choices.map((choice) => ({
        label: choice.label,
        isCorrect: choice.isCorrect,
      })),
    };

    const outcome = await action.run(() =>
      isCreate ? questionsApi.create(examId, payload) : questionsApi.replace(question.id, payload),
    );

    if (outcome.ok) {
      onSaved(isCreate ? 'Question ajoutée.' : 'Question mise à jour.');
    }
  }

  return (
    <Modal
      title={isCreate ? 'Ajouter une question' : `Modifier la question ${question.position}`}
      onClose={action.pending ? () => {} : onClose}
      wide
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="statement">Énoncé</label>
          <textarea
            id="statement"
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            required
          />
        </div>

        <div className="field" style={{ maxWidth: '10rem' }}>
          <label htmlFor="points">Barème</label>
          <input
            id="points"
            type="number"
            min="1"
            step="1"
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            required
          />
          <span className="field__hint">En points entiers.</span>
        </div>

        <fieldset className="choices-editor">
          <legend>
            Propositions <span className="field__hint">de {MIN_CHOICES} à {MAX_CHOICES}, une seule correcte</span>
          </legend>

          {choices.map((choice, index) => (
            <div className="choice-row" key={index}>
              <label className="choice-row__radio">
                <input
                  type="radio"
                  name="correctChoice"
                  checked={choice.isCorrect}
                  onChange={() => markCorrect(index)}
                />
                <span className="sr-only">Désigner comme bonne réponse</span>
              </label>

              <input
                className="choice-row__input"
                value={choice.label}
                placeholder={`Proposition ${index + 1}`}
                aria-label={`Intitulé de la proposition ${index + 1}`}
                onChange={(event) => updateChoice(index, { label: event.target.value })}
              />

              <button
                type="button"
                className="button button--quiet button--small"
                disabled={choices.length <= MIN_CHOICES}
                title={
                  choices.length <= MIN_CHOICES
                    ? `Une question doit garder au moins ${MIN_CHOICES} propositions.`
                    : undefined
                }
                onClick={() => removeChoice(index)}
              >
                Retirer
              </button>
            </div>
          ))}

          <button
            type="button"
            className="button button--quiet button--small"
            disabled={choices.length >= MAX_CHOICES}
            title={
              choices.length >= MAX_CHOICES
                ? `Maximum ${MAX_CHOICES} propositions par question.`
                : undefined
            }
            onClick={addChoice}
          >
            Ajouter une proposition
          </button>
        </fieldset>

        {problems.length > 0 && (
          <StatusMessage tone="warning">
            {problems.length === 1 ? problems[0] : `À corriger : ${problems.join(' ')}`}
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
          <button
            type="submit"
            className="button"
            disabled={action.pending || problems.length > 0}
          >
            {action.pending ? 'Enregistrement…' : isCreate ? 'Ajouter' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
