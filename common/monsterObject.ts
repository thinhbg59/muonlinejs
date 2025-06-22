import { ModelObject } from './modelObject';
import { MonsterActionType } from './objects/enum';

export class MonsterObject extends ModelObject {
  setActionSpeed(actionType: MonsterActionType, speed: number) {
    const action = this.Model?.Actions[actionType];
    if (action) {
      action.PlaySpeed = speed;
    }
  }
}
