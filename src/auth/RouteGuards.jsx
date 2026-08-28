import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './AuthContext';
import { homePathFor, LOGIN_PATH, resolveAccess } from './guards';

export function RequireRole({ role }) {
  const { user } = useAuth();
  const location = useLocation();

  const access = resolveAccess(user, role);

  if (access.allowed) return <Outlet />;

  const state = access.reason === 'ANONYMOUS' ? { from: location.pathname } : undefined;

  return <Navigate to={access.redirectTo} replace state={state} />;
}

export function RequireAnonymous() {
  const { user } = useAuth();

  if (user) return <Navigate to={homePathFor(user)} replace />;

  return <Outlet />;
}

export function HomeRedirect() {
  const { user } = useAuth();

  return <Navigate to={user ? homePathFor(user) : LOGIN_PATH} replace />;
}
