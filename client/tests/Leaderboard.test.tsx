import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Leaderboard from "@/pages/Results/components/Leaderboard";

describe("Leaderboard", () => {
  it("ranks players by score descending and displays rank numbers", () => {
    render(
      <Leaderboard
        entries={[
          { socketId: "s1", nickname: "Chris", score: 220, rank: 99 },
          { socketId: "s2", nickname: "Ada", score: 340, rank: 99 },
          { socketId: "s3", nickname: "Ben", score: 280, rank: 99 },
        ]}
      />
    );

    const rankingRows = screen.getAllByRole("listitem");
    expect(rankingRows).toHaveLength(3);
    expect(rankingRows[0]).toHaveTextContent("#1 Ada");
    expect(rankingRows[1]).toHaveTextContent("#2 Ben");
    expect(rankingRows[2]).toHaveTextContent("#3 Chris");
  });

  it("shows empty-state text when no leaderboard data exists", () => {
    render(<Leaderboard entries={[]} />);

    expect(screen.getByText(/no leaderboard data yet/i)).toBeInTheDocument();
  });
});
