import { useParams } from 'react-router-dom';

export default function Game() {
  const { code } = useParams<{ code: string }>();

  return (
    <div>
      <h1>Game: {code}</h1>
      {/* TODO: Question display, typing input, timer, scoreboard */}
    </div>
  );
}
