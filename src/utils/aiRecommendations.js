import { saveRecommendation } from './storage';

const RATING_LABELS = {
  too_easy: 'Too Easy',
  good: 'Good',
  hard: 'Hard',
  failed: 'Failed Reps',
};

// Rule-based fallback (no API key needed)
export const getRuleBasedRecommendation = (exercise, week) => {
  const { sets, rating } = exercise;
  if (!sets || sets.length === 0) return null;

  const weights = sets.map(s => s.weight).filter(Boolean);
  const avgWeight = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;
  const allRepsCompleted = sets.every(s => s.reps >= 8);

  let newWeight = avgWeight;
  let reason = '';

  if (rating === 'too_easy') {
    newWeight = Math.ceil((avgWeight * 1.1) / 2.5) * 2.5; // +10%, rounded to 2.5
    reason = 'Too easy — bumping up 10%';
  } else if (rating === 'good' && allRepsCompleted) {
    newWeight = Math.ceil((avgWeight * 1.05) / 2.5) * 2.5; // +5%
    reason = 'Solid — small increase to keep progressing';
  } else if (rating === 'good') {
    newWeight = avgWeight;
    reason = 'Good effort — keep same weight, nail all 8 reps';
  } else if (rating === 'hard') {
    newWeight = avgWeight;
    reason = 'Hard but manageable — hold weight, improve reps';
  } else if (rating === 'failed') {
    newWeight = Math.floor((avgWeight * 0.95) / 2.5) * 2.5; // -5%
    reason = 'Missed reps — drop slightly and lock in form';
  }

  // Week 8 deload: override to -20%
  if (week === 8) {
    newWeight = Math.floor((avgWeight * 0.8) / 2.5) * 2.5;
    reason = 'Deload week — backing off to recover';
  }

  return {
    weight: newWeight > 0 ? newWeight : avgWeight,
    reason,
    source: 'rule',
  };
};

// Claude API-powered recommendation
export const getAIRecommendation = async (session, apiKey) => {
  const weekConfig = [
    { week: 1, sets: 3, rpe: 'Moderate' },
    { week: 2, sets: 3, rpe: 'Moderate-High' },
    { week: 3, sets: 3, rpe: 'High' },
    { week: 4, sets: 3, rpe: 'Very High' },
    { week: 5, sets: 4, rpe: 'High-Very High' },
    { week: 6, sets: 4, rpe: 'Max Effort' },
    { week: 7, sets: 5, rpe: 'Max Effort' },
    { week: 8, sets: 3, rpe: 'Low-Moderate (Deload)' },
  ];

  const nextWeek = Math.min(session.week + 1, 8);
  const nextWeekConfig = weekConfig[nextWeek - 1];

  const exerciseSummary = session.exercises
    .filter(ex => ex.sets?.length > 0)
    .map(ex => {
      const setLines = ex.sets
        .map((s, i) => `  Set ${i + 1}: ${s.weight}kg × ${s.reps} reps`)
        .join('\n');
      return `Exercise: ${ex.name}${ex.note ? ` (${ex.note})` : ''}
${setLines}
User Rating: ${RATING_LABELS[ex.rating] || 'Not rated'}`;
    })
    .join('\n\n');

  const prompt = `You are a strength and conditioning coach specializing in progressive overload for body recomposition.

A client just completed Week ${session.week} of an 8-week program: ${session.dayName}

Here is their performance:

${exerciseSummary}

Next week is Week ${nextWeek} — Target: ${nextWeekConfig.sets} sets × 8 reps @ ${nextWeekConfig.rpe}.

For EACH exercise, provide:
1. Recommended weight for next session (in kg)
2. One-line reason (max 10 words)

Format your response as JSON like this:
{
  "recommendations": [
    { "name": "Exercise Name", "weight": 25, "reason": "brief reason here" }
  ]
}

Be direct. No fluff. Only JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const text = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.recommendations || [];
  } catch (err) {
    console.error('AI recommendation failed:', err);
    return null;
  }
};

// Main function: tries AI first, falls back to rules
export const generateRecommendations = async (session, apiKey) => {
  let aiResults = null;

  if (apiKey) {
    aiResults = await getAIRecommendation(session, apiKey);
  }

  const results = {};

  session.exercises.forEach((ex, i) => {
    const ruleRec = getRuleBasedRecommendation(ex, session.week);

    if (aiResults && aiResults[i]) {
      const ai = aiResults[i];
      results[ex.exerciseId] = {
        weight: ai.weight,
        reason: ai.reason,
        source: 'ai',
      };
    } else if (ruleRec) {
      results[ex.exerciseId] = ruleRec;
    }

    if (results[ex.exerciseId]) {
      saveRecommendation(ex.exerciseId, results[ex.exerciseId]);
    }
  });

  return results;
};
