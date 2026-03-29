import io from 'socket.io-client';

let socket = null;

export const getSocket = (url) => {
    if (!socket) {
        socket = io(url);
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
