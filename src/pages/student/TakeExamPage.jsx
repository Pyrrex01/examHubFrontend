import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { myExams } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { useAction } from '../../hooks/useAction';
import { formatDateTime, plural } from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import Modal from '../../components/Modal';

export default function TakeExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const { data, error, loading } = useResource(
    ({ signal }) => myExams.paper(examId, { signal }),
    [examId],
  );

  const [selection, setSelection] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const action = useAction();

  const exam = data?.exam;
  const questions = useMemo(() => data?.questions ?? [], [data]);

  const answeredCount = Object.keys(selection).length;
  const unanswered = questions.filter((question) => selection[question.id] === undefined);

  useEffect(() => {
    if (submitted || answeredCount === 0) return undefined;

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [submitted, answeredCount]);

  function choose(questionId, choiceId) {
    setSelection((current) => ({ ...current, [questionId]: choiceId }));
  }

  function clearChoice(questionId) {
    setSelection((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  }

  async function handleSubmit() {
    const answers = Object.entries(selection).map(([questionId, choiceId]) => ({
      questionId: Number(questionId),
      choiceId,
    }));

    const outcome = await action.run(() => myExams.submit(examId, answers));

    if (!outcome.ok) return;

    setSubmitted(true);
    setConfirming(false);

    navigate(`/student/exams/${examId}/result`, { replace: true });
  }

  if (loading) {
    return (
      <div className="sheet">
        <LoadingBlock label="Ouverture du sujet" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader eyebrow="Espace étudiant" title="Examen indisponible" />
        <div className="sheet paper-notice">
          <StatusMessage tone="error">{error.message}</StatusMessage>
          <div className="table__actions" style={{ justifyContent: 'flex-start' }}>
            <Link className="button button--quiet" to="/student">
              Retour aux examens
            </Link>
            {error.status === 409 && (
              <Link className="button" to={`/student/exams/${examId}/result`}>
                Voir mon résultat
              </Link>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`${exam.courseCode} — ${exam.courseName}`}
        title={exam.title}
        description={exam.description || undefined}
      />

      <div className="paper-bar sheet">
        <div className="paper-bar__facts">
          <span>
            <strong className="numeric">{questions.length}</strong>{' '}
            {questions.length > 1 ? 'questions' : 'question'}
          </span>
          <span>
            Barème <strong className="numeric">{exam.totalPoints}</strong>
          </span>
          <span>
            Répondu <strong className="numeric">{answeredCount}</strong> / {questions.length}
          </span>
          <span className="paper-bar__deadline">
            À rendre avant le {formatDateTime(exam.availableTo)}
          </span>
        </div>

        <button
          type="button"
          className="button"
          onClick={() => {
            action.clearError();
            setConfirming(true);
          }}
        >
          Rendre ma copie
        </button>
      </div>

      <StatusMessage tone="error">{action.error?.message}</StatusMessage>

      <ol className="paper">
        {questions.map((question) => {
          const selected = selection[question.id];

          return (
            <li key={question.id} className="paper-question sheet">
              <div className="paper-question__head">
                <p className="eyebrow">
                  Question {question.position} · {plural(question.points, 'point')}
                </p>
                {selected !== undefined && (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => clearChoice(question.id)}
                  >
                    Effacer ma réponse
                  </button>
                )}
              </div>

              <h2 className="paper-question__statement">{question.statement}</h2>

              <fieldset className="paper-choices">
                <legend className="sr-only">{question.statement}</legend>

                {question.choices.map((choice) => (
                  <label
                    key={choice.id}
                    className={`paper-choice${selected === choice.id ? ' paper-choice--on' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={choice.id}
                      checked={selected === choice.id}
                      onChange={() => choose(question.id, choice.id)}
                    />
                    <span className="paper-choice__label">{choice.label}</span>
                  </label>
                ))}
              </fieldset>
            </li>
          );
        })}
      </ol>

      <div className="paper-footer sheet">
        <p className="paper-footer__text">
          Vous pouvez laisser des questions sans réponse : elles vaudront 0 point. Une fois la
          copie rendue, il n’est plus possible de la modifier.
        </p>
        <button
          type="button"
          className="button"
          onClick={() => {
            action.clearError();
            setConfirming(true);
          }}
        >
          Rendre ma copie
        </button>
      </div>

      {confirming && (
        <Modal
          title="Rendre votre copie ?"
          onClose={action.pending ? () => {} : () => setConfirming(false)}
        >
          <p className="confirm__message">
            Vous avez répondu à <strong>{answeredCount}</strong> question
            {answeredCount > 1 ? 's' : ''} sur <strong>{questions.length}</strong>.
          </p>

          {unanswered.length > 0 && (
            <StatusMessage tone="warning">
              {unanswered.length === 1
                ? `La question ${unanswered[0].position} est sans réponse et vaudra 0 point.`
                : `${unanswered.length} questions sont sans réponse (${unanswered
                    .map((question) => question.position)
                    .join(', ')}) et vaudront 0 point.`}
            </StatusMessage>
          )}

          <p className="confirm__message">
            Cet examen ne peut être passé qu’une seule fois. Après validation, votre note sera
            calculée et vous ne pourrez plus revenir sur vos réponses.
          </p>

          <StatusMessage tone="error">{action.error?.message}</StatusMessage>

          <div className="modal__actions">
            <button
              type="button"
              className="button button--quiet"
              onClick={() => setConfirming(false)}
              disabled={action.pending}
            >
              Continuer à composer
            </button>
            <button type="button" className="button" onClick={handleSubmit} disabled={action.pending}>
              {action.pending ? 'Envoi…' : 'Rendre ma copie'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
