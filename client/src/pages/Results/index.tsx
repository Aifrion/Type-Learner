import { useParams } from 'react-router-dom';

export default function Results() {
  const { code } = useParams<{ code: string }>();

  return (
    <div>
      <h1>Results: {code}</h1>
      {/* TODO: Final standings, player scores, play again button */}
    </div>
  );
}
