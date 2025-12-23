import { X, TrendingUp, Calendar, HardDrive, FileType } from 'lucide-react';
import { FileRecord } from '../lib/storage';

interface StorageAnalyticsProps {
  files: FileRecord[];
  darkMode: boolean;
  onClose: () => void;
}

export function StorageAnalytics({ files, darkMode, onClose }: StorageAnalyticsProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTypeStats = () => {
    const stats: Record<string, { count: number; size: number; color: string; label: string }> = {
      images: { count: 0, size: 0, color: 'bg-blue-500', label: 'Images' },
      videos: { count: 0, size: 0, color: 'bg-red-500', label: 'Videos' },
      audio: { count: 0, size: 0, color: 'bg-green-500', label: 'Audio' },
      documents: { count: 0, size: 0, color: 'bg-amber-500', label: 'Documents' },
      archives: { count: 0, size: 0, color: 'bg-yellow-500', label: 'Archives' },
      other: { count: 0, size: 0, color: 'bg-slate-500', label: 'Other' },
    };

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        stats.images.count++;
        stats.images.size += file.size;
      } else if (file.type.startsWith('video/')) {
        stats.videos.count++;
        stats.videos.size += file.size;
      } else if (file.type.startsWith('audio/')) {
        stats.audio.count++;
        stats.audio.size += file.size;
      } else if (
        file.type.includes('pdf') ||
        file.type.includes('document') ||
        file.type.includes('text')
      ) {
        stats.documents.count++;
        stats.documents.size += file.size;
      } else if (
        file.type.includes('zip') ||
        file.type.includes('rar') ||
        file.type.includes('tar')
      ) {
        stats.archives.count++;
        stats.archives.size += file.size;
      } else {
        stats.other.count++;
        stats.other.size += file.size;
      }
    });

    return Object.entries(stats)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[1].size - a[1].size);
  };

  const getUploadTrend = () => {
    const last30Days: Record<string, number> = {};
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      last30Days[key] = 0;
    }

    files.forEach((file) => {
      const date = new Date(file.created_at).toISOString().split('T')[0];
      if (date in last30Days) {
        last30Days[date]++;
      }
    });

    return Object.entries(last30Days);
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const typeStats = getFileTypeStats();
  const uploadTrend = getUploadTrend();
  const maxUploads = Math.max(...uploadTrend.map(([_, count]) => count), 1);

  const getLargestFiles = () => {
    return [...files].sort((a, b) => b.size - a.size).slice(0, 5);
  };

  const getRecentFiles = () => {
    return [...files]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  const getAverageFileSize = () => {
    return files.length > 0 ? totalSize / files.length : 0;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl max-w-6xl w-full p-8 animate-slideUp max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Storage Analytics
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Insights and trends for your vault
            </p>
          </div>
          <button
            onClick={onClose}
            className={darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl p-6`}>
            <div className="flex items-center gap-3 mb-2">
              <HardDrive className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Total Storage
              </span>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {formatBytes(totalSize)}
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              {files.length} files
            </div>
          </div>

          <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl p-6`}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Average Size
              </span>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {formatBytes(getAverageFileSize())}
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              per file
            </div>
          </div>

          <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl p-6`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                This Month
              </span>
            </div>
            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {
                files.filter((f) => {
                  const fileDate = new Date(f.created_at);
                  const now = new Date();
                  return (
                    fileDate.getMonth() === now.getMonth() &&
                    fileDate.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              files uploaded
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <FileType className="w-5 h-5" />
              Storage by File Type
            </h3>
            <div className="space-y-4">
              {typeStats.map(([type, data]) => {
                const percentage = (data.size / totalSize) * 100;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${data.color}`}></div>
                        <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {data.label}
                        </span>
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {formatBytes(data.size)} ({data.count})
                      </div>
                    </div>
                    <div className={`w-full ${darkMode ? 'bg-slate-600' : 'bg-slate-200'} rounded-full h-2`}>
                      <div
                        className={`h-full ${data.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <TrendingUp className="w-5 h-5" />
              Upload Trend (30 Days)
            </h3>
            <div className="flex items-end justify-between gap-1 h-48">
              {uploadTrend.slice(-14).map(([date, count], index) => {
                const height = (count / maxUploads) * 100;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex-1 flex items-end w-full">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                        style={{ height: `${height}%` }}
                        title={`${formatDate(date)}: ${count} files`}
                      ></div>
                    </div>
                    <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      {new Date(date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Largest Files
            </h3>
            <div className="space-y-3">
              {getLargestFiles().map((file, index) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    darkMode ? 'bg-slate-600' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      #{index + 1}
                    </span>
                    <span className={`text-sm truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {file.name}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {formatBytes(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Recent Uploads
            </h3>
            <div className="space-y-3">
              {getRecentFiles().map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    darkMode ? 'bg-slate-600' : 'bg-white'
                  }`}
                >
                  <span className={`text-sm truncate flex-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {file.name}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'} ml-3`}>
                    {formatDate(file.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
