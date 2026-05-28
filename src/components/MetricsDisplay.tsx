"use client";

interface MetricsDisplayProps {
  metrics: {
    // Basic text metrics
    word_count?: number;
    char_count?: number;
    vocab_count?: number;
    
    // Basic text analysis metrics
    letter_count?: number;
    syllable_count?: number;
    sentence_count?: number;
    
    // Average calculation metrics
    average_sentence_length?: number;
    average_syllable_per_word?: number;
    average_character_per_word?: number;
    average_letter_per_word?: number;
    average_sentence_per_word?: number;
    
    // Readability index metrics
    flesch_reading_ease?: number;
    flesch_reading_ease_grade?: number;
    flesch_kincaid_grade?: number;
    poly_syllable_count?: number;
    smog_index?: number;
    coleman_liau_index?: number;
    automated_readability_index?: number;
    dale_chall_readability_score?: number;
    dale_chall_grade?: number;
    difficult_words?: number;
    linsear_write_formula?: number;
    gunning_fog?: number;
    lix_score?: number;
    rix_score?: number;
    
    // Composite readability metrics
    text_standard_score?: number;
    text_standard_grade?: string;
    text_median_score?: number;
    
    // CARE metrics
    care_context_score?: number;
    care_ask_score?: number;
    care_rules_score?: number;
    care_examples_score?: number;
    care_specificity_score?: number;
    care_measurability_score?: number;
    care_verifiability_score?: number;
    care_ambiguity_count?: number;
    care_output_format_specified?: boolean;
    care_role_specified?: boolean;
    care_quantity_specified?: boolean;
    care_has_citations?: boolean;
    
    // Structural quality metrics (likert scale 1-5)
    task_intent_specification?: number;
    goal_objective_articulation?: number;
    persona_role_definition?: number;
    step_by_step_decomposition?: number;
    chain_of_thought_structure?: number;
    context_provisioning?: number;
    reference_use?: number;
    example_use?: number;
    tonality_writing_style?: number;
    output_format_specification?: number;
    information_hierarchy?: number;
    
    // Prompt strategy classification
    prompt_strategy_classification?: string;
    prompt_strategy_justification?: string;
    
    // Structural quality comments/justifications
    task_intent_specification_comment?: string;
    goal_objective_articulation_comment?: string;
    persona_role_definition_comment?: string;
    step_by_step_decomposition_comment?: string;
    chain_of_thought_structure_comment?: string;
    context_provisioning_comment?: string;
    reference_use_comment?: string;
    example_use_comment?: string;
    tonality_writing_style_comment?: string;
    output_format_specification_comment?: string;
    information_hierarchy_comment?: string;
    
    // API metrics (for responses)
    model?: string;
    token_input?: number;
    token_output?: number;
    cost_input?: number;
    cost_output?: number;
    latency?: number;
  };
  type: 'prompt' | 'response';
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function MetricsDisplay({ 
  metrics, 
  type, 
  isExpanded = false, 
  onToggle 
}: MetricsDisplayProps) {
  const formatValue = (value: number | string | boolean | undefined, decimals = 2) => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') return value;
    return typeof value === 'number' ? value.toFixed(decimals) : 'N/A';
  };

  const getReadabilityGrade = (score: number | undefined) => {
    if (score === undefined || score === null) return 'N/A';
    if (score <= 6) return 'Elementary';
    if (score <= 9) return 'Middle School';
    if (score <= 12) return 'High School';
    if (score <= 16) return 'College';
    return 'Graduate';
  };

  const getCAREQuality = (score: number | undefined) => {
    if (score === undefined || score === null) return 'N/A';
    if (score >= 1.5) return 'High';
    if (score >= 1.0) return 'Medium';
    if (score >= 0.5) return 'Low';
    return 'Very Low';
  };

