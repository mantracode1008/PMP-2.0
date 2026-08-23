'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../auth/auth-context';
import { Button } from '../../components/ui/button';
import { DataTable, Column } from '../../components/shared/data-table';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { useToast } from '../../components/ui/toast';
import { formatDate, formatBytes } from '../../lib/utils';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  Image,
  Download,
  Trash2,
  Plus,
  UploadCloud,
} from 'lucide-react';
import { DocumentItem } from '../../types';

interface DocumentListViewProps {
  documents: DocumentItem[];
  projectId: string;
  isLoading: boolean;
  onUploadDocument: () => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-emerald-600" />;
  if (mimeType.includes('sheet') || mimeType.includes('csv'))
    return <FileSpreadsheet className="h-4 w-4 text-teal-600" />;
  if (mimeType.includes('json') || mimeType.includes('code'))
    return <FileCode className="h-4 w-4 text-amber-600" />;
  return <FileText className="h-4 w-4 text-indigo-600" />;
};

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  documents,
  projectId,
  isLoading,
  onUploadDocument,
}) => {
  const queryClient = useQueryClient();
  const { hasPermission, user: authUser } = useAuth();
  const { showToast } = useToast();
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);

  const canUpload = hasPermission('documents.upload');
  const canDelete = hasPermission('documents.delete');

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      showToast('Success', 'Document deleted.', 'success');
      setDocToDelete(null);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to delete document.', 'error');
    },
  });

  const handleDownload = (docId: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/documents/${docId}/download`, '_blank');
  };

  const columns: Column<DocumentItem>[] = [
    {
      header: 'File Name',
      cell: (d) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            {getFileIcon(d.mimeType)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate max-w-sm">{d.originalFileName}</p>
            <p className="text-[11px] text-slate-400 font-mono">{d.mimeType}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'File Size',
      cell: (d) => <span className="text-xs text-slate-600 font-medium">{formatBytes(d.fileSize)}</span>,
    },
    {
      header: 'Uploaded By',
      cell: (d) => (
        <span className="text-xs text-slate-700 font-medium">
          {d.uploadedBy?.firstName} {d.uploadedBy?.lastName}
        </span>
      ),
    },
    {
      header: 'Uploaded Date',
      cell: (d) => <span className="text-xs text-slate-500">{formatDate(d.createdAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (d) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleDownload(d.id)}
          >
            <Download className="h-3 w-3 mr-1" /> Download
          </Button>
          {(canDelete || d.uploadedById === authUser?.id) && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => setDocToDelete(d)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Project Documents & Repository</h3>
          <p className="text-xs text-slate-500">Secure central workspace file storage and deliverables</p>
        </div>
        {canUpload && (
          <Button size="sm" onClick={onUploadDocument}>
            <UploadCloud className="h-4 w-4 mr-1.5" /> Upload Document
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={documents}
        isLoading={isLoading}
        emptyTitle="No project documents uploaded"
        emptyDescription="Upload specifications, designs, architecture diagrams, and release notes."
        emptyActionLabel={canUpload ? 'Upload Document' : undefined}
        onEmptyAction={onUploadDocument}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={() => docToDelete && deleteMutation.mutate(docToDelete.id)}
        title="Delete Document"
        description={`Are you sure you want to delete "${docToDelete?.originalFileName}"? This action cannot be undone.`}
        confirmLabel="Delete Document"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
