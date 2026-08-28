import { Link } from 'react-router-dom';

import { courses as coursesApi, exams as examsApi, students as studentsApi } from '../../api/endpoints';
import { useResource } from '../../hooks/useResource';
import { useAuth } from '../../auth/AuthContext';
import { EXAM_STATUS, formatWindow, plural } from '../../utils/format';

import PageHeader from '../../components/PageHeader';
import StatusMessage from '../../components/StatusMessage';
import LoadingBlock from '../../components/LoadingBlock';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Icon from '../../components/Icon';

export default function DashboardPage() {
  const { user } = useAuth();

  const query = useResource(
    ({ signal }) =>
      Promise.all([
        studentsApi.list({ signal }),
        coursesApi.list({ signal }),
        examsApi.list({ signal }),
      ]).then(([students, courses, exams]) => ({ students, courses, exams })),
    [],
  );

  const { data, error, loading, reload } = query;

  const students = data?.students ?? [];
  const courses = data?.courses ?? [];
  const exams = data?.exams ?? [];

  const activeStudents = students.filter((student) => student.isActive).length;
  const openExams = exams.filter((exam) => exam.status === 'OPEN');
  const attempts = exams.reduce((total, exam) => total + exam.attemptCount, 0);

  const incomplete = exams.filter(
    (exam) => exam.questionCount === 0 && exam.status !== 'CLOSED',
  );

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title={`Bonjour, ${user?.fullName?.split(' ')[0] ?? ''}`}
        description="Vue d’ensemble des comptes, des cours et des examens."
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
          <LoadingBlock label="Chargement du tableau de bord" />
        </div>
      ) : (
        <>
          {incomplete.length > 0 && (
            <StatusMessage tone="warning">
              {incomplete.length === 1
                ? `L’examen « ${incomplete[0].title} » ne comporte aucune question : il reste invisible pour les étudiants.`
                : `${incomplete.length} examens ne comportent aucune question et restent invisibles pour les étudiants.`}{' '}
              <Link to="/admin/exams">Compléter</Link>
            </StatusMessage>
          )}

          <div className="cards">
            <Link className="card sheet card--link" to="/admin/students">
              <span className="card__icon" aria-hidden="true">
                <Icon name="users" size={22} />
              </span>
              <span className="card__value">{activeStudents}</span>
              <span className="card__label">
                {plural(activeStudents, 'étudiant actif', 'étudiants actifs')}
              </span>
              <span className="card__note">
                {students.length - activeStudents > 0
                  ? `${students.length - activeStudents} désactivé${students.length - activeStudents > 1 ? 's' : ''}`
                  : 'Aucun compte désactivé'}
              </span>
            </Link>

            <Link className="card sheet card--link" to="/admin/courses">
              <span className="card__icon" aria-hidden="true">
                <Icon name="book" size={22} />
              </span>
              <span className="card__value">{courses.length}</span>
              <span className="card__label">{plural(courses.length, 'cours', 'cours')}</span>
              <span className="card__note">Gérer les cours</span>
            </Link>

            <Link className="card sheet card--link" to="/admin/exams">
              <span className="card__icon" aria-hidden="true">
                <Icon name="clipboard" size={22} />
              </span>
              <span className="card__value">{exams.length}</span>
              <span className="card__label">{plural(exams.length, 'examen', 'examens')}</span>
              <span className="card__note">
                {openExams.length > 0 ? `${openExams.length} ouvert${openExams.length > 1 ? 's' : ''} en ce moment` : 'Aucun ouvert en ce moment'}
              </span>
            </Link>

            <div className="card sheet">
              <span className="card__icon" aria-hidden="true">
                <Icon name="chart" size={22} />
              </span>
              <span className="card__value">{attempts}</span>
              <span className="card__label">
                {plural(attempts, 'copie rendue', 'copies rendues')}
              </span>
              <span className="card__note">tous examens confondus</span>
            </div>
          </div>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Examens ouverts en ce moment</h2>
              <Link className="button button--link" to="/admin/exams">
                Tous les examens
              </Link>
            </div>

            <div className="sheet">
              {openExams.length === 0 ? (
                <EmptyState
                  title="Aucun examen ouvert"
                  description="Les étudiants ne voient rien pour l’instant. Un examen apparaît chez eux pendant sa période de disponibilité, à condition de comporter des questions."
                  action={
                    <Link className="button" to="/admin/exams">
                      Gérer les examens
                    </Link>
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Examen</th>
                        <th scope="col">Disponibilité</th>
                        <th scope="col" className="is-numeric">
                          Questions
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
                      {openExams.map((exam) => (
                        <tr key={exam.id}>
                          <td>
                            <span className="table__main">{exam.title}</span>
                            <span className="table__sub">{exam.courseCode}</span>
                          </td>
                          <td>
                            <span className="table__sub" style={{ fontSize: 'var(--step--1)' }}>
                              {formatWindow(exam.availableFrom, exam.availableTo)}
                            </span>
                          </td>
                          <td className="is-numeric">
                            {exam.questionCount === 0 ? (
                              <Badge tone="danger">Aucune</Badge>
                            ) : (
                              exam.questionCount
                            )}
                          </td>
                          <td className="is-numeric">{exam.attemptCount}</td>
                          <td>
                            <div className="table__actions">
                              <Link
                                className="button button--quiet button--small"
                                to={`/admin/exams/${exam.id}/questions`}
                              >
                                Sujet
                              </Link>
                              <Link
                                className="button button--quiet button--small"
                                to={`/admin/exams/${exam.id}/results`}
                              >
                                Résultats
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Derniers examens créés</h2>
              <span className="eyebrow">{Math.min(exams.length, 5)} sur {exams.length}</span>
            </div>

            <div className="sheet">
              {exams.length === 0 ? (
                <EmptyState
                  title="Aucun examen"
                  description="Créez un cours, puis un examen, puis ses questions."
                  action={
                    <Link className="button" to="/admin/courses">
                      Commencer par un cours
                    </Link>
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Examen</th>
                        <th scope="col">Cours</th>
                        <th scope="col">État</th>
                        <th scope="col" className="is-numeric">
                          Barème
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.slice(0, 5).map((exam) => {
                        const status = EXAM_STATUS[exam.status] ?? EXAM_STATUS.UPCOMING;

                        return (
                          <tr key={exam.id}>
                            <td>
                              <Link className="table__main" to={`/admin/exams/${exam.id}/questions`}>
                                {exam.title}
                              </Link>
                            </td>
                            <td>{exam.courseCode}</td>
                            <td>
                              <Badge tone={status.tone}>{status.label}</Badge>
                            </td>
                            <td className="is-numeric">{exam.totalPoints}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
