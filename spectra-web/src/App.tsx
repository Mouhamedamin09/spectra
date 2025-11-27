import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { BrowserPage } from './pages/BrowserPage';
import { DetailsPage } from './pages/DetailsPage';
import { SearchPage } from './pages/SearchPage';
import { MyListPage } from './pages/MyListPage';
import { VideoPlayer } from './components/player/VideoPlayer';
import { useAdBlockDetector } from './hooks/useAdBlockDetector';
import { AdBlockModal } from './components/common/AdBlockModal';

function App() {
  const isAdBlockDetected = useAdBlockDetector();

  return (
    <Router>
      {isAdBlockDetected && <AdBlockModal />}
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<BrowserPage title="Movies" type="movie" />} />
          <Route path="/tv-shows" element={<BrowserPage title="TV Shows" type="tv" />} />
          <Route path="/animation" element={<BrowserPage title="Animation" type="animation" />} />
          <Route path="/my-list" element={<MyListPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/browse" element={<BrowserPage title="Browse All" type="movie" />} />
          <Route path="/profile" element={<div className="p-8 text-center"><h1>Profile</h1></div>} />
          <Route path="/details/:id" element={<DetailsPage />} />
        </Route>
        <Route path="/watch/:id" element={<VideoPlayer title="Now Playing" />} />
      </Routes>
    </Router>
  );
}

export default App;
