'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SessionSummary {
  session_id: string;
  user_id: string;
  scenario: string;
  task_code: string | null;
  total_prompts: number;
  created_at: string;
  // Structural quality averages
  avg_task_intent_specification: number | null;
  avg_goal_objective_articulation: number | null;
  avg_persona_role_definition: number | null;
  avg_step_by_step_decomposition: number | null;
  avg_chain_of_thought_structure: number | null;
  avg_context_provisioning: number | null;
  avg_reference_use: number | null;
  avg_example_use: number | null;
  avg_tonality_writing_style: number | null;
  avg_output_format_specification: number | null;
  avg_information_hierarchy: number | null;
}

interface SessionWithEvaluationStatus extends SessionSummary {
  needsEvaluation: boolean;
  evaluationProgress: number; // percentage of interactions that have been evaluated
  needsClassification: boolean;
  classificationProgress: number; // percentage of interactions that have been classified
  session_prompt_strategy_classification?: string;
  session_prompt_strategy_justification?: string;
}

export default function EvalIndexPage() {
  const [sessions, setSessions] = useState<SessionWithEvaluationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluatingSessions, setEvaluatingSessions] = useState<Set<string>>(new Set());
  const [evaluationResults, setEvaluationResults] = useState<Record<string, string>>({});
  const [classifyingSessions, setClassifyingSessions] = useState<Set<string>>(new Set());
  const [classificationResults, setClassificationResults] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/eval/sessions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const evaluateSession = async (sessionId: string) => {
    if (evaluatingSessions.has(sessionId)) return;
    
    setEvaluatingSessions(prev => new Set(prev).add(sessionId));
    setEvaluationResults(prev => ({ ...prev, [sessionId]: 'Evaluating...' }));
    
    try {
      console.log(`🚀 Starting evaluation for session: ${sessionId}`);
      
      const response = await fetch('/api/evaluate-structural-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          evaluateAll: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Evaluation completed for session ${sessionId}:`, result);
        setEvaluationResults(prev => ({ 
          ...prev, 
          [sessionId]: `Evaluated ${result.evaluated} interactions` 
        }));
        
        // Refresh the sessions list to show updated data
        setTimeout(() => {
          fetchSessions();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error(`❌ Evaluation failed for session ${sessionId}:`, errorText);
        setEvaluationResults(prev => ({ 
          ...prev, 
          [sessionId]: `Error: ${response.status}` 
        }));
      }
    } catch (err) {
      console.error(`❌ Error evaluating session ${sessionId}:`, err);
      setEvaluationResults(prev => ({ 
        ...prev, 
        [sessionId]: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` 
      }));
    } finally {
      setEvaluatingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  const evaluateAllSessions = async () => {
    const sessionsNeedingEvaluation = sessions.filter(session => session.needsEvaluation);
    
    for (const session of sessionsNeedingEvaluation) {
      await evaluateSession(session.session_id);
      // Add a small delay between evaluations to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const classifySession = async (sessionId: string) => {
    if (classifyingSessions.has(sessionId)) return;
    
    setClassifyingSessions(prev => new Set(prev).add(sessionId));
    setClassificationResults(prev => ({ ...prev, [sessionId]: 'Classifying...' }));
    
    try {
      console.log(`🚀 Starting classification for session: ${sessionId}`);
      
      const response = await fetch('/api/classify-prompt-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          classifyAll: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Classification completed for session ${sessionId}:`, result);
        setClassificationResults(prev => ({ 
          ...prev, 
          [sessionId]: `Classified ${result.classified} interactions` 
        }));
        
        // Refresh the sessions list to show updated data
        setTimeout(() => {
          fetchSessions();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error(`❌ Classification failed for session ${sessionId}:`, errorText);
        setClassificationResults(prev => ({ 
          ...prev, 
          [sessionId]: `Error: ${response.status}` 
        }));
      }
    } catch (err) {
      console.error(`❌ Error classifying session ${sessionId}:`, err);
      setClassificationResults(prev => ({ 
        ...prev, 
        [sessionId]: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` 
      }));
    } finally {
      setClassifyingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  const classifyAllSessions = async () => {
    const sessionsNeedingClassification = sessions.filter(session => session.needsClassification);
    
    for (const session of sessionsNeedingClassification) {
      await classifySession(session.session_id);
      // Add a small delay between classifications to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const getEvaluationStatus = (session: SessionWithEvaluationStatus) => {
    if (session.needsEvaluation) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Needs Evaluation
        </span>
      );
    } else if (session.avg_task_intent_specification !== null) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Evaluated ({session.evaluationProgress}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Data
        </span>
      );
    }
  };

  const getClassificationStatus = (session: SessionWithEvaluationStatus) => {
    if (session.needsClassification) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Needs Classification
        </span>
      );
    } else if (session.classificationProgress > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Classified ({session.classificationProgress}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Classification
        </span>
      );
    }
  };

  const getStructuralQualityScore = (session: SessionWithEvaluationStatus) => {
    if (session.avg_task_intent_specification === null) return 'N/A';
    
    const scores = [
      session.avg_task_intent_specification,
      session.avg_goal_objective_articulation,
      session.avg_persona_role_definition,
      session.avg_step_by_step_decomposition,
      session.avg_chain_of_thought_structure,
      session.avg_context_provisioning,
      session.avg_reference_use,
      session.avg_example_use,
      session.avg_tonality_writing_style,
      session.avg_output_format_specification,
      session.avg_information_hierarchy
    ].filter(score => score !== null) as number[];
    
    if (scores.length === 0) return 'N/A';
    
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return average.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchSessions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

    const sessionsNeedingEvaluation = sessions.filter(session => session.needsEvaluation);
    const evaluatedSessions = sessions.filter(session => !session.needsEvaluation && session.avg_task_intent_specification !== null);
    const sessionsNeedingClassification = sessions.filter(session => session.needsClassification);
    const classifiedSessions = sessions.filter(session => !session.needsClassification && session.classificationProgress > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Evaluation Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage structural quality evaluations for all chat sessions
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{sessions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Needs Evaluation</p>
                <p className="text-2xl font-semibold text-gray-900">{sessionsNeedingEvaluation.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Evaluated</p>
                <p className="text-2xl font-semibold text-gray-900">{evaluatedSessions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm font-medium">🏷️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Needs Classification</p>
                <p className="text-2xl font-semibold text-gray-900">{sessionsNeedingClassification.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">🏷️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Classified</p>
                <p className="text-2xl font-semibold text-gray-900">{classifiedSessions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-medium">📈</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Score</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {evaluatedSessions.length > 0 
                    ? (evaluatedSessions.reduce((sum, session) => {
                        const score = getStructuralQualityScore(session);
                        return sum + (score === 'N/A' ? 0 : parseFloat(score));
                      }, 0) / evaluatedSessions.length).toFixed(1)
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          {sessionsNeedingEvaluation.length > 0 && (
            <button
              onClick={evaluateAllSessions}
              disabled={evaluatingSessions.size > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {evaluatingSessions.size > 0 ? 'Evaluating...' : `Evaluate All (${sessionsNeedingEvaluation.length} sessions)`}
            </button>
          )}
          
          {sessionsNeedingClassification.length > 0 && (
            <button
              onClick={classifyAllSessions}
              disabled={classifyingSessions.size > 0}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {classifyingSessions.size > 0 ? 'Classifying...' : `Classify All (${sessionsNeedingClassification.length} sessions)`}
            </button>
          )}
        </div>

        {/* Sessions Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Chat Sessions</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scenario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prompts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session Strategy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {session.session_id.substring(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(session.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.scenario}</div>
                      {session.task_code && (
                        <div className="text-sm text-gray-500">{session.task_code}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.total_prompts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEvaluationStatus(session)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getClassificationStatus(session)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {session.session_prompt_strategy_classification ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {session.session_prompt_strategy_classification}
                          </div>
                          {session.session_prompt_strategy_justification && (
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={session.session_prompt_strategy_justification}>
                              {session.session_prompt_strategy_justification}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not classified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getStructuralQualityScore(session)}/5
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/eval/${session.session_id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                      {session.needsEvaluation && (
                        <button
                          onClick={() => evaluateSession(session.session_id)}
                          disabled={evaluatingSessions.has(session.session_id)}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {evaluatingSessions.has(session.session_id) ? 'Evaluating...' : 'Evaluate'}
                        </button>
                      )}
                      {session.needsClassification && (
                        <button
                          onClick={() => classifySession(session.session_id)}
                          disabled={classifyingSessions.has(session.session_id)}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                        >
                          {classifyingSessions.has(session.session_id) ? 'Classifying...' : 'Classify'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results */}
        {(Object.keys(evaluationResults).length > 0 || Object.keys(classificationResults).length > 0) && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Results</h3>
            <div className="space-y-4">
              {Object.keys(evaluationResults).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Evaluation Results</h4>
                  <div className="space-y-2">
                    {Object.entries(evaluationResults).map(([sessionId, result]) => (
                      <div key={sessionId} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm font-mono text-gray-600">
                          {sessionId.substring(0, 8)}...
                        </span>
                        <span className="text-sm text-gray-900">{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {Object.keys(classificationResults).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Classification Results</h4>
                  <div className="space-y-2">
                    {Object.entries(classificationResults).map(([sessionId, result]) => (
                      <div key={sessionId} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm font-mono text-gray-600">
                          {sessionId.substring(0, 8)}...
                        </span>
                        <span className="text-sm text-gray-900">{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
