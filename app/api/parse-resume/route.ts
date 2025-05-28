import { NextRequest, NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

// Initialize PDF.js worker
const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface Contact {
    email?: string;
    phone?: string;
    linkedin?: string;
    portfolio?: string;
}

interface Education {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    location?: string;
}

interface Skills {
    technical: string[];
    soft: string[];
    tools: string[];
    languages: string[];
}

interface Experience {
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description: string[];
    location?: string;
}

interface Project {
    name: string;
    description: string;
    technologies: string[];
    achievements?: string[];
    startDate?: string;
    endDate?: string;
}

interface Certification {
    name: string;
    issuer: string;
    date?: string;
    credentialId?: string;
}

interface ResumeData {
    name: string;
    contact: {
        email?: string;
        phone?: string;
        linkedin?: string;
        portfolio?: string;
    };
    education: Education[];
    skills: Skills;
    experience: Experience[];
    projects: Project[];
    certifications: Certification[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Log file details for debugging
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    });

    // Validate file type
    if (!file.name.match(/\.(pdf|docx)$/i)) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are allowed' },
        { status: 400 }
      );
    }

    // Convert file to appropriate format
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    let text = '';
    let parsedData = {};

    // Parse based on file type
    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;
        const textContent = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => item.str)
            .join(' ');
          textContent.push(pageText);
        }
        
        text = textContent.join('\n');
      } catch (error) {
        console.error('Error parsing PDF:', error);
        return NextResponse.json(
          { error: 'Failed to parse PDF file' },
          { status: 500 }
        );
      }
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      try {
        console.log('Parsing DOCX file...');
        const result = await mammoth.extractRawText({ buffer: Buffer.from(uint8Array) });
        text = result.value;
        console.log('DOCX parsing completed');
      } catch (error: any) {
        console.error('Error parsing DOCX:', error);
        throw new Error(`Failed to parse DOCX file: ${error?.message || 'Unknown error'}`);
      }
    }

    if (!text) {
      return NextResponse.json(
        { error: 'No text content could be extracted from the file' },
        { status: 400 }
      );
    }

    // Parse the extracted text to get structured data
    try {
      parsedData = parseResumeText(text);
    } catch (error: any) {
      console.error('Error extracting data:', error);
      throw new Error(`Failed to extract data from resume: ${error?.message || 'Unknown error'}`);
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error in parse-resume route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to parse resume' },
      { status: 500 }
    );
  }
}

function parseResumeText(text: string): ResumeData {
    // Split text into lines and clean up
    const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    // Initialize data structure
    const data: ResumeData = {
        name: '',
        contact: {
            email: '',
            phone: '',
            linkedin: '',
            portfolio: ''
        },
        education: [],
        skills: {
            technical: [],
            soft: [],
            tools: [],
            languages: []
        },
        experience: [],
        projects: [],
        certifications: []
    };

    // Extract name with more sophisticated pattern
    const namePattern = /^([A-Z][A-Z\s]+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s*[-–—]\s*[A-Z][A-Za-z\s]+)?$/;
    for (let i = 0; i < Math.min(3, lines.length); i++) {
        const nameMatch = lines[i].match(namePattern);
        if (nameMatch) {
            data.name = nameMatch[1].trim();
            break;
        }
    }

    // Extract contact information with structured format
    const contactPatterns = {
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
        phone: /(?:\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/,
        linkedin: /linkedin\.com\/in\/[a-zA-Z0-9-]+/,
        portfolio: /(?:https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9-]+)*/
    };

    // Process contact information only once
    let contactProcessed = false;
    lines.forEach(line => {
        if (!contactProcessed) {
            Object.entries(contactPatterns).forEach(([type, pattern]) => {
                const match = line.match(pattern);
                if (match) {
                    data.contact[type as keyof typeof data.contact] = match[0];
                }
            });
            // Check if all contact fields are filled
            if (Object.values(data.contact).every(value => value !== '')) {
                contactProcessed = true;
            }
        }
    });

    // Define section patterns with more specific boundaries
    const sectionPatterns = {
        education: /EDUCATION\s*([\s\S]*?)(?=SKILLS|EXPERIENCE|PROJECTS|CERTIFICATIONS|$)/i,
        skills: /SKILLS\s*([\s\S]*?)(?=EDUCATION|EXPERIENCE|PROJECTS|CERTIFICATIONS|$)/i,
        experience: /EXPERIENCE\s*([\s\S]*?)(?=EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|$)/i,
        projects: /PROJECTS\s*([\s\S]*?)(?=EDUCATION|SKILLS|EXPERIENCE|CERTIFICATIONS|$)/i,
        certifications: /CERTIFICATIONS\s*(?:&|AND)?\s*ACHIEVEMENTS\s*([\s\S]*?)$/i
    };

    // Extract sections using patterns
    let processedText = text;
    Object.entries(sectionPatterns).forEach(([section, pattern]) => {
        const match = processedText.match(pattern);
        if (match && match[1]) {
            const sectionContent = match[1]
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            switch (section) {
                case 'education':
                    processEducationSection(sectionContent, data);
                    break;
                case 'skills':
                    processSkillsSection(sectionContent, data);
                    break;
                case 'experience':
                    processExperienceSection(sectionContent, data);
                    break;
                case 'projects':
                    processProjectsSection(sectionContent, data);
                    break;
                case 'certifications':
                    processCertificationsSection(sectionContent, data);
                    break;
            }

            // Remove the processed section from the text to prevent duplicate matches
            processedText = processedText.replace(match[0], '');
        }
    });

    return data;
}

