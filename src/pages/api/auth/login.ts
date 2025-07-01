import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;
  
  const cleanUsername = username
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\W+/g, '')
    .toLowerCase();

  let user = await prisma.user.findUnique({
    where: { username: cleanUsername }
  });

  if (!user) {
    user = await prisma.user.create({
      data: { username: cleanUsername }
    });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.status(200).json({ token, user });
}

