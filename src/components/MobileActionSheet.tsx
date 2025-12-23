import { Download, Trash2, Star, Edit2, MessageCircle, Share2, Eye, X } from 'lucide-react';
import { FileRecord } from '../lib/storage';

interface MobileActionSheetProps {
  file: FileRecord;
  darkMode: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onRename: () => void;
  onComments: () => void;
  onShare: () => void;
  onPreview?: () => void;
}

export function MobileActionSheet({
  file,
  darkMode,
  onClose,
  onDownload,
  onDelete,
  onToggleFavorite,
  onRename,
  onComments,
  onShare,
  onPreview
}: MobileActionSheetProps) {
  const menuItems = [
    onPreview && { icon: Eye, label: 'Preview', onClick: onPreview, color: 'default' },
    { icon: Download, label: 'Download', onClick: onDownload, color: 'default' },
    { icon: Share2, label: 'Share', onClick: onShare, color: 'default' },
    { icon: MessageCircle, label: 'Comments', onClick: onComments, color: 'default' },
    { icon: Star, label: file.favorite ? 'Unfavorite' : 'Favorite', onClick: onToggleFavorite, color: 'amber' },
    { icon: Edit2, label: 'Rename', onClick: onRename, color: 'default' },
    { icon: Trash2, label: 'Delete', onClick: onDelete, color: 'red' },
  ].filter(Boolean) as Array<{
    icon: any;
    label: string;
    onClick: () => void;
    color: string;
  }>;

  const handleItemClick = (onClick: () => void) => {
    onClick();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-t-3xl w-full max-w-lg pb-safe animate-slideUp`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'} truncate flex-1`}>
            {file.name}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item.onClick)}
              className={`w-full px-4 py-4 flex items-center gap-4 rounded-xl transition-colors ${
                item.color === 'red'
                  ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : item.color === 'amber' && file.favorite
                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  : darkMode
                  ? 'text-slate-300 hover:bg-slate-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-base font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
