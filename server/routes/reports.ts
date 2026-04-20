import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// GET /api/reports
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await db
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data });
});

// POST /api/reports
router.post('/', async (req: Request, res: Response) => {
  const { title, content = '', status = '완료' } = req.body;
  if (!title) { res.status(400).json({ success: false, error: '제목 누락' }); return; }

  const { data, error } = await db
    .from('reports')
    .insert({ title, content, status })
    .select()
    .single();

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data });
});

// PATCH /api/reports/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const updates: Record<string, string> = {};
  if (req.body.content !== undefined) updates.content = req.body.content;
  if (req.body.status  !== undefined) updates.status  = req.body.status;

  const { error } = await db
    .from('reports')
    .update(updates)
    .eq('id', req.params.id);

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true });
});

// DELETE /api/reports/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { error } = await db
    .from('reports')
    .delete()
    .eq('id', req.params.id);

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true });
});

export default router;
