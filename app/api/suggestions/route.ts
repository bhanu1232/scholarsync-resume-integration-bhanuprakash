import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini API
const apiKey = "AIzaSyB73gVVIQZKuCAmtNMLduYHWCPcFVS7YmQ";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    try {
        // Check if API key is configured
        if (!apiKey) {
            console.error('Gemini API key is not configured');
            return NextResponse.json(
                { error: 'Gemini API key is not configured' },
                { status: 500 }
            );
        }

        const { skills, interests } = await req.json();

        if (!skills || !interests || !Array.isArray(skills) || !Array.isArray(interests)) {
            return NextResponse.json(
                { error: 'Skills and interests must be arrays' },
                { status: 400 }
            );
        }

        const prompt = `You are a project suggestion AI. Based on the following skills and interests, suggest 3 innovative project ideas. Return ONLY a JSON array, no other text.

Skills: ${skills.join(', ')}
Interests: ${interests.join(', ')}

Each project in the array should have these exact fields:
{
  "title": "string",
  "description": "string",
  "learningOutcomes": ["string"],
  "technologies": ["string"],
  "difficultyLevel": "Beginner|Intermediate|Advanced",
  "potentialImpact": "string"
}

Example format:
[
  {
    "title": "Project Name",
    "description": "Brief description",
    "learningOutcomes": ["Outcome 1", "Outcome 2"],
    "technologies": ["Tech 1", "Tech 2"],
    "difficultyLevel": "Intermediate",
    "potentialImpact": "Impact description"
  }
]`;

        // Initialize the model with the correct model name
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Generate content with safety settings
        const generationConfig = {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        };

        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            }
        ];

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
            safetySettings,
        });

        const response = await result.response;
        const text = response.text();

        // Parse the response to ensure it's valid JSON
        let suggestions;
        try {
            // Clean the response text to ensure it's valid JSON
            const cleanedText = text.trim().replace(/^```json\n?|\n?```$/g, '');
            suggestions = JSON.parse(cleanedText);
            
            if (!Array.isArray(suggestions)) {
                throw new Error('Response is not an array');
            }

            // Validate each suggestion has the required fields
            suggestions = suggestions.map(suggestion => ({
                title: suggestion.title || 'Untitled Project',
                description: suggestion.description || 'No description provided',
                learningOutcomes: Array.isArray(suggestion.learningOutcomes) ? suggestion.learningOutcomes : [],
                technologies: Array.isArray(suggestion.technologies) ? suggestion.technologies : [],
                difficultyLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(suggestion.difficultyLevel) 
                    ? suggestion.difficultyLevel 
                    : 'Intermediate',
                potentialImpact: suggestion.potentialImpact || 'No impact description provided'
            }));

        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            console.error('Raw response:', text);
            throw new Error('Failed to parse project suggestions from AI response');
        }

        return NextResponse.json({ suggestions });

    } catch (error: any) {
        console.error('Error in suggestions API:', error);
        
        // Handle specific error cases
        if (error.message.includes('API key')) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured' },
                { status: 500 }
            );
        }

        if (error.message.includes('rate limit')) {
            return NextResponse.json(
                { error: 'Gemini API rate limit exceeded' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to generate project suggestions' },
            { status: 500 }
        );
    }
} 