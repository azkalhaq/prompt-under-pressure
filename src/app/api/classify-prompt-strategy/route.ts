import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/chatgpt';
import { getSupabaseServerClient } from '@/lib/supabase';

export interface PromptStrategyClassification {
  prompt_strategy_classification: string;
  prompt_strategy_justification: string;
}

// Helper function to classify a single interaction
async function classifySingleInteraction(interaction: { id: string; prompt: string; response?: string }, sessionId: string) {
  console.log(`🔍 Starting prompt strategy classification for interaction ${interaction.id}`);
  const supabase = getSupabaseServerClient();

  // Check if classification already exists
  const { data: existingData } = await supabase
    .from('chat_interactions')
    .select('prompt_strategy_classification')
    .eq('id', interaction.id)
    .single();

  if (existingData && existingData.prompt_strategy_classification !== null) {
    console.log(`⚠️ Interaction ${interaction.id} already has classification:`, existingData.prompt_strategy_classification);
    return { success: true, message: 'Already classified' };
  }

  console.log(`📝 Interaction ${interaction.id} needs classification, proceeding...`);

  // Prepare the classification prompt
  const classificationPrompt = `You are a precise classifier that identifies the prompting strategy/technique used in user-generated prompts. Focus only on the user's prompt and classify it into one of the observable User-Level categories.

Classify the prompting strategy/technique used at the observable levels in this experiment. Use these categories and levels as applicable (pick the most applicable one):

OBSERVABLE USER-LEVEL CATEGORIES (DEFINITIONS & DETECTION RULES)

Direct Instruction
1) zero-shot — Chat Level
   • Definition: A direct instruction or question with no explicit examples and no explicit reasoning scaffold.
   • Detection: Single user message asks for an answer or action; no input–output exemplars; no “think step by step” or similar.

Example-driven
2) one-shot — Chat Level
   • Definition: The user supplies exactly one explicit example (an input→desired output pair or a template) in the SAME user message as the task.
   • Detection: One worked example present in the prompt text, then the actual query.

3) few-shot — Conversation Level
   • Definition: The user supplies multiple examples (K>1) bundled within the SAME user message, then asks for a completion.
   • Detection: Several input–output pairs or cases embedded directly in the prompt.

4) multi-shot — Conversation Level
   • Definition: The user provides multiple examples incrementally across several turns, expanding or refining them to help the model generalize better.
   • Detection: User iteratively adds more examples or variations in subsequent messages, often after seeing partial success or failure.

Reasoning based
5) Chain-of-Thought (CoT) — Chat Level
   • Definition: The user explicitly asks the model to show intermediate reasoning steps or provides a reasoning scaffold (e.g., “explain your steps”, “derive step by step”, bullet-pointed reasoning slots).
   • Detection: Phrases like “show your reasoning”, “walk through the logic”, “explain step by step” OR a structured reasoning template.

6) Automated CoT — Chat Level
   • Definition: The user triggers reasoning with generic cues rather than a full scaffold, e.g., “Let’s think step by step”, “think carefully”, “first principles”, without providing an explicit multi-step template.
   • Detection: Presence of generic reasoning triggers (classic Automated-CoT cues) in the current prompt.

Other
7) Interactive Prompting — Conversation Level
   • Definition: The user engages in an iterative, multi-turn dialog to refine the task via clarifications, constraints, or follow-up questions (no tool-use structure).
   • Detection: Across the provided chat history, the user asks iterative clarifications/refinements before the current request.

8) ReAct — Conversation Level
   • Definition: The user instructs the model to alternate explicit reasoning and actions (e.g., “Reason/Act/Observation” loops) or to use tools/queries based on reasoning traces.
   • Detection: The prompt asks for interleaved “Reason → Act → Observe” style flows, mentions actions/tools to be chosen after reasoning, or includes an explicit ReAct template.

NON-OBSERVABLE (DO NOT CHOOSE IN THIS EXPERIMENT)
System-Level Prompting: 9) RAG, 10) ToT, 11) APE, 12) Reflexion, 13) Active-Prompt, 14) ART, 15) Prompt Chaining, 
16) Generated Knowledge Prompting, 17) Meta Prompting. 
These rely on system orchestration or hidden pipelines and are NON-OBSERVABLE here — do NOT select them.

TIE-BREAK & EDGE-CASE RULES
A. Specificity over generality: If CoT cues are present along with examples, prefer the reasoning category (5 or 6) over example-driven categories (2–4).
B. Automated CoT vs CoT: If the prompt uses generic triggers (“Let’s think step by step”) without a concrete reasoning scaffold/template, choose 6) Automated CoT. 
   If it explicitly asks to show steps or provides a structured scaffold, choose 5) Chain-of-Thought (CoT).
C. Few-shot vs Multi-shot: 
   • Few-shot (3) = multiple examples provided within the same user message (chat-level).
   • Multi-shot (4) = multiple examples incrementally added across turns (conversation-level).
D. One-shot vs Zero-shot: If exactly one example appears in the SAME message, choose 2) one-shot; otherwise default to 1) zero-shot if no examples and no reasoning cues.
E. Interactive Prompting vs Others: If the chat history shows clear iterative refinement across multiple turns (even if current prompt is simple), choose 7) Interactive Prompting unless a stronger, more specific pattern (e.g., ReAct) is present.
F. ReAct supremacy: If the user explicitly requests reasoning interleaved with actions/observations or a “Reason–Act–Observe” pattern, choose 8) ReAct regardless of examples or CoT cues.

Only choose from the observable User-Level categories (1-8). Additionally, provide a short justification for why this classification fits the user prompt/context.

Return your classification as JSON in the following format:
{
  "prompt_strategy_classification": "one of: zero-shot | one-shot | few-shot | multi-shot | Chain-of-Thought (CoT) | Automated CoT | Interactive Prompting | ReAct",
  "prompt_strategy_justification": "Brief justification for the classification"
}

We would like you to classify the prompting strategy used in the following user prompt:

[The Start of Chat History]
User: ${interaction.prompt}
${interaction.response ? `AI: ${interaction.response}` : ''}
[The End of Chat History]

Please provide your classification following the criteria and output format above.`;

  // Call OpenAI API
  console.log(`🤖 Calling GPT API for classification of interaction ${interaction.id}...`);
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a precise classifier that returns only valid JSON responses for prompt strategy classification. Always return valid JSON with both classification and justification.'
      },
      {
        role: 'user',
        content: classificationPrompt
      }
    ],
    temperature: 0,
    max_tokens: 500
  });

  console.log(`📡 GPT API response received for interaction ${interaction.id}`);

  const classificationText = response.choices[0]?.message?.content;
  if (!classificationText) {
    console.error('❌ No response from OpenAI');
    throw new Error('No response from OpenAI');
  }

  console.log(`📄 GPT response text for interaction ${interaction.id}:`, classificationText.substring(0, 200) + '...');

  // Parse the JSON response
  let classification: PromptStrategyClassification;
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = classificationText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : classificationText;
    console.log(`🔍 Extracted JSON for interaction ${interaction.id}:`, jsonString.substring(0, 200) + '...');
    classification = JSON.parse(jsonString);
    console.log(`✅ Successfully parsed JSON for interaction ${interaction.id}`);
  } catch (error) {
    console.error('❌ Failed to parse classification JSON:', classificationText);
    console.error('Parse error:', error);
    throw new Error('Invalid JSON response from OpenAI');
  }

  // Validate the classification
  const allowedClasses = [
    'zero-shot', 'one-shot', 'few-shot', 'multi-shot',
    'Chain-of-Thought (CoT)', 'Automated CoT', 'Interactive Prompting', 'ReAct'
  ];

  if (typeof classification.prompt_strategy_classification !== 'string' || 
      !allowedClasses.includes(classification.prompt_strategy_classification)) {
    throw new Error(`Invalid prompt_strategy_classification: ${classification.prompt_strategy_classification}`);
  }

  if (typeof classification.prompt_strategy_justification !== 'string' || 
      classification.prompt_strategy_justification.trim().length === 0) {
    throw new Error(`Invalid prompt_strategy_justification: ${classification.prompt_strategy_justification}`);
  }

  // Update the chat interaction with the classification
  console.log(`💾 Updating database for interaction ${interaction.id}...`);
  const { error: updateError } = await supabase
    .from('chat_interactions')
    .update({
      prompt_strategy_classification: classification.prompt_strategy_classification,
      prompt_strategy_justification: classification.prompt_strategy_justification,
    })
    .eq('id', interaction.id)
    .eq('session_id', sessionId);

  if (updateError) {
    console.error('❌ Error updating chat interaction:', updateError);
    throw new Error('Failed to update chat interaction with classification');
  }

  console.log(`✅ Successfully updated database for interaction ${interaction.id}`);
  return { success: true, classification };
}

