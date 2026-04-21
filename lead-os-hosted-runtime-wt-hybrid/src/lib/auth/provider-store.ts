export type ProviderAccount = {
  id: string;
  email: string;
  password: string;
};

const providers: ProviderAccount[] = [
  {
    id: "demo-owner",
    email: "demo@provider.com",
    password: "password123",
  },
];

export function findProviderByEmail(email: string) {
  return providers.find(p => p.email === email) || null;
}

export function findProviderById(id: string) {
  return providers.find(p => p.id === id) || null;
}
