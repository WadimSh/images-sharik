import { render, screen } from '@testing-library/react';

import { AiChatMessageMeta } from './AiChatMessageMeta';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { company: [{ id: 'company-1' }], username: 'Vadim' },
  }),
}));

jest.mock('../ImageEditedUploadModal/ImageEditedUploadModal', () => ({
  __esModule: true,
  default: () => null,
}));

describe('AiChatMessageMeta', () => {
  test('shows save to library action for image generation responses', () => {
    render(
      <AiChatMessageMeta
        companyId="company-1"
        message={{
          role: 'assistant',
          status: 'completed',
          generation: { type: 'out_image', model: 'Image Model' },
          result: {
            files: [{ url: 'https://example.com/generated.png', fileName: 'generated.png' }],
            cost: { amount: 1.2 },
          },
        }}
      />
    );

    expect(screen.getByTestId('ai-chat-message-save-to-library')).toHaveAttribute(
      'aria-label',
      'Сохранить в библиотеке'
    );
    expect(screen.queryByTestId('ai-chat-message-copy')).not.toBeInTheDocument();
  });

  test('shows copy action for text responses', () => {
    render(
      <AiChatMessageMeta
        message={{
          role: 'assistant',
          status: 'completed',
          generation: { type: 'out_text', model: 'Test Model' },
          result: { text: 'Ответ ассистента' },
        }}
      />
    );

    expect(screen.getByTestId('ai-chat-message-copy')).toHaveAttribute(
      'aria-label',
      'Копировать ответ'
    );
    expect(screen.queryByTestId('ai-chat-message-save-to-library')).not.toBeInTheDocument();
  });
});
