import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { homePathFor, LOGIN_PATH } from '../auth/guards';

export default function NotFoundPage() {
  const { user } = useAuth();
  const destination = user ? homePathFor(user) : LOGIN_PATH;

  return (
    <div className="notfound ruled">
      <section className="notfound__inner sheet">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="display pending__title">Cette page n’existe pas</h1>
        <p className="pending__text">
          L’adresse saisie ne correspond à aucun écran de l’application.
        </p>
        <Link className="button" to={destination}>
          {user ? 'Revenir à mon espace' : 'Aller à la connexion'}
        </Link>
      </section>
    </div>
  );
}
