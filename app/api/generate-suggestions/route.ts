import { NextRequest, NextResponse } from 'next/server';

interface ProjectSuggestion {
  type: 'publication' | 'skill' | 'education';
  title: string;
  description: string;
  relevance: number;
  category: string;
  tags: string[];
}

interface RequestData {
  resumeData: {
    skills: string[];
  };
  scholarData: {
    researchInterests: string[];
  };
}

// Project templates categorized by domain
const projectTemplates = {
  'AI/ML': [
    {
      title: 'Machine Learning Model for {domain}',
      description: 'Develop a machine learning model to solve {domain} problems using {framework}. Implement data preprocessing, model training, and evaluation pipeline.',
      tags: ['Python', 'TensorFlow', 'PyTorch', 'scikit-learn'],
    },
    {
      title: 'Natural Language Processing System',
      description: 'Build an NLP system for {domain} using transformer models. Implement text preprocessing, model fine-tuning, and API integration.',
      tags: ['Python', 'HuggingFace', 'NLP', 'Deep Learning'],
    },
  ],
  'Web Development': [
    {
      title: 'Full-Stack {framework} Application',
      description: 'Create a full-stack application using {framework} for {domain}. Implement responsive design, authentication, and real-time features.',
      tags: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    },
    {
      title: 'Progressive Web App',
      description: 'Develop a PWA for {domain} with offline capabilities, push notifications, and responsive design.',
      tags: ['JavaScript', 'React', 'Service Workers', 'PWA'],
    },
  ],
  'Data Science': [
    {
      title: 'Data Analysis Pipeline',
      description: 'Build a data analysis pipeline for {domain} using Python. Implement data cleaning, visualization, and statistical analysis.',
      tags: ['Python', 'Pandas', 'NumPy', 'Matplotlib'],
    },
    {
      title: 'Big Data Processing System',
      description: 'Create a big data processing system for {domain} using distributed computing frameworks.',
      tags: ['Python', 'Spark', 'Hadoop', 'Data Engineering'],
    },
  ],
  'Cybersecurity': [
    {
      title: 'Security Analysis Tool',
      description: 'Develop a security analysis tool for {domain} with vulnerability scanning and threat detection capabilities.',
      tags: ['Python', 'Security', 'Networking', 'Cryptography'],
    },
    {
      title: 'Secure Authentication System',
      description: 'Build a secure authentication system with multi-factor authentication and encryption.',
      tags: ['JavaScript', 'Security', 'Authentication', 'Cryptography'],
    },
  ],
};

// Skill to domain mapping
const skillToDomain: { [key: string]: string[] } = {
  'Python': ['AI/ML', 'Data Science', 'Cybersecurity'],
  'JavaScript': ['Web Development', 'Cybersecurity'],
  'React': ['Web Development'],
  'Node.js': ['Web Development'],
  'TensorFlow': ['AI/ML'],
  'PyTorch': ['AI/ML'],
  'Pandas': ['Data Science'],
  'Machine Learning': ['AI/ML', 'Data Science'],
  'Deep Learning': ['AI/ML'],
  'NLP': ['AI/ML'],
  'Data Analysis': ['Data Science'],
  'Security': ['Cybersecurity'],
};

// Research interest to domain mapping
const interestToDomain: { [key: string]: string[] } = {
  'Artificial Intelligence': ['AI/ML'],
  'Machine Learning': ['AI/ML'],
  'Natural Language Processing': ['AI/ML'],
  'Computer Vision': ['AI/ML'],
  'Data Mining': ['Data Science'],
  'Big Data': ['Data Science'],
  'Web Development': ['Web Development'],
  'Cybersecurity': ['Cybersecurity'],
  'Network Security': ['Cybersecurity'],
  'Software Engineering': ['Web Development'],
};

function calculateRelevance(
  suggestion: Omit<ProjectSuggestion, 'relevance'>,
  skills: string[],
  interests: string[]
): number {
  let relevance = 0;
  
  // Check skill matches
  suggestion.tags.forEach(tag => {
    if (skills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()))) {
      relevance += 2;
    }
  });

  // Check interest matches
  if (interests.some(interest => 
    suggestion.description.toLowerCase().includes(interest.toLowerCase())
  )) {
    relevance += 1;
  }

  return relevance;
}

function generateSuggestions(
  skills: string[],
  interests: string[]
): ProjectSuggestion[] {
  const suggestions: ProjectSuggestion[] = [];
  const domains = new Set<string>();

  // Determine relevant domains from skills
  skills.forEach(skill => {
    const skillDomains = skillToDomain[skill] || [];
    skillDomains.forEach(domain => domains.add(domain));
  });

  // Add domains from research interests
  interests.forEach(interest => {
    const interestDomains = interestToDomain[interest] || [];
    interestDomains.forEach(domain => domains.add(domain));
  });

  // Generate suggestions for each domain
  domains.forEach(domain => {
    const templates = projectTemplates[domain as keyof typeof projectTemplates] || [];
    
    templates.forEach(template => {
      // Replace placeholders with actual values
      const title = template.title.replace('{domain}', domain);
      const description = template.description
        .replace('{domain}', domain)
        .replace('{framework}', template.tags[0]);

      const suggestionBase = {
        type: 'skill' as const,
        title,
        description,
        category: domain,
        tags: template.tags,
      };

      const suggestion: ProjectSuggestion = {
        ...suggestionBase,
        relevance: calculateRelevance(suggestionBase, skills, interests),
      };

      suggestions.push(suggestion);
    });
  });

  // Sort by relevance and limit to top 5
  return suggestions
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const { resumeData, scholarData }: RequestData = await request.json();

    if (!resumeData?.skills || !scholarData?.researchInterests) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    const suggestions = generateSuggestions(
      resumeData.skills,
      scholarData.researchInterests
    );

    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
} 