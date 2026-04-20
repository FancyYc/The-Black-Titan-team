import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import supabase from '../db';

const router = Router();
const MODEL = 'llama-3.3-70b-versatile';

function getAI(): Groq {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY 환경변수가 설정되지 않았습니다.');
  return new Groq({ apiKey: key });
}

const TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getEmissionStats',
      description:
        '탄소 배출량 통계 데이터를 DB에서 조회합니다. 월별 Scope1, Scope2 배출량과 에너지 사용량을 반환합니다. 배출량 추이·패턴·통계 분석 시 사용합니다.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '조회할 레코드 수 (기본값: 12)' },
          year: { type: 'number', description: '특정 연도 필터 (선택)' },
          is_prediction: { type: 'boolean', description: '예측 데이터만 조회 (선택)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateEmission',
      description:
        '특정 월의 에너지 사용량 데이터를 수정합니다. 사용자가 "오타야", "수정해줘", "고쳐줘" 등으로 데이터 수정을 요청할 때 사용합니다.',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'number', description: '수정할 연도' },
          month: { type: 'number', description: '수정할 월 (1-12)' },
          electricity_kwh: { type: 'number', description: '전기 사용량 kWh' },
          gas_m3: { type: 'number', description: '가스 사용량 m³' },
          diesel_l: { type: 'number', description: '경유 사용량 L' },
        },
        required: ['year', 'month'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getReports',
      description: '저장된 ESG 보고서 목록을 조회합니다.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: '조회할 보고서 수 (기본값: 10)' },
        },
      },
    },
  },
];

type ToolResult = { result: string; chartData?: any };

async function executeTool(name: string, args: Record<string, any>): Promise<ToolResult> {
  try {
    if (name === 'getEmissionStats') {
      let query = supabase
        .from('emission_records')
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true })
        .limit(args.limit || 12);
      if (args.year !== undefined) query = query.eq('year', args.year);
      if (args.is_prediction !== undefined) query = query.eq('is_prediction', args.is_prediction);

      const { data, error } = await query;
      if (error) return { result: `DB 오류: ${error.message}` };

      const chartData = (data || []).map((d) => ({
        month: d.month_label,
        scope1: parseFloat((d.scope1_tco2 ?? 0).toFixed(2)),
        scope2: parseFloat((d.scope2_tco2 ?? 0).toFixed(2)),
        total: parseFloat(((d.scope1_tco2 ?? 0) + (d.scope2_tco2 ?? 0)).toFixed(2)),
      }));

      return {
        result: `총 ${data?.length ?? 0}개 레코드 조회 완료:\n${JSON.stringify(data, null, 2)}`,
        chartData:
          chartData.length > 0
            ? { type: 'area', data: chartData, keys: ['scope1', 'scope2'], colors: ['#a855f7', '#2aff6e'] }
            : undefined,
      };
    }

    if (name === 'updateEmission') {
      const { year, month, electricity_kwh, gas_m3, diesel_l } = args;
      const updates: Record<string, any> = {};

      if (electricity_kwh !== undefined) {
        updates.electricity_kwh = electricity_kwh;
        updates.scope2_tco2 = (electricity_kwh * 0.4747) / 1000;
      }

      if (gas_m3 !== undefined || diesel_l !== undefined) {
        let finalGas = gas_m3;
        let finalDiesel = diesel_l;
        if (gas_m3 === undefined || diesel_l === undefined) {
          const { data: existing } = await supabase
            .from('emission_records')
            .select('gas_m3, diesel_l')
            .eq('year', year)
            .eq('month', month)
            .single();
          finalGas = gas_m3 ?? existing?.gas_m3 ?? 0;
          finalDiesel = diesel_l ?? existing?.diesel_l ?? 0;
        }
        if (gas_m3 !== undefined) updates.gas_m3 = finalGas;
        if (diesel_l !== undefined) updates.diesel_l = finalDiesel;
        updates.scope1_tco2 = ((finalGas * 2.176) + (finalDiesel * 2.59)) / 1000;
      }

      const { error } = await supabase
        .from('emission_records')
        .update(updates)
        .eq('year', year)
        .eq('month', month)
        .eq('is_prediction', false);

      if (error) return { result: `업데이트 실패: ${error.message}` };
      return { result: `✅ ${year}년 ${month}월 데이터 업데이트 완료. 변경: ${JSON.stringify(updates)}` };
    }

    if (name === 'getReports') {
      const { data, error } = await supabase
        .from('reports')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(args.limit || 10);
      if (error) return { result: `오류: ${error.message}` };
      return { result: `보고서 ${data?.length ?? 0}개:\n${JSON.stringify(data, null, 2)}` };
    }

    return { result: '알 수 없는 도구입니다.' };
  } catch (err: any) {
    return { result: `도구 실행 오류: ${err.message}` };
  }
}

