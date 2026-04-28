import { ReactNode } from "react";
import MessagesList from "./components/messageList";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/70">
      <aside className="flex h-full w-[360px] max-w-[42%] shrink-0 flex-col overflow-hidden border-r border-slate-200/80 bg-white/95">
        <MessagesList />
      </aside>

      <main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
        {children}
      </main>
    </div>
  );
}
