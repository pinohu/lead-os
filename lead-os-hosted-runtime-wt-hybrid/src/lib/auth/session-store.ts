export type Session = {
  token: string;
  ownerId: string;
  createdAt: string;
};

const sessions: Session[] = [];

export function createSession(ownerId: string) {
  const token = Math.random().toString(36).slice(2);
  const session: Session = {
    token,
    ownerId,
    createdAt: new Date().toISOString(),
  };
  sessions.push(session);
  return session;
}

export function getSession(token: string) {
  return sessions.find(s => s.token === token) || null;
}
