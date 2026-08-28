export const ROLES = { ADMIN: 'ADMIN', STUDENT: 'STUDENT' };

export const LOGIN_PATH = '/login';

export const HOME_PATH = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.STUDENT]: '/student',
};

export function homePathFor(user) {
  if (!user || !HOME_PATH[user.role]) return LOGIN_PATH;
  return HOME_PATH[user.role];
}

export function resolveAccess(user, allowedRole) {
  if (!user) {
    return {
      allowed: false,
      redirectTo: LOGIN_PATH,
      reason: 'ANONYMOUS',
    };
  }

  if (user.role !== allowedRole) {
    return {
      allowed: false,
      redirectTo: homePathFor(user),
      reason: 'WRONG_ROLE',
    };
  }

  return { allowed: true };
}

export function postLoginPath(user, intended) {
  const home = homePathFor(user);

  if (typeof intended !== 'string' || !intended.startsWith('/')) return home;
  if (intended === LOGIN_PATH) return home;

  const space = HOME_PATH[user?.role];
  if (!space) return LOGIN_PATH;

  return intended === space || intended.startsWith(`${space}/`) ? intended : home;
}
