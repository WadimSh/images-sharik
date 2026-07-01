import { formatMitupBalance } from '../../hooks/useAiChatInit';
import { getMinuteLimitMeter } from '../../utils/mitupLimits';
import './AiChatStatusBar.css';

/**
 * @param {object} props
 * @param {{ balance?: number|null }|null|undefined} props.balance
 * @param {{ usage?: { minute?: number }, max?: { minute?: number } }|null|undefined} props.limits
 * @param {(balanceData: object|null|undefined) => string} [props.formatBalance]
 */
export function AiChatStatusBar({ balance, limits, formatBalance = formatMitupBalance }) {
  const limitMeter = getMinuteLimitMeter(limits);
  const balanceLabel = formatBalance(balance);

  return (
    <div className="ai-chat-status-bar" data-testid="ai-chat-status-bar">
      <div className="ai-chat-status-balance" data-testid="ai-chat-status-bar-balance">
        <span className="ai-chat-status-balance-badge" aria-hidden="true">
          ₽
        </span>
        <div className="ai-chat-status-balance-content">
          <span className="ai-chat-status-balance-label">Баланс</span>
          <span className="ai-chat-status-balance-value">{balanceLabel}</span>
        </div>
      </div>

      {limitMeter ? (
        <div
          className={`ai-chat-status-limit${
            limitMeter.isExceeded ? ' ai-chat-status-limit--exceeded' : ''
          }`}
          data-testid="ai-chat-status-bar-limit"
          data-tone={limitMeter.tone}
          title={limitMeter.title}
        >
          <div className="ai-chat-status-limit-header">
            <span className="ai-chat-status-limit-label">Запросы / мин</span>
            <span className="ai-chat-status-limit-count" data-testid="ai-chat-status-bar-limit-count">
              {limitMeter.usage} / {limitMeter.max}
            </span>
          </div>
          <div
            className="ai-chat-status-limit-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={limitMeter.max}
            aria-valuenow={limitMeter.usage}
            aria-label={limitMeter.title}
          >
            <span
              className="ai-chat-status-limit-fill"
              data-testid="ai-chat-status-bar-limit-fill"
              style={{ width: `${limitMeter.percent}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
