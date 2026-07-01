import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AiChatUserMessageActions } from './AiChatUserMessageActions';

describe('AiChatUserMessageActions', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  test('calls onResend with message when repeat is clicked', async () => {
    const message = { role: 'user', content: { text: 'Промпт' } };
    const onResend = jest.fn();

    render(
      <AiChatUserMessageActions message={message} companyId="company-1" onResend={onResend} />
    );

    await userEvent.click(screen.getByTestId('ai-chat-user-message-repeat'));
    expect(onResend).toHaveBeenCalledWith(message);
  });

  test('copies prompt text to clipboard', async () => {
    render(
      <AiChatUserMessageActions
        message={{
          role: 'user',
          content: {
            text: 'Промпт',
            attachments: [{ fileId: '6655a1b2c3d4e5f6a7b8c9d1', url: '/media/photo.png' }],
          },
        }}
        companyId="company-1"
        onResend={jest.fn()}
      />
    );

    await userEvent.click(screen.getByTestId('ai-chat-user-message-copy'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Промпт\nhttps://mp.sharik.ru/media/photo.png'
    );
  });
});

jest.mock('../../services/fetch/fetchBase', () => ({
  getApiBaseUrl: () => 'https://mp.sharik.ru',
}));
