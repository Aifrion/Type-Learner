import type { LeaderboardEntry } from "@/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  const rankedEntries = sortEntries(entries);

  if (rankedEntries.length === 0) {
    return <p className="text-sm text-gray-500">No leaderboard data yet.</p>;
  }

  return (
    <ol className="space-y-2" aria-label="Leaderboard rankings">
      {rankedEntries.map((entry) => (
        <li
          key={entry.socketId}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
        >
          <span className="font-medium text-gray-800">
            #{entry.rank} {entry.nickname}
          </span>
          <span className="text-sm font-semibold text-purple-700">
            {entry.score} pts
          </span>
        </li>
      ))}
    </ol>
  );
}