function processEducationSection(content: string[], resumeData: ResumeData) {
    let currentEducation: Partial<Education> = {};
    let isNewEntry = true;

    for (const line of content) {
        // Check for institution name (usually contains university, college, etc.)
        if (isNewEntry && /(university|college|institute|school)/i.test(line)) {
            if (Object.keys(currentEducation).length > 0) {
                resumeData.education.push(currentEducation as Education);
            }
            currentEducation = { institution: line };
            isNewEntry = false;
            continue;
        }

        // Check for degree
        if (!currentEducation.degree && /(bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?e\.?|m\.?e\.?)/i.test(line)) {
            currentEducation.degree = line;
            continue;
        }

        // Check for field of study
        if (!currentEducation.fieldOfStudy && /(computer science|engineering|mathematics|physics|chemistry|biology)/i.test(line)) {
            currentEducation.fieldOfStudy = line;
            continue;
        }

        // Check for dates
        if (!currentEducation.startDate && /(20\d{2}|19\d{2})/.test(line)) {
            const dates = line.match(/(20\d{2}|19\d{2})/g);
            if (dates) {
                currentEducation.startDate = dates[0];
                if (dates.length > 1) {
                    currentEducation.endDate = dates[1];
                }
            }
            continue;
        }

        // Check for GPA
        if (!currentEducation.gpa && /gpa|grade point average/i.test(line)) {
            const gpaMatch = line.match(/\d\.\d{1,2}/);
            if (gpaMatch) {
                currentEducation.gpa = gpaMatch[0];
            }
        }
    }

    // Add the last education entry
    if (Object.keys(currentEducation).length > 0) {
        resumeData.education.push(currentEducation as Education);
    }
}

function processSkillsSection(content: string[], resumeData: ResumeData) {
    const skillCategories = {
        technical: /(programming|development|software|technical|frameworks|languages|databases|cloud|devops|ai|ml|data science)/i,
        soft: /(communication|leadership|teamwork|problem-solving|management|soft skills)/i,
        tools: /(tools|software|platforms|environments|ide|version control|git|github)/i,
        languages: /(languages|fluent|proficient|native|bilingual)/i
    };

    let currentCategory = 'technical';

    for (const line of content) {
        // Check for category headers
        for (const [category, pattern] of Object.entries(skillCategories)) {
            if (pattern.test(line)) {
                currentCategory = category;
                continue;
            }
        }

        // Process skills in the line
        const skills = line.split(/[,•|]/).map(skill => skill.trim()).filter(skill => skill.length > 0);
        
        // Add skills to appropriate category
        for (const skill of skills) {
            if (!resumeData.skills[currentCategory as keyof typeof resumeData.skills].includes(skill)) {
                resumeData.skills[currentCategory as keyof typeof resumeData.skills].push(skill);
            }
        }
    }
}

