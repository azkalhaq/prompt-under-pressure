"use client"
import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import MetricsDisplay from "@/components/MetricsDisplay";

type UiMessage = { 
  id: string; 
  role: "user" | "assistant"; 
  content: string;
  metrics?: {
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
    
    // API metrics (for responses)
    model?: string;
    token_input?: number;
    token_output?: number;
    cost_input?: number;
    cost_output?: number;
    latency?: number;
  };
};

type SessionSummary = {
  scenario: string;
  task_code: string;
  total_interactions: number;
  total_prompts: number;
  total_responses: number;
  avg_flesch_reading_ease: number;
  avg_flesch_kincaid_grade: number;
  avg_smog_index: number;
  avg_care_context_score: number;
  avg_care_ask_score: number;
  avg_care_rules_score: number;
  avg_care_examples_score: number;
  total_token_input: number;
  total_token_output: number;
  total_cost_input: number;
  total_cost_output: number;
  avg_latency: number;
};

function EvalContent() {
  const params = useParams();
  const sessionId = params['session-id'] as string;
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [userPromptsCopySuccess, setUserPromptsCopySuccess] = useState(false);
  const [aiResponsesCopySuccess, setAiResponsesCopySuccess] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());

  // Get AI name from environment variable
  const aiName = process.env.NEXT_PUBLIC_AI_NAME || 'LLM/Agent/AI';

  // Function to format chat history for copying
  const formatChatHistory = (messages: UiMessage[]) => {
    return messages.map(message => {
      const role = message.role === 'user' ? 'User' : aiName;
      return `${role}: ${message.content}`;
    }).join('\n');
  };

  // Function to format only user prompts for copying with indexing
  const formatUserPrompts = (messages: UiMessage[]) => {
    const userMessages = messages.filter(message => message.role === 'user');
    return userMessages.map((message, index) => {
      return `User Chat#${index + 1}:\n${message.content}`;
    }).join('\n\n');
  };

  // Function to format only AI responses for copying with indexing
  const formatAiResponses = (messages: UiMessage[]) => {
    const aiMessages = messages.filter(message => message.role === 'assistant');
    return aiMessages.map((message, index) => {
      return `${aiName} Chat#${index + 1}:\n${message.content}`;
    }).join('\n\n');
  };

  // Function to copy chat history to clipboard
  const copyChatHistory = async () => {
    try {
      const formattedHistory = formatChatHistory(messages);
      await navigator.clipboard.writeText(formattedHistory);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy chat history:', err);
    }
  };

  // Function to copy only user prompts to clipboard
  const copyUserPrompts = async () => {
    try {
      const userPrompts = formatUserPrompts(messages);
      await navigator.clipboard.writeText(userPrompts);
      setUserPromptsCopySuccess(true);
      setTimeout(() => setUserPromptsCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy user prompts:', err);
    }
  };

  // Function to copy only AI responses to clipboard
  const copyAiResponses = async () => {
    try {
      const aiResponses = formatAiResponses(messages);
      await navigator.clipboard.writeText(aiResponses);
      setAiResponsesCopySuccess(true);
      setTimeout(() => setAiResponsesCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy AI responses:', err);
    }
  };

  // Toggle metrics expansion
  const toggleMetrics = (messageId: string) => {
    const newExpanded = new Set(expandedMetrics);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMetrics(newExpanded);
  };

  useEffect(() => {
    const fetchEvalData = async () => {
      if (!sessionId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/eval/${sessionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('No evaluation data found for this session');
          } else {
            setError('Failed to load evaluation data');
          }
          return;
        }
        
        const data = await response.json();
        setMessages(data.messages || []);
        setSessionSummary(data.sessionSummary || null);
      } catch (err) {
        console.error('Error fetching evaluation data:', err);
        setError('Failed to load evaluation data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvalData();
  }, [sessionId]);

  if (isLoading) {
    return (
      <main className="h-full flex flex-col items-center pt-10">
        <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading evaluation data...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="h-full flex flex-col items-center pt-10">
        <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <p className="text-gray-500 text-sm mt-2">Please check the session ID and try again.</p>
          </div>
        </div>
      </main>
    );
  }

  if (messages.length === 0) {
    return (
      <main className="h-full flex flex-col items-center pt-10">
        <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="text-gray-400 text-xl mb-4">💬</div>
            <p className="text-gray-600">No evaluation data found for this conversation.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto relative flex flex-col gap-3 h-full">
        {/* Header with Session Summary */}
        {sessionSummary && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mt-6 mb-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">📊 Session Evaluation</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Scenario:</span>
                <span className="ml-2 font-semibold">{sessionSummary.scenario}</span>
              </div>
              <div>
                <span className="text-gray-600">Task:</span>
                <span className="ml-2 font-semibold">{sessionSummary.task_code || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Interactions:</span>
                <span className="ml-2 font-semibold">{sessionSummary.total_interactions}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Cost:</span>
                <span className="ml-2 font-semibold">
                  ${((sessionSummary.total_cost_input || 0) + (sessionSummary.total_cost_output || 0)).toFixed(6)}
                </span>
              </div>
            </div>
            
            {/* Quick Readability Summary */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Avg Flesch Reading Ease:</span>
                <span className="ml-2 font-mono">{sessionSummary.avg_flesch_reading_ease.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Avg Flesch-Kincaid Grade:</span>
                <span className="ml-2 font-mono">{sessionSummary.avg_flesch_kincaid_grade.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Avg CARE Context Score:</span>
                <span className="ml-2 font-mono">{sessionSummary.avg_care_context_score.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Avg Latency:</span>
                <span className="ml-2 font-mono">{sessionSummary.avg_latency.toFixed(0)}ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Copy Buttons */}
        <div className="flex justify-center items-center gap-4 pt-6 pb-4">
          <button
            onClick={copyAiResponses}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              aiResponsesCopySuccess
                ? 'bg-green-500 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {aiResponsesCopySuccess ? '✓ Copied!' : '🤖 Copy Response'}
          </button>

          <button
            onClick={copyChatHistory}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              copySuccess
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {copySuccess ? '✓ Copied!' : '📋 Copy Chat History'}
          </button>

          <button
            onClick={copyUserPrompts}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              userPromptsCopySuccess
                ? 'bg-green-500 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {userPromptsCopySuccess ? '✓ Copied!' : '👤 Copy User Chat'}
          </button>
        </div>
        
        <div className="flex-1 px-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className={`p-4 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-gray-100 ml-8' 
                    : 'bg-blue-50 mr-8'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      message.role === 'user' 
                        ? 'bg-gray-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {message.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-700 mb-1">
                        {message.role === 'user' ? 'User' : aiName}
                      </div>
                      <div className="text-gray-800 whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Metrics Display */}
                {message.metrics && (
                  <MetricsDisplay
                    metrics={message.metrics}
                    type={message.role === 'user' ? 'prompt' : 'response'}
                    isExpanded={expandedMetrics.has(message.id)}
                    onToggle={() => toggleMetrics(message.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function EvalPage() {
  return (
    <Suspense fallback={
      <main className="h-full flex flex-col items-center pt-10">
        <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <EvalContent />
    </Suspense>
  );
}
