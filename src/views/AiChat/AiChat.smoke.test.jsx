import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ru from '../../assets/lang/ru.json';
import { LanguageContext } from '../../contexts/contextLanguage';
import * as chatService from '../../services/chatService';
import * as editorAiLogService from '../../services/editorAiLogService';
import { fetchDataWithFetch } from '../../services/fetch/fetchBase';
import * as mitupService from '../../services/mitupService';
import { AiChat } from './AiChat';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { company: [{ id: 'company-1' }] },
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('react-markdown', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../../services/fetch/fetchBase', () => ({
  fetchDataWithFetch: jest.fn(),
}));

jest.mock('../../services/mitupService', () => ({
  apiGetMitupModels: jest.fn(),
  apiGetMitupLimits: jest.fn(),
  apiGetMitupBalance: jest.fn(),
  apiMitupGenerate: jest.fn(),
  apiMitupStatus: jest.fn(),
  streamMitupResult: jest.fn(),
  MitupStreamError: class MitupStreamError extends Error {},
  MitupStreamDisconnectedError: class MitupStreamDisconnectedError extends Error {},
}));

jest.mock('../../services/chatService', () => ({
  apiCreateChatSession: jest.fn(),
  apiGetChatSessions: jest.fn(),
  apiGetChatMessages: jest.fn(),
  apiPostChatMessage: jest.fn(),
  apiPatchChatMessage: jest.fn(),
}));

jest.mock('../../services/editorAiLogService', () => ({
  apiStartEditorAiLog: jest.fn(),
  apiProcessingEditorAiLog: jest.fn(),
  apiCompleteEditorAiLog: jest.fn(),
}));

const TEST_MODEL = {
  output_name: 'Test Model',
  out_text: true,
  ai: 'OpenAI',
  in_text: true,
  in_image: false,
  ext: null,
  best_for: null,
};

function setupMocks() {
  fetchDataWithFetch.mockResolvedValue({ isEnabled: true, hasKey: true });

  mitupService.apiGetMitupModels.mockResolvedValue({ models: [TEST_MODEL] });
  mitupService.apiGetMitupLimits.mockResolvedValue({
    usage: { minute: 1 },
    max: { minute: 10 },
  });
  mitupService.apiGetMitupBalance.mockResolvedValue({ balance: 100 });
  chatService.apiGetChatSessions.mockResolvedValue({ data: [], pagination: {} });

  let messageCounter = 0;

  chatService.apiCreateChatSession.mockResolvedValue({
    id: 'session-1',
    title: 'Привет',
  });

  chatService.apiPostChatMessage.mockImplementation(async (_sessionId, body) => {
    messageCounter += 1;
    return { id: `msg-${messageCounter}`, ...body };
  });

  chatService.apiPatchChatMessage.mockImplementation(async (_sessionId, messageId, body) => ({
    id: messageId,
    ...body,
  }));

  editorAiLogService.apiStartEditorAiLog.mockResolvedValue({ id: 'log-1' });
  editorAiLogService.apiProcessingEditorAiLog.mockResolvedValue({});
  editorAiLogService.apiCompleteEditorAiLog.mockResolvedValue({});

  mitupService.apiMitupGenerate.mockResolvedValue({ taskId: 'task-1' });
  mitupService.streamMitupResult.mockResolvedValue({
    text: 'Ответ ассистента',
    cost: { amount: 0.5 },
  });
}

function translateRu(key) {
  const keys = key.split('.');
  let value = ru;

  for (const part of keys) {
    value = value?.[part];
  }

  return value || key;
}

function TestLanguageProvider({ children }) {
  return (
    <LanguageContext.Provider
      value={{
        t: translateRu,
        currentLanguage: 'ru',
        changeLanguage: () => {},
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

function renderAiChat() {
  return render(
    <TestLanguageProvider>
      <AiChat />
    </TestLanguageProvider>
  );
}

describe('AiChat smoke', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  test('header matches AI logs pattern', async () => {
    renderAiChat();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'AI-чат' })).toBeInTheDocument();
      expect(screen.getByText(/Баланс:/)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Назад/i })).toBeInTheDocument();
  });

  test('send text → assistant response in feed → editor AI log recorded', async () => {
    renderAiChat();

    const input = await screen.findByTestId('ai-chat-composer-input');
    await waitFor(() => expect(input).not.toBeDisabled());

    await userEvent.selectOptions(screen.getByLabelText('Модель'), 'Test Model');
    await userEvent.type(input, 'Привет');
    await userEvent.click(screen.getByTestId('ai-chat-composer-send'));

    await waitFor(() => {
      expect(screen.getByText('Ответ ассистента')).toBeInTheDocument();
    });

    expect(screen.getByTestId('ai-chat-message-meta')).toHaveTextContent('Test Model');

    expect(screen.getByTestId('ai-chat-message-user')).toHaveTextContent('Привет');

    expect(chatService.apiCreateChatSession).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        title: 'Привет',
      })
    );

    expect(editorAiLogService.apiStartEditorAiLog).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'mitup',
        meta: expect.objectContaining({
          source: 'page_chat',
          sessionId: 'session-1',
        }),
      })
    );

    expect(editorAiLogService.apiCompleteEditorAiLog).toHaveBeenCalledWith(
      'log-1',
      expect.objectContaining({
        responseData: expect.objectContaining({
          status: 'success',
        }),
      })
    );
  });
});
