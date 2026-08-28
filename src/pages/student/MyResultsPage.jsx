import { Link } from 'react-router-dom';

import { myResults } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { formatDateTime, plural } from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import EmptyState from '../../components/EmptyState';

export default function MyResultsPage() {
  const { data, error, loading, reload } = useResource(
    ({ signal }) => myResults.list({ signal }),
    [],
  );

  const list = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Espace étudiant"
        title="Mes résultats"
        description="Les examens que vous avez passés, du plus récent au plus ancien."
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
          <LoadingBlock label="Chargement de vos résultats" />
        </div>
      ) : list.length === 0 ? (
        <div className="sheet">
          <EmptyState
            title="Aucun examen passé"
            description="Vos notes apparaîtront ici après votre première copie rendue."
            action={
              <Link className="button" to="/student">
                Voir les examens disponibles
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <p className="summary-line">
            {plural(list.length, 'examen passé', 'examens passés')}. Chaque note est celle
            attribuée par le serveur au moment de la soumission.
          </p>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Détail par examen</h2>
            </div>

            <div className="sheet">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Examen</th>
                      <th scope="col" className="is-numeric">
                        Note
                      </th>
                      <th scope="col" className="is-numeric">
                        Sur 100
                      </th>
                      <th scope="col">Rendu le</th>
                      <th scope="col" className="is-numeric">
                        Correction
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((result) => (
                      <tr key={result.attemptId}>
                        <td>
                          <span className="table__main">{result.examTitle}</span>
                          <span className="table__sub">
                            {result.courseCode} — {result.courseName}
                          </span>
                        </td>
                        <td className="is-numeric">
                          <strong>{result.score}</strong>
                          <span className="table__sub">sur {result.maxScore}</span>
                        </td>
                        <td className="is-numeric">{result.percentage} %</td>
                        <td>{formatDateTime(result.submittedAt)}</td>
                        <td>
                          <div className="table__actions">
                            <Link
                              className="button button--quiet button--small"
                              to={`/student/exams/${result.examId}/result`}
                            >
                              Voir ma copie
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