// Helper function to update session-level classification
async function updateSessionClassification(sessionId: string) {
  console.log(`🔄 Updating session-level classification for session: ${sessionId}`);
  const supabase = getSupabaseServerClient();
  
  // Get all interactions for the session (both classified and unclassified)
  const { data: interactions, error } = await supabase
    .from('chat_interactions')
    .select('id, prompt, response, prompt_strategy_classification')
    .eq('session_id', sessionId)
    .order('prompt_index_no', { ascending: true });

  if (error) {
    console.error('Error fetching interactions for session classification:', error);
    return;
  }

  if (!interactions || interactions.length === 0) {
    console.log('No interactions found for session');
    return;
  }

  // First, try to get GPT to classify the entire conversation
  try {
    console.log(`🤖 Asking GPT to classify entire conversation for session: ${sessionId}`);
    const conversationClassification = await classifyEntireConversation(interactions);
    
    if (conversationClassification) {
      console.log(`✅ GPT classified entire conversation: ${conversationClassification.prompt_strategy_classification}`);
      
      // Update user_sessions table with GPT's conversation-level classification
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({
          session_prompt_strategy_classification: conversationClassification.prompt_strategy_classification,
          session_prompt_strategy_justification: conversationClassification.prompt_strategy_justification
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error updating session classification:', updateError);
      } else {
        console.log(`✅ Successfully updated session classification for ${sessionId}`);
      }
      return;
    }
  } catch (error) {
    console.error('Error in GPT conversation classification:', error);
  }

  // Fallback: Use most common strategy from individual classifications
  console.log(`📊 Falling back to most common individual strategy for session: ${sessionId}`);
  
  const classifiedInteractions = interactions.filter(i => i.prompt_strategy_classification !== null);
  
  if (classifiedInteractions.length === 0) {
    console.log('No classified interactions found for fallback classification');
    return;
  }

  // Count occurrences of each classification
  const classificationCounts = new Map<string, number>();
  classifiedInteractions.forEach(interaction => {
    const classification = interaction.prompt_strategy_classification;
    if (classification) {
      classificationCounts.set(classification, (classificationCounts.get(classification) || 0) + 1);
    }
  });

  // Find the most common classification
  let mostCommonClassification = '';
  let maxCount = 0;
  for (const [classification, count] of classificationCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonClassification = classification;
    }
  }

  // Generate justification for the fallback classification
  const totalInteractions = classifiedInteractions.length;
  const percentage = Math.round((maxCount / totalInteractions) * 100);
  const justification = `Fallback: Most common strategy across ${totalInteractions} interactions (${percentage}% - ${maxCount}/${totalInteractions} interactions)`;

  console.log(`📊 Fallback classification: ${mostCommonClassification} (${maxCount}/${totalInteractions} interactions)`);

  // Update user_sessions table
  const { error: updateError } = await supabase
    .from('user_sessions')
    .update({
      session_prompt_strategy_classification: mostCommonClassification,
      session_prompt_strategy_justification: justification
    })
    .eq('session_id', sessionId);

  if (updateError) {
    console.error('Error updating session classification:', updateError);
  } else {
    console.log(`✅ Successfully updated session classification for ${sessionId}`);
  }
}

