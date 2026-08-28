import { Link, useParams } from 'react-router-dom';

import { myResults } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { formatDateTime, plural } from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

export default function ExamResultPage() {
  const { examId } = useParams();

  const { data, error, loading } = useResource(
    ({ signal }) => myResults.forExam(examId, { signal }),
    [examId],
  );

  const result = data?.[0] ?? null;

  if (loading) {
    return (
      <div className="sheet">
        <LoadingBlock label="Chargement de votre copie" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader eyebrow="Espace étudiant" title="Résultat indisponible" />
        <div className="sheet paper-notice">
          <StatusMessage tone="error">{error.message}</StatusMessage>
          <Link className="button button--quiet" to="/student/results">
            Voir mes résultats
          </Link>
        </div>
      </>
    );
  }

  if (!result) {
    return (
      <>
        <PageHeader eyebrow="Espace étudiant" title="Aucun résultat" />
        <div className="sheet">
          <EmptyState
            title="Vous n’avez pas passé cet examen"
            description="Aucune copie n’a été rendue pour cet examen, il n’y a donc rien à corriger."
            action={
              <Link className="button" to="/student">
                Retour aux examens
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const questions = result.questions ?? [];
  const correctCount = questions.filter((question) => question.answeredCorrectly).length;
  const unansweredCount = questions.filter((question) => question.selectedChoiceId === null).length;

  return (
    <>
      <PageHeader
        eyebrow={`${result.courseCode} · rendu le ${formatDateTime(result.submittedAt)}`}
        title={result.examTitle}
        actions={
          <>
            <Link className="button button--quiet" to="/student/results">
              Mes résultats
            </Link>
            <Link className="button button--quiet" to="/student">
              Autres examens
            </Link>
          </>
        }
      />

      <section className="grade sheet" aria-label="Votre note">
        <div className="grade__score">
          <span className="grade__value numeric">{result.score}</span>
          <span className="grade__max numeric">/ {result.maxScore}</span>
        </div>
        <div className="grade__detail">
          <p className="grade__percent numeric">{result.percentage} %</p>
          <p className="grade__breakdown">
            {plural(correctCount, 'bonne réponse', 'bonnes réponses')} sur {questions.length}
            {unansweredCount > 0 &&
              ` · ${plural(unansweredCount, 'question sans réponse', 'questions sans réponse')}`}
          </p>
        </div>
      </section>

      {questions.length > 0 && (
        <ol className="correction">
          {questions.map((question) => {
            const skipped = question.selectedChoiceId === null;
            const state = question.answeredCorrectly ? 'right' : skipped ? 'skipped' : 'wrong';

            return (
              <li key={question.id} className={`correction-item sheet correction-item--${state}`}>
                <div className="correction-item__head">
                  <p className="eyebrow">Question {question.position}</p>

                  <span className="correction-item__verdict">
                    {question.answeredCorrectly ? (
                      <Badge tone="open">Juste</Badge>
                    ) : skipped ? (
                      <Badge tone="neutral">Sans réponse</Badge>
                    ) : (
                      <Badge tone="danger">Faux</Badge>
                    )}
                    <span className="numeric correction-item__points">
                      {question.pointsEarned} / {question.points}
                    </span>
                  </span>
                </div>

                <h2 className="correction-item__statement">{question.statement}</h2>

                <ul className="correction-choices">
                  {question.choices.map((choice) => {
                    const classes = ['correction-choice'];
                    if (choice.isCorrect) classes.push('correction-choice--correct');
                    if (choice.selected && !choice.isCorrect) classes.push('correction-choice--wrong');

                    return (
                      <li key={choice.id} className={classes.join(' ')}>
                        <span className="correction-choice__mark" aria-hidden="true">
                          {choice.isCorrect ? '✓' : choice.selected ? '✗' : ''}
                        </span>
                        <span className="correction-choice__label">{choice.label}</span>

                        <span className="correction-choice__tags">
                          {choice.selected && (
                            <span className="correction-choice__tag">Votre réponse</span>
                          )}
                          {choice.isCorrect && (
                            <span className="correction-choice__tag correction-choice__tag--right">
                              Bonne réponse
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {skipped && (
                  <p className="correction-item__note">
                    Vous n’avez pas répondu à cette question : elle vaut 0 point.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
