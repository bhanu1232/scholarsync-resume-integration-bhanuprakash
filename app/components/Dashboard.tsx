'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import ResumeUpload from './ResumeUpload';
import ScholarProfile from './ScholarProfile';
import ProjectSuggestions from './ProjectSuggestions';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('resume');
    const resumeData = useSelector((state: RootState) => state.resume.data);

    const renderResumeData = () => {
        if (!resumeData) return null;

        return (
            <div className="space-y-6">
                {/* Name and Contact */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold mb-4 text-black">{resumeData.name}</h2>
                    <div className="space-y-2">
                        {resumeData.contact?.email && (
                            <div className="flex items-center">
                                <span className="font-semibold text-black">Email:</span>
                                <span className="ml-2 text-black">{resumeData.contact.email}</span>
                            </div>
                        )}
                        {resumeData.contact?.phone && (
                            <div className="flex items-center">
                                <span className="font-semibold text-black">Phone:</span>
                                <span className="ml-2 text-black">{resumeData.contact.phone}</span>
                            </div>
                        )}
                        {resumeData.contact?.linkedin && (
                            <div className="flex items-center">
                                <span className="font-semibold text-black">LinkedIn:</span>
                                <a href={`https://${resumeData.contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                                    {resumeData.contact.linkedin}
                                </a>
                            </div>
                        )}
                        {resumeData.contact?.portfolio && (
                            <div className="flex items-center">
                                <span className="font-semibold text-black">Portfolio:</span>
                                <a href={`https://${resumeData.contact.portfolio}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                                    {resumeData.contact.portfolio}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Education */}
                {resumeData.education && resumeData.education.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4 text-black">Education</h3>
                        <div className="space-y-4">
                            {resumeData.education.map((edu, index) => (
                                <div key={index} className="border-l-4 border-blue-500 pl-4">
                                    <div className="font-semibold text-black">{edu.institution}</div>
                                    <div className="text-black">{edu.degree}</div>
                                    {edu.gpa && <div className="text-black">GPA: {edu.gpa}</div>}
                                    {edu.year && <div className="text-black">Year: {edu.year}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Skills */}
                {resumeData.skills && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4 text-black">Skills</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(resumeData.skills).map(([category, skills]) => (
                                skills.length > 0 && (
                                    <div key={category} className="space-y-2">
                                        <h4 className="font-semibold capitalize text-black">{category}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map((skill: string, index: number) => (
                                                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* Experience */}
                {resumeData.experience && resumeData.experience.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4 text-black">Experience</h3>
                        <div className="space-y-6">
                            {resumeData.experience.map((exp, index) => (
                                <div key={index} className="border-l-4 border-green-500 pl-4">
                                    <div className="font-semibold text-black">{exp.company}</div>
                                    <div className="text-black">{exp.role}</div>
                                    {exp.duration && <div className="text-black">{exp.duration}</div>}
                                    {exp.description && (
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            {exp.description.map((desc, i) => (
                                                <li key={i} className="text-black">{desc}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Projects */}
                {resumeData.projects && resumeData.projects.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4 text-black">Projects</h3>
                        <div className="space-y-6">
                            {resumeData.projects.map((project, index) => (
                                <div key={index} className="border-l-4 border-purple-500 pl-4">
                                    <div className="font-semibold text-black">{project.name}</div>
                                    <div className="text-black mt-2">{project.description}</div>
                                    {project.technologies && project.technologies.length > 0 && (
                                        <div className="mt-2">
                                            <span className="font-semibold text-black">Technologies:</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {project.technologies.map((tech, i) => (
                                                    <span key={i} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {project.achievements && project.achievements.length > 0 && (
                                        <div className="mt-2">
                                            <span className="font-semibold text-black">Achievements:</span>
                                            <ul className="list-disc list-inside mt-1">
                                                {project.achievements.map((achievement, i) => (
                                                    <li key={i} className="text-black">{achievement}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Certifications */}
                {resumeData.certifications && resumeData.certifications.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4 text-black">Certifications & Achievements</h3>
                        <div className="space-y-4">
                            {resumeData.certifications.map((cert, index) => (
                                <div key={index} className="flex items-start">
                                    <div className="flex-1">
                                        <div className="font-semibold text-black">{cert.name}</div>
                                        <div className="text-black">{cert.issuer}</div>
                                    </div>
                                    {cert.date && <div className="text-black">{cert.date}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-black">ScholarSync Dashboard</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h1 className="text-3xl font-bold text-black mb-8">ScholarSync Dashboard</h1>

                        {/* Navigation Tabs */}
                        <div className="border-b border-gray-200 mb-8">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('resume')}
                                    className={`${activeTab === 'resume'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Resume Upload
                                </button>
                                <button
                                    onClick={() => setActiveTab('scholar')}
                                    className={`${activeTab === 'scholar'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Scholar Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab('suggestions')}
                                    className={`${activeTab === 'suggestions'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Project Suggestions
                                </button>
                            </nav>
                        </div>

                        {/* Content Sections */}
                        <div className="mt-6">
                            {activeTab === 'resume' && (
                                <div className="space-y-8">
                                    <ResumeUpload />
                                    {renderResumeData()}
                                </div>
                            )}
                            {activeTab === 'scholar' && <ScholarProfile />}
                            {activeTab === 'suggestions' && <ProjectSuggestions />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 