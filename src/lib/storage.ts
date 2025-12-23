import { supabase } from './supabase';

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
  storage_path: string;
  favorite?: boolean;
}

export interface FileShare {
  id: string;
  file_id: string;
  user_id: string;
  share_token: string;
  password?: string;
  expires_at?: string;
  max_downloads?: number;
  download_count: number;
  is_public: boolean;
  created_at: string;
  last_accessed_at?: string;
}

export interface FileComment {
  id: string;
  file_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface FileHash {
  id: string;
  file_id: string;
  user_id: string;
  hash: string;
  created_at: string;
}

export const storage = {
  async getNotes(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async saveNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          user_id: user.id,
          title: note.title,
          content: note.content,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getFiles(): Promise<FileRecord[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getFileType(file: File): string {
    if (file.type) return file.type;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'json': 'application/json',
      'xml': 'application/xml',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'text/javascript',
      'ts': 'text/typescript',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  },

  async saveFile(file: File, skipDuplicateCheck = false): Promise<{ file: FileRecord; isDuplicate: boolean; duplicateOf?: FileRecord }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const hash = await this.calculateFileHash(file);

    if (!skipDuplicateCheck) {
      const duplicate = await this.checkDuplicateFile(hash);
      if (duplicate) {
        return { file: duplicate, isDuplicate: true, duplicateOf: duplicate };
      }
    }

    const fileId = crypto.randomUUID();
    const filePath = `${user.id}/${fileId}`;
    const fileType = this.getFileType(file);

    const { error: uploadError } = await supabase.storage
      .from('vault-files')
      .upload(filePath, file, {
        contentType: fileType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data, error: dbError } = await supabase
      .from('files')
      .insert([
        {
          id: fileId,
          user_id: user.id,
          name: file.name,
          size: file.size,
          type: fileType,
          storage_path: filePath,
        },
      ])
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from('vault-files').remove([filePath]);
      throw dbError;
    }

    await this.saveFileHash(fileId, hash);

    return { file: data, isDuplicate: false };
  },

  async getFileData(id: string): Promise<Blob | null> {
    const { data: fileRecord, error: recordError } = await supabase
      .from('files')
      .select('storage_path')
      .eq('id', id)
      .maybeSingle();

    if (recordError || !fileRecord) return null;

    const { data, error } = await supabase.storage
      .from('vault-files')
      .download(fileRecord.storage_path);

    if (error) throw error;
    return data;
  },

  async getPublicFileUrl(id: string): Promise<string | null> {
    const { data: fileRecord, error: recordError } = await supabase
      .from('files')
      .select('storage_path')
      .eq('id', id)
      .maybeSingle();

    if (recordError || !fileRecord) return null;

    const { data, error } = await supabase.storage
      .from('vault-files')
      .createSignedUrl(fileRecord.storage_path, 3600);

    if (error) throw error;
    return data?.signedUrl || null;
  },

  async deleteFile(id: string): Promise<void> {
    const { data: fileRecord, error: recordError } = await supabase
      .from('files')
      .select('storage_path')
      .eq('id', id)
      .maybeSingle();

    if (recordError) throw recordError;

    if (fileRecord) {
      await supabase.storage
        .from('vault-files')
        .remove([fileRecord.storage_path]);
    }

    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateFile(id: string, updates: Partial<FileRecord>): Promise<void> {
    const { error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async getFile(id: string): Promise<FileRecord | null> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async calculateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async checkDuplicateFile(hash: string): Promise<FileRecord | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('file_hashes')
      .select('file_id')
      .eq('user_id', user.id)
      .eq('hash', hash)
      .maybeSingle();

    if (error || !data) return null;

    return await this.getFile(data.file_id);
  },

  async saveFileHash(fileId: string, hash: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('file_hashes')
      .insert([
        {
          file_id: fileId,
          user_id: user.id,
          hash,
        },
      ]);

    if (error) throw error;
  },

  async createFileShare(
    fileId: string,
    options: {
      password?: string;
      expiresAt?: Date;
      maxDownloads?: number;
      isPublic?: boolean;
    } = {}
  ): Promise<FileShare> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const shareToken = crypto.randomUUID();

    const { data, error } = await supabase
      .from('file_shares')
      .insert([
        {
          file_id: fileId,
          user_id: user.id,
          share_token: shareToken,
          password: options.password,
          expires_at: options.expiresAt?.toISOString(),
          max_downloads: options.maxDownloads,
          is_public: options.isPublic ?? true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFileShares(fileId: string): Promise<FileShare[]> {
    const { data, error } = await supabase
      .from('file_shares')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deleteFileShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('file_shares')
      .delete()
      .eq('id', shareId);

    if (error) throw error;
  },

  async getFileComments(fileId: string): Promise<FileComment[]> {
    const { data, error } = await supabase
      .from('file_comments')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addFileComment(fileId: string, comment: string): Promise<FileComment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('file_comments')
      .insert([
        {
          file_id: fileId,
          user_id: user.id,
          comment,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFileComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('file_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  },
};
