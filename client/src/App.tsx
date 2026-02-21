import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Join from '@/pages/Join';
import Lobby from '@/pages/Lobby';
import Game from '@/pages/Game';
import Results from '@/pages/Results';
import QuizCreate from '@/pages/QuizCreate';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join" element={<Join />} />
      <Route path="/lobby/:code" element={<Lobby />} />
      <Route path="/typing/:code" element={<Game />} />
      <Route path="/results/:code" element={<Results />} />
      <Route path="/create" element={<QuizCreate />} />
    </Routes>
  );
}

export default App;