function processExperienceSection(content: string[], resumeData: ResumeData) {
    let currentExperience: Partial<Experience> = {};
    let isNewEntry = true;

    for (const line of content) {
        // Check for company name (usually contains company, inc, ltd, etc.)
        if (isNewEntry && /(inc\.?|ltd\.?|llc|corp\.?|company)/i.test(line)) {
            if (Object.keys(currentExperience).length > 0) {
                resumeData.experience.push(currentExperience as Experience);
            }
            currentExperience = { company: line };
            isNewEntry = false;
            continue;
        }

        // Check for position
        if (!currentExperience.position && /(engineer|developer|analyst|manager|director|lead|architect)/i.test(line)) {
            currentExperience.position = line;
            continue;
        }

        // Check for dates
        if (!currentExperience.startDate && /(20\d{2}|19\d{2})/.test(line)) {
            const dates = line.match(/(20\d{2}|19\d{2})/g);
            if (dates) {
                currentExperience.startDate = dates[0];
                if (dates.length > 1) {
                    currentExperience.endDate = dates[1];
                }
            }
            continue;
        }

        // Check for description points
        if (line.startsWith('•') || line.startsWith('-')) {
            if (!currentExperience.description) {
                currentExperience.description = [];
            }
            currentExperience.description.push(line.replace(/^[•-]\s*/, ''));
        }
    }

    // Add the last experience entry
    if (Object.keys(currentExperience).length > 0) {
        resumeData.experience.push(currentExperience as Experience);
    }
}

function processProjectsSection(content: string[], resumeData: ResumeData) {
    let currentProject: Partial<Project> = {};
    let isNewEntry = true;

    for (const line of content) {
        // Check for project name (usually starts with a title)
        if (isNewEntry && line.length > 0 && !line.startsWith('•') && !line.startsWith('-')) {
            if (Object.keys(currentProject).length > 0) {
                resumeData.projects.push(currentProject as Project);
            }
            currentProject = { name: line };
            isNewEntry = false;
            continue;
        }

        // Check for description
        if (!currentProject.description && line.length > 0) {
            currentProject.description = line;
            continue;
        }

        // Check for technologies
        if (line.includes('Technologies:') || line.includes('Tech Stack:')) {
            const techs = line.split(':')[1].split(/[,•|]/).map(tech => tech.trim()).filter(tech => tech.length > 0);
            currentProject.technologies = techs;
            continue;
        }

        // Check for achievements
        if (line.startsWith('•') || line.startsWith('-')) {
            if (!currentProject.achievements) {
                currentProject.achievements = [];
            }
            currentProject.achievements.push(line.replace(/^[•-]\s*/, ''));
        }
    }

    // Add the last project entry
    if (Object.keys(currentProject).length > 0) {
        resumeData.projects.push(currentProject as Project);
    }
}

function processCertificationsSection(content: string[], resumeData: ResumeData) {
    let currentCert: Partial<Certification> = {};
    let isNewEntry = true;

    for (const line of content) {
        // Check for certification name
        if (isNewEntry && line.length > 0 && !line.startsWith('•') && !line.startsWith('-')) {
            if (Object.keys(currentCert).length > 0) {
                resumeData.certifications.push(currentCert as Certification);
            }
            currentCert = { name: line };
            isNewEntry = false;
            continue;
        }

        // Check for issuer
        if (!currentCert.issuer && /(issued by|from|by)/i.test(line)) {
            currentCert.issuer = line.replace(/(issued by|from|by)/i, '').trim();
            continue;
        }

        // Check for date
        if (!currentCert.date && /(20\d{2}|19\d{2})/.test(line)) {
            const dateMatch = line.match(/(20\d{2}|19\d{2})/);
            if (dateMatch) {
                currentCert.date = dateMatch[0];
            }
        }

        // Check for credential ID
        if (!currentCert.credentialId && /(credential|id|number)/i.test(line)) {
            const idMatch = line.match(/[A-Z0-9-]+/);
            if (idMatch) {
                currentCert.credentialId = idMatch[0];
            }
        }
    }

    // Add the last certification entry
    if (Object.keys(currentCert).length > 0) {
        resumeData.certifications.push(currentCert as Certification);
    }
} 