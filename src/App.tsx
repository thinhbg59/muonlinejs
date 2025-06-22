import { ServersPage } from './ui/pages/serversPage';
import { observer } from 'mobx-react-lite';
import { Store, UIState } from './store';
import { LoginPage } from './ui/pages/loginPage';
import { CharactersPage } from './ui/pages/charactersPage';
import { WorldPage } from './ui/pages/worldPage';
import { Notification } from './ui/components/notification';
import { useEventBus } from './hooks/useEventBus';

const Debug = observer(() => {
  const playerData = Store.playerData;

  return (
    <div className="debug">
      <span className="money">Zen: {playerData.money}</span>
      <span className="coords">
        XY: {playerData.x} {playerData.y}
      </span>
    </div>
  );
});

const CurrentPage = observer(() => {
  const state = Store.uiState;

  switch (state) {
    case UIState.Servers:
      return <ServersPage />;
    case UIState.Login:
      return <LoginPage />;
    case UIState.Characters:
      return <CharactersPage />;
    case UIState.LoadingWorld:
    case UIState.World:
      return <WorldPage />;
    default:
      return <div>No Page</div>;
  }
});

export const App = observer(() => {
  useEventBus('wsError', () => {
    Store.addNotification('WebSocket connection error', 'error');
  });

  return (
    <div className="app">
      {!Store.isOffline && <CurrentPage />}
      <Notification />
      <Debug />
    </div>
  );
});
