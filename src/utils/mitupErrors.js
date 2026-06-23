const MITUP_ERROR_MESSAGES = {
  MITUP_INSUFFICIENT_BALANCE: 'Недостаточно средств на балансе Mitup.',
  MITUP_RATE_LIMIT_MINUTE: 'Превышен лимит Mitup: 7 запросов в минуту. Попробуйте через минуту.',
  MITUP_RATE_LIMIT_DAY: 'Превышен дневной лимит Mitup (5000 запросов).',
  MITUP_INVALID_MODEL: 'Выбранная модель недоступна или не поддерживает этот режим.',
  MITUP_FILE_TOO_LARGE: 'Файл слишком большой. Максимум 5 МБ.',
  MITUP_TOO_MANY_FILES: 'Слишком много файлов. Максимум 10.',
  MITUP_TASK_FAILED: 'Mitup не смог выполнить задачу.',
  MITUP_TASK_TIMEOUT: 'Превышено время ожидания ответа Mitup (120 с).',
  MITUP_STREAM_DISCONNECTED: 'Соединение с Mitup прервано до получения ответа.',
  MITUP_STREAM_ERROR: 'Ошибка потока ответа Mitup.',
  MITUP_API_ERROR: 'Ошибка API Mitup. Попробуйте позже.',
  MITUP_UNKNOWN_ERROR: 'Неизвестная ошибка Mitup.',
};

/**
 * @param {string|undefined|null} code
 * @returns {string}
 */
export function getMitupErrorMessage(code) {
  if (!code) return MITUP_ERROR_MESSAGES.MITUP_UNKNOWN_ERROR;
  return MITUP_ERROR_MESSAGES[code] || MITUP_ERROR_MESSAGES.MITUP_UNKNOWN_ERROR;
}

/**
 * @param {unknown} error
 * @returns {{ code: string, message: string, httpStatus?: number }}
 */
export function normalizeMitupError(error) {
  if (!error) {
    return {
      code: 'MITUP_UNKNOWN_ERROR',
      message: getMitupErrorMessage('MITUP_UNKNOWN_ERROR'),
    };
  }

  const code =
    error.code
    || error.payload?.code
    || error.data?.code
    || (error.name === 'MitupStreamDisconnectedError' ? 'MITUP_STREAM_DISCONNECTED' : undefined)
    || 'MITUP_UNKNOWN_ERROR';

  const rawMessage =
    error.message
    || error.payload?.message
    || error.data?.message
    || '';

  return {
    code,
    message: rawMessage || getMitupErrorMessage(code),
    httpStatus: error.httpStatus || error.payload?.httpStatus,
  };
}

/**
 * @param {unknown} error
 * @returns {'error'|'timeout'}
 */
export function getMitupErrorLifecycleStatus(error) {
  const code = normalizeMitupError(error).code;
  if (code === 'MITUP_TASK_TIMEOUT' || code === 'MITUP_STREAM_DISCONNECTED') {
    return 'timeout';
  }
  return 'error';
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getMitupUserMessage(error) {
  return normalizeMitupError(error).message;
}
