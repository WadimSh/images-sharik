import './AiChatLayout.css';

/**
 * Каркас страницы AI-чата: sidebar + main + composer.
 */
export function AiChatLayout({
  sidebar,
  main,
  modeSwitch,
  composer,
  sidebarOpen = false,
  onSidebarClose,
  isWelcomeCenter = false,
}) {
  return (
    <div className="ai-chat-layout">
      {sidebarOpen && onSidebarClose ? (
        <button
          type="button"
          className="ai-chat-sidebar-backdrop"
          onClick={onSidebarClose}
          aria-label="Закрыть меню чатов"
        />
      ) : null}

      <aside
        className={`ai-chat-layout-sidebar ${sidebarOpen ? 'ai-chat-layout-sidebar--open' : ''}`}
      >
        {sidebar}
      </aside>

      <div className="ai-chat-layout-main">
        <div
          className={`ai-chat-layout-main-inner${
            isWelcomeCenter ? ' ai-chat-layout-main-inner--welcome' : ''
          }`}
        >
          {isWelcomeCenter ? (
            <div className="ai-chat-welcome-center" data-testid="ai-chat-welcome-center">
              <div className="ai-chat-layout-main-scroll">{main}</div>
              {modeSwitch ? (
                <div className="ai-chat-layout-mode-switch">{modeSwitch}</div>
              ) : null}
              <div className="ai-chat-layout-composer">{composer}</div>
            </div>
          ) : (
            <>
              <div className="ai-chat-layout-main-scroll">{main}</div>
              {modeSwitch ? (
                <div className="ai-chat-layout-mode-switch">{modeSwitch}</div>
              ) : null}
              <div className="ai-chat-layout-composer">{composer}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
