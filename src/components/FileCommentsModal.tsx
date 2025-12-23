import { useState, useEffect } from 'react';
import { X, MessageCircle, Send, Trash2 } from 'lucide-react';
import { storage, FileRecord, FileComment } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';

interface FileCommentsModalProps {
  file: FileRecord;
  darkMode: boolean;
  onClose: () => void;
}

export function FileCommentsModal({ file, darkMode, onClose }: FileCommentsModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<FileComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [file.id]);

  const loadComments = async () => {
    try {
      const data = await storage.getFileComments(file.id);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await storage.addFileComment(file.id, newComment.trim());
      setNewComment('');
      await loadComments();
    } catch (error) {
      alert('Error adding comment: ' + error);
    }
    setLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await storage.deleteFileComment(commentId);
      await loadComments();
    } catch (error) {
      alert('Error deleting comment: ' + error);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl max-w-2xl w-full h-[600px] flex flex-col animate-slideUp`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Comments</h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{file.name}</p>
          </div>
          <button
            onClick={onClose}
            className={darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {comments.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No comments yet</p>
              <p className="text-sm">Be the first to comment on this file</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-slate-300'} flex items-center justify-center`}>
                        <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {user?.email?.[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {comment.user_id === user?.id ? 'You' : 'User'}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          {formatDate(comment.created_at)}
                        </div>
                      </div>
                    </div>
                    {comment.user_id === user?.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} whitespace-pre-wrap`}>
                    {comment.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleAddComment();
                }
              }}
              placeholder="Write a comment... (Ctrl+Enter to send)"
              className={`flex-1 px-4 py-3 ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-300'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
              rows={3}
            />
            <button
              onClick={handleAddComment}
              disabled={loading || !newComment.trim()}
              className={`px-6 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
