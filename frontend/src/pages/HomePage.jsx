import { Link } from 'react-router-dom';
import { Mic, ShieldCheck, Users, FolderKanban } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#d5eedd,_#fafaf9_45%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-dbu-600 font-display text-white">PM</span>
          <div>
            <p className="font-display text-lg">ProjectMarket DBU</p>
            <p className="text-xs uppercase tracking-wide text-stone-500">Debre Berhan University</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link className="btn-ghost" to="/login">
            Sign in
          </Link>
          <Link className="btn-primary" to="/register">
            Register
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-dbu-600">Academic project platform</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight text-dbu-900">
          Find a project. Form a team. Get a supervisor. Report every week.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          ProjectMarket replaces notice boards and WhatsApp groups with one university system for students,
          instructors, industry partners, and administrators at Debre Berhan University.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn-primary" to="/register">
            Create your account
          </Link>
          <Link className="btn-ghost" to="/login">
            Use a demo account
          </Link>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FolderKanban, title: 'Marketplace', text: 'Post, browse, search, and approve academic or industry ideas.' },
            { icon: Users, title: 'Teams', text: 'Create a team, request to join, and get instructor approval.' },
            { icon: ShieldCheck, title: 'Supervision', text: 'Leaders request instructors. Progress reports stay on record.' },
            { icon: Mic, title: 'Selam AI', text: 'A voice agent helps visitors and signed-in users find the next step.' },
          ].map((f) => (
            <div key={f.title} className="card p-5">
              <f.icon className="h-6 w-6 text-dbu-600" />
              <h3 className="mt-3 font-display text-xl">{f.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{f.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
