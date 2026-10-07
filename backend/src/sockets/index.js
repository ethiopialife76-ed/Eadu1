import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const notifyUser = async (io, userId, payload) => {
  const notification = await prisma.notification.create({
    data: {
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link || null,
    },
  });
  io?.to(`user:${userId}`).emit('notification:new', notification);
  return notification;
};

export const initSockets = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
      if (!user || !user.is_active) return next(new Error('Invalid user'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    socket.join(`user:${user.id}`);
    if (user.role === 'ADMIN') socket.join('admin');

    const membership = await prisma.teamMember.findFirst({
      where: {
        student_id: user.id,
        team: { status: { in: ['FORMING', 'ACTIVE'] } },
      },
    });
    if (membership) socket.join(`team:${membership.team_id}`);

    const led = await prisma.team.findFirst({
      where: { leader_id: user.id, status: { in: ['FORMING', 'ACTIVE'] } },
    });
    if (led) socket.join(`team:${led.id}`);

    socket.on('team:message', async ({ teamId, content }) => {
      if (!teamId || !content?.trim()) return;
      const member = await prisma.teamMember.findFirst({
        where: { team_id: Number(teamId), student_id: user.id },
      });
      const leader = await prisma.team.findFirst({
        where: { id: Number(teamId), leader_id: user.id },
      });
      if (!member && !leader && user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;

      const message = await prisma.chatMessage.create({
        data: {
          team_id: Number(teamId),
          sender_id: user.id,
          content: content.trim(),
        },
        include: { sender: { select: { id: true, name: true, role: true } } },
      });

      io.to(`team:${teamId}`).emit('team:message:received', {
        message: message.content,
        sender: message.sender,
        timestamp: message.created_at,
        id: message.id,
        teamId: Number(teamId),
      });
    });
  });
};
