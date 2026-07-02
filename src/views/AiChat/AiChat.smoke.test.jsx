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
    user: { company: [{ id: 'company-1' }], username: 'Vadim' },
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
  getApiBaseUrl: () => 'https://mp.sharik.ru',
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
  apiArchiveChatSession: jest.fn(),
  apiCreateChatSession: jest.fn(),
  apiGetChatSessions: jest.fn(),
  apiGetChatMessages: jest.fn(),
  apiPatchChatSession: jest.fn(),
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
  best_for: 'Короткие ответы и черновики текстов',
};

const IMAGE_MODEL = {
  output_name: 'Image Model',
  model: 'gpt-5-mini',
  out_text: false,
  out_image: true,
  ai: 'OpenAI',
  in_text: true,
  in_image: true,
  ext: 'png, jpg, jpeg',
  best_for: 'Генерация изображений',
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
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
    setupMocks();
  });

  test('header matches AI logs pattern', async () => {
    renderAiChat();

    await waitFor(() => {
      expect(screen.getByAltText('Bloom')).toBeInTheDocument();
      expect(screen.getByTestId('ai-chat-status-bar-balance')).toHaveTextContent('100 ₽');
      expect(screen.getByTestId('ai-chat-status-bar-limit-count')).toHaveTextContent('1 / 10');
      expect(screen.getByTestId('ai-chat-status-bar-limit-fill')).toHaveStyle({ width: '10%' });
    });

    expect(document.querySelector('.button-back')).toBeInTheDocument();
    expect(screen.queryByTestId('ai-chat-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'История чатов' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-chat-composer-attach')).not.toBeInTheDocument();
    expect(screen.getByTestId('ai-chat-welcome-center')).toBeInTheDocument();
    expect(screen.getByTestId('ai-chat-welcome-logo')).toBeInTheDocument();
    expect(screen.getByTestId('ai-chat-welcome-greeting')).toHaveTextContent('Здравствуйте, Vadim!');
    expect(screen.getByTestId('ai-chat-welcome-question')).toHaveTextContent('Что вас интересует?');
  });

  test('send text → assistant response in feed → editor AI log recorded', async () => {
    renderAiChat();

    const input = await screen.findByTestId('ai-chat-composer-input');
    await waitFor(() => expect(input).not.toBeDisabled());

    await userEvent.click(screen.getByTestId('ai-chat-model-select-trigger'));
    await userEvent.click(screen.getByTestId('ai-chat-model-option-Test Model'));
    await userEvent.type(input, 'Привет');
    await userEvent.click(screen.getByTestId('ai-chat-composer-send'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-message-meta')).toHaveTextContent('Test Model');
      expect(screen.getByTestId('ai-chat-sidebar')).toBeInTheDocument();
    });

    const copyButton = screen.getByTestId('ai-chat-message-copy');
    expect(copyButton).toHaveAttribute('aria-label', 'Копировать ответ');
    await userEvent.click(copyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Ответ ассистента');
    await waitFor(() => {
      expect(copyButton).toHaveAttribute('aria-label', 'Скопировано');
    });

    expect(screen.getByTestId('ai-chat-message-user')).toHaveTextContent('Привет');

    const userCopyButton = screen.getByTestId('ai-chat-user-message-copy');
    expect(userCopyButton).toHaveAttribute('aria-label', 'Копировать');
    await userEvent.click(userCopyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Привет');

    expect(chatService.apiCreateChatSession).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        title: 'Привет',
      })
    );

    expect(editorAiLogService.apiStartEditorAiLog).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'mitup',
        requestConfig: expect.objectContaining({
          model: {
            model: 'Test Model',
            temperature: 0.9,
            topP: 1,
          },
          mitup: {
            outputType: 'out_text',
            generationType: 'text',
          },
        }),
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

  test('updates balance and limits after completed response', async () => {
    mitupService.streamMitupResult.mockResolvedValue({
      text: 'Ответ ассистента',
      cost: { amount: 0.5 },
      balance: { balance: 95 },
      limits: { minute: 2 },
    });

    renderAiChat();

    const input = await screen.findByTestId('ai-chat-composer-input');
    await waitFor(() => expect(input).not.toBeDisabled());

    await userEvent.click(screen.getByTestId('ai-chat-model-select-trigger'));
    await userEvent.click(screen.getByTestId('ai-chat-model-option-Test Model'));
    await userEvent.type(input, 'Привет');
    await userEvent.click(screen.getByTestId('ai-chat-composer-send'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-status-bar-balance')).toHaveTextContent('95 ₽');
      expect(screen.getByTestId('ai-chat-status-bar-limit-count')).toHaveTextContent('2 / 10');
    });
  });

  test('blocks send when minute rate limit is reached', async () => {
    mitupService.apiGetMitupLimits.mockResolvedValue({
      usage: { minute: 10 },
      max: { minute: 10 },
    });

    renderAiChat();

    const input = await screen.findByTestId('ai-chat-composer-input');
    const sendButton = screen.getByTestId('ai-chat-composer-send');

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-status-bar-limit')).toHaveClass('ai-chat-status-limit--exceeded');
      expect(screen.getByTestId('ai-chat-status-bar-limit')).toHaveAttribute('data-tone', 'exceeded');
    });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  test('sidebar rename and delete session', async () => {
    chatService.apiGetChatSessions.mockResolvedValue({
      data: [
        {
          id: 'session-old',
          title: 'Старый чат',
          lastMessageAt: '2026-01-01T10:00:00.000Z',
        },
      ],
      pagination: {},
    });
    chatService.apiGetChatMessages.mockResolvedValue({ data: [], pagination: {} });
    chatService.apiPatchChatSession.mockResolvedValue({
      id: 'session-old',
      title: 'Новое название',
    });
    chatService.apiArchiveChatSession.mockResolvedValue({ success: true });

    renderAiChat();

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-sidebar')).toBeInTheDocument();
      expect(screen.getByText('Старый чат')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('ai-chat-sidebar-rename-session-old'));

    const renameInput = await screen.findByTestId('ai-chat-sidebar-session-rename-input');
    await userEvent.clear(renameInput);
    await userEvent.type(renameInput, 'Новое название');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(chatService.apiPatchChatSession).toHaveBeenCalledWith(
        'session-old',
        { title: 'Новое название' },
        'company-1'
      );
      expect(screen.getByText('Новое название')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('ai-chat-sidebar-delete-session-old'));

    expect(screen.getByTestId('ai-chat-delete-session-modal')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('ai-chat-delete-session-confirm'));

    await waitFor(() => {
      expect(chatService.apiArchiveChatSession).toHaveBeenCalledWith('session-old', 'company-1');
      expect(screen.queryByText('Новое название')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ai-chat-sidebar')).not.toBeInTheDocument();
    });
  });

  test('send image prompt → assistant shows image grid and image log', async () => {
    mitupService.apiGetMitupModels.mockResolvedValue({
      models: [TEST_MODEL, IMAGE_MODEL],
    });
    mitupService.streamMitupResult.mockResolvedValue({
      files: [
        {
          url: '/media/company-1/generated.png',
          fileName: 'generated.png',
          mimeType: 'image/png',
        },
      ],
      cost: { amount: 1.2 },
    });

    renderAiChat();

    const input = await screen.findByTestId('ai-chat-composer-input');
    await waitFor(() => expect(input).not.toBeDisabled());

    await userEvent.click(screen.getByTestId('ai-chat-mode-switch-out_image'));
    await userEvent.click(screen.getByTestId('ai-chat-model-select-trigger'));
    await userEvent.click(screen.getByTestId('ai-chat-model-option-Image Model'));

    expect(screen.getByTestId('ai-chat-composer-attach')).toBeInTheDocument();

    await userEvent.type(input, 'Красный шар на белом фоне');
    await userEvent.click(screen.getByTestId('ai-chat-composer-send'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-image-result')).toBeInTheDocument();
      expect(screen.getByTestId('ai-chat-image-result-item-0')).toHaveAttribute(
        'href',
        'https://mp.sharik.ru/media/company-1/generated.png'
      );
      expect(screen.getByTestId('ai-chat-message-save-to-library')).toHaveAttribute(
        'aria-label',
        'Сохранить в библиотеке'
      );
      expect(screen.queryByTestId('ai-chat-message-copy')).not.toBeInTheDocument();
    });

    expect(mitupService.apiMitupGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        type: 'out_image',
        response_format: 'url',
        ai: expect.objectContaining({
          model: 'gpt-5-mini',
          image_size: 'auto',
          image_quality: 'auto',
        }),
      })
    );

    expect(editorAiLogService.apiStartEditorAiLog).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: 'generateImage',
        section: 'ai_image_generation',
        requestConfig: expect.objectContaining({
          mitup: {
            outputType: 'out_image',
            generationType: 'image',
          },
        }),
      })
    );
  });
});
