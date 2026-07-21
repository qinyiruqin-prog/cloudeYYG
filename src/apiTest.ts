export type TestStatus = 'idle' | 'testing' | 'ok' | 'fail';

export interface TestResult {
  status: TestStatus;
  message: string;
}

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.SUPABASE_URL ?? '') as string;

async function directTest(cfg: Record<string, string>, mode: 'chat' | 'image' | 'voice'): Promise<TestResult> {
  if (!cfg.baseUrl) return { status: 'fail', message: '请填写接口地址' };

  try {
    const base = cfg.baseUrl.replace(/\/+$/, '');
    let endpoint = '';
    let body: any = {};

    if (mode === 'chat') {
      endpoint = `${base}/chat/completions`;
      body = {
        model: cfg.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 10,
      };
    } else if (mode === 'image') {
      endpoint = `${base}/images/generations`;
      body = {
        model: cfg.model || 'dall-e-3',
        prompt: 'test',
        n: 1,
        size: '1024x1024',
      };
    } else if (mode === 'voice') {
      endpoint = `${base}/audio/speech`;
      body = {
        model: cfg.model || 'tts-1',
        input: '测试',
        voice: 'alloy',
      };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '未知错误');
      return {
        status: 'fail',
        message: `连接失败 (HTTP ${res.status}): ${errorText.substring(0, 100)}`
      };
    }

    return { status: 'ok', message: '连接成功！API 正常工作' };
  } catch (e) {
    const error = e as Error;
    if (error.message.includes('fetch')) {
      return { status: 'fail', message: '网络连接失败，请检查API地址或网络' };
    }
    return { status: 'fail', message: `错误: ${error.message}` };
  }
}

async function callProxy(cfg: Record<string, string>, mode: 'chat' | 'image' | 'voice'): Promise<TestResult> {
  if (!cfg.baseUrl && mode !== 'voice') return { status: 'fail', message: '请填写接口地址' };
  if (!cfg.baseUrl && mode === 'voice' && cfg.provider === 'custom') return { status: 'fail', message: '请填写接口地址' };

  // 如果没有配置Supabase代理，直接测试
  if (!supabaseUrl) {
    return directTest(cfg, mode);
  }

  try {
    const fnUrl = `${supabaseUrl}/functions/v1/api-test`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, mode }),
    });
    if (!res.ok) {
      // 如果代理失败，尝试直接连接
      console.warn('代理连接失败，尝试直接连接API');
      return directTest(cfg, mode);
    }
    const data = await res.json();
    return data.ok
      ? { status: 'ok', message: data.message ?? '连接成功' }
      : { status: 'fail', message: data.message ?? '连接失败' };
  } catch (e) {
    // 代理失败，尝试直接连接
    console.warn('代理连接出错，尝试直接连接API');
    return directTest(cfg, mode);
  }
}

export async function testChat(cfg: Record<string, string>): Promise<TestResult> {
  return callProxy(cfg, 'chat');
}

export async function testImage(cfg: Record<string, string>): Promise<TestResult> {
  return callProxy(cfg, 'image');
}

export async function testVoice(cfg: Record<string, string>): Promise<TestResult> {
  if (cfg.provider === 'minimax') {
    if (!cfg.apiKey) return { status: 'fail', message: '请填写 MiniMax API Key' };
    return { status: 'ok', message: '已保存 MiniMax 配置（联网时调用）' };
  }
  return callProxy(cfg, 'voice');
}
