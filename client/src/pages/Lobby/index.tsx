import { useParams } from 'react-router-dom';

export default function Lobby() {
  const { code } = useParams<{ code: string }>();

  return (
    <div>
      <h1>Lobby: {code}</h1>
      {/* TODO: Player list, start game button (host only) */}
    </div>
  );
}
