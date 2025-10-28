import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/chatgpt';
import { getSupabaseServerClient } from '@/lib/supabase';

export interface StructuralQualityEvaluation {
  task_intent_specification: number;
  goal_objective_articulation: number;
  persona_role_definition: number;
  step_by_step_decomposition: number;
  chain_of_thought_structure: number;
  context_provisioning: number;
  reference_use: number;
  example_use: number;
  tonality_writing_style: number;
  output_format_specification: number;
  information_hierarchy: number;
  // Comments for justifications
  task_intent_specification_comment: string;
  goal_objective_articulation_comment: string;
  persona_role_definition_comment: string;
  step_by_step_decomposition_comment: string;
  chain_of_thought_structure_comment: string;
  context_provisioning_comment: string;
  reference_use_comment: string;
  example_use_comment: string;
  tonality_writing_style_comment: string;
  output_format_specification_comment: string;
  information_hierarchy_comment: string;
}

// Helper function to evaluate a single interaction
async function evaluateSingleInteraction(interaction: { id: string; prompt: string; response?: string }, sessionId: string) {
  console.log(`🔍 Starting evaluation for interaction ${interaction.id}`);
  const supabase = getSupabaseServerClient();

  // Check if evaluation already exists
  const { data: existingData } = await supabase
    .from('chat_interactions')
    .select('task_intent_specification')
    .eq('id', interaction.id)
    .single();

  if (existingData && existingData.task_intent_specification !== null) {
    console.log(`⚠️ Interaction ${interaction.id} already has evaluation:`, existingData.task_intent_specification);
    return { success: true, message: 'Already evaluated' };
  }

  console.log(`📝 Interaction ${interaction.id} needs evaluation, proceeding...`);

  // Prepare the evaluation prompt
  const evaluationPrompt = `You are a precise and objective evaluator that assesses the **structural quality** of user-generated prompts in a User–LLM interaction. You focus exclusively on how well the prompt conveys intent, context, and structure — not on its linguistic correctness or the AI's response quality. You return your evaluation as a JSON object.

Structural quality refers to how effectively the prompt guides the LLM toward the user's intended goal by specifying task intent, goal articulation, role/persona, decomposition, reasoning flow, context, and expected output format.

Each prompt should be evaluated along the following 11 dimensions:

1. **Task/Intent Specification** – Does the prompt clearly specify what the AI should do?
2. **Goal/Objective Articulation** – Does it express the intended outcome or goal?
3. **Persona/Role Definition** – Does it define a role or perspective for the AI to adopt (e.g., "act as a teacher")?
4. **Step-by-Step/Decomposition** – Does it break the task into sub-steps or logical parts?
5. **Chain-of-Thought Structure** – Does it encourage reasoning or explanation before the answer?
6. **Context Provisioning** – Does it provide relevant background or situational context to guide the AI?
7. **Reference** – Does it include references to external material, examples, or previous turns?
8. **Example** – Does it demonstrate what the expected response should look like?
9. **Tonality** – Does it specify tone, style, or emotional intent (e.g., "formal," "friendly")?
10. **Output/Format Specification** – Does it define the expected output structure or format (e.g., table, list, JSON)?
11. **Information Hierarchy** – Is information organized clearly and logically within the prompt?

Use the following 5-point scale for each dimension:

1 = Not present  
2 = Weak or vague  
3 = Adequate  
4 = Strong  
5 = Excellent

Finally, return your structured evaluation as JSON in the following format:
{
  "task_intent_specification": 1-5,
  "goal_objective_articulation": 1-5,
  "persona_role_definition": 1-5,
  "step_by_step_decomposition": 1-5,
  "chain_of_thought_structure": 1-5,
  "context_provisioning": 1-5,
  "reference_use": 1-5,
  "example_use": 1-5,
  "tonality_writing_style": 1-5,
  "output_format_specification": 1-5,
  "information_hierarchy": 1-5,
  "task_intent_specification_comment": "Brief justification for the score",
  "goal_objective_articulation_comment": "Brief justification for the score",
  "persona_role_definition_comment": "Brief justification for the score",
  "step_by_step_decomposition_comment": "Brief justification for the score",
  "chain_of_thought_structure_comment": "Brief justification for the score",
  "context_provisioning_comment": "Brief justification for the score",
  "reference_use_comment": "Brief justification for the score",
  "example_use_comment": "Brief justification for the score",
  "tonality_writing_style_comment": "Brief justification for the score",
  "output_format_specification_comment": "Brief justification for the score",
  "information_hierarchy_comment": "Brief justification for the score"
}

We would like you to evaluate the structural quality of the user's prompt(s) within the following conversation. Focus only on the user's prompts, not the AI's responses. Assess how effectively each prompt is structured to communicate its purpose and intent to the AI.

[The Start of Chat History]
User: ${interaction.prompt}
${interaction.response ? `AI: ${interaction.response}` : ''}
[The End of Chat History]

Please provide your evaluation following the criteria and output format above.`;

  // Call OpenAI API
  console.log(`🤖 Calling GPT API for interaction ${interaction.id}...`);
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a precise evaluator that returns only valid JSON responses for structural quality assessment. Always return valid JSON with both scores and comments.'
      },
      {
        role: 'user',
        content: evaluationPrompt
      }
    ],
    temperature: 0,
    max_tokens: 1000
  });

  console.log(`📡 GPT API response received for interaction ${interaction.id}`);

  const evaluationText = response.choices[0]?.message?.content;
  if (!evaluationText) {
    console.error('❌ No response from OpenAI');
    throw new Error('No response from OpenAI');
  }

  console.log(`📄 GPT response text for interaction ${interaction.id}:`, evaluationText.substring(0, 200) + '...');

  // Parse the JSON response
  let evaluation: StructuralQualityEvaluation;
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : evaluationText;
    console.log(`🔍 Extracted JSON for interaction ${interaction.id}:`, jsonString.substring(0, 200) + '...');
    evaluation = JSON.parse(jsonString);
    console.log(`✅ Successfully parsed JSON for interaction ${interaction.id}`);
  } catch (error) {
    console.error('❌ Failed to parse evaluation JSON:', evaluationText);
    console.error('Parse error:', error);
    throw new Error('Invalid JSON response from OpenAI');
  }

  // Validate the evaluation scores
  const scoreKeys = [
    'task_intent_specification', 'goal_objective_articulation', 'persona_role_definition',
    'step_by_step_decomposition', 'chain_of_thought_structure', 'context_provisioning',
    'reference_use', 'example_use', 'tonality_writing_style', 'output_format_specification',
    'information_hierarchy'
  ];

  const commentKeys = [
    'task_intent_specification_comment', 'goal_objective_articulation_comment', 'persona_role_definition_comment',
    'step_by_step_decomposition_comment', 'chain_of_thought_structure_comment', 'context_provisioning_comment',
    'reference_use_comment', 'example_use_comment', 'tonality_writing_style_comment', 'output_format_specification_comment',
    'information_hierarchy_comment'
  ];

  // Validate scores
  for (const key of scoreKeys) {
    const value = evaluation[key as keyof StructuralQualityEvaluation];
    if (typeof value !== 'number' || value < 1 || value > 5) {
      throw new Error(`Invalid score for ${key}: ${value}`);
    }
  }

  // Validate comments
  for (const key of commentKeys) {
    const value = evaluation[key as keyof StructuralQualityEvaluation];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Invalid comment for ${key}: ${value}`);
    }
  }

  // Update the chat interaction with the evaluation scores and comments
  console.log(`💾 Updating database for interaction ${interaction.id}...`);
  const { error: updateError } = await supabase
    .from('chat_interactions')
    .update({
      task_intent_specification: evaluation.task_intent_specification,
      goal_objective_articulation: evaluation.goal_objective_articulation,
      persona_role_definition: evaluation.persona_role_definition,
      step_by_step_decomposition: evaluation.step_by_step_decomposition,
      chain_of_thought_structure: evaluation.chain_of_thought_structure,
      context_provisioning: evaluation.context_provisioning,
      reference_use: evaluation.reference_use,
      example_use: evaluation.example_use,
      tonality_writing_style: evaluation.tonality_writing_style,
      output_format_specification: evaluation.output_format_specification,
      information_hierarchy: evaluation.information_hierarchy,
      // Comments
      task_intent_specification_comment: evaluation.task_intent_specification_comment,
      goal_objective_articulation_comment: evaluation.goal_objective_articulation_comment,
      persona_role_definition_comment: evaluation.persona_role_definition_comment,
      step_by_step_decomposition_comment: evaluation.step_by_step_decomposition_comment,
      chain_of_thought_structure_comment: evaluation.chain_of_thought_structure_comment,
      context_provisioning_comment: evaluation.context_provisioning_comment,
      reference_use_comment: evaluation.reference_use_comment,
      example_use_comment: evaluation.example_use_comment,
      tonality_writing_style_comment: evaluation.tonality_writing_style_comment,
      output_format_specification_comment: evaluation.output_format_specification_comment,
      information_hierarchy_comment: evaluation.information_hierarchy_comment,
    })
    .eq('id', interaction.id)
    .eq('session_id', sessionId);

  if (updateError) {
    console.error('❌ Error updating chat interaction:', updateError);
    throw new Error('Failed to update chat interaction with evaluation');
  }

  console.log(`✅ Successfully updated database for interaction ${interaction.id}`);
  return { success: true, evaluation };
}

// Helper function to update session averages
async function updateSessionAverages(sessionId: string) {
  const supabase = getSupabaseServerClient();
  
  // Calculate averages for all structural quality metrics
  const { data: interactions, error } = await supabase
    .from('chat_interactions')
    .select(`
      task_intent_specification,
      goal_objective_articulation,
      persona_role_definition,
      step_by_step_decomposition,
      chain_of_thought_structure,
      context_provisioning,
      reference_use,
      example_use,
      tonality_writing_style,
      output_format_specification,
      information_hierarchy
    `)
    .eq('session_id', sessionId)
    .not('task_intent_specification', 'is', null);

  if (error) {
    console.error('Error fetching interactions for session averages:', error);
    return;
  }

  if (!interactions || interactions.length === 0) {
    return;
  }

  // Calculate averages
  const calculateAverage = (field: keyof typeof interactions[0]) => {
    const values = interactions
      .map(i => i[field])
      .filter((v): v is number => v !== null && v !== undefined && typeof v === 'number');
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : null;
  };

  const averages = {
    avg_task_intent_specification: calculateAverage('task_intent_specification'),
    avg_goal_objective_articulation: calculateAverage('goal_objective_articulation'),
    avg_persona_role_definition: calculateAverage('persona_role_definition'),
    avg_step_by_step_decomposition: calculateAverage('step_by_step_decomposition'),
    avg_chain_of_thought_structure: calculateAverage('chain_of_thought_structure'),
    avg_context_provisioning: calculateAverage('context_provisioning'),
    avg_reference_use: calculateAverage('reference_use'),
    avg_example_use: calculateAverage('example_use'),
    avg_tonality_writing_style: calculateAverage('tonality_writing_style'),
    avg_output_format_specification: calculateAverage('output_format_specification'),
    avg_information_hierarchy: calculateAverage('information_hierarchy'),
  };

  // Update user_sessions table
  const { error: updateError } = await supabase
    .from('user_sessions')
    .update(averages)
    .eq('session_id', sessionId);

  if (updateError) {
    console.error('Error updating session averages:', updateError);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, chatInteractionId, evaluateAll } = await request.json();
    console.log('🔍 Structural Quality Evaluation API called:', { sessionId, chatInteractionId, evaluateAll });

    if (!sessionId) {
      console.log('❌ No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // If evaluateAll is true, find all interactions that need evaluation
    if (evaluateAll) {
      console.log('🔄 Evaluating all interactions for session:', sessionId);
      const supabase = getSupabaseServerClient();
      
      // Get all chat interactions for the session that don't have structural quality metrics
      const { data: interactions, error: fetchError } = await supabase
        .from('chat_interactions')
        .select('id, prompt, response, task_intent_specification')
        .eq('session_id', sessionId);

      if (fetchError) {
        console.error('❌ Error fetching interactions:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch interactions' },
          { status: 500 }
        );
      }

      console.log(`📊 Found ${interactions?.length || 0} total interactions for session`);
      
      // Filter for interactions that need evaluation
      const interactionsNeedingEvaluation = interactions?.filter(interaction => 
        interaction.task_intent_specification === null || interaction.task_intent_specification === undefined
      ) || [];
      
      console.log(`📊 Found ${interactionsNeedingEvaluation.length} interactions needing evaluation`);
      
      // Debug: Show first few interactions and their values
      console.log('🔍 Debug - First few interactions and their task_intent_specification values:');
      interactions?.slice(0, 3).forEach((interaction, index) => {
        console.log(`  Interaction ${index + 1}:`, {
          id: interaction.id,
          task_intent_specification: interaction.task_intent_specification,
          type: typeof interaction.task_intent_specification
        });
      });
      if (interactionsNeedingEvaluation.length === 0) {
        console.log('✅ No interactions need evaluation');
        return NextResponse.json({
          message: 'No interactions need evaluation',
          evaluated: 0
        });
      }

      // Evaluate each interaction
      let evaluatedCount = 0;
      for (const interaction of interactionsNeedingEvaluation) {
        try {
          console.log(`🔍 Evaluating interaction ${interaction.id}...`);
          const result = await evaluateSingleInteraction(interaction, sessionId);
          if (result.success) {
            evaluatedCount++;
            console.log(`✅ Successfully evaluated interaction ${interaction.id}`);
          } else {
            console.log(`⚠️ Interaction ${interaction.id} already evaluated`);
          }
        } catch (err) {
          console.error(`❌ Failed to evaluate interaction ${interaction.id}:`, err);
        }
      }

      // Update session averages after evaluation
      if (evaluatedCount > 0) {
        await updateSessionAverages(sessionId);
      }

      return NextResponse.json({
        message: `Evaluated ${evaluatedCount} interactions`,
        evaluated: evaluatedCount
      });
    }

    // Single interaction evaluation
    if (!chatInteractionId) {
      return NextResponse.json(
        { error: 'Chat Interaction ID is required for single evaluation' },
        { status: 400 }
      );
    }

    // Single interaction evaluation
    const supabase = getSupabaseServerClient();

    // Get the chat interaction data
    const { data: chatInteraction, error: chatError } = await supabase
      .from('chat_interactions')
      .select('id, prompt, response, task_intent_specification, goal_objective_articulation, persona_role_definition, step_by_step_decomposition, chain_of_thought_structure, context_provisioning, reference_use, example_use, tonality_writing_style, output_format_specification, information_hierarchy')
      .eq('id', chatInteractionId)
      .eq('session_id', sessionId)
      .single();

    if (chatError || !chatInteraction) {
      return NextResponse.json(
        { error: 'Chat interaction not found' },
        { status: 404 }
      );
    }

    // Check if evaluation already exists
    const hasExistingEvaluation = chatInteraction.task_intent_specification !== null;

    if (hasExistingEvaluation) {
      return NextResponse.json({
        message: 'Evaluation already exists',
        evaluation: {
          task_intent_specification: chatInteraction.task_intent_specification,
          goal_objective_articulation: chatInteraction.goal_objective_articulation,
          persona_role_definition: chatInteraction.persona_role_definition,
          step_by_step_decomposition: chatInteraction.step_by_step_decomposition,
          chain_of_thought_structure: chatInteraction.chain_of_thought_structure,
          context_provisioning: chatInteraction.context_provisioning,
          reference_use: chatInteraction.reference_use,
          example_use: chatInteraction.example_use,
          tonality_writing_style: chatInteraction.tonality_writing_style,
          output_format_specification: chatInteraction.output_format_specification,
          information_hierarchy: chatInteraction.information_hierarchy,
        }
      });
    }

    // Use the helper function to evaluate the interaction
    const result = await evaluateSingleInteraction(chatInteraction, sessionId);
    
    if (result.success) {
      return NextResponse.json({
        message: 'Evaluation completed successfully',
        evaluation: result.evaluation
      });
    } else {
      throw new Error('Evaluation failed');
    }

  } catch (error) {
    console.error('Error in structural quality evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate structural quality' },
      { status: 500 }
    );
  }
}
