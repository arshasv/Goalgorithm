import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const MockAuthContext = React.createContext(null);

export const mockAuthValue = {
  user: null,
  token: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
  isOrganizer: false,
  isTeamLeader: false,
};

export const MockAuthProvider = ({ children, value }) => (
  <MockAuthContext.Provider value={value || mockAuthValue}>
    {children}
  </MockAuthContext.Provider>
);

export function renderWithRouter(ui, { route = '/', ...options } = {}) {
  return (
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

export function renderWithProviders(ui, {
  route = '/',
  authValue = mockAuthValue,
  ...options
} = {}) {
  return (
    <MockAuthProvider value={authValue}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </MockAuthProvider>
  );
}
