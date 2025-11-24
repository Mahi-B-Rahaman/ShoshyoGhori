import { AuthProvider } from './AuthContext.tsx';
import { NotificationProvider } from './NotificationContext.tsx';
import { Layout } from './Layout.tsx';

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50 text-gray-800">
          <div className="animate-fadeIn">
            <Layout />
          </div>
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
