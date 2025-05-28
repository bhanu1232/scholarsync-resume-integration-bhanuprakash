'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchScholarProfile } from '../store/slices/scholarSlice';
import toast from 'react-hot-toast';

interface Publication {
    title: string;
    authors: string;
    year: string;
    citations: number;
}

interface ScholarData {
    name: string;
    researchInterests: string[];
    citationCount: number;
    publications: Publication[];
}

export default function ScholarProfile() {
    const [url, setUrl] = useState('');
    const dispatch = useDispatch<AppDispatch>();
    const { data: profileData, loading, error } = useSelector((state: RootState) => state.scholar);

    const validateScholarUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            // Check for both .com and .co.in domains
            const validDomains = ['scholar.google.com', 'scholar.google.co.in'];
            return (
                validDomains.includes(urlObj.hostname) &&
                urlObj.pathname.startsWith('/citations') &&
                urlObj.searchParams.has('user')
            );
        } catch {
            return false;
        }
    };

    const normalizeScholarUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            // Extract the user ID
            const userId = urlObj.searchParams.get('user');
            if (!userId) return url;

            // Create a normalized URL with only essential parameters
            return `https://scholar.google.com/citations?user=${userId}`;
        } catch {
            return url;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Trim the URL and remove any trailing slashes
        const trimmedUrl = url.trim().replace(/\/+$/, '');

        if (!trimmedUrl) {
            toast.error('Please enter a Google Scholar URL');
            return;
        }

        if (!validateScholarUrl(trimmedUrl)) {
            toast.error('Please enter a valid Google Scholar profile URL (e.g., https://scholar.google.com/citations?user=...)');
            return;
        }

        try {
            // Normalize the URL before sending
            const normalizedUrl = normalizeScholarUrl(trimmedUrl);
            await dispatch(fetchScholarProfile(normalizedUrl)).unwrap();
            toast.success('Profile fetched successfully!');
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            toast.error(error.message || 'Failed to fetch profile');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* URL Input Form */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-2xl font-bold mb-4 text-black">Google Scholar Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="scholarUrl" className="block text-sm font-medium text-black mb-2">
                            Enter Google Scholar Profile URL
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                id="scholarUrl"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://scholar.google.com/citations?user=..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                disabled={loading}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Example: https://scholar.google.com/citations?user=USER_ID or https://scholar.google.co.in/citations?user=USER_ID
                            </p>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Fetching Profile...
                            </div>
                        ) : (
                            'Fetch Profile'
                        )}
                    </button>
                </form>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && !profileData && (
                <div className="space-y-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Data Display */}
            {profileData && !loading && (
                <div className="space-y-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold mb-4 text-black">{profileData.name}</h2>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2 text-black">Research Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                {profileData.researchInterests.map((interest: string, index: number) => (
                                    <span
                                        key={index}
                                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2 text-black">Citation Count</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                {profileData.citationCount.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {profileData.publications && profileData.publications.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold mb-4 text-black">Publications</h3>
                            <div className="space-y-4">
                                {profileData.publications.map((pub: Publication, index: number) => (
                                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                                        <h4 className="font-medium text-lg mb-1 text-black">{pub.title}</h4>
                                        <p className="text-black mb-1">{pub.authors}</p>
                                        <div className="flex items-center gap-4 text-sm text-black">
                                            <span>{pub.year}</span>
                                            <span>•</span>
                                            <span>{pub.citations} citations</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 