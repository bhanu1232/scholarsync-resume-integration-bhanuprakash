import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface ProjectSuggestion {
    title: string;
    description: string;
    learningOutcomes: string[];
    technologies: string[];
    difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    potentialImpact: string;
}

interface SuggestionsState {
    suggestions: ProjectSuggestion[];
    loading: boolean;
    error: string | null;
}

const initialState: SuggestionsState = {
    suggestions: [],
    loading: false,
    error: null,
};

export const fetchSuggestions = createAsyncThunk(
    'suggestions/fetchSuggestions',
    async ({ skills, interests }: { skills: string[]; interests: string[] }) => {
        try {
            const response = await fetch('/api/suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ skills, interests }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch suggestions');
            }

            const data = await response.json();
            if (!data.suggestions || !Array.isArray(data.suggestions)) {
                throw new Error('Invalid response format from server');
            }
            return data.suggestions;
        } catch (error: any) {
            console.error('Error fetching suggestions:', error);
            throw new Error(error.message || 'Failed to fetch suggestions');
        }
    }
);

const suggestionsSlice = createSlice({
    name: 'suggestions',
    initialState,
    reducers: {
        clearSuggestions: (state) => {
            state.suggestions = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSuggestions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSuggestions.fulfilled, (state, action) => {
                state.loading = false;
                state.suggestions = action.payload;
                state.error = null;
            })
            .addCase(fetchSuggestions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch suggestions';
            });
    },
});

export const { clearSuggestions } = suggestionsSlice.actions;
export default suggestionsSlice.reducer; 