'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { UploadCloud, FileText, Check } from 'lucide-react';
import { formatBytes } from '../../lib/utils';

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Validation Error', 'Please choose a file to upload.', 'error');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post(`/projects/${projectId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      showToast('Success', 'Document uploaded successfully.', 'success');
      setSelectedFile(null);
      onClose();
    } catch (err: any) {
      showToast('Upload Error', err.response?.data?.message || 'Failed to upload document.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Upload Project Document" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-indigo-50/20 hover:border-indigo-300 transition-colors">
          <input
            type="file"
            id="doc-file-input"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.svg,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
          />
          <label htmlFor="doc-file-input" className="cursor-pointer block">
            {selectedFile ? (
              <div className="space-y-2">
                <div className="h-10 w-10 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-400">{formatBytes(selectedFile.size)}</p>
                <span className="text-[11px] text-indigo-600 font-semibold hover:underline block">
                  Click to choose a different file
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="h-10 w-10 mx-auto text-indigo-600" />
                <p className="text-xs font-bold text-slate-800">
                  Click to browse or drop your document here
                </p>
                <p className="text-[11px] text-slate-400">
                  Supported formats: PDF, PNG, JPG, DOCX, XLSX, CSV, ZIP (Max 25MB)
                </p>
              </div>
            )}
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isUploading} disabled={!selectedFile}>
            Upload Document
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
