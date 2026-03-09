import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import HostAuth from "@/pages/HostAuth";
import HostLogin from "@/pages/HostLogin";
import HostRegister from "@/pages/HostRegister";
import HostDashboard from "@/pages/HostDashboard";
import Join from "@/pages/Join";
import Lobby from "@/pages/Lobby";
import Question from "@/pages/Question";
import Game from "@/pages/Game";
import Results from "@/pages/Results";
import QuizCreate from "@/pages/QuizCreate";
import TeacherWaitingRoom from "@/pages/TeacherWaitingRoom";
import { SocketProvider } from "@/hooks/useSocket";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/host-auth" element={<HostAuth />} />
      <Route path="/host-login" element={<HostLogin />} />
      <Route path="/host-registration" element={<HostRegister />} />
      <Route path="/host/dashboard" element={<HostDashboard />} />
      <Route path="/join" element={<Join />} />
      <Route path="/create" element={<QuizCreate />} />
      <Route path="/edit/:id" element={<QuizCreate />} />
      <Route element={<SocketProvider />}>
        <Route path="/host/waiting-room" element={<TeacherWaitingRoom />} />
        <Route path="/lobby/:code" element={<Lobby />} />
        <Route path="/question/:code" element={<Question />} />
        <Route path="/typing/:code" element={<Game />} />
        <Route path="/results/:code" element={<Results />} />
      </Route>
    </Routes>
  );
}

export default App;
