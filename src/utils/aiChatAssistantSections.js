const THINKING_HEADING =
  /^(?:#{1,6}\s+|\*{2}|_{2})?\s*(?:Размышлени(?:е|я)|Рассуждени(?:е|я)|Thinking|Reasoning|Thoughts?)\s*(?:\*{2}|_{2})?\s*:?\s*$/i;

const ANSWER_HEADING =
  /^(?:#{1,6}\s+|\*{2}|_{2})?\s*(?:Ответ|Answer|Response|Результат)\s*(?:\*{2}|_{2})?\s*:?\s*$/i;

const HR_LINE = /^-{3,}\s*$/;

const MARKDOWN_HEADING = /^#{1,6}\s+/;

const THINK_CLOSE_TAG = '<' + '/think>';
const THINK_OPEN_TAG = '<' + 'think' + '>';

/**
 * @param {string} normalized
 * @returns {Array<{ type: 'reasoning'|'answer', content: string }>|null}
 */
function splitByThinkTag(normalized) {
  const closeIndex = normalized.toLowerCase().indexOf(THINK_CLOSE_TAG.toLowerCase());
  if (closeIndex === -1) {
    return null;
  }

  const beforeClose = normalized.slice(0, closeIndex);
  const after = normalized.slice(closeIndex + THINK_CLOSE_TAG.length).trim();
  const openIndex = beforeClose.toLowerCase().lastIndexOf(THINK_OPEN_TAG.toLowerCase());

  const sections = [];
  let before = '';
  let reasoning = beforeClose.trim();

  if (openIndex !== -1) {
    before = beforeClose.slice(0, openIndex).trim();
    reasoning = beforeClose.slice(openIndex + THINK_OPEN_TAG.length).trim();
  }

  if (before) {
    sections.push({ type: 'answer', content: before });
  }
  if (reasoning) {
    sections.push({ type: 'reasoning', content: reasoning });
  }
  if (after) {
    sections.push({ type: 'answer', content: after });
  }

  return sections.length ? sections : null;
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isThinkingHeading(line) {
  return THINKING_HEADING.test(line.trim());
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isAnswerHeading(line) {
  return ANSWER_HEADING.test(line.trim());
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isHorizontalRule(line) {
  return HR_LINE.test(line.trim());
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isMarkdownHeading(line) {
  return MARKDOWN_HEADING.test(line.trim());
}

/**
 * @param {string} text
 * @returns {Array<{ type: 'reasoning'|'answer', content: string }>}
 */
export function splitAssistantMessageSections(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return [{ type: 'answer', content: text || '' }];
  }

  const normalized = text.replace(/\r\n/g, '\n');
  const tagSections = splitByThinkTag(normalized);
  if (tagSections) {
    return tagSections;
  }

  const lines = normalized.split('\n');
  /** @type {Array<{ type: 'reasoning'|'answer', content: string }>} */
  const sections = [];
  /** @type {string[]} */
  let answerBuffer = [];

  const flushAnswer = () => {
    const content = answerBuffer.join('\n').trim();
    if (content) {
      sections.push({ type: 'answer', content });
    }
    answerBuffer = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!isThinkingHeading(line)) {
      answerBuffer.push(line);
      continue;
    }

    flushAnswer();

    const reasoningLines = [line];
    index += 1;

    while (index < lines.length) {
      const currentLine = lines[index];

      if (isAnswerHeading(currentLine)) {
        index += 1;
        break;
      }

      if (isHorizontalRule(currentLine)) {
        index += 1;
        break;
      }

      if (isMarkdownHeading(currentLine) && !isThinkingHeading(currentLine)) {
        break;
      }

      reasoningLines.push(currentLine);
      index += 1;
    }

    const reasoningContent = reasoningLines.join('\n').trim();
    if (reasoningContent) {
      sections.push({ type: 'reasoning', content: reasoningContent });
    }

    index -= 1;
  }

  flushAnswer();

  return sections.length ? sections : [{ type: 'answer', content: normalized }];
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isValidJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Оборачивает голый JSON в markdown-блок кода для корректного рендера и копирования.
 * @param {string} text
 * @returns {string}
 */
export function prepareAssistantMarkdownSection(text) {
  const trimmed = text.trim();

  if (!trimmed) {
    return text;
  }

  if (
    (trimmed.startsWith('[') || trimmed.startsWith('{'))
    && isValidJson(trimmed)
  ) {
    return `\`\`\`json\n${trimmed}\n\`\`\``;
  }

  return text;
}
