import { HiChatAlt2, HiUsers, HiSparkles } from "react-icons/hi";

export default function MessagesPlaceholder() {
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)]">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-slate-900/5 blur-3xl" />
      <div className="absolute -bottom-28 left-16 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative flex h-full items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/80 p-8 text-center shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-xl shadow-slate-900/20">
            <HiChatAlt2 className="h-10 w-10" />
          </div>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <HiSparkles className="h-4 w-4 text-amber-500" />
            Team discussions
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Select a group chat to start
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
            Choose a conversation from the left panel to view live messages,
            files, participants, and team updates in one focused workspace.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left shadow-sm">
              <div className="text-sm font-semibold text-slate-950">Live chat</div>
              <div className="mt-1 text-xs text-slate-500">Real-time updates</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left shadow-sm">
              <div className="text-sm font-semibold text-slate-950">Files</div>
              <div className="mt-1 text-xs text-slate-500">PDF, media, docs</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <HiUsers className="h-4 w-4" /> Members
              </div>
              <div className="mt-1 text-xs text-slate-500">IME / BME teams</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
