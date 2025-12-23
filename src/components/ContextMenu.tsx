import { useEffect, useRef } from 'react';
import {
  Download, Trash2, Star, Edit2, MessageCircle, Share2, Eye
} from 'lucide-react';
import { FileRecord } from '../lib/storage';

interface ContextMenuProps {
  x: number;
  y: number;
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

export function ContextMenu({
  x,
  y,
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
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }

      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

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
      ref={menuRef}
      className={`fixed z-50 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl py-1 min-w-[200px] animate-slideUp`}
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => handleItemClick(item.onClick)}
          className={`w-full px-4 py-2 flex items-center gap-3 transition-colors ${
            item.color === 'red'
              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
              : item.color === 'amber' && file.favorite
              ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              : darkMode
              ? 'text-slate-300 hover:bg-slate-700'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <item.icon className="w-4 h-4" />
          <span className="text-sm font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
