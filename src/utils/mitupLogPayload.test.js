import { buildTextLogStartPayload } from './mitupLogPayload';

describe('buildTextLogStartPayload', () => {
  test('requestConfig.model matches editor-ai-logs validator', () => {
    const payload = buildTextLogStartPayload({
      companyId: '691b0e28378e7cd83d5261a1',
      sessionId: 'session-1',
      prompt: 'Привет',
      aiSettings: {
        model: 'Test Model',
        temperature: 0.7,
        topP: 0.8,
        thinking: true,
        webSearch: true,
      },
      startedAt: '2026-06-05T12:00:00.000Z',
    });

    expect(payload.requestConfig.model).toEqual({
      model: 'Test Model',
      temperature: 0.7,
      topP: 0.8,
    });
    expect(payload.requestConfig.mitup).toEqual({
      outputType: 'out_text',
      generationType: 'text',
    });
  });
});
