import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection to backend
      const newSocket = io('http://localhost:5000', {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        newSocket.emit('join_room', user.id);
      });

      newSocket.on('notification', (data) => {
        toast.success(
          <div>
            <strong>{data.title}</strong>
            <p className="text-sm mt-1">{data.message}</p>
          </div>,
          { duration: 5000, position: 'top-right' }
        );
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
