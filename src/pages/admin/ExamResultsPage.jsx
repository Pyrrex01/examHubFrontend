import { Link, useParams } from 'react-router-dom';

import { exams as examsApi } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { formatDateTime, plural } from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

export default function ExamResultsPage() {
  const { examId } = useParams();

  const { data, error, loading, reload } = useResource(
    ({ signal }) => examsApi.results(examId, { signal }),
    [examId],
  );

  const stats = data?.stats;
  const results = data?.results ?? [];
  const submitted = results.filter((row) => row.hasAttempted);
  const absent = results.filter((row) => !row.hasAttempted);

  return (
    <>
      <PageHeader
        eyebrow={data ? `${data.courseCode} — ${data.courseName}` : 'Examen'}
        title={data ? data.examTitle : 'Résultats'}
        description="Notes par étudiant et statistiques de la promotion."
        actions={
          <>
            <Link className="button button--quiet" to="/admin/exams">
              Retour aux examens
            </Link>
            <Link className="button button--quiet" to={`/admin/exams/${examId}/questions`}>
              Voir le sujet
            </Link>
          </>
        }
      />

      {error && (
        <StatusMessage tone="error">
          {error.message}{' '}
          <button type="button" className="button button--link" onClick={reload}>
            Réessayer
          </button>
        </StatusMessage>
      )}

      {loading ? (
        <div className="sheet">
          <LoadingBlock label="Chargement des résultats" />
        </div>
      ) : !data ? (
        null
      ) : (
        <>
          <div className="cards">
            <div className="card sheet">
              <span className="card__value">{stats.attemptCount}</span>
              <span className="card__label">
                {plural(stats.attemptCount, 'copie rendue', 'copies rendues')}
              </span>
              <span className="card__note">sur {plural(stats.studentCount, 'étudiant')}</span>
            </div>

            <div className="card sheet">
              <span className="card__value">
                {stats.average === null ? '—' : stats.average}
              </span>
              <span className="card__label">Moyenne</span>
              <span className="card__note">
                {stats.average === null
                  ? 'Aucune copie rendue'
                  : `sur ${stats.maxScore} · ${stats.averagePercentage} %`}
              </span>
            </div>

            <div className="card sheet">
              <span className="card__value">
                {stats.lowest === null ? '—' : `${stats.lowest}–${stats.highest}`}
              </span>
              <span className="card__label">Note la plus basse et la plus haute</span>
              <span className="card__note">
                {stats.lowest === null ? 'Aucune copie rendue' : `barème sur ${stats.maxScore}`}
              </span>
            </div>
          </div>

          {stats.attemptCount > 0 && absent.length > 0 && (
            <StatusMessage tone="warning">
              {plural(absent.length, 'étudiant n’a pas composé', 'étudiants n’ont pas composé')}.
              Ces absences ne sont pas comptées dans la moyenne.
            </StatusMessage>
          )}

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Copies rendues</h2>
              <span className="eyebrow">{submitted.length}</span>
            </div>

            <div className="sheet">
              {submitted.length === 0 ? (
                <EmptyState
                  title="Aucune copie rendue"
                  description="Les résultats apparaîtront ici dès qu’un étudiant aura soumis cet examen."
                />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Étudiant</th>
                        <th scope="col" className="is-numeric">
                          Note
                        </th>
                        <th scope="col" className="is-numeric">
                          Sur 100
                        </th>
                        <th scope="col">Rendue le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submitted.map((row) => (
                        <tr key={row.studentId}>
                          <td>
                            <span className="table__main">{row.fullName}</span>
                            <span className="table__sub">{row.email}</span>
                            {!row.isActive && (
                              <>
                                {' '}
                                <Badge tone="danger">Compte désactivé</Badge>
                              </>
                            )}
                          </td>
                          <td className="is-numeric">
                            <strong>{row.score}</strong>
                            <span className="table__sub">sur {row.maxScore}</span>
                          </td>
                          <td className="is-numeric">{row.percentage} %</td>
                          <td>{formatDateTime(row.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {absent.length > 0 && (
            <section className="section">
              <div className="section__head">
                <h2 className="section__title">Sans copie</h2>
                <span className="eyebrow">{absent.length}</span>
              </div>

              <div className="sheet">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Étudiant</th>
                        <th scope="col">État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absent.map((row) => (
                        <tr key={row.studentId} className="row--muted">
                          <td>
                            <span className="table__main">{row.fullName}</span>
                            <span className="table__sub">{row.email}</span>
                          </td>
                          <td>
                            {row.isActive ? (
                              <span className="table__sub">N’a pas composé</span>
                            ) : (
                              <Badge tone="danger">Compte désactivé</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
