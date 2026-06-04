const QuizEngine = {
  
  async generate(lesson) {
    if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      throw new Error('Groq API key not set. Please edit config.js.');
    }

    const prompt = `You are a quiz generator for an online course.

Lesson title: "${lesson.title}"
${lesson.description ? `Lesson description: "${lesson.description}"` : ''}

Generate exactly ${CONFIG.QUIZ_QUESTIONS} multiple-choice questions to test understanding of this lesson.

Rules:
- Each question has exactly 4 options (A, B, C, D)
- Exactly one option is correct
- Questions should test conceptual understanding, not just trivia
- Keep questions concise and clear
-Question should only be in English even if content is in Hindi

Respond ONLY with valid JSON in this exact format, no extra text:
{
  "questions": [
    {
      "q": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0
    }
  ]
}

Where "answer" is the 0-based index of the correct option.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: CONFIG.GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Groq API error');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid quiz format from AI');
    }

    return parsed.questions;
  },

 
  score(questions, userAnswers) {
    let correct = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  },
};
