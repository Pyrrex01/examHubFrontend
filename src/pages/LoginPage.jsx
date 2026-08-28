import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { postLoginPath } from '../auth/guards';
import { ApiError } from '../api/client';
import Icon from '../components/Icon';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (pending) return;

    setError(null);
    setPending(true);

    try {
      const user = await login(email, password);

      const destination = postLoginPath(user, location.state?.from);
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'La connexion a échoué. Réessayez dans un instant.',
      );
      setPending(false);
    }
  }

  return (
    <div className="login">
      <aside className="login__brandside">
        <div className="login__logo">
          <span className="login__mark" aria-hidden="true">
            <Icon name="cap" size={26} />
          </span>
          <span className="login__wordmark">ExamHub</span>
        </div>

        <div className="login__pitch">
          <p className="login__badge">Le jour J, en toute clarté</p>

          <h1 className="login__headline">
            La confiance
            <em>dans chaque réponse.</em>
          </h1>

          <p className="login__lede">
            Un espace calme et net pour celles et ceux qui préparent les examens — et pour
            celles et ceux qui les passent.
          </p>

          <ol className="login__steps">
            {[
              ['01', 'Préparer'],
              ['02', 'Évaluer'],
              ['03', 'Apprendre'],
            ].map(([index, label]) => (
              <li key={index}>
                <span className="login__step-index">{index}</span>
                <span className="login__step-label">{label}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="login__signature">ExamHub / Accès sécurisé</p>
      </aside>

      <main className="login__formside">
        <div className="login__panel">
          <span className="login__shield" aria-hidden="true">
            <Icon name="shield" size={22} />
          </span>

          <h2 className="login__title">Bon retour parmi nous.</h2>
          <p className="login__subtitle">Connectez-vous pour reprendre où vous en étiez.</p>

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Adresse email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="vous@ecole.fr"
                autoFocus
                required
                value={email}
                aria-invalid={error ? 'true' : undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Saisissez votre mot de passe"
                required
                value={password}
                aria-invalid={error ? 'true' : undefined}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && (
              <p className="notice" role="alert">
                {error}
              </p>
            )}

            <button className="button login__submit" type="submit" disabled={pending}>
              {pending ? 'Connexion…' : 'Se connecter'}
              {!pending && <Icon name="arrow" size={17} />}
            </button>
          </form>

          <p className="login__footnote">
            Espace protégé · Accès réservé aux comptes autorisés
          </p>
        </div>
      </main>
    </div>
  );
}
