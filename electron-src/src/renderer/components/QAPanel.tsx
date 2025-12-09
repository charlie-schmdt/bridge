import { useAuth } from '@/renderer/contexts/AuthContext';
import { supabase } from '@/renderer/lib/supabase';
import { useEffect, useState } from 'react';

interface QAQuestion {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_picture?: string;
  question: string;
  status: 'pending' | 'completed';
  completed_at?: string;
  completed_by?: string;
  created_at: string;
}

interface QAPanelProps {
  roomId: string;
  roomOwnerId: string | null; // The created_by field from the room
}

export default function QAPanel({ roomId, roomOwnerId }: QAPanelProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isRoomOwner = user?.id === roomOwnerId;
  
  console.log('🔍 Q&A Owner Check:', {
    currentUserId: user?.id,
    roomOwnerId: roomOwnerId,
    isRoomOwner: isRoomOwner
  });

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const completedQuestions = questions.filter(q => q.status === 'completed');

  // Fetch questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('qa_questions')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setQuestions(data || []);
      } catch (error) {
        console.error('Error fetching Q&A questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [roomId]);

  // Real-time subscription for Q&A updates
  useEffect(() => {
    console.log('🔌 Setting up Q&A realtime subscription for room:', roomId);
    
    const channel = supabase
      .channel(`qa:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qa_questions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('✅ New Q&A question received:', payload);
          setQuestions((current) => [...current, payload.new as QAQuestion]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qa_questions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('✅ Q&A question updated:', payload);
          setQuestions((current) =>
            current.map((q) => (q.id === payload.new.id ? (payload.new as QAQuestion) : q))
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Q&A subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up Q&A subscription');
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuestion.trim() || !user || submitting) return;

    setSubmitting(true);
    try {
      const questionId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('qa_questions')
        .insert({
          id: questionId,
          room_id: roomId,
          user_id: user.id,
          user_name: user.name,
          user_picture: user.picture,
          question: newQuestion.trim(),
          status: 'pending',
        });

      if (error) throw error;
      
      setNewQuestion('');
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleQuestionStatus = async (questionId: string, currentStatus: string) => {
    if (!isRoomOwner) return;

    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user?.id;
      } else {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error } = await supabase
        .from('qa_questions')
        .update(updateData)
        .eq('id', questionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating question status:', error);
      alert('Failed to update question status');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  const QuestionItem = ({ question }: { question: QAQuestion }) => {
    const isPending = question.status === 'pending';
    const isOwnQuestion = question.user_id === user?.id;

    return (
      <div
        className={`p-3 rounded-lg border ${
          isPending ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-75'
        }`}
      >
        <div className="flex items-start gap-2">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {question.user_picture ? (
              <img
                src={question.user_picture}
                alt={question.user_name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                {question.user_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Question content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900">
                {question.user_name}
                {isOwnQuestion && <span className="text-gray-500 font-normal ml-1">(You)</span>}
              </p>
              <span className="text-xs text-gray-500">{formatDate(question.created_at)} • {formatTime(question.created_at)}</span>
              {!isPending && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                  Completed
                </span>
              )}
            </div>
            <p className={`text-sm ${isPending ? 'text-gray-900' : 'text-gray-600 line-through'}`}>
              {question.question}
            </p>

            {/* Owner actions */}
            {isRoomOwner && (
              <button
                onClick={() => toggleQuestionStatus(question.id, question.status)}
                className={`mt-2 text-xs font-medium px-3 py-1 rounded transition ${
                  isPending
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                {isPending ? '✓ Mark as Completed' : '↺ Reopen'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Pending Questions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading questions...</p>
          </div>
        ) : (
          <>
            {/* Pending Section */}
            {pendingQuestions.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Pending Questions ({pendingQuestions.length})
                </h3>
                <div className="space-y-2">
                  {pendingQuestions.map((question) => (
                    <QuestionItem key={question.id} question={question} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Section */}
            {completedQuestions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Completed ({completedQuestions.length})
                </h3>
                <div className="space-y-2">
                  {completedQuestions.map((question) => (
                    <QuestionItem key={question.id} question={question} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {questions.length === 0 && (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">No questions yet</p>
                  <p className="text-sm text-gray-400">Be the first to ask a question!</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Submit form */}
      <form onSubmit={submitQuestion} className="p-3 border-t bg-white">
        <div className="flex flex-col gap-2">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
            placeholder="Ask a question..."
            rows={2}
            disabled={!user || submitting}
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {newQuestion.length}/500
            </span>
            <button
              type="submit"
              disabled={!newQuestion.trim() || !user || submitting}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              {submitting ? 'Submitting...' : 'Ask Question'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
