import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchCurrentUser } from '../../store/authSlice';
import { fetchCategories } from '../../store/financeSlice';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
    if (token) {
      dispatch(fetchCategories());
    }
  }, [dispatch, token, user]);

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  if (token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <LoadingSpinner size="lg" text="Authenticating session..." />
      </div>
    );
  }

  return children;
};
