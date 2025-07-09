import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));

  // Guarantee axios header is set on mount and when token changes
  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem('token', token); // store as plain string
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      sessionStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
  }, [user]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    // Set header immediately for any in-flight requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    sessionStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <UserContext.Provider value={{ user, setUser, token, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext); 