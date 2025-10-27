import { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ 'session-id': string }> }
) {
  try {
    const { 'session-id': sessionId } = await params;
    
    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    
    // Fetch chat interactions with all metrics for the given session, ordered by prompt_index_no
    const { data: interactions, error } = await supabase
      .from('chat_interactions')
      .select(`
        prompt, 
        response, 
        prompt_index_no, 
        created_at,
        scenario,
        task_code,
        word_count,
        char_count,
        vocab_count,
        letter_count,
        syllable_count,
        sentence_count,
        average_sentence_length,
        average_syllable_per_word,
        average_character_per_word,
        average_letter_per_word,
        average_sentence_per_word,
        flesch_reading_ease,
        flesch_reading_ease_grade,
        flesch_kincaid_grade,
        poly_syllable_count,
        smog_index,
        coleman_liau_index,
        automated_readability_index,
        dale_chall_readability_score,
        dale_chall_grade,
        difficult_words,
        linsear_write_formula,
        gunning_fog,
        lix_score,
        rix_score,
        text_standard_score,
        text_standard_grade,
        text_median_score,
        care_context_score,
        care_ask_score,
        care_rules_score,
        care_examples_score,
        care_specificity_score,
        care_measurability_score,
        care_verifiability_score,
        care_ambiguity_count,
        care_output_format_specified,
        care_role_specified,
        care_quantity_specified,
        care_has_citations,
        model,
        token_input,
        token_output,
        cost_input,
        cost_output,
        latency
      `)
      .eq('session_id', sessionId)
      .order('prompt_index_no', { ascending: true });

    if (error) {
      console.error('Error fetching evaluation data:', error);
      return Response.json({ error: 'Failed to fetch evaluation data' }, { status: 500 });
    }

    if (!interactions || interactions.length === 0) {
      return Response.json({ error: 'No evaluation data found for this session' }, { status: 404 });
    }

    // Transform the data to match the expected format
    const messages = interactions.flatMap(interaction => [
      {
        id: `user-${interaction.prompt_index_no}`,
        role: 'user' as const,
        content: interaction.prompt,
        metrics: {
          // Basic text metrics
          word_count: interaction.word_count,
          char_count: interaction.char_count,
          vocab_count: interaction.vocab_count,
          
          // Basic text analysis metrics
          letter_count: interaction.letter_count,
          syllable_count: interaction.syllable_count,
          sentence_count: interaction.sentence_count,
          
          // Average calculation metrics
          average_sentence_length: interaction.average_sentence_length,
          average_syllable_per_word: interaction.average_syllable_per_word,
          average_character_per_word: interaction.average_character_per_word,
          average_letter_per_word: interaction.average_letter_per_word,
          average_sentence_per_word: interaction.average_sentence_per_word,
          
          // Readability index metrics
          flesch_reading_ease: interaction.flesch_reading_ease,
          flesch_reading_ease_grade: interaction.flesch_reading_ease_grade,
          flesch_kincaid_grade: interaction.flesch_kincaid_grade,
          poly_syllable_count: interaction.poly_syllable_count,
          smog_index: interaction.smog_index,
          coleman_liau_index: interaction.coleman_liau_index,
          automated_readability_index: interaction.automated_readability_index,
          dale_chall_readability_score: interaction.dale_chall_readability_score,
          dale_chall_grade: interaction.dale_chall_grade,
          difficult_words: interaction.difficult_words,
          linsear_write_formula: interaction.linsear_write_formula,
          gunning_fog: interaction.gunning_fog,
          lix_score: interaction.lix_score,
          rix_score: interaction.rix_score,
          
          // Composite readability metrics
          text_standard_score: interaction.text_standard_score,
          text_standard_grade: interaction.text_standard_grade,
          text_median_score: interaction.text_median_score,
          
          // CARE metrics
          care_context_score: interaction.care_context_score,
          care_ask_score: interaction.care_ask_score,
          care_rules_score: interaction.care_rules_score,
          care_examples_score: interaction.care_examples_score,
          care_specificity_score: interaction.care_specificity_score,
          care_measurability_score: interaction.care_measurability_score,
          care_verifiability_score: interaction.care_verifiability_score,
          care_ambiguity_count: interaction.care_ambiguity_count,
          care_output_format_specified: interaction.care_output_format_specified,
          care_role_specified: interaction.care_role_specified,
          care_quantity_specified: interaction.care_quantity_specified,
          care_has_citations: interaction.care_has_citations
        }
      },
      ...(interaction.response ? [{
        id: `assistant-${interaction.prompt_index_no}`,
        role: 'assistant' as const,
        content: interaction.response,
        metrics: {
          // API metrics for responses
          model: interaction.model,
          token_input: interaction.token_input,
          token_output: interaction.token_output,
          cost_input: interaction.cost_input,
          cost_output: interaction.cost_output,
          latency: interaction.latency
        }
      }] : [])
    ]);

    // Calculate session-level summary metrics
    const sessionSummary = {
      scenario: interactions[0]?.scenario,
      task_code: interactions[0]?.task_code,
      total_interactions: interactions.length,
      total_prompts: interactions.filter(i => i.prompt).length,
      total_responses: interactions.filter(i => i.response).length,
      
      // Average readability metrics across all prompts
      avg_flesch_reading_ease: interactions
        .filter(i => i.flesch_reading_ease !== null)
        .reduce((sum, i) => sum + (i.flesch_reading_ease || 0), 0) / 
        interactions.filter(i => i.flesch_reading_ease !== null).length || 0,
      
      avg_flesch_kincaid_grade: interactions
        .filter(i => i.flesch_kincaid_grade !== null)
        .reduce((sum, i) => sum + (i.flesch_kincaid_grade || 0), 0) / 
        interactions.filter(i => i.flesch_kincaid_grade !== null).length || 0,
      
      avg_smog_index: interactions
        .filter(i => i.smog_index !== null)
        .reduce((sum, i) => sum + (i.smog_index || 0), 0) / 
        interactions.filter(i => i.smog_index !== null).length || 0,
      
      // Average CARE scores
      avg_care_context_score: interactions
        .filter(i => i.care_context_score !== null)
        .reduce((sum, i) => sum + (i.care_context_score || 0), 0) / 
        interactions.filter(i => i.care_context_score !== null).length || 0,
      
      avg_care_ask_score: interactions
        .filter(i => i.care_ask_score !== null)
        .reduce((sum, i) => sum + (i.care_ask_score || 0), 0) / 
        interactions.filter(i => i.care_ask_score !== null).length || 0,
      
      avg_care_rules_score: interactions
        .filter(i => i.care_rules_score !== null)
        .reduce((sum, i) => sum + (i.care_rules_score || 0), 0) / 
        interactions.filter(i => i.care_rules_score !== null).length || 0,
      
      avg_care_examples_score: interactions
        .filter(i => i.care_examples_score !== null)
        .reduce((sum, i) => sum + (i.care_examples_score || 0), 0) / 
        interactions.filter(i => i.care_examples_score !== null).length || 0,
      
      // Total costs and tokens
      total_token_input: interactions.reduce((sum, i) => sum + (i.token_input || 0), 0),
      total_token_output: interactions.reduce((sum, i) => sum + (i.token_output || 0), 0),
      total_cost_input: interactions.reduce((sum, i) => sum + (i.cost_input || 0), 0),
      total_cost_output: interactions.reduce((sum, i) => sum + (i.cost_output || 0), 0),
      
      // Average latency
      avg_latency: interactions
        .filter(i => i.latency !== null)
        .reduce((sum, i) => sum + (i.latency || 0), 0) / 
        interactions.filter(i => i.latency !== null).length || 0
    };

    return Response.json({ 
      messages, 
      sessionSummary 
    });
  } catch (error) {
    console.error('Evaluation API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
