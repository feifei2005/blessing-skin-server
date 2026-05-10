import React from 'react'

export const useAuth = jest.fn().mockReturnValue({
  isAuth: true,
  user: null,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) =>
  children
