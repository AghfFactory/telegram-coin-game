export function getPlayerInfo() {
  const tg = (window as any).Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;
  const playerId = user?.id?.toString() || crypto.randomUUID();

  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room') || 'default';

  return { playerId, roomId };
}
