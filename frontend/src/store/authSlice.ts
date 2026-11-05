import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';
import { authApi } from '../api/authApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const savedToken = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');

const initialState: AuthState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  isAuthenticated: !!savedToken,
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.login(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.register(userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Registration failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authApi.getMe();
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to authenticate');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { name?: string; email?: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.updateProfile(profileData);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });

    // Update Profile
    builder.addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
