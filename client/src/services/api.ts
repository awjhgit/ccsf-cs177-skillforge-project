import type { User } from '../types/user';

export type ReferenceLink = { label: string; url: string };

export type ProfileDetails = {
  title: string;
  description: string;
  years: number;
  skills: string[];
  certifications: string[];
  links: ReferenceLink[];
};

export type Recognition = {
  id: number;
  title: string;
  description: string;
  awardedAt: string;
};

export type ProfileOverview = {
  profile: ProfileDetails | null;
  recognition: Recognition[];
  trustedReferenceHosts: string[];
};

export type DirectoryProfile = ProfileDetails & Pick<User, 'id' | 'name' | 'department'>;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.error ?? 'Request failed.', response.status);
  return data as T;
}

export const api = {
  register: (account: Pick<User, 'name' | 'email' | 'department'> & { password: string }) =>
    request('/api/register', 'POST', account),
  session: () => request<{ user: User | null }>('/api/session'),
  login: (email: string, password: string) => request<{ user: User }>('/api/login', 'POST', { email, password }),
  logout: () => request('/api/logout', 'POST'),
  profile: () => request<ProfileOverview>('/api/profile'),
  saveProfile: (profile: ProfileDetails) => request<{ profile: ProfileDetails }>('/api/profile', 'PUT', profile),
  profiles: () => request<{ profiles: DirectoryProfile[] }>('/api/profiles'),
  users: () => request<{ users: User[] }>('/api/users'),
  setStatus: (id: number, status: User['status']) => request<{ users: User[] }>(`/api/users/${id}/status`, 'PATCH', { status }),
};
