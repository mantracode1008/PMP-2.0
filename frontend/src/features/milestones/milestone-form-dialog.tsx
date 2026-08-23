'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Dialog } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { Milestone, MilestoneStatus } from '../../types';

interface MilestoneFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  milestoneToEdit?: Milestone | null;
}

export const MilestoneFormDialog: React.FC<MilestoneFormDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  milestoneToEdit,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<MilestoneStatus>('NOT_STARTED');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (milestoneToEdit) {
      setName(milestoneToEdit.name);
      setDescription(milestoneToEdit.description || '');
      setStatus(milestoneToEdit.status);
      setStartDate(milestoneToEdit.startDate ? milestoneToEdit.startDate.split('T')[0] : '');
      setDueDate(milestoneToEdit.dueDate ? milestoneToEdit.dueDate.split('T')[0] : '');
    } else {
      setName('');
      setDescription('');
      setStatus('NOT_STARTED');
      setStartDate('');
      setDueDate('');
    }
  }, [milestoneToEdit, isOpen]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };

      if (milestoneToEdit) {
        return api.patch(`/milestones/${milestoneToEdit.id}`, payload);
      } else {
        return api.post(`/projects/${projectId}/milestones`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      showToast('Success', milestoneToEdit ? 'Milestone updated.' : 'Milestone created.', 'success');
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to save milestone.';
      showToast('Error', Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    },
  });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={milestoneToEdit ? 'Edit Milestone' : 'Create New Milestone'}
      maxWidth="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) {
            showToast('Validation Error', 'Milestone title is required.', 'error');
            return;
          }
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Milestone Name *</label>
          <Input
            placeholder="e.g. M1: Production Beta Launch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Deliverables</label>
          <Textarea
            placeholder="Key outcomes, dependencies, and delivery scope..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as MilestoneStatus)}>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELAYED">Delayed</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={mutation.isPending}>
            {milestoneToEdit ? 'Save Changes' : 'Create Milestone'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