  const getCAREQualityColor = (score: number | undefined) => {
    if (score === undefined || score === null) return 'text-gray-500';
    if (score >= 1.5) return 'text-green-600';
    if (score >= 1.0) return 'text-yellow-600';
    if (score >= 0.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStructuralQuality = (score: number | undefined) => {
    if (score === undefined || score === null) return 'N/A';
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Strong';
    if (score >= 2.5) return 'Adequate';
    if (score >= 1.5) return 'Weak';
    return 'Not Present';
  };

  const getStructuralQualityColor = (score: number | undefined) => {
    if (score === undefined || score === null) return 'text-gray-500';
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    if (score >= 1.5) return 'text-orange-600';
    return 'text-red-600';
  };

  if (type === 'prompt') {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-2">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={onToggle}
        >
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            📊 Prompt Quality Metrics
            <span className="text-sm text-gray-500">({isExpanded ? 'Hide' : 'Show'})</span>
          </h4>
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Basic Text Metrics */}
            <div>
              <h5 className="font-medium text-gray-600 mb-2">Basic Text Analysis</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Words:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.word_count, 0)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Characters:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.char_count, 0)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Sentences:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.sentence_count, 0)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Syllables:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.syllable_count, 0)}</span>
                </div>
              </div>
            </div>

            {/* Readability Metrics */}
            <div>
              <h5 className="font-medium text-gray-600 mb-2">Readability Scores</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Flesch Reading Ease:</span>
                    <span className="ml-1 font-mono">{formatValue(metrics.flesch_reading_ease)}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      ({getReadabilityGrade(metrics.flesch_reading_ease_grade)})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Flesch-Kincaid Grade:</span>
                    <span className="ml-1 font-mono">{formatValue(metrics.flesch_kincaid_grade)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">SMOG Index:</span>
                    <span className="ml-1 font-mono">{formatValue(metrics.smog_index)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Coleman-Liau Index:</span>
                    <span className="ml-1 font-mono">{formatValue(metrics.coleman_liau_index)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Automated Readability:</span>
                    <span className="ml-1 font-mono">{formatValue(metrics.automated_readability_index)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dale-Chall Grade:</span>
                    <span className="ml-1 font-mono">{formatValue(metrics.dale_chall_grade)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Gunning Fog:</span>
                    <span className="ml-1 font-mono">{formatValue(metrics.gunning_fog)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Text Standard:</span>
                    <span className="ml-1 font-mono">{formatValue(metrics.text_standard_grade)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARE Metrics */}
            <div>
              <h5 className="font-medium text-gray-600 mb-2">CARE Quality Scores (0-2 scale)</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Context:</span>
                  <span className={`ml-1 font-mono ${getCAREQualityColor(metrics.care_context_score)}`}>
                    {formatValue(metrics.care_context_score)} ({getCAREQuality(metrics.care_context_score)})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ask:</span>
                  <span className={`ml-1 font-mono ${getCAREQualityColor(metrics.care_ask_score)}`}>
                    {formatValue(metrics.care_ask_score)} ({getCAREQuality(metrics.care_ask_score)})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Rules:</span>
                  <span className={`ml-1 font-mono ${getCAREQualityColor(metrics.care_rules_score)}`}>
                    {formatValue(metrics.care_rules_score)} ({getCAREQuality(metrics.care_rules_score)})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Examples:</span>
                  <span className={`ml-1 font-mono ${getCAREQualityColor(metrics.care_examples_score)}`}>
                    {formatValue(metrics.care_examples_score)} ({getCAREQuality(metrics.care_examples_score)})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Specificity:</span>
                  <span className={`ml-1 font-mono ${getCAREQualityColor(metrics.care_specificity_score)}`}>
                    {formatValue(metrics.care_specificity_score)} ({getCAREQuality(metrics.care_specificity_score)})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Measurability:</span>
                  <span className={`ml-1 font-mono ${getCAREQualityColor(metrics.care_measurability_score)}`}>
                    {formatValue(metrics.care_measurability_score)} ({getCAREQuality(metrics.care_measurability_score)})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Verifiability:</span>
                  <span className={`ml-1 font-mono ${getCAREQualityColor(metrics.care_verifiability_score)}`}>
                    {formatValue(metrics.care_verifiability_score)} ({getCAREQuality(metrics.care_verifiability_score)})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ambiguity Count:</span>
                  <span className="ml-1 font-mono text-red-600">
                    {formatValue(metrics.care_ambiguity_count, 0)} (lower is better)
                  </span>
                </div>
              </div>
              
              {/* CARE Boolean Flags */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Output Format:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.care_output_format_specified)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Role Specified:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.care_role_specified)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Quantity Specified:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.care_quantity_specified)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Has Citations:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.care_has_citations)}</span>
                </div>
              </div>
            </div>

            {/* Structural Quality Metrics */}
            <div>
              <h5 className="font-medium text-gray-600 mb-2">Structural Quality Scores (1-5 Likert Scale)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Task Intent Specification:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.task_intent_specification)}`}>
                      {formatValue(metrics.task_intent_specification, 1)}/5 ({getStructuralQuality(metrics.task_intent_specification)})
                    </span>
                    {metrics.task_intent_specification_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.task_intent_specification_comment}&quot;
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Goal/Objective Articulation:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.goal_objective_articulation)}`}>
                      {formatValue(metrics.goal_objective_articulation, 1)}/5 ({getStructuralQuality(metrics.goal_objective_articulation)})
                    </span>
                    {metrics.goal_objective_articulation_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.goal_objective_articulation_comment}&quot;
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Persona/Role Definition:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.persona_role_definition)}`}>
                      {formatValue(metrics.persona_role_definition, 1)}/5 ({getStructuralQuality(metrics.persona_role_definition)})
                    </span>
                    {metrics.persona_role_definition_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.persona_role_definition_comment}&quot;
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Step-by-Step Decomposition:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.step_by_step_decomposition)}`}>
                      {formatValue(metrics.step_by_step_decomposition, 1)}/5 ({getStructuralQuality(metrics.step_by_step_decomposition)})
                    </span>
                    {metrics.step_by_step_decomposition_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.step_by_step_decomposition_comment}&quot;
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Chain-of-Thought Structure:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.chain_of_thought_structure)}`}>
                      {formatValue(metrics.chain_of_thought_structure, 1)}/5 ({getStructuralQuality(metrics.chain_of_thought_structure)})
                    </span>
                    {metrics.chain_of_thought_structure_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.chain_of_thought_structure_comment}&quot;
                      </div>
                    )}
                  </div>
          {/* Prompt Strategy Classification */}
          {metrics.prompt_strategy_classification && (
            <div className="mt-4 p-3 rounded border bg-gray-50">
              <div className="text-sm text-gray-600">Prompt Strategy Classification</div>
              <div className="mt-1 text-sm font-medium text-gray-900">{metrics.prompt_strategy_classification}</div>
              {metrics.prompt_strategy_justification && (
                <div className="mt-1 text-xs text-gray-500 italic">&quot;{metrics.prompt_strategy_justification}&quot;</div>
              )}
            </div>
          )}
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Context Provisioning:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.context_provisioning)}`}>
                      {formatValue(metrics.context_provisioning, 1)}/5 ({getStructuralQuality(metrics.context_provisioning)})
                    </span>
                    {metrics.context_provisioning_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.context_provisioning_comment}&quot;
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Reference Use:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.reference_use)}`}>
                      {formatValue(metrics.reference_use, 1)}/5 ({getStructuralQuality(metrics.reference_use)})
                    </span>
                    {metrics.reference_use_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.reference_use_comment}&quot;
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Example Use:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.example_use)}`}>
                      {formatValue(metrics.example_use, 1)}/5 ({getStructuralQuality(metrics.example_use)})
                    </span>
                    {metrics.example_use_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.example_use_comment}&quot;
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Tonality/Writing Style:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.tonality_writing_style)}`}>
                      {formatValue(metrics.tonality_writing_style, 1)}/5 ({getStructuralQuality(metrics.tonality_writing_style)})
                    </span>
                    {metrics.tonality_writing_style_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.tonality_writing_style_comment}&quot;
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Output Format Specification:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.output_format_specification)}`}>
                      {formatValue(metrics.output_format_specification, 1)}/5 ({getStructuralQuality(metrics.output_format_specification)})
                    </span>
                    {metrics.output_format_specification_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.output_format_specification_comment}&quot;
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Information Hierarchy:</span>
                    <span className={`ml-1 font-mono ${getStructuralQualityColor(metrics.information_hierarchy)}`}>
                      {formatValue(metrics.information_hierarchy, 1)}/5 ({getStructuralQuality(metrics.information_hierarchy)})
                    </span>
                    {metrics.information_hierarchy_comment && (
                      <div className="text-xs text-gray-400 mt-1 italic">
                        &quot;{metrics.information_hierarchy_comment}&quot;
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'response') {
    return (
      <div className="bg-blue-50 rounded-lg p-4 mt-2">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={onToggle}
        >
          <h4 className="font-semibold text-blue-700 flex items-center gap-2">
            🤖 Response Metrics
            <span className="text-sm text-blue-500">({isExpanded ? 'Hide' : 'Show'})</span>
          </h4>
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* API Metrics */}
            <div>
              <h5 className="font-medium text-blue-600 mb-2">API Usage</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-500">Model:</span>
                  <span className="ml-1 font-mono">{metrics.model || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-500">Input Tokens:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.token_input, 0)}</span>
                </div>
                <div>
                  <span className="text-blue-500">Output Tokens:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.token_output, 0)}</span>
                </div>
                <div>
                  <span className="text-blue-500">Latency:</span>
                  <span className="ml-1 font-mono">{formatValue(metrics.latency, 0)}ms</span>
                </div>
              </div>
            </div>

            {/* Cost Metrics */}
            <div>
              <h5 className="font-medium text-blue-600 mb-2">Cost Analysis</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-500">Input Cost:</span>
                  <span className="ml-1 font-mono">${formatValue(metrics.cost_input, 6)}</span>
                </div>
                <div>
                  <span className="text-blue-500">Output Cost:</span>
                  <span className="ml-1 font-mono">${formatValue(metrics.cost_output, 6)}</span>
                </div>
                <div>
                  <span className="text-blue-500">Total Cost:</span>
                  <span className="ml-1 font-mono font-semibold">
                    ${formatValue((metrics.cost_input || 0) + (metrics.cost_output || 0), 6)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-500">Cost per Token:</span>
                  <span className="ml-1 font-mono">
                    ${formatValue(
                      ((metrics.cost_input || 0) + (metrics.cost_output || 0)) / 
                      ((metrics.token_input || 0) + (metrics.token_output || 0) || 1), 
                      8
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
