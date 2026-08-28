import { Link } from 'react-router-dom';

import { myExams } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { useAuth } from '../../auth/AuthContext';
import { formatDateTime, plural } from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';

export default function AvailableExamsPage() {
  const { user } = useAuth();

  const { data, error, loading, reload } = useResource(
    ({ signal }) => myExams.available({ signal }),
    [],
  );

  const list = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Espace étudiant"
        title={`Bonjour, ${user?.fullName?.split(' ')[0] ?? ''}`}
        description="Les examens ouverts que vous n’avez pas encore passés. Chacun ne peut être passé qu’une seule fois."
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
          <LoadingBlock label="Recherche de vos examens" />
        </div>
      ) : list.length === 0 ? (
        <div className="sheet">
          <EmptyState
            title="Aucun examen à passer pour le moment"
            description="Un examen apparaît ici pendant sa période d’ouverture. Revenez à la date indiquée par votre enseignant."
            action={
              <Link className="button button--quiet" to="/student/results">
                Voir mes résultats
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="cards">
            <div className="card sheet">
              <span className="card__icon" aria-hidden="true">
                <Icon name="clipboard" size={22} />
              </span>
              <span className="card__value">{list.length}</span>
              <span className="card__label">
                {plural(list.length, 'examen à passer', 'examens à passer')}
              </span>
              <span className="card__note">Ouverts en ce moment</span>
            </div>

            <div className="card sheet">
              <span className="card__icon" aria-hidden="true">
                <Icon name="clock" size={22} />
              </span>
              <span className="card__value">
                {list.reduce((total, exam) => total + exam.questionCount, 0)}
              </span>
              <span className="card__label">Questions au total</span>
              <span className="card__note">Tous examens confondus</span>
            </div>
          </div>

          <ul className="exam-list">
          {list.map((exam) => (
            <li key={exam.id} className="exam-card sheet">
              <div className="exam-card__body">
                <p className="eyebrow">
                  {exam.courseCode} — {exam.courseName}
                </p>
                <h2 className="exam-card__title display">{exam.title}</h2>
                {exam.description && <p className="exam-card__text">{exam.description}</p>}

                <dl className="exam-card__facts">
                  <div>
                    <dt>Questions</dt>
                    <dd className="numeric">{exam.questionCount}</dd>
                  </div>
                  <div>
                    <dt>Barème</dt>
                    <dd className="numeric">{plural(exam.totalPoints, 'point')}</dd>
                  </div>
                  <div>
                    <dt>À rendre avant le</dt>
                    <dd>{formatDateTime(exam.availableTo)}</dd>
                  </div>
                </dl>
              </div>

              <div className="exam-card__action">
                <Link className="button" to={`/student/exams/${exam.id}`}>
                  Composer
                </Link>
              </div>
            </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
