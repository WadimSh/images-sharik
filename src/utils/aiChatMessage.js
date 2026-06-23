/**
 * @param {object|null|undefined} message
 * @returns {string}
 */
export function getAssistantMessageModel(message) {
  return message?.generation?.model || message?.result?.model || '';
}

/**
 * @param {object|null|undefined} message
 * @returns {number|null}
 */
export function getAssistantMessageCostAmount(message) {
  const amount = message?.result?.cost?.amount;
  return typeof amount === 'number' ? amount : null;
}

/**
 * @param {object|null|undefined} message
 * @returns {{ model: string, costLabel: string|null }|null}
 */
export function getAssistantMessageMeta(message) {
  if (message?.role !== 'assistant') {
    return null;
  }

  const model = getAssistantMessageModel(message);
  const costAmount = getAssistantMessageCostAmount(message);

  if (!model && costAmount == null) {
    return null;
  }

  return {
    model,
    costLabel: costAmount != null ? `${costAmount} ₽` : null,
  };
}
