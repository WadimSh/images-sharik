/**
 * Каркас страницы AI-чата: sidebar + main + composer.
 */
export function AiChatLayout({
  sidebar,
  main,
  composer,
  sidebarOpen = false,
  onSidebarClose,
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
        <div className="ai-chat-layout-main-inner">
          <div className="ai-chat-layout-main-scroll">{main}</div>
          <div className="ai-chat-layout-composer">{composer}</div>
        </div>
      </div>
    </div>
  );
}
