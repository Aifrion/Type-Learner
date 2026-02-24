import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import HostAuth from '@/pages/HostAuth';
import HostLogin from '@/pages/HostLogin';
import HostRegister from '@/pages/HostRegister';
import HostDashboard from '@/pages/HostDashboard';
import Join from '@/pages/Join';
import Lobby from '@/pages/Lobby';
import Game from '@/pages/Game';
import Results from '@/pages/Results';
import QuizCreate from '@/pages/QuizCreate';
import DebugRoom from '@/pages/DebugRoom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/host-auth" element={<HostAuth />} />
      <Route path="/host-login" element={<HostLogin />} />
      <Route path="/host-registration" element={<HostRegister />} />
      <Route path="/host/dashboard" element={<HostDashboard />} />
      <Route path="/join" element={<Join />} />
      <Route path="/lobby/:code" element={<Lobby />} />
      <Route path="/typing/:code" element={<Game />} />
      <Route path="/results/:code" element={<Results />} />
      <Route path="/create" element={<QuizCreate />} />
      <Route path="/debug-room" element={<DebugRoom />} />
    </Routes>
  );
}

export default App;
