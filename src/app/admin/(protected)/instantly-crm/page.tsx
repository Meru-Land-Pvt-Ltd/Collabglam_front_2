"use client";

const stats = [
  {
    title: "Connected Senders",
    value: "1",
    hint: "Instantly sender ready",
  },
  {
    title: "Live Campaigns",
    value: "3",
    hint: "SDR-owned outbound campaigns",
  },
  {
    title: "Pending RH Reviews",
    value: "8",
    hint: "Replies waiting for allocation",
  },
  {
    title: "Assigned BME Threads",
    value: "14",
    hint: "Relationship-owned conversations",
  },
];

const campaigns = [
  {
    name: "Spring Fashion Outreach",
    status: "Launched",
    sdr: "Sophia Green",
    rh: "Revenue Head A",
    bme: "BME A",
    sender: "sophia.green@collabglam.com",
    prospects: 120,
    replies: 9,
  },
  {
    name: "Beauty Brand Pilot",
    status: "Paused",
    sdr: "Sophia Green",
    rh: "Revenue Head A",
    bme: "BME B",
    sender: "sophia.green@collabglam.com",
    prospects: 64,
    replies: 4,
  },
  {
    name: "Creator Partnership Batch",
    status: "Draft",
    sdr: "Sophia Green",
    rh: "Revenue Head A",
    bme: "BME C",
    sender: "sophia.green@collabglam.com",
    prospects: 88,
    replies: 0,
  },
];

function getStatusClasses(status: string) {
  if (status === "Launched") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Paused") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-zinc-50 text-zinc-700 border-zinc-200";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function InstantlyCRMPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {stats.map((card) => (
          <div
            key={card.title}
            className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
          >
            <p className="text-sm font-medium text-black/55">{card.title}</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-black">
              {card.value}
            </h3>
            <p className="mt-2 text-sm text-black/50">{card.hint}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        <div>
          <h3 className="text-lg font-semibold text-black">Campaign Creation Flow</h3>
          <p className="mt-1 text-sm text-black/55">
            Launch cold outreach through Instantly with strict ownership from SDR to RH to BME.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] border border-black/10 bg-[#fcfcfc] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/35">
              Step 1
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-black">
              SDR creates the campaign, selects Instantly sender accounts, and maps Revenue Head and
              BME before launch.
            </p>
          </div>

          <div className="rounded-[20px] border border-black/10 bg-[#fcfcfc] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/35">
              Step 2
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-black">
              Instantly runs the outbound sequence, warmup, sending rotation, and reply tracking.
            </p>
          </div>

          <div className="rounded-[20px] border border-black/10 bg-[#fcfcfc] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/35">
              Step 3
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-black">
              When a brand replies, the lead moves to Revenue Head review and is locked away from SDR.
            </p>
          </div>

          <div className="rounded-[20px] border border-black/10 bg-[#fcfcfc] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/35">
              Step 4
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-black">
              Revenue Head assigns the brand to BME, and BME becomes the only conversation owner.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-black">Campaign Operations</h3>
            <p className="mt-1 text-sm text-black/55">
              Live overview of sender usage, ownership mapping, and reply handoff flow.
            </p>
          </div>
          <button
            type="button"
            className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
          >
            View All
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-black/40">
                <th className="pb-1 font-medium">Campaign</th>
                <th className="pb-1 font-medium">Status</th>
                <th className="pb-1 font-medium">Owners</th>
                <th className="pb-1 font-medium">Sender</th>
                <th className="pb-1 font-medium">Prospects</th>
                <th className="pb-1 font-medium">Replies</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((row) => (
                <tr key={row.name} className="rounded-2xl bg-[#fcfcfc]">
                  <td className="rounded-l-2xl px-4 py-4 align-top">
                    <p className="text-sm font-semibold text-black">{row.name}</p>
                    <p className="mt-1 text-xs text-black/50">Instantly synced outbound campaign</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span
                      className={cx(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                        getStatusClasses(row.status)
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="text-sm text-black">
                      <span className="font-medium">SDR:</span> {row.sdr}
                    </p>
                    <p className="mt-1 text-sm text-black/70">
                      <span className="font-medium">RH:</span> {row.rh}
                    </p>
                    <p className="mt-1 text-sm text-black/70">
                      <span className="font-medium">BME:</span> {row.bme}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top text-sm font-medium text-black">
                    {row.sender}
                  </td>
                  <td className="px-4 py-4 align-top text-sm font-medium text-black">
                    {row.prospects}
                  </td>
                  <td className="rounded-r-2xl px-4 py-4 align-top text-sm font-medium text-black">
                    {row.replies}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-[24px] border border-dashed border-black/15 bg-white px-6 py-6 text-center text-sm leading-7 text-black/55 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        Start by connecting sender accounts, creating an SDR campaign, mapping RH and BME,
        launching from Instantly, and moving every replied brand into RH review before BME handoff.
      </div>
    </div>
  );
}