// app/(app)/contacts/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Plus, Users, Trash2, Loader2, Linkedin, Mail } from "lucide-react";

type Contact = {
  id: string; name: string; title?: string; email?: string;
  linkedin?: string; notes?: string;
  application?: { company: string; role: string } | null;
};
type Application = { id: string; company: string; role: string };

const EMPTY_FORM = { name:"", title:"", email:"", linkedin:"", notes:"", applicationId:"" };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then(r => r.json()),
      fetch("/api/applications").then(r => r.json()),
    ]).then(([c, a]) => { setContacts(c); setApplications(a); }).finally(() => setLoading(false));
  }, []);

  async function addContact(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const c = await res.json();
    setContacts(p => [c, ...p]);
    setForm(EMPTY_FORM); setAdding(false); setSaving(false);
  }

  async function remove(id: string) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    setContacts(p => p.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Contacts</h1>
          <p className="text-neutral-500 mt-1">Recruiters, hiring managers, and network connections.</p>
        </div>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>
          <Plus className="w-4 h-4" /> Add contact
        </button>
      </div>

      {adding && (
        <div className="card border-neutral-300">
          <h3 className="mb-4">New contact</h3>
          <form onSubmit={addContact} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input className="input" placeholder="Full name" required
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Title / Role</label>
                <input className="input" placeholder="e.g. Senior Recruiter"
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input className="input" type="email" placeholder="name@company.com"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">LinkedIn URL</label>
                <input className="input" placeholder="https://linkedin.com/in/..."
                  value={form.linkedin} onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Linked application</label>
              <select className="input" value={form.applicationId} onChange={e => setForm(p => ({ ...p, applicationId: e.target.value }))}>
                <option value="">None</option>
                {applications.map(a => <option key={a.id} value={a.id}>{a.company} — {a.role}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Notes</label>
              <textarea className="input h-16 resize-none" placeholder="How you met, topics discussed..."
                value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
              <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-neutral-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : contacts.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No contacts yet. Build your network!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {contacts.map(c => (
            <div key={c.id} className="card flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-base font-bold text-neutral-600 shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{c.name}</p>
                {c.title && <p className="text-sm text-neutral-400">{c.title}</p>}
                {c.application && (
                  <p className="text-xs text-neutral-400 mt-0.5">{c.application.company} · {c.application.role}</p>
                )}
                <div className="flex gap-3 mt-2">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-neutral-300 hover:text-blue-400">
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  {c.linkedin && (
                    <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-blue-600">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {c.notes && <p className="text-xs text-neutral-400 mt-2">{c.notes}</p>}
              </div>
              <button onClick={() => remove(c.id)} className="text-neutral-200 hover:text-red-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
