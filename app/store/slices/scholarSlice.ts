import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface ScholarData {
  name: string;
  researchInterests: string[];
  citationCount: number;
  publications: Array<{
    title: string;
    authors: string;
    year: string;
    citations: number;
  }>;
}

interface ScholarState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: ScholarState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchScholarProfile = createAsyncThunk(
  'scholar/fetchProfile',
  async (url: string) => {
    try {
      const response = await axios.post('/api/scholar-profile', { url });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch scholar profile');
    }
  }
);

const scholarSlice = createSlice({
  name: 'scholar',
  initialState,
  reducers: {
    clearScholarData: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScholarProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScholarProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchScholarProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch scholar profile';
      });
  },
});

export const { clearScholarData } = scholarSlice.actions;
export default scholarSlice.reducer; 