function sendSSE(res: Response, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sanitizeText(text: string): string {
  // 한글, 영문, 숫자, 공백, 일반 문장부호, 마크다운 기호, 단위 기호만 허용
  // 힌디어(데바나가리), 중국어, 일본어 등 비허용 문자 제거
  return text.replace(/[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318Fa-zA-Z0-9\s\r\n!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~·₂₃°₩%※→←↑↓■□●○★☆✓\u2019\u2018\u201C\u201D]/g, '');
}

async function fakeStream(res: Response, text: string, chunkSize = 40): Promise<void> {
  for (let i = 0; i < text.length; i += chunkSize) {
    sendSSE(res, { type: 'text', content: text.slice(i, i + chunkSize) });
    await new Promise((r) => setTimeout(r, 18));
  }
}

// POST /api/ai/stream
router.post('/stream', async (req: Request, res: Response) => {
  const { type = 'chat', message, context } = req.body;

  if (!message) {
    res.status(400).json({ error: 'message가 필요합니다.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let ai: Groq;
  try {
    ai = getAI();
  } catch (e: any) {
    sendSSE(res, { type: 'error', message: e.message });
    res.end();
    return;
  }

  const contextStr = context ? `\n[현재 기업 데이터] ${JSON.stringify(context)}` : '';
  const systemInstruction = `You are a professional AI assistant for the re100port Enterprise ESG portal, serving (주)코코네스쿨.
CRITICAL LANGUAGE RULE: You MUST respond ONLY in Korean (한국어). Never use Chinese, Japanese, Hindi, Arabic, or any other language. English is only allowed for technical terms like ESG, RE100, GHG, Scope, tCO₂eq, kWh.
Your expertise covers carbon emission management, K-ESG guidelines, GHG Protocol, RE100, EU CBAM, and carbon credits.
Always include units when citing numbers (tCO₂eq, kWh, m³, L, 원).${contextStr}`;

  try {
    if (type === 'omni' || type === 'chat') {
      const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: message },
      ];
      let chartData: any = null;

      for (let round = 0; round < 4; round++) {
        const response = await ai.chat.completions.create({
          model: MODEL,
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
        });

        const choice = response.choices[0];
        if (!choice) break;

        const { finish_reason, message: assistantMsg } = choice;

        if (finish_reason !== 'tool_calls' || !assistantMsg.tool_calls?.length) {
          await fakeStream(res, sanitizeText(assistantMsg.content ?? ''));
          break;
        }

        messages.push(assistantMsg);

        for (const toolCall of assistantMsg.tool_calls) {
          const { name } = toolCall.function;
          const args = JSON.parse(toolCall.function.arguments || '{}');
          sendSSE(res, { type: 'tool_call', toolName: name });
          const toolResult = await executeTool(name, args);
          if (toolResult.chartData) chartData = toolResult.chartData;
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult.result,
          });
        }
      }

      if (chartData) sendSSE(res, { type: 'chart', data: chartData });
    } else {
      // report / insight / roadmap — 실제 스트리밍
      const stream = await ai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: message },
        ],
        stream: true,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          const clean = sanitizeText(text);
          if (clean) sendSSE(res, { type: 'text', content: clean });
        }
      }
    }

    sendSSE(res, { type: 'done' });
  } catch (err: any) {
    console.error('[AI Stream Error]:', err);
    sendSSE(res, { type: 'error', message: err.message || 'AI 처리 중 오류가 발생했습니다.' });
  } finally {
    res.end();
  }
});

// POST /api/ai/extract-bill
router.post('/extract-bill', async (req: Request, res: Response) => {
  const { image, mimeType } = req.body;
  if (!image || !mimeType) {
    res.status(400).json({ error: 'image와 mimeType이 필요합니다.' });
    return;
  }

  let ai: Groq;
  try { ai = getAI(); } catch (e: any) { res.status(500).json({ error: e.message }); return; }

  try {
    const response = await ai.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image}` } } as any,
          { type: 'text', text: '이 고지서 이미지를 분석해서 에너지 사용량을 추출하세요.\n전기(kWh), 도시가스(m³), 경유(L) 숫자만 찾아서 JSON으로만 응답하세요.\n형식: {"electricity_kwh": 숫자또는null, "gas_m3": 숫자또는null, "diesel_l": 숫자또는null}' },
        ],
      }],
      response_format: { type: 'json_object' },
    } as any);

    const content = response.choices[0]?.message?.content ?? '{}';
    const data = JSON.parse(content);
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
