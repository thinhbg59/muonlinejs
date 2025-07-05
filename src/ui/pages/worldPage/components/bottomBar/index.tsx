import { Store } from '../../../../../store';
import './style.less';
import { observer } from 'mobx-react-lite';

function normalizeLvl(lvl: number) {
  if (lvl < 3) return 0;
  if (lvl < 5) return 3;
  if (lvl < 7) return 5;
  if (lvl < 9) return 7;
  if (lvl < 11) return 9;
  if (lvl < 13) return 11;
  if (lvl < 15) return 13;
  return 15;
}

const ItemIcon = ({
  group,
  num,
  lvl,
  excellent,
}: {
  group: number;
  num: number;
  lvl?: number;
  excellent?: boolean;
}) => {
  const normalizedLvl = normalizeLvl(lvl ?? 0);

  return (
    <img
      src={`/items/item_${group}_${num}_${normalizedLvl}${
        excellent ? '_e' : ''
      }.png`}
      className="item-icon"
      alt="icon"
    />
  );
};

const ConsumableItem = ({
  hotKey,
  icon,
  count,
}: {
  hotKey: string;
  icon: {
    group: number;
    num: number;
    lvl?: number;
    excellent?: boolean;
  };
  count: number;
}) => {
  return (
    <div className="consumable-item">
      <span className="hot-key">{hotKey}</span>
      <ItemIcon {...icon} />
      <span className="count">{count}</span>
    </div>
  );
};

const VerticalBar = ({
  className,
  value,
  maxValue,
  fillAmount,
}: {
  className: string;
  value: number;
  maxValue: number;
  fillAmount: number;
}) => {
  const filled = (fillAmount * 100).toFixed(0) + '%';

  return (
    <div className={`${className} vertical-bar`}>
      <div className="bg">
        <div className="fill" style={{ height: filled }}></div>
        <span className="current">{value}</span>
      </div>
    </div>
  );
};

export const ExpBar = observer(() => {
  const playerData = Store.playerData;
  const filled = (playerData.expPercent * 100).toFixed(0) + '%';

  return (
    <div className="exp-bar">
      <div className="fill" style={{ width: filled }}></div>
      <span className="value">{playerData.exp}</span>
    </div>
  );
});

export const BottomBar = observer(() => {
  const playerData = Store.playerData;

  return (
    <div className="bottom-bar">
      <div className="panel">
        <div className="consumable-items">
          <ConsumableItem hotKey="Q" icon={{ group: 14, num: 0 }} count={10} />
          <ConsumableItem hotKey="W" icon={{ group: 14, num: 1 }} count={10} />
          <ConsumableItem hotKey="E" icon={{ group: 14, num: 2 }} count={10} />
          <ConsumableItem hotKey="R" icon={{ group: 14, num: 3 }} count={10} />
        </div>
        <VerticalBar
          className="hp-bar"
          value={playerData.currentHP}
          maxValue={playerData.maxHP}
          fillAmount={playerData.hpPercent}
        />
        <VerticalBar
          className="sd-bar"
          value={playerData.currentSD}
          maxValue={playerData.maxSD}
          fillAmount={playerData.sdPercent}
        />
        <div className="skills">
          <button className="skill-6">6</button>
          <button className="skill-7">7</button>
          <button className="skill-8">8</button>
          <button className="skill-9">9</button>
          <button className="skill-0">5</button>
          <button className="skill-current">Current</button>
        </div>
        <VerticalBar
          className="ag-bar"
          value={playerData.currentAG}
          maxValue={playerData.maxAG}
          fillAmount={playerData.agPercent}
        />
        <VerticalBar
          className="mp-bar"
          value={playerData.currentMP}
          maxValue={playerData.maxMP}
          fillAmount={playerData.mpPercent}
        />
        <div className="buttons">
          <button className="item-shop">Shop</button>
          <button className="character">Char</button>
          <button className="inventory">Inv</button>
          <button className="friend">Friend</button>
          <button className="menu">Menu</button>
        </div>
      </div>
      <ExpBar />
    </div>
  );
});
