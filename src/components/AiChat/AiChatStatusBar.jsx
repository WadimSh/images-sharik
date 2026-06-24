import { formatMitupBalance } from '../../hooks/useAiChatInit';
import { isMinuteRateLimitReached } from '../../utils/mitupLimits';
import './AiChatStatusBar.css';

/**
 * @param {object} props
 * @param {{ balance?: number|null }|null|undefined} props.balance
 * @param {{ usage?: { minute?: number }, max?: { minute?: number } }|null|undefined} props.limits
 * @param {(balanceData: object|null|undefined) => string} [props.formatBalance]
 */
export function AiChatStatusBar({ balance, limits, formatBalance = formatMitupBalance }) {
  const limitUsage = limits?.usage?.minute;
  const limitMax = limits?.max?.minute;
  const isLimitReached = isMinuteRateLimitReached(limits);

  return (
    <div className="ai-chat-status-bar" data-testid="ai-chat-status-bar">
      <span className="ai-chat-status-bar-item" data-testid="ai-chat-status-bar-balance">
        Баланс: {formatBalance(balance)}
      </span>

      {limitMax != null ? (
        <span
          className={`ai-chat-status-bar-item${
            isLimitReached ? ' ai-chat-status-bar-item--limit-exceeded' : ''
          }`}
          data-testid="ai-chat-status-bar-limit"
        >
          {isLimitReached ? (
            <span
              className="ai-chat-status-bar-limit-indicator"
              aria-hidden="true"
              title="Лимит запросов исчерпан"
            />
          ) : null}
          Лимит: {limitUsage ?? 0}/{limitMax}/мин
        </span>
      ) : null}
    </div>
  );
}
