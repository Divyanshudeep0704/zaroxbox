import { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Copy, Trash2, Calendar, Lock, Download } from 'lucide-react';
import { storage, FileRecord, FileShare } from '../lib/storage';

interface ShareLinkModalProps {
  file: FileRecord;
  darkMode: boolean;
  onClose: () => void;
}

export function ShareLinkModal({ file, darkMode, onClose }: ShareLinkModalProps) {
  const [shares, setShares] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [maxDownloads, setMaxDownloads] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  useEffect(() => {
    loadShares();
  }, [file.id]);

  const loadShares = async () => {
    try {
      const data = await storage.getFileShares(file.id);
      setShares(data);
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      const options: any = {};

      if (expiresIn !== 'never') {
        const expiresAt = new Date();
        if (expiresIn === '1hour') expiresAt.setHours(expiresAt.getHours() + 1);
        else if (expiresIn === '1day') expiresAt.setDate(expiresAt.getDate() + 1);
        else if (expiresIn === '7days') expiresAt.setDate(expiresAt.getDate() + 7);
        else if (expiresIn === '30days') expiresAt.setDate(expiresAt.getDate() + 30);
        options.expiresAt = expiresAt;
      }

      if (maxDownloads) {
        options.maxDownloads = parseInt(maxDownloads);
      }

      if (password) {
        options.password = password;
      }

      await storage.createFileShare(file.id, options);
      await loadShares();

      setExpiresIn('never');
      setMaxDownloads('');
      setPassword('');
    } catch (error) {
      alert('Error creating share link: ' + error);
    }
    setLoading(false);
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm('Delete this share link?')) return;
    try {
      await storage.deleteFileShare(shareId);
      await loadShares();
    } catch (error) {
      alert('Error deleting share: ' + error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const isExpired = (share: FileShare) => {
    if (!share.expires_at) return false;
    return new Date(share.expires_at) < new Date();
  };

  const isMaxDownloadsReached = (share: FileShare) => {
    if (!share.max_downloads) return false;
    return share.download_count >= share.max_downloads;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl max-w-2xl w-full p-8 animate-slideUp max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Share Link</h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{file.name}</p>
          </div>
          <button
            onClick={onClose}
            className={darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl p-6 mb-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Create New Share Link</h3>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Calendar className="w-4 h-4 inline mr-2" />
                Expires In
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className={`w-full px-4 py-2 ${darkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'} border rounded-lg`}
              >
                <option value="never">Never</option>
                <option value="1hour">1 Hour</option>
                <option value="1day">1 Day</option>
                <option value="7days">7 Days</option>
                <option value="30days">30 Days</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Download className="w-4 h-4 inline mr-2" />
                Max Downloads (optional)
              </label>
              <input
                type="number"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                placeholder="Unlimited"
                min="1"
                className={`w-full px-4 py-2 ${darkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'} border rounded-lg`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Lock className="w-4 h-4 inline mr-2" />
                Password (optional)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="No password"
                className={`w-full px-4 py-2 ${darkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300'} border rounded-lg`}
              />
            </div>

            <button
              onClick={handleCreateShare}
              disabled={loading}
              className={`w-full py-3 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg font-medium transition-colors disabled:opacity-50`}
            >
              {loading ? 'Creating...' : 'Create Share Link'}
            </button>
          </div>
        </div>

        <div>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Active Links ({shares.length})
          </h3>

          {shares.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No share links yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4 ${
                    isExpired(share) || isMaxDownloadsReached(share) ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <LinkIcon className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                        <code className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'} truncate block`}>
                          {window.location.origin}/share/{share.share_token}
                        </code>
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'} space-y-1`}>
                        <div>Created: {formatDate(share.created_at)}</div>
                        {share.expires_at && (
                          <div className={isExpired(share) ? 'text-red-500' : ''}>
                            Expires: {formatDate(share.expires_at)}
                            {isExpired(share) && ' (Expired)'}
                          </div>
                        )}
                        {share.max_downloads && (
                          <div className={isMaxDownloadsReached(share) ? 'text-red-500' : ''}>
                            Downloads: {share.download_count}/{share.max_downloads}
                            {isMaxDownloadsReached(share) && ' (Limit reached)'}
                          </div>
                        )}
                        {share.password && (
                          <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Password protected
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleCopyLink(share.share_token)}
                        className={`p-2 ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'} rounded-lg transition-colors`}
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShare(share.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
