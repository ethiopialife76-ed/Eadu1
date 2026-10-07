import prisma from '../config/prisma.js';

const HELP = {
  visitor: `ProjectMarket DBU is Debre Berhan University's academic project marketplace.
Visitors can register as Student, Instructor, or Industry Partner.
Students browse approved ideas, form teams, request a supervisor, chat, and submit weekly reports.
Instructors accept supervision and review progress.
Industry partners propose real-world projects after admin approval.
Admins approve projects, manage users and departments.`,
};

const intents = [
  {
    keys: ['register', 'sign up', 'create account', 'how to join'],
    reply:
      'To register, open Sign up, enter your name, university email, password, role, and department. Students and instructors should pick their department. Industry partners wait for admin approval before posting ideas.',
    actions: [{ type: 'navigate', to: '/register' }],
  },
  {
    keys: ['login', 'sign in', 'log in'],
    reply: 'Go to Sign in and use your university email and password. Demo accounts are listed on the login page.',
    actions: [{ type: 'navigate', to: '/login' }],
  },
  {
    keys: ['project', 'browse', 'find idea', 'marketplace'],
    reply:
      'The marketplace lists academic and industry project ideas. After you sign in, search by title or keyword and filter by department, type, and status. New ideas start as Pending until an admin approves them.',
    actions: [{ type: 'navigate', to: '/projects' }],
  },
  {
    keys: ['team', 'join team', 'form team', 'create team'],
    reply:
      'Once a project is approved, a student can create a team and become team leader. Other students request to join. The leader accepts or rejects, then an instructor or admin approves the team so it becomes Active. You cannot be in two active teams at once.',
    actions: [{ type: 'navigate', to: '/projects' }],
  },
  {
    keys: ['supervisor', 'instructor', 'advisor'],
    reply:
      'After the team is Active, the team leader requests an instructor as supervisor. The instructor gets a live notification and can accept or reject. Admins can also assign a supervisor manually.',
    actions: [{ type: 'navigate', to: '/supervisors' }],
  },
  {
    keys: ['report', 'progress', 'weekly'],
    reply:
      'Team members submit weekly progress reports with a week number, description, and optional PDF, DOCX, or ZIP file. Supervisors are notified and can comment.',
    actions: [{ type: 'navigate', to: '/dashboard' }],
  },
  {
    keys: ['chat', 'message', 'communication'],
    reply: 'Each team has a persisted chat room. Open your team page to message teammates in real time.',
  },
  {
    keys: ['admin', 'department', 'approve'],
    reply:
      'Admins manage users, departments, and platform statistics. They approve or reject submitted projects and can deactivate accounts. Industry partners must be approved before posting.',
  },
  {
    keys: ['help', 'what can you do', 'voice', 'assistant', 'who are you'],
    reply:
      'I am Selam, the ProjectMarket DBU voice assistant. I can explain registration, projects, teams, supervisors, reports, and admin tasks. Ask me in English or Amharic-style English, then I can take you to the right page.',
  },
  {
    keys: ['contact', 'university', 'dbu', 'debre'],
    reply:
      'This platform is built for Debre Berhan University academic projects. Use your DBU email when you register as a student or instructor.',
  },
];

function matchIntent(text) {
  const q = text.toLowerCase();
  return intents.find((i) => i.keys.some((k) => q.includes(k)));
}

async function personalized(user, text) {
  if (!user) return null;
  const q = text.toLowerCase();

  if (q.includes('my project') || q.includes('my projects')) {
    const projects = await prisma.project.findMany({
      where: { posted_by: user.id },
      take: 5,
      orderBy: { created_at: 'desc' },
    });
    if (!projects.length) return 'You have not posted a project yet. Open Post project to submit an idea.';
    return `You have ${projects.length} recent project(s): ${projects.map((p) => `${p.title} (${p.status})`).join('; ')}.`;
  }

  if (q.includes('my team') || q.includes('team status')) {
    const membership = await prisma.teamMember.findFirst({
      where: { student_id: user.id, team: { status: { in: ['FORMING', 'ACTIVE'] } } },
      include: { team: { include: { project: true } } },
    });
    if (!membership) return 'You are not in an active team. Browse approved projects to create or join one.';
    return `You are on the team for "${membership.team.project.title}". Team status is ${membership.team.status}.`;
  }

  if (q.includes('notification') || q.includes('unread')) {
    const count = await prisma.notification.count({ where: { user_id: user.id, read: false } });
    return count ? `You have ${count} unread notification(s). Open the bell in the top bar.` : 'You have no unread notifications.';
  }

  if (user.role === 'INSTRUCTOR' && (q.includes('request') || q.includes('supervise'))) {
    const pending = await prisma.supervisorRequest.count({
      where: { instructor_id: user.id, status: 'PENDING' },
    });
    return `You have ${pending} pending supervision request(s). Open Supervisor requests to accept or reject.`;
  }

  if (user.role === 'ADMIN' && (q.includes('pending') || q.includes('approve'))) {
    const pending = await prisma.project.count({ where: { status: 'PENDING' } });
    return `There are ${pending} project(s) waiting for approval. Open Admin review to decide.`;
  }

  return null;
}

export const assist = async ({ message, path }, user) => {
  const personal = await personalized(user, message);
  if (personal) {
    return { reply: personal, actions: [] };
  }

  const hit = matchIntent(message);
  if (hit) {
    return { reply: hit.reply, actions: hit.actions || [] };
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `${HELP.visitor}\nUser role: ${user?.role || 'visitor'}. Current page: ${path || '/'}. Be concise. You may suggest navigation paths like /register, /login, /projects, /dashboard.`,
            },
            { role: 'user', content: message },
          ],
          temperature: 0.3,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return { reply, actions: [] };
    } catch (err) {
      console.error('OpenAI voice assist failed', err.message);
    }
  }

  return {
    reply: `I can help with ProjectMarket DBU: registration, browsing projects, forming teams, requesting supervisors, weekly reports, chat, and admin review. You are currently on ${path || 'the home page'}. Ask about any of those steps.`,
    actions: [],
  };
};
