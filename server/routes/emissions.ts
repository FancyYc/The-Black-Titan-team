import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// GET /api/emissions
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await db
    .from('emission_records')
    .select('*')
    .order('year').order('month').order('is_prediction');

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data });
});

// POST /api/emissions
router.post('/', async (req: Request, res: Response) => {
  const { year, month, month_label, electricity_kwh, gas_m3, diesel_l, is_prediction = false } = req.body;

  if (!year || !month || !month_label) {
    res.status(400).json({ success: false, error: '필수 필드 누락' });
    return;
  }

  const scope1_tco2 = ((gas_m3 * 2.176) + (diesel_l * 2.59)) / 1000;
  const scope2_tco2 = (electricity_kwh * 0.4747) / 1000;

  const { data, error } = await db
    .from('emission_records')
    .upsert(
      { year, month, month_label, electricity_kwh, gas_m3, diesel_l, scope1_tco2, scope2_tco2, is_prediction },
      { onConflict: 'year,month,is_prediction' }
    )
    .select()
    .single();

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data });
});

// DELETE /api/emissions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { error } = await db
    .from('emission_records')
    .delete()
    .eq('id', req.params.id);

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true });
});

export default router;
