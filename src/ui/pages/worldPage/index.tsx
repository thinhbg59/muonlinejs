import './style.less';
import { observer } from 'mobx-react-lite';
import { Store } from '../../../store';
import { WorldObjects } from '../../components/worldObjects';

const HUD = observer(() => {
  const playerData = Store.playerData;

  return <div className="hud"></div>;
});

export const WorldPage = observer(() => {
  return (
    <div className="world-page">
      <WorldObjects />
      <HUD />
    </div>
  );
});
