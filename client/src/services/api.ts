const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// TODO: Add specific API functions
// export const createGame = () => fetchApi('/games', { method: 'POST' });
// export const joinGame = (code: string) => fetchApi(`/games/${code}/join`);
