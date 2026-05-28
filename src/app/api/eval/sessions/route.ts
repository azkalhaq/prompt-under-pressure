import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

type InteractionRow = {
  session_id: string;
  scenario: string | null;
  task_code: string | null;
  task_intent_specification: number | null;
  prompt_strategy_classification: string | null;
};

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get all sessions with their basic info
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select(`
        session_id,
        user_id,
        total_prompts,
        created_at,
        avg_task_intent_specification,
        avg_goal_objective_articulation,
        avg_persona_role_definition,
        avg_step_by_step_decomposition,
        avg_chain_of_thought_structure,
        avg_context_provisioning,
        avg_reference_use,
        avg_example_use,
        avg_tonality_writing_style,
        avg_output_format_specification,
        avg_information_hierarchy,
        session_prompt_strategy_classification,
        session_prompt_strategy_justification
      `)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    // Get scenario and task_code from the first interaction of each session
    const sessionIds = sessions.map(s => s.session_id);
    
    const { data: interactions, error: interactionsError } = await supabase
      .from('chat_interactions')
      .select('session_id, scenario, task_code, task_intent_specification, prompt_strategy_classification')
      .in('session_id', sessionIds)
      .order('prompt_index_no', { ascending: true });

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError);
      return NextResponse.json(
        { error: 'Failed to fetch interaction data' },
        { status: 500 }
      );
    }

    // Group interactions by session_id and get the first one for scenario/task_code
    const sessionInteractionMap = new Map<string, InteractionRow>();
    const sessionEvaluationCounts = new Map<string, { total: number; evaluated: number }>();
    const sessionClassificationCounts = new Map<string, { total: number; classified: number }>();

    const interactionsTyped = (interactions ?? []) as unknown as InteractionRow[];
    interactionsTyped.forEach(interaction => {
      if (!sessionInteractionMap.has(interaction.session_id)) {
        sessionInteractionMap.set(interaction.session_id, interaction);
      }

      // Count evaluation status
      if (!sessionEvaluationCounts.has(interaction.session_id)) {
        sessionEvaluationCounts.set(interaction.session_id, { total: 0, evaluated: 0 });
      }
      
      const evalCounts = sessionEvaluationCounts.get(interaction.session_id)!;
      evalCounts.total++;
      if (interaction.task_intent_specification !== null) {
        evalCounts.evaluated++;
      }

      // Count classification status
      if (!sessionClassificationCounts.has(interaction.session_id)) {
        sessionClassificationCounts.set(interaction.session_id, { total: 0, classified: 0 });
      }
      
      const classCounts = sessionClassificationCounts.get(interaction.session_id)!;
      classCounts.total++;
      if (interaction.prompt_strategy_classification !== null) {
        classCounts.classified++;
      }
    });

    // Combine session data with interaction data and evaluation status
    const sessionsWithStatus = sessions.map(session => {
      const interaction = sessionInteractionMap.get(session.session_id);
      const evaluationCounts = sessionEvaluationCounts.get(session.session_id) || { total: 0, evaluated: 0 };
      const classificationCounts = sessionClassificationCounts.get(session.session_id) || { total: 0, classified: 0 };
      
      // Determine if session needs evaluation
      const needsEvaluation = session.avg_task_intent_specification === null && evaluationCounts.total > 0;
      
      // Calculate evaluation progress percentage
      const evaluationProgress = evaluationCounts.total > 0 
        ? Math.round((evaluationCounts.evaluated / evaluationCounts.total) * 100)
        : 0;

      // Determine if session needs classification
      const needsClassification = classificationCounts.total > 0 && classificationCounts.classified < classificationCounts.total;
      
      // Calculate classification progress percentage
      const classificationProgress = classificationCounts.total > 0 
        ? Math.round((classificationCounts.classified / classificationCounts.total) * 100)
        : 0;

      return {
        ...session,
        scenario: interaction?.scenario || 'Unknown',
        task_code: interaction?.task_code || null,
        needsEvaluation,
        evaluationProgress,
        needsClassification,
        classificationProgress
      };
    });

    return NextResponse.json({ 
      sessions: sessionsWithStatus 
    });

  } catch (error) {
    console.error('Error in sessions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