// Helper function to ask GPT to classify the entire conversation
async function classifyEntireConversation(interactions: { id: string; prompt: string; response?: string }[]) {
  const client = getOpenAIClient();
  
  // Build the conversation history
  const conversationHistory = interactions
    .map(interaction => `User: ${interaction.prompt}${interaction.response ? `\nAI: ${interaction.response}` : ''}`)
    .join('\n\n');

  const conversationClassificationPrompt = `You are an expert in Large Language Model (LLM) prompting techniques. Your task is to classify the OVERALL prompting strategy used throughout the ENTIRE conversation provided below. Analyze the conversation holistically to determine the primary strategy pattern across all user interactions.

OBSERVABLE USER-LEVEL CATEGORIES (DEFINITIONS & DETECTION RULES)

Direct Instruction
1) zero-shot — Chat Level
   • Definition: A direct instruction or question with no explicit examples and no explicit reasoning scaffold.
   • Detection: Single user message asks for an answer or action; no input–output exemplars; no "think step by step" or similar.

Example-driven
2) one-shot — Chat Level
   • Definition: The user supplies exactly one explicit example (an input→desired output pair or a template) in the SAME user message as the task.
   • Detection: One worked example present in the prompt text, then the actual query.

3) few-shot — Conversation Level
   • Definition: The user supplies multiple examples (K>1) bundled within the SAME user message, then asks for a completion.
   • Detection: Multiple prior user-provided exemplars across earlier messages; current message leverages them.

4) multi-shot — Conversation Level
   • Definition: The user provides multiple examples incrementally across several turns, expanding or refining them to help the model generalize better.
   • Detection: User iteratively adds more examples or variations in subsequent messages, often after seeing partial success or failure.

Reasoning based
5) Chain-of-Thought (CoT) — Chat Level
   • Definition: The user explicitly asks the model to show intermediate reasoning steps or provides a reasoning scaffold (e.g., "explain your steps", "derive step by step", bullet-pointed reasoning slots).
   • Detection: Phrases like "show your reasoning", "walk through the logic", "explain step by step" OR a structured reasoning template.

6) Automated CoT — Chat Level
   • Definition: The user triggers reasoning with generic cues rather than a full scaffold, e.g., "Let's think step by step", "think carefully", "first principles", without providing an explicit multi-step template.
   • Detection: Presence of generic reasoning triggers (classic Automated-CoT cues) in the current prompt.

Other
7) Interactive Prompting — Conversation Level
   • Definition: The user engages in an iterative, multi-turn dialog to refine the task via clarifications, constraints, or follow-up questions (no tool-use structure).
   • Detection: Across the provided chat history, the user asks iterative clarifications/refinements before the current request.

8) ReAct — Conversation Level
   • Definition: The user instructs the model to alternate explicit reasoning and actions (e.g., "Reason/Act/Observation" loops) or to use tools/queries based on reasoning traces.
   • Detection: The prompt asks for interleaved "Reason → Act → Observe" style flows, mentions actions/tools to be chosen after reasoning, or includes an explicit ReAct template.

NON-OBSERVABLE (DO NOT CHOOSE IN THIS EXPERIMENT)
System-Level Prompting: 9) RAG, 10) ToT, 11) APE, 12) Reflexion, 13) Active-Prompt, 14) ART, 15) Prompt Chaining, 
16) Generated Knowledge Prompting, 17) Meta Prompting. 
These rely on system orchestration or hidden pipelines and are NON-OBSERVABLE here — do NOT select them.

TIE-BREAK & EDGE-CASE RULES
A. Specificity over generality: If CoT cues are present along with examples, prefer the reasoning category (5 or 6) over example-driven categories (2–4).
B. Automated CoT vs CoT: If the prompt uses generic triggers ("Let's think step by step") without a concrete reasoning scaffold/template, choose 6) Automated CoT. 
   If it explicitly asks to show steps or provides a structured scaffold, choose 5) Chain-of-Thought (CoT).
C. Few-shot vs Multi-shot: 
   • Few-shot (3) = multiple examples provided within the same user message (chat-level).
   • Multi-shot (4) = multiple examples incrementally added across turns (conversation-level).
D. One-shot vs Zero-shot: If exactly one example appears in the SAME message, choose 2) one-shot; otherwise default to 1) zero-shot if no examples and no reasoning cues.
E. Interactive Prompting vs Others: If the chat history shows clear iterative refinement across multiple turns (even if current prompt is simple), choose 7) Interactive Prompting unless a stronger, more specific pattern (e.g., ReAct) is present.
F. ReAct supremacy: If the user explicitly requests reasoning interleaved with actions/observations or a "Reason–Act–Observe" pattern, choose 8) ReAct regardless of examples or CoT cues.

Please analyze the ENTIRE conversation below and classify the overall prompting strategy used throughout the session. Focus on the dominant pattern across all user interactions, not individual messages.

[The Start of Conversation History]
${conversationHistory}
[The End of Conversation History]

Please return your classification as a JSON object in the following format:
{
  "prompt_strategy_classification": "zero-shot" | "one-shot" | "few-shot" | "multi-shot" | "Chain-of-Thought (CoT)" | "Automated CoT" | "Interactive Prompting" | "ReAct" | "Other",
  "prompt_strategy_justification": "Brief justification for the overall conversation classification"
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert LLM prompting technique classifier that analyzes entire conversations holistically. Always return valid JSON with both classification and justification.'
      },
      {
        role: 'user',
        content: conversationClassificationPrompt
      }
    ],
    temperature: 0,
    max_tokens: 500
  });

  const classificationText = response.choices[0]?.message?.content;
  if (!classificationText) {
    throw new Error('No response from OpenAI for conversation classification');
  }

  let classification: PromptStrategyClassification;
  try {
    const jsonMatch = classificationText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : classificationText;
    classification = JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse conversation classification JSON:', classificationText, error);
    throw new Error('Invalid JSON response from OpenAI for conversation classification');
  }

  const validCategories = [
    "zero-shot", "one-shot", "few-shot", "multi-shot", "Chain-of-Thought (CoT)",
    "Automated CoT", "Interactive Prompting", "ReAct", "Other"
  ];

  if (!validCategories.includes(classification.prompt_strategy_classification) ||
      typeof classification.prompt_strategy_justification !== 'string' ||
      classification.prompt_strategy_justification.trim().length === 0) {
    throw new Error('Invalid conversation classification or justification from OpenAI');
  }

  return classification;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, chatInteractionId, classifyAll } = await request.json();
    console.log('🔍 Prompt Strategy Classification API called:', { sessionId, chatInteractionId, classifyAll });

    if (!sessionId) {
      console.log('❌ No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // If classifyAll is true, find all interactions that need classification
    if (classifyAll) {
      console.log('🔄 Classifying all interactions for session:', sessionId);
      const supabase = getSupabaseServerClient();
      
      // Get all chat interactions for the session that don't have prompt strategy classification
      const { data: interactions, error: fetchError } = await supabase
        .from('chat_interactions')
        .select('id, prompt, response, prompt_strategy_classification')
        .eq('session_id', sessionId);

      if (fetchError) {
        console.error('❌ Error fetching interactions:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch interactions' },
          { status: 500 }
        );
      }

      console.log(`📊 Found ${interactions?.length || 0} total interactions for session`);
      
      // Filter for interactions that need classification
      const interactionsNeedingClassification = interactions?.filter(interaction => 
        interaction.prompt_strategy_classification === null || interaction.prompt_strategy_classification === undefined
      ) || [];
      
      console.log(`📊 Found ${interactionsNeedingClassification.length} interactions needing classification`);
      
      // Debug: Show first few interactions and their values
      console.log('🔍 Debug - First few interactions and their prompt_strategy_classification values:');
      interactions?.slice(0, 3).forEach((interaction, index) => {
        console.log(`  Interaction ${index + 1}:`, {
          id: interaction.id,
          prompt_strategy_classification: interaction.prompt_strategy_classification,
          type: typeof interaction.prompt_strategy_classification
        });
      });

      if (interactionsNeedingClassification.length === 0) {
        console.log('✅ No interactions need classification');
        return NextResponse.json({
          message: 'No interactions need classification',
          classified: 0
        });
      }

      // Classify each interaction
      let classifiedCount = 0;
      for (const interaction of interactionsNeedingClassification) {
        try {
          console.log(`🔍 Classifying interaction ${interaction.id}...`);
          const result = await classifySingleInteraction(interaction, sessionId);
          if (result.success) {
            classifiedCount++;
            console.log(`✅ Successfully classified interaction ${interaction.id}`);
          } else {
            console.log(`⚠️ Interaction ${interaction.id} already classified`);
          }
        } catch (err) {
          console.error(`❌ Failed to classify interaction ${interaction.id}:`, err);
        }
      }

      // Update session-level classification after individual classifications
      if (classifiedCount > 0) {
        await updateSessionClassification(sessionId);
      }

      return NextResponse.json({
        message: `Classified ${classifiedCount} interactions`,
        classified: classifiedCount
      });
    }

    // Single interaction classification
    if (!chatInteractionId) {
      return NextResponse.json(
        { error: 'Chat Interaction ID is required for single classification' },
        { status: 400 }
      );
    }

    // Single interaction classification
    const supabase = getSupabaseServerClient();

    // Get the chat interaction data
    const { data: chatInteraction, error: chatError } = await supabase
      .from('chat_interactions')
      .select('id, prompt, response, prompt_strategy_classification')
      .eq('id', chatInteractionId)
      .eq('session_id', sessionId)
      .single();

    if (chatError || !chatInteraction) {
      return NextResponse.json(
        { error: 'Chat interaction not found' },
        { status: 404 }
      );
    }

    // Check if classification already exists
    const hasExistingClassification = chatInteraction.prompt_strategy_classification !== null;

    if (hasExistingClassification) {
      return NextResponse.json({
        message: 'Classification already exists',
        classification: {
          prompt_strategy_classification: chatInteraction.prompt_strategy_classification,
        }
      });
    }

    // Use the helper function to classify the interaction
    const result = await classifySingleInteraction(chatInteraction, sessionId);
    
    if (result.success) {
      return NextResponse.json({
        message: 'Classification completed successfully',
        classification: result.classification
      });
    } else {
      throw new Error('Classification failed');
    }

  } catch (error) {
    console.error('Error in prompt strategy classification:', error);
    return NextResponse.json(
      { error: 'Failed to classify prompt strategy' },
      { status: 500 }
    );
  }
}
