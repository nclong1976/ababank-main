import io from 'socket.io-client';

const socket = io(window.location.origin, {
  transports: ['websocket'],
  reconnection: true,
});

export default socket;
