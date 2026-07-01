import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AiChatMarkdownCodeBlock } from './AiChatMarkdownCodeBlock';

describe('AiChatMarkdownCodeBlock', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  test('shows language label and copies code block text', async () => {
    render(
      <AiChatMarkdownCodeBlock className="language-json">{`{\n  "sku": "A"\n}`}</AiChatMarkdownCodeBlock>
    );

    expect(screen.getByText('json')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('ai-chat-message-code-copy'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{\n  "sku": "A"\n}');
  });
});
