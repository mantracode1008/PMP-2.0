'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { ProjectTemplate, TaskTemplate, Client, User, ApiResponse } from '@/types';
import {
  ProjectTemplatesList,
  InstantiateTemplateModal,
  TaskTemplatesList,
} from '@/features/templates';
import { Loader2, Sparkles, FolderKanban } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const router = useRouter();
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [instantiateModalOpen, setInstantiateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'TASKS'>('PROJECTS');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, cRes, uRes] = await Promise.all([
        api.get<ApiResponse<{ data: ProjectTemplate[] }>>('/templates/projects'),
        api.get<ApiResponse<TaskTemplate[]>>('/templates/tasks'),
        api.get<ApiResponse<{ data: Client[] }>>('/clients'),
        api.get<ApiResponse<{ data: User[] }>>('/users'),
      ]);

      setProjectTemplates(pRes.data.data.data || []);
      setTaskTemplates(tRes.data.data || []);
      setClients(cRes.data.data.data || []);
      setUsers(uRes.data.data.data || []);
    } catch (err) {
      console.error('Failed to load templates catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenInstantiate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setInstantiateModalOpen(true);
  };

  const handleInstantiateSubmit = async (data: any) => {
    if (!selectedTemplate) return;
    const res = await api.post(`/templates/projects/${selectedTemplate.id}/instantiate`, data);
    const newProjectId = res.data.data.id;
    router.push(`/projects/${newProjectId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Nav Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('PROJECTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PROJECTS'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Project Templates ({projectTemplates.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TASKS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TASKS'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Task Templates & Checklists ({taskTemplates.length})
        </button>
      </div>

      {activeTab === 'PROJECTS' ? (
        <ProjectTemplatesList
          templates={projectTemplates}
          onInstantiate={handleOpenInstantiate}
        />
      ) : (
        <TaskTemplatesList taskTemplates={taskTemplates} />
      )}

      {/* Instantiate Modal */}
      <InstantiateTemplateModal
        template={selectedTemplate}
        isOpen={instantiateModalOpen}
        onClose={() => setInstantiateModalOpen(false)}
        onSubmit={handleInstantiateSubmit}
        clients={clients}
        users={users}
      />
    </div>
  );
}
