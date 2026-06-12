import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  UploadCloud,
  Search,
  Trash2,
  Download,
  Eye,
  Edit,
  FileImage,
  FileCode,
  File,
  X,
  AlertTriangle
} from 'lucide-react';

interface FileRecord {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  file_data?: string; // Base64 payload, only loaded on single fetch
  created_at: string;
}

export const Documents: React.FC = () => {
  const { apiCall } = useAuth();

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal / Preview States
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  
  // Rename States
  const [renamingFile, setRenamingFile] = useState<FileRecord | null>(null);
  const [newFilename, setNewFilename] = useState('');

  // Delete Confirmation States
  const [deletingFile, setDeletingFile] = useState<FileRecord | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = '/files';
      if (searchQuery) url += `?search=${searchQuery}`;
      
      const data = await apiCall(url);
      setFiles(data);
    } catch (err: any) {
      setError(err.message || 'Error loading files list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFiles();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 10MB limit
    if (selectedFile.size > 10 * 1024 * 1024) {
      return alert('File size exceeds 10MB limit.');
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      await apiCall('/files/upload', {
        method: 'POST',
        body: formData
      });

      fetchFiles();
    } catch (err: any) {
      alert(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePreview = async (file: FileRecord) => {
    try {
      // Fetch single file with base64 data payload
      const data = await apiCall(`/files/${file.id}`);
      setPreviewFile(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load file preview.');
    }
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      // Fetch full file payload
      const data = await apiCall(`/files/${file.id}`);
      
      // Download trigger
      const link = document.createElement('a');
      link.href = `data:${data.file_type};base64,${data.file_data}`;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Download failed.');
    }
  };

  const handleRenameClick = (file: FileRecord) => {
    setRenamingFile(file);
    setNewFilename(file.filename);
  };

  const handleRenameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !newFilename.trim()) return;

    try {
      await apiCall(`/files/${renamingFile.id}/rename`, {
        method: 'PUT',
        body: JSON.stringify({ filename: newFilename })
      });
      setRenamingFile(null);
      fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Failed to rename file.');
    }
  };

  const handleDeleteClick = (file: FileRecord) => {
    setDeletingFile(file);
  };

  const confirmDelete = async () => {
    if (!deletingFile) return;
    try {
      await apiCall(`/files/${deletingFile.id}`, { method: 'DELETE' });
      setDeletingFile(null);
      fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete file.');
    }
  };

  // Helper to choose file icon
  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <FileImage size={18} className="text-cyan-500" />;
    if (mime === 'application/pdf') return <FileText size={18} className="text-red-500" />;
    if (mime.startsWith('text/') || mime === 'application/json') return <FileCode size={18} className="text-indigo-500" />;
    return <File size={18} className="text-slate-500" />;
  };

  // Format File Size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Render file preview content based on MIME
  const renderPreviewContent = () => {
    if (!previewFile || !previewFile.file_data) return null;
    const { file_type, file_data } = previewFile;

    if (file_type.startsWith('image/')) {
      return (
        <div className="flex justify-center max-h-[400px] overflow-hidden rounded-xl border border-border">
          <img
            src={`data:${file_type};base64,${file_data}`}
            alt={previewFile.filename}
            className="object-contain max-w-full h-auto max-h-[400px]"
          />
        </div>
      );
    }

    if (file_type.startsWith('text/') || file_type === 'application/json' || file_type === 'text/plain') {
      try {
        // Decode base64 to plain text
        const decodedText = atob(file_data);
        return (
          <pre className="p-4 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-[11px] overflow-auto max-h-[400px] leading-relaxed select-text">
            <code>{decodedText}</code>
          </pre>
        );
      } catch (err) {
        return <div className="text-xs text-red-400">Failed to decode text file.</div>;
      }
    }

    if (file_type === 'application/pdf') {
      return (
        <div className="w-full h-[500px] border border-border rounded-xl overflow-hidden bg-slate-900">
          <iframe
            src={`data:application/pdf;base64,${file_data}#toolbar=0`}
            className="w-full h-full border-none"
            title={previewFile.filename}
          />
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-xs text-muted-foreground">
        Preview not supported for this file type. Click download to access the file.
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Secure Documents Vault</h2>
            <p className="text-muted-foreground text-xs">Upload important files, PDFs, or photos securely.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 pl-8.5 pr-4 text-xs placeholder-muted-foreground focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* UPLOAD CLOUD DRAG AREA */}
      <div
        onClick={handleUploadClick}
        className="border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group text-center"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="p-4 bg-card border border-border rounded-xl group-hover:scale-105 transition-transform shadow-sm mb-4">
          <UploadCloud size={28} className={uploading ? 'text-primary animate-bounce' : 'text-muted-foreground group-hover:text-primary'} />
        </div>
        
        <h3 className="text-xs font-bold text-foreground mb-1">
          {uploading ? 'Uploading secure file...' : 'Upload Important File'}
        </h3>
        <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
          Support images, text documents, or PDFs up to 10MB.
        </p>
      </div>

      {/* FILES LIST */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-card border border-border p-4 rounded-xl h-20 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="w-2/3 h-3 bg-muted rounded" />
                <div className="w-1/3 h-2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl">
          {error}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl flex flex-col items-center gap-2">
          <File size={36} className="text-muted-foreground/30" />
          <h3 className="text-xs font-bold text-foreground">No Documents Uploaded</h3>
          <p className="text-xs text-muted-foreground">Upload your files above to store them in your database vault.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-card border border-border hover:border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-150 group"
            >
              {/* Info block */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-muted/40 rounded-lg group-hover:scale-105 transition-transform">
                  {getFileIcon(file.file_type)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors" title={file.filename}>
                    {file.filename}
                  </h4>
                  <div className="flex gap-2 text-[9px] text-muted-foreground mt-0.5">
                    <span>{formatSize(file.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Preview */}
                <button
                  onClick={() => handlePreview(file)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Preview document"
                >
                  <Eye size={13} />
                </button>
                
                {/* Download */}
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Download file"
                >
                  <Download size={13} />
                </button>

                {/* Rename */}
                <button
                  onClick={() => handleRenameClick(file)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Rename file"
                >
                  <Edit size={13} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteClick(file)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  title="Delete permanently"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="text-xs font-bold text-foreground truncate max-w-[80%] flex items-center gap-2">
                {getFileIcon(previewFile.file_type)}
                {previewFile.filename}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Preview canvas */}
            <div className="py-2">
              {renderPreviewContent()}
            </div>

            <div className="flex justify-between items-center border-t border-border mt-4 pt-4 text-[10px] text-muted-foreground">
              <span>Size: {formatSize(previewFile.file_size)}</span>
              <button
                onClick={() => handleDownload(previewFile)}
                className="bg-primary text-primary-foreground py-1 px-3.5 rounded-lg text-xs font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME POPUP MODAL */}
      {renamingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-xs font-bold text-foreground mb-4">Rename Secure Document</h3>
            
            <form onSubmit={handleRenameSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5">Filename</label>
                <input
                  type="text"
                  required
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-2 px-3 text-xs focus:outline-none transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="px-3.5 py-1.5 border border-border rounded-xl text-xs font-semibold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground hover:bg-indigo-500 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Save Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deletingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Confirm Permanent File Deletion</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to permanently delete document <strong>"{deletingFile.filename}"</strong>? The document payload will be permanently deleted from Neon.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border mt-5 pt-4">
              <button
                onClick={() => setDeletingFile(null)}
                className="px-3.5 py-1.5 border border-border rounded-xl text-xs font-semibold hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3.5 py-1.5 bg-destructive text-destructive-foreground hover:bg-red-500 rounded-xl text-xs font-semibold shadow-md shadow-destructive/10 transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
