import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { miscService, projectService } from '../services';

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: miscService.departments });
  const { data: existing } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.get(id),
    enabled: isEdit,
  });
  const [form, setForm] = useState({ title: '', description: '', department_id: '', type: 'ACADEMIC' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description,
        department_id: existing.department_id,
        type: existing.type,
      });
    }
  }, [existing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, department_id: Number(form.department_id) };
      const project = isEdit ? await projectService.update(id, payload) : await projectService.create(payload);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save project');
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">{isEdit ? 'Edit project' : 'Post a project idea'}</h1>
      <p className="text-stone-600">New ideas start as Pending until an administrator approves them.</p>
      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={8} value={form.description} onChange={(e) => set('description', e.target.value)} required />
      </div>
      <div>
        <label className="label">Department</label>
        <select className="input" value={form.department_id} onChange={(e) => set('department_id', e.target.value)} required>
          <option value="">Select</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Type</label>
        <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
          <option>ACADEMIC</option>
          <option>INDUSTRY</option>
        </select>
      </div>
      <button className="btn-primary">{isEdit ? 'Save changes' : 'Submit for review'}</button>
    </form>
  );
}
