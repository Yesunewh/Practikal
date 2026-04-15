import React, { useState } from 'react';
import { User } from '../../types';
import { useCampaigns } from '../../context/CampaignContext';
import { useChallenges } from '../../context/ChallengeContext';
import { Calendar, Plus, Trash2 } from 'lucide-react';

interface CampaignAssignmentsProps {
  currentUser: User;
}

export default function CampaignAssignments({ currentUser }: CampaignAssignmentsProps) {
  const { campaigns, assignments, addCampaign, addAssignment, deleteAssignment } = useCampaigns();
  const { challenges } = useChallenges();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeId, setChallengeId] = useState(challenges[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addCampaign({ title: title.trim(), description: description.trim() || 'Training campaign' });
    setTitle('');
    setDescription('');
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const ch = challenges.find((c) => c.id === challengeId);
    if (!ch || campaigns.length === 0) return;
    addAssignment({
      campaignId: campaigns[0].id,
      userId: 'all',
      challengeId: ch.id,
      title: ch.title,
      dueDate,
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        Demo data: assignments are stored in this browser only (localStorage). No server sync.
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create campaign</h2>
        <form onSubmit={handleCreateCampaign} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q2 Phishing focus"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus size={18} />
            Add campaign
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Assign challenge (all learners)</h2>
        <form
          onSubmit={handleAddAssignment}
          className="flex flex-wrap gap-4 items-end max-w-2xl"
        >
          {campaigns.length === 0 && (
            <p className="text-sm text-amber-800 w-full">Create a campaign above before assigning.</p>
          )}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
            >
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={14} /> Due date
            </label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={campaigns.length === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            Assign
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Active assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-500 text-sm">No assignments yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {assignments.map((a) => (
              <li key={a.id} className="py-3 flex flex-wrap justify-between gap-2 items-center">
                <div>
                  <div className="font-medium text-gray-900">{a.title}</div>
                  <div className="text-sm text-gray-500">
                    Due {a.dueDate} · audience: {a.userId === 'all' ? 'everyone' : a.userId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteAssignment(a.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                  aria-label="Remove assignment"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400">Signed in as {currentUser.email}</p>
    </div>
  );
}
