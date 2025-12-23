import { useState, useEffect, useRef, useMemo } from 'react';
import { storage, Note, FileRecord } from '../lib/storage';
import { useAuth } from '../contexts/AuthContext';
import {
  Lock, Upload, FileText, Plus, Trash2, Download, File, Clock,
  Image as ImageIcon, Video, Music, FileArchive, Code, Search,
  Grid3x3, List, Zap, HardDrive, TrendingUp, X, Moon, Sun,
  ArrowUpDown, Star, Edit2, Check, Undo2, CheckSquare, Square, MoreVertical, LogOut,
  Share2, MessageCircle, Loader
} from 'lucide-react';
import { ShareLinkModal } from './ShareLinkModal';
import { FileCommentsModal } from './FileCommentsModal';
import { ContextMenu } from './ContextMenu';
import { MobileActionSheet } from './MobileActionSheet';
import { StorageAnalytics } from './StorageAnalytics';
import { ToastContainer } from './Toast';

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'size';
type SortOrder = 'asc' | 'desc';

interface DeletedItem {
  file: FileRecord;
  data: Blob;
  timestamp: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'loading' | 'info';
}

export function VaultDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'files' | 'notes'>('files');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [previewFile, setPreviewFile] = useState<{ file: FileRecord; url: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isDragging, setIsDragging] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dropbox_theme') === 'dark');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [shareModalFile, setShareModalFile] = useState<FileRecord | null>(null);
  const [commentsModalFile, setCommentsModalFile] = useState<FileRecord | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileRecord } | null>(null);
  const [mobileActionSheet, setMobileActionSheet] = useState<FileRecord | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [textContent, setTextContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileCategory = (type: string) => {
    if (type.startsWith('image/')) return 'images';
    if (type.startsWith('video/')) return 'videos';
    if (type.startsWith('audio/')) return 'audio';
    return 'other';
  };

  const sortFiles = (filesToSort: FileRecord[]) => {
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comparison = a.size - b.size;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredFiles = useMemo(() => {
    return sortFiles(
      files
        .filter(f => filterType === 'all' || getFileCategory(f.type) === filterType)
        .filter(f => filterType !== 'favorites' || f.favorite)
        .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [files, filterType, searchQuery, sortBy, sortOrder]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    loadFiles();
    loadNotes();

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [darkMode]);

  useEffect(() => {
    if (previewFile && previewFile.file.type === 'application/pdf') {
      const timer = setTimeout(() => {
        setPreviewLoading(false);
        setToasts(prev => prev.filter(t => t.type !== 'loading'));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [previewFile]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === '/' && e.ctrlKey) {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if (e.key === 'u' && e.ctrlKey) {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        setShowNoteModal(true);
      }
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
      }
      if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        toggleDarkMode();
      }
      if (e.key === 'a' && e.ctrlKey && activeTab === 'files') {
        e.preventDefault();
        if (selectedFiles.size === filteredFiles.length) {
          setSelectedFiles(new Set());
        } else {
          setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
        }
      }
      if (e.key === 'z' && e.ctrlKey && deletedItems.length > 0) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [showShortcuts, selectedFiles, filteredFiles, activeTab, deletedItems]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDeletedItems(prev => prev.filter(item => Date.now() - item.timestamp < 10000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadFiles = async () => {
    const loadedFiles = await storage.getFiles();
    setFiles(loadedFiles);
  };

  const loadNotes = async () => {
    try {
      const loadedNotes = await storage.getNotes();
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dropbox_theme', newMode ? 'dark' : 'light');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    setLoading(true);
    try {
      for (const file of droppedFiles) {
        const result = await storage.saveFile(file);
        if (result.isDuplicate && result.duplicateOf) {
          const shouldUpload = confirm(
            `File "${file.name}" already exists as "${result.duplicateOf.name}". Upload anyway?`
          );
          if (shouldUpload) {
            await storage.saveFile(file, true);
          }
        }
      }
      await loadFiles();
    } catch (error) {
      alert('Error uploading files: ' + error);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setLoading(true);
    const uploadCount = fileList.length;
    showToast(`Uploading ${uploadCount} file${uploadCount > 1 ? 's' : ''}...`, 'loading');

    try {
      let successCount = 0;
      for (let i = 0; i < fileList.length; i++) {
        const result = await storage.saveFile(fileList[i]);
        if (result.isDuplicate && result.duplicateOf) {
          const shouldUpload = confirm(
            `File "${fileList[i].name}" already exists as "${result.duplicateOf.name}". Upload anyway?`
          );
          if (shouldUpload) {
            await storage.saveFile(fileList[i], true);
            successCount++;
          }
        } else {
          successCount++;
        }
      }
      await loadFiles();
      setToasts(prev => prev.filter(t => t.type !== 'loading'));
      showToast(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}!`, 'success');
    } catch (error) {
      setToasts(prev => prev.filter(t => t.type !== 'loading'));
      showToast('Error uploading files: ' + error, 'error');
    }

    setLoading(false);
    e.target.value = '';
  };

  const handleCreateNote = async () => {
    if (!noteContent.trim()) return;

    setLoading(true);
    showToast('Creating note...', 'loading');
    try {
      await storage.saveNote({
        title: noteTitle.trim() || 'Untitled',
        content: noteContent.trim(),
      });
      setNoteTitle('');
      setNoteContent('');
      setShowNoteModal(false);
      await loadNotes();
      setToasts(prev => prev.filter(t => t.type !== 'loading'));
      showToast('Note created successfully!', 'success');
    } catch (error) {
      setToasts(prev => prev.filter(t => t.type !== 'loading'));
      showToast('Error creating note: ' + error, 'error');
    }
    setLoading(false);
  };

  const handleDeleteFile = async (file: FileRecord) => {
    showToast('Deleting file...', 'loading');
    try {
      const data = await storage.getFileData(file.id);
      if (data) {
        setDeletedItems(prev => [...prev, { file, data, timestamp: Date.now() }]);
      }
      await storage.deleteFile(file.id);
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      await loadFiles();
      setToasts(prev => prev.filter(t => t.type !== 'loading'));
      showToast('File deleted successfully!', 'success');
    } catch (error) {
      setToasts(prev => prev.filter(t => t.type !== 'loading'));
      showToast('Error deleting file', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Delete ${selectedFiles.size} file(s)?`)) return;

    for (const fileId of selectedFiles) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        await handleDeleteFile(file);
      }
    }
    setSelectedFiles(new Set());
  };

  const handleUndo = async () => {
    const lastDeleted = deletedItems[deletedItems.length - 1];
    if (!lastDeleted) return;

    const fileToRestore = new File([lastDeleted.data], lastDeleted.file.name, {
      type: lastDeleted.file.type
    });

    await storage.saveFile(fileToRestore);
    await storage.updateFile(lastDeleted.file.id, { favorite: lastDeleted.file.favorite });

    setDeletedItems(prev => prev.slice(0, -1));
    await loadFiles();
  };

  const handleDeleteNote = (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    storage.deleteNote(noteId);
    loadNotes();
  };

  const handleDownloadFile = async (file: FileRecord) => {
    showToast('Preparing download...', 'loading');
    try {
      const blob = await storage.getFileData(file.id);
      if (!blob) {
        setToasts(prev => prev.filter(t => t.type !== 'loading'));
        showToast('Error: File not found', 'error');
        return;
      }

      const blobWithType = new Blob([blob], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blobWithType);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      setToasts(prev => prev.filter(t => t.type !== 'loading'));
      showToast('Download started!', 'success');
    } catch (error) {
      setToasts(prev => prev.filter(t => t.type !== 'loading'));
      showToast('Error downloading file: ' + error, 'error');
    }
  };

  const handleBulkDownload = async () => {
    for (const fileId of selectedFiles) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        await handleDownloadFile(file);
      }
    }
  };

  const handlePreviewFile = async (file: FileRecord) => {
    if (!isPreviewable(file)) return;

    showToast('Loading preview...', 'loading');
    setPreviewLoading(true);
    setTextContent('');

    try {
      const fileName = file.name.toLowerCase();
      const officeExtensions = ['.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];
      const isOfficeFile = officeExtensions.some(ext => fileName.endsWith(ext));

      let url: string;

      if (isOfficeFile) {
        const publicUrl = await storage.getPublicFileUrl(file.id);
        if (!publicUrl) {
          setToasts(prev => prev.filter(t => t.type !== 'loading'));
          setPreviewLoading(false);
          showToast('Error loading preview', 'error');
          return;
        }
        url = publicUrl;
      } else {
        const blob = await storage.getFileData(file.id);
        if (!blob) {
          setToasts(prev => prev.filter(t => t.type !== 'loading'));
          setPreviewLoading(false);
          showToast('Error loading preview', 'error');
          return;
        }

        const textExtensions = ['.txt', '.md', '.json', '.xml', '.csv', '.log'];
        const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.py', '.java', '.c', '.cpp', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.sql', '.sh', '.yaml', '.yml'];
        const isTextFile = file.type === 'text/plain' ||
                           textExtensions.some(ext => fileName.endsWith(ext)) ||
                           codeExtensions.some(ext => fileName.endsWith(ext));

        if (isTextFile) {
          const text = await blob.text();
          setTextContent(text);
        }

        url = URL.createObjectURL(blob);
      }

      setPreviewFile({ file, url });
      setToasts(prev => prev.filter(t => t.type !== 'loading'));
    } catch (error) {
      setToasts(prev => prev.filter(t => t.type !== 'loading'));
      setPreviewLoading(false);
      showToast('Error loading preview: ' + error, 'error');
    }
  };

  const closePreview = () => {
    if (previewFile) {
      if (previewFile.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewFile.url);
      }
      setPreviewFile(null);
      setPreviewLoading(false);
      setTextContent('');
    }
  };

  const toggleFavorite = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    try {
      await storage.updateFile(fileId, { favorite: !file.favorite });
      await loadFiles();
      showToast(file.favorite ? 'Removed from favorites' : 'Added to favorites', 'success');
    } catch (error) {
      showToast('Error updating favorite', 'error');
    }
  };

  const startRenaming = (file: FileRecord) => {
    setEditingFileId(file.id);
    setEditingFileName(file.name);
  };

  const handleRename = async (fileId: string) => {
    if (!editingFileName.trim()) return;
    try {
      await storage.updateFile(fileId, { name: editingFileName.trim() });
      setEditingFileId(null);
      await loadFiles();
      showToast('File renamed successfully!', 'success');
    } catch (error) {
      showToast('Error renaming file', 'error');
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileRecord) => {
    e.preventDefault();
    if (isMobile) {
      setMobileActionSheet(file);
    } else {
      setContextMenu({ x: e.clientX, y: e.clientY, file });
    }
  };

  const getFileIcon = (type: string) => {
    const iconClass = isMobile ? "w-5 h-5" : "w-6 h-6";
    if (type.startsWith('image/')) return <ImageIcon className={iconClass} />;
    if (type.startsWith('video/')) return <Video className={iconClass} />;
    if (type.startsWith('audio/')) return <Music className={iconClass} />;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <FileArchive className={iconClass} />;
    if (type.includes('javascript') || type.includes('python') || type.includes('code')) return <Code className={iconClass} />;
    return <File className={iconClass} />;
  };

  const getFileColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (type.startsWith('video/')) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    if (type.startsWith('audio/')) return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (type.includes('javascript') || type.includes('python') || type.includes('code')) return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  };

  const isPreviewable = (file: FileRecord) => {
    const fileName = file.name.toLowerCase();
    const officeExtensions = ['.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];
    const textExtensions = ['.txt', '.md', '.json', '.xml', '.csv', '.log'];
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.py', '.java', '.c', '.cpp', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.sql', '.sh', '.yaml', '.yml'];

    const officeMimeTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    return file.type.startsWith('image/') ||
           file.type.startsWith('video/') ||
           file.type.startsWith('audio/') ||
           file.type === 'application/pdf' ||
           file.type === 'text/plain' ||
           officeMimeTypes.includes(file.type) ||
           officeExtensions.some(ext => fileName.endsWith(ext)) ||
           textExtensions.some(ext => fileName.endsWith(ext)) ||
           codeExtensions.some(ext => fileName.endsWith(ext));
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalSize = () => {
    return files.reduce((acc, file) => acc + file.size, 0);
  };

  const getStoragePercentage = () => {
    const totalSize = getTotalSize();
    if (totalSize === 0) return 0;
    return Math.min(5 + (totalSize / (1024 * 1024 * 1024)) * 0.5, 15);
  };

  const getLargestFile = () => {
    return files.length > 0 ? files.reduce((max, file) => file.size > max.size ? file : max) : null;
  };

  const getAverageFileSize = () => {
    return files.length > 0 ? getTotalSize() / files.length : 0;
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        darkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <nav className={`${darkMode ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-sm border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'} sticky top-0 z-20 transition-colors`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-base sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>zaroxbox</h1>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} hidden sm:block`}>Unlimited Storage</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-4">
              <span className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'} hidden lg:inline`}>{user?.email}</span>
              <button
                onClick={toggleDarkMode}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className={`hidden md:inline text-xs ${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'} transition-colors`}
              >
                Press <kbd className={`px-2 py-1 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} rounded`}>?</kbd> for shortcuts
              </button>
              <button
                onClick={signOut}
                className={`hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors touch-manipulation ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Sign Out</span>
              </button>
              <button
                onClick={signOut}
                className={`sm:hidden p-1.5 rounded-lg transition-colors touch-manipulation ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="text-right hidden sm:block">
                <div className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{files.length} files</div>
                <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatBytes(getTotalSize())} stored</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {deletedItems.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 flex items-center justify-between animate-slideUp`}>
            <div className="flex items-center gap-3">
              <Undo2 className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-blue-900'}`}>
                File deleted. <button onClick={handleUndo} className="font-semibold underline">Undo</button> (Ctrl+Z)
              </span>
            </div>
            <button onClick={() => setDeletedItems([])} className={darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-blue-600 hover:text-blue-800'}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className={`${darkMode ? 'from-blue-600 to-blue-700' : 'from-blue-500 to-blue-600'} bg-gradient-to-br rounded-xl sm:rounded-2xl p-3 sm:p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <HardDrive className="w-5 h-5 sm:w-8 sm:h-8 opacity-80" />
              <Zap className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{files.length}</div>
            <div className={`${darkMode ? 'text-blue-200' : 'text-blue-100'} text-xs sm:text-sm`}>Total Files</div>
          </div>

          <div className={`${darkMode ? 'from-emerald-600 to-emerald-700' : 'from-emerald-500 to-emerald-600'} bg-gradient-to-br rounded-xl sm:rounded-2xl p-3 sm:p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <ImageIcon className="w-5 h-5 sm:w-8 sm:h-8 opacity-80" />
              <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{files.filter(f => f.type.startsWith('image/')).length}</div>
            <div className={`${darkMode ? 'text-emerald-200' : 'text-emerald-100'} text-xs sm:text-sm`}>Images</div>
          </div>

          <div className={`${darkMode ? 'from-amber-600 to-amber-700' : 'from-amber-500 to-amber-600'} bg-gradient-to-br rounded-xl sm:rounded-2xl p-3 sm:p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Star className="w-5 h-5 sm:w-8 sm:h-8 opacity-80" />
              <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{files.filter(f => f.favorite).length}</div>
            <div className={`${darkMode ? 'text-amber-200' : 'text-amber-100'} text-xs sm:text-sm`}>Favorites</div>
          </div>

          <div className={`${darkMode ? 'from-purple-600 to-purple-700' : 'from-purple-500 to-purple-600'} bg-gradient-to-br rounded-xl sm:rounded-2xl p-3 sm:p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <FileText className="w-5 h-5 sm:w-8 sm:h-8 opacity-80" />
              <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{notes.length}</div>
            <div className={`${darkMode ? 'text-purple-200' : 'text-purple-100'} text-xs sm:text-sm`}>Notes</div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl p-6 mb-8 shadow-sm border transition-colors`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Storage Usage</h3>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{formatBytes(getTotalSize())} used</span>
              <button
                onClick={() => setShowAnalytics(true)}
                className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                  darkMode ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                View Analytics
              </button>
            </div>
          </div>
          <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-full h-3 overflow-hidden`}>
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getStoragePercentage()}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div>
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Average Size</div>
              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatBytes(getAverageFileSize())}</div>
            </div>
            <div>
              <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Largest File</div>
              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>{getLargestFile() ? formatBytes(getLargestFile()!.size) : 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Your Vault</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files... (Ctrl+/)"
                  className={`pl-10 pr-4 py-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-slate-900'} border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm w-64 transition-colors`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className={`flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200'} border rounded-xl hover:shadow-md transition-all`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="text-sm capitalize">{sortBy}</span>
                </button>
                {showSortMenu && (
                  <div className={`absolute right-0 mt-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl shadow-xl p-2 min-w-[160px] z-10 animate-slideUp`}>
                    {(['date', 'name', 'size'] as SortBy[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          if (sortBy === option) {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy(option);
                            setSortOrder('desc');
                          }
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          sortBy === option
                            ? darkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'
                            : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize">{option}</span>
                          {sortBy === option && (
                            <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={`flex ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? darkMode ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'
                      : darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? darkMode ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'
                      : darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Store unlimited files, videos, images, and notes privately</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'files'
                ? darkMode ? 'bg-slate-700 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg'
                : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <File className="w-4 h-4" />
              Files ({files.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'notes'
                ? darkMode ? 'bg-slate-700 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg'
                : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes ({notes.length})
            </div>
          </button>
        </div>

        {selectedFiles.size > 0 && activeTab === 'files' && (
          <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4 mb-6 flex items-center justify-between animate-slideUp`}>
            <div className="flex items-center gap-3">
              <CheckSquare className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {selectedFiles.size} file(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDownload}
                className={`px-4 py-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-700'} rounded-lg text-sm font-medium transition-colors flex items-center gap-2`}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedFiles(new Set())}
                className={`px-4 py-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-700'} rounded-lg text-sm font-medium transition-colors`}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div>
            <div className="mb-6">
              <label className={`flex flex-col items-center justify-center gap-3 w-full px-6 py-12 ${
                darkMode
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                  : 'bg-gradient-to-br from-white to-slate-50'
              } border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-xl'
                  : darkMode ? 'border-slate-700 hover:border-slate-600 hover:shadow-lg' : 'border-slate-300 hover:border-slate-500 hover:shadow-lg'
              }`}>
                <div className={`w-16 h-16 ${darkMode ? 'bg-slate-700' : 'bg-slate-900'} rounded-2xl flex items-center justify-center transition-transform ${
                  isDragging ? 'scale-110' : ''
                }`}>
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <span className={`text-lg font-semibold block ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {loading ? 'Uploading...' : isDragging ? 'Drop files here!' : 'Drop files here or click to upload'}
                  </span>
                  <span className={`text-sm mt-1 block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Videos, images, documents - unlimited storage (Ctrl+U)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                  multiple
                />
              </label>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? darkMode ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'
                    : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({files.length})
              </button>
              <button
                onClick={() => setFilterType('favorites')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'favorites'
                    ? 'bg-amber-600 text-white'
                    : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-amber-600/20' : 'bg-white text-slate-600 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Favorites ({files.filter(f => f.favorite).length})
                </div>
              </button>
              <button
                onClick={() => setFilterType('images')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'images'
                    ? 'bg-blue-600 text-white'
                    : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-blue-600/20' : 'bg-white text-slate-600 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Images ({files.filter(f => f.type.startsWith('image/')).length})
                </div>
              </button>
              <button
                onClick={() => setFilterType('videos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'videos'
                    ? 'bg-red-600 text-white'
                    : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-red-600/20' : 'bg-white text-slate-600 hover:bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Videos ({files.filter(f => f.type.startsWith('video/')).length})
                </div>
              </button>
              <button
                onClick={() => setFilterType('audio')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'audio'
                    ? 'bg-green-600 text-white'
                    : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-green-600/20' : 'bg-white text-slate-600 hover:bg-green-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Audio ({files.filter(f => f.type.startsWith('audio/')).length})
                </div>
              </button>
            </div>

            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {filteredFiles.length === 0 ? (
                <div className={`col-span-full ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-12 text-center border`}>
                  <File className={`w-16 h-16 ${darkMode ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-4`} />
                  <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg font-medium mb-2`}>
                    {searchQuery ? 'No files found' : filterType === 'favorites' ? 'No favorites yet' : 'No files yet'}
                  </p>
                  <p className={`${darkMode ? 'text-slate-500' : 'text-slate-500'} text-sm`}>
                    {searchQuery ? 'Try a different search term' : filterType === 'favorites' ? 'Star files to add them to favorites' : 'Upload your first file to get started'}
                  </p>
                </div>
              ) : (
                filteredFiles.map((file) => (
                  viewMode === 'grid' ? (
                    <div
                      key={file.id}
                      className={`${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white border-gray-200'} rounded-xl p-4 border hover:shadow-lg transition-all group relative`}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleFileSelection(file.id)}
                            className={`flex-shrink-0 ${selectedFiles.has(file.id) ? 'text-blue-600' : darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {selectedFiles.has(file.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileColor(file.type)}`}>
                            {getFileIcon(file.type)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleFavorite(file.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              file.favorite
                                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                : darkMode ? 'text-slate-600 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${file.favorite ? 'fill-current' : ''}`} />
                          </button>
                          {isPreviewable(file) && (
                            <button
                              onClick={() => handlePreviewFile(file)}
                              className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setShareModalFile(file)}
                            className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            title="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCommentsModalFile(file)}
                            className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            title="Comments"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startRenaming(file)}
                            className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadFile(file)}
                            className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {editingFileId === file.id ? (
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={editingFileName}
                            onChange={(e) => setEditingFileName(e.target.value)}
                            className={`flex-1 px-2 py-1 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'} border rounded`}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(file.id);
                              if (e.key === 'Escape') setEditingFileId(null);
                            }}
                          />
                          <button
                            onClick={() => handleRename(file.id)}
                            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingFileId(null)}
                            className={`p-1 ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'} rounded`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'} truncate mb-2`} title={file.name}>
                          {file.name}
                        </h3>
                      )}
                      <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(file.created_at)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={file.id}
                      className={`${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white border-gray-200'} rounded-lg p-4 border hover:shadow-md transition-all group flex items-center justify-between`}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                          onClick={() => toggleFileSelection(file.id)}
                          className={`flex-shrink-0 ${selectedFiles.has(file.id) ? 'text-blue-600' : darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {selectedFiles.has(file.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </button>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileColor(file.type)}`}>
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingFileId === file.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingFileName}
                                onChange={(e) => setEditingFileName(e.target.value)}
                                className={`flex-1 px-2 py-1 text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'} border rounded`}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRename(file.id);
                                  if (e.key === 'Escape') setEditingFileId(null);
                                }}
                              />
                              <button
                                onClick={() => handleRename(file.id)}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingFileId(null)}
                                className={`p-1 ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'} rounded`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'} truncate`} title={file.name}>
                                {file.name}
                              </h3>
                              <div className={`flex items-center gap-3 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span>{formatBytes(file.size)}</span>
                                <span>•</span>
                                <span>{formatDate(file.created_at)}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => toggleFavorite(file.id)}
                          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                            file.favorite
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              : darkMode ? 'text-slate-600 hover:bg-slate-700 opacity-0 group-hover:opacity-100' : 'text-slate-400 hover:bg-slate-100 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${file.favorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPreviewable(file) && (
                          <button
                            onClick={() => handlePreviewFile(file)}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShareModalFile(file)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCommentsModalFile(file)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                          title="Comments"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startRenaming(file)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <button
              onClick={() => setShowNoteModal(true)}
              className={`w-full mb-6 flex items-center justify-center gap-3 px-6 py-8 ${
                darkMode
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-slate-600'
                  : 'bg-gradient-to-br from-white to-slate-50 border-slate-300 hover:border-slate-500'
              } border-2 border-dashed rounded-2xl hover:shadow-lg transition-all`}
            >
              <Plus className={`w-6 h-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
              <span className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} font-medium`}>Create new note (Ctrl+N)</span>
            </button>

            <div className="grid md:grid-cols-2 gap-4">
              {filteredNotes.length === 0 ? (
                <div className={`col-span-full ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-12 text-center border`}>
                  <FileText className={`w-16 h-16 ${darkMode ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-4`} />
                  <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-lg font-medium mb-2`}>
                    {searchQuery ? 'No notes found' : 'No notes yet'}
                  </p>
                  <p className={`${darkMode ? 'text-slate-500' : 'text-slate-500'} text-sm`}>
                    {searchQuery ? 'Try a different search term' : 'Create your first note to get started'}
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-xl p-6 border hover:shadow-lg transition-all`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-slate-900'} flex-1`}>{note.title}</h3>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} whitespace-pre-wrap mb-3 line-clamp-3`}>{note.content}</p>
                    <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      <Clock className="w-3 h-3" />
                      {formatDate(note.updated_at)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowNoteModal(false)}>
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl max-w-2xl w-full p-8 animate-slideUp`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-6`}>Create Note</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Title
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className={`w-full px-4 py-3 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'} border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent`}
                  placeholder="Note title"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Content
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className={`w-full px-4 py-3 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'} border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent min-h-[200px]`}
                  placeholder="Write your note here..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateNote}
                disabled={loading || !noteContent.trim()}
                className={`flex-1 py-3 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Creating...' : 'Create Note'}
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteTitle('');
                  setNoteContent('');
                }}
                className={`px-6 py-3 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} rounded-xl font-medium transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={closePreview}>
          <button
            onClick={closePreview}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-3 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {previewLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-black bg-opacity-70 rounded-2xl p-8 flex flex-col items-center gap-4">
                <Loader className="w-12 h-12 text-white animate-spin" />
                <p className="text-white font-medium">Loading preview...</p>
              </div>
            </div>
          )}

          <div className="max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            {previewFile.file.type.startsWith('image/') && (
              <img
                src={previewFile.url}
                alt={previewFile.file.name}
                className="w-full h-full object-contain rounded-lg"
                onLoad={() => setPreviewLoading(false)}
                onError={() => {
                  setPreviewLoading(false);
                  showToast('Error loading image', 'error');
                }}
              />
            )}
            {previewFile.file.type.startsWith('video/') && (
              <video
                src={previewFile.url}
                controls
                className="w-full h-full rounded-lg"
                onLoadedData={() => setPreviewLoading(false)}
                onError={() => {
                  setPreviewLoading(false);
                  showToast('Error loading video', 'error');
                }}
              />
            )}
            {previewFile.file.type.startsWith('audio/') && (
              <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-8 max-w-2xl mx-auto`}>
                <div className="text-center mb-6">
                  <Music className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {previewFile.file.name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {formatBytes(previewFile.file.size)}
                  </p>
                </div>
                <audio
                  src={previewFile.url}
                  controls
                  className="w-full"
                  autoPlay
                  onLoadedData={() => setPreviewLoading(false)}
                  onError={() => {
                    setPreviewLoading(false);
                    showToast('Error loading audio', 'error');
                  }}
                />
              </div>
            )}
            {previewFile.file.type === 'application/pdf' && (
              <div className="w-full h-full">
                <iframe
                  src={`${previewFile.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                  className="w-full h-full rounded-lg border-0"
                  title={previewFile.file.name}
                  onLoad={() => {
                    setPreviewLoading(false);
                    setToasts(prev => prev.filter(t => t.type !== 'loading'));
                  }}
                  onError={() => {
                    setPreviewLoading(false);
                    setToasts(prev => prev.filter(t => t.type !== 'loading'));
                  }}
                />
              </div>
            )}
            {(() => {
              const fileName = previewFile.file.name.toLowerCase();
              const officeExtensions = ['.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];
              const isOfficeFile = officeExtensions.some(ext => fileName.endsWith(ext));

              if (isOfficeFile) {
                setTimeout(() => {
                  setPreviewLoading(false);
                  setToasts(prev => prev.filter(t => t.type !== 'loading'));
                }, 2000);

                const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewFile.url)}`;

                return (
                  <div className="w-full h-full flex flex-col">
                    <div className={`flex items-center justify-between p-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b`}>
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                        <div>
                          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {previewFile.file.name}
                          </h3>
                          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {formatBytes(previewFile.file.size)} • Office Document
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(previewFile.file)}
                        className={`px-4 py-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm`}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                    <div className="flex-1 relative">
                      <iframe
                        src={viewerUrl}
                        className="w-full h-full border-0"
                        title={previewFile.file.name}
                        allow="autoplay"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      />
                      <div className={`absolute inset-x-0 bottom-0 ${darkMode ? 'bg-gradient-to-t from-slate-900/80' : 'bg-gradient-to-t from-white/80'} p-4 text-center`}>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Preview powered by Microsoft Office Online
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            {textContent && (() => {
              setPreviewLoading(false);
              return (
                <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 max-w-4xl max-h-[80vh] overflow-auto mx-auto`}>
                  <div className={`flex items-center justify-between mb-4 pb-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div>
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {previewFile.file.name}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {formatBytes(previewFile.file.size)}
                      </p>
                    </div>
                    <FileText className={`w-8 h-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                  </div>
                  <pre className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'} whitespace-pre-wrap break-words font-mono`}>
                    {textContent}
                  </pre>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setShowShortcuts(false)}>
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl max-w-md w-full p-8 animate-slideUp`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className={darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Search files', key: 'Ctrl+/' },
                { label: 'Upload files', key: 'Ctrl+U' },
                { label: 'Create note', key: 'Ctrl+N' },
                { label: 'Toggle dark mode', key: 'Ctrl+D' },
                { label: 'Select all files', key: 'Ctrl+A' },
                { label: 'Undo delete', key: 'Ctrl+Z' },
                { label: 'Show shortcuts', key: 'Shift+?' },
              ].map((shortcut, index, arr) => (
                <div key={shortcut.key} className={`flex items-center justify-between py-2 ${index < arr.length - 1 ? 'border-b' : ''} ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{shortcut.label}</span>
                  <kbd className={`px-3 py-1 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'} rounded text-sm`}>{shortcut.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {shareModalFile && (
        <ShareLinkModal
          file={shareModalFile}
          darkMode={darkMode}
          onClose={() => setShareModalFile(null)}
        />
      )}

      {commentsModalFile && (
        <FileCommentsModal
          file={commentsModalFile}
          darkMode={darkMode}
          onClose={() => setCommentsModalFile(null)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          darkMode={darkMode}
          onClose={() => setContextMenu(null)}
          onDownload={() => handleDownloadFile(contextMenu.file)}
          onDelete={() => handleDeleteFile(contextMenu.file)}
          onToggleFavorite={() => toggleFavorite(contextMenu.file.id)}
          onRename={() => startRenaming(contextMenu.file)}
          onComments={() => setCommentsModalFile(contextMenu.file)}
          onShare={() => setShareModalFile(contextMenu.file)}
          onPreview={isPreviewable(contextMenu.file) ? () => handlePreviewFile(contextMenu.file) : undefined}
        />
      )}

      {showAnalytics && (
        <StorageAnalytics
          files={files}
          darkMode={darkMode}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {mobileActionSheet && (
        <MobileActionSheet
          file={mobileActionSheet}
          darkMode={darkMode}
          onClose={() => setMobileActionSheet(null)}
          onDownload={() => {
            handleDownloadFile(mobileActionSheet);
            setMobileActionSheet(null);
          }}
          onDelete={() => {
            handleDeleteFile(mobileActionSheet);
            setMobileActionSheet(null);
          }}
          onToggleFavorite={() => {
            toggleFavorite(mobileActionSheet.id);
            setMobileActionSheet(null);
          }}
          onRename={() => {
            startRenaming(mobileActionSheet);
            setMobileActionSheet(null);
          }}
          onComments={() => {
            setCommentsModalFile(mobileActionSheet);
            setMobileActionSheet(null);
          }}
          onShare={() => {
            setShareModalFile(mobileActionSheet);
            setMobileActionSheet(null);
          }}
          onPreview={
            isPreviewable(mobileActionSheet)
              ? () => {
                  handlePreviewFile(mobileActionSheet);
                  setMobileActionSheet(null);
                }
              : undefined
          }
        />
      )}

      <ToastContainer toasts={toasts} darkMode={darkMode} onRemove={removeToast} />
    </div>
  );
}
