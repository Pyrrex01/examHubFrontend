import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { LOGIN_PATH } from '../auth/guards';
import Icon from './Icon';

export default function AppShell({ title, sections }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate(LOGIN_PATH, { replace: true });
  }

  const initials = (user?.fullName ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="shell">
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>

      {navOpen && (
        <button
          type="button"
          className="shell__scrim"
          aria-label="Fermer la navigation"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside className={`sidebar${navOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <span className="sidebar__mark" aria-hidden="true">
            <Icon name="cap" size={20} />
          </span>
          <span className="sidebar__wordmark">ExamHub</span>
        </div>

        <nav className="sidebar__nav" aria-label={`Navigation ${title}`}>
          {sections.map((section) => (
            <div className="sidebar__section" key={section.label}>
              <p className="sidebar__section-label">{section.label}</p>
              <ul>
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className="sidebar__link">
                      <Icon name={item.icon} size={18} className="sidebar__icon" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span className="avatar avatar--dark" aria-hidden="true">
            {initials}
          </span>
          <span className="sidebar__identity">
            <span className="sidebar__name">{user?.fullName}</span>
            <span className="sidebar__role">
              {user?.role === 'ADMIN' ? 'Administrateur' : 'Étudiant'}
            </span>
          </span>
        </div>
      </aside>

      <div className="shell__body">
        <header className="topbar">
          <div className="topbar__left">
            <button
              type="button"
              className="topbar__toggle"
              aria-label="Ouvrir la navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((open) => !open)}
            >
              <Icon name={navOpen ? 'close' : 'menu'} size={20} />
            </button>
            <span className="topbar__context">{title}</span>
          </div>

          <div className="shell__account">
            <span className="shell__identity">
              <span className="shell__name">{user?.fullName}</span>
              <span className="shell__role">
                {user?.role === 'ADMIN' ? 'Administrateur' : 'Étudiant'}
              </span>
            </span>
            <span className="avatar" aria-hidden="true">
              {initials}
            </span>
            <button type="button" className="button button--quiet button--small" onClick={handleLogout}>
              <Icon name="logout" size={16} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </header>

        <main className="shell__main" id="contenu">
          <div className="shell__inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
