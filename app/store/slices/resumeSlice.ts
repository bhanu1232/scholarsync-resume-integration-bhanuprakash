import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Contact {
  email?: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
}

interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  gpa?: string;
  year?: string;
}

interface Skills {
  programming: string[];
  frontend: string[];
  backend: string[];
  database: string[];
  devops: string[];
  tools: string[];
}

interface Experience {
  company?: string;
  role?: string;
  duration?: string;
  description?: string[];
}

interface Project {
  name?: string;
  description?: string;
  technologies?: string[];
  achievements?: string[];
}

interface Certification {
  name?: string;
  issuer?: string;
  date?: string;
}

interface ResumeData {
  name?: string;
  contact: Contact;
  education?: Education[];
  skills: Skills;
  experience?: Experience[];
  projects?: Project[];
  certifications?: Certification[];
}

interface ResumeState {
  data: ResumeData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ResumeState = {
  data: null,
  loading: false,
  error: null,
};

export const parseResume = createAsyncThunk(
  'resume/parse',
  async (formData: FormData) => {
    const response = await fetch('/api/parse-resume', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to parse resume');
    }

    return response.json();
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    clearResume: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(parseResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(parseResume.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(parseResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to parse resume';
      });
  },
});

export const { clearResume } = resumeSlice.actions;
export default resumeSlice.reducer; 