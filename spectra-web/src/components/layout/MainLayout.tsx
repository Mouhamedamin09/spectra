import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const isDetailsPage = location.pathname.startsWith('/details/');
  const isWatchPage = location.pathname.startsWith('/watch/');
  const isFullPage = isDetailsPage || isWatchPage;

  return (
    <div className="layout">
      <Header />
      
      <main className={`main-content ${isFullPage ? 'main-content--full' : ''}`}>
        <Outlet />
      </main>
      
      <MobileTabBar />
    </div>
  );
};
