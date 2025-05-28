'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store';
import { fetchSuggestions } from '@/app/store/slices/suggestionsSlice';
import toast from 'react-hot-toast';

interface ProjectSuggestion {
    title: string;
    description: string;
    learningOutcomes: string[];
    technologies: string[];
    difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    potentialImpact: string;
}

export default function ProjectSuggestions() {
    const dispatch = useDispatch<AppDispatch>();
    const { suggestions, loading, error } = useSelector((state: RootState) => state.suggestions);
    const { data: resumeData } = useSelector((state: RootState) => state.resume);
    const { data: scholarData } = useSelector((state: RootState) => state.scholar);

    const [interests, setInterests] = useState<string[]>([]);

    useEffect(() => {
        if (resumeData?.skills && scholarData?.researchInterests) {
            // Convert skills object to array of skill names
            const skillNames = Object.values(resumeData.skills).flat();

            // Combine skills and research interests
            const combinedInterests = [
                ...skillNames,
                ...scholarData.researchInterests
            ].filter((value, index, self) => self.indexOf(value) === index);

            setInterests(combinedInterests);
        }
    }, [resumeData, scholarData]);

    const handleGenerateSuggestions = async () => {
        if (!resumeData?.skills || !interests.length) {
            toast.error('Please upload your resume and Google Scholar profile first');
            return;
        }

        try {
            // Convert skills object to array of skill names
            const skillNames = Object.values(resumeData.skills).flat();

            await dispatch(fetchSuggestions({
                skills: skillNames,
                interests: interests
            })).unwrap();
            toast.success('Project suggestions generated successfully!');
        } catch (error: any) {
            console.error('Error generating suggestions:', error);
            toast.error(error.message || 'Failed to generate suggestions');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-2xl font-bold mb-4 text-black">Project Suggestions</h2>

                {!resumeData && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800">
                            Please upload your resume to get personalized project suggestions.
                        </p>
                    </div>
                )}

                <button
                    onClick={handleGenerateSuggestions}
                    disabled={loading || !resumeData}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Suggestions...
                        </div>
                    ) : (
                        'Generate Project Suggestions'
                    )}
                </button>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {loading && (
                <div className="space-y-8">
                    {[1, 2, 3].map((index) => (
                        <div key={index} className="bg-white rounded-lg shadow p-6">
                            <div className="animate-pulse space-y-4">
                                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {suggestions && suggestions.length > 0 && !loading && (
                <div className="space-y-8">
                    {suggestions.map((suggestion: ProjectSuggestion, index) => (
                        <div key={index} className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold mb-4 text-black">{suggestion.title}</h3>
                            <p className="text-black mb-4">{suggestion.description}</p>

                            <div className="mb-4">
                                <h4 className="font-medium mb-2 text-black">Learning Outcomes:</h4>
                                <ul className="list-disc list-inside space-y-1 text-black">
                                    {suggestion.learningOutcomes.map((outcome, i) => (
                                        <li key={i}>{outcome}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mb-4">
                                <h4 className="font-medium mb-2 text-black">Technologies:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {suggestion.technologies.map((tech, i) => (
                                        <span
                                            key={i}
                                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-black">
                                <span className="font-medium">Difficulty:</span>
                                <span className={`px-2 py-1 rounded ${suggestion.difficultyLevel === 'Beginner' ? 'bg-green-100 text-green-800' :
                                    suggestion.difficultyLevel === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {suggestion.difficultyLevel}
                                </span>
                            </div>

                            <div className="mt-4">
                                <h4 className="font-medium mb-2 text-black">Potential Impact:</h4>
                                <p className="text-black">{suggestion.potentialImpact}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 