import { ModelFactoryPerId } from '../common/modelFactoryPerId';
import {
  MODEL_PLAYER,
  MonsterActionType,
  PlayerAction,
} from '../common/objects/enum';
import { HelloPacket } from '../common/packets/ConnectServerPackets';
import {
  AddCharactersToScopePacket,
  AddNpcsToScopePacket,
  CharacterInformationPacket,
  ChatMessagePacket,
  CurrentHealthAndShieldPacket,
  CurrentManaAndAbilityPacket,
  GameServerEnteredPacket,
  MapObjectOutOfScopePacket,
  ObjectWalkedPacket,
} from '../common/packets/ServerToClientPackets';
import { PlayerObject } from '../common/playerObject';
import { World } from './ecs/world';
import { createAttributeSystem } from './libs/attributeSystem';
import { Vector3 } from './libs/babylon/exports';
import { EventBus } from './libs/eventBus';
import { Store, UIState } from './store';

function convertDirectionToAngle(direction: number): number {
  // Convert the direction (0-7) to an angle in radians
  // 0 = 0 degrees, 1 = 45 degrees, ..., 7 = 315 degrees
  return (direction * Math.PI) / 4; // Convert to radians
}

export function spawnPlayer(world: World) {
  const playerEntity = world.add({
    transform: {
      pos: new Vector3(),
      rot: Vector3.Zero(),
      scale: 1,
    },
    modelId: MODEL_PLAYER,
    modelFactory: PlayerObject,
    pathfinding: {
      from: { x: 0, y: 0 },
      to: { x: 0, y: 0 },
      path: [],
      calculated: true,
    },
    playerMoveTo: {
      point: { x: 0, y: 0 },
      handled: true as boolean,
    },
    movement: {
      velocity: { x: 0, y: 0 },
    },
    playerAnimation: {
      action: PlayerAction.PLAYER_SET,
    },
    attributeSystem: createAttributeSystem(),
  });
  playerEntity.transform.pos.z = 1.7;

  playerEntity.attributeSystem.setValue('isFemale', 0);
  playerEntity.attributeSystem.setValue('isFlying', 1);
  playerEntity.attributeSystem.setValue('currentHealth', 0);
  playerEntity.attributeSystem.setValue('currentMana', 0);
  playerEntity.attributeSystem.setValue('maxHealth', 1);
  playerEntity.attributeSystem.setValue('maxMana', 1);

  return playerEntity;
}

let serverListRequested = false;
EventBus.on('Hello', packet => {
  const p = new HelloPacket(packet);
  if (serverListRequested) return;
  serverListRequested = true;
  Store.updateServerListRequest();
});

EventBus.on('GameServerEntered', bytes => {
  const p = new GameServerEnteredPacket(bytes);
  console.log(p);
  Store.playerId = p.PlayerId;
  console.log(`PlayerID: ${Store.playerId}`);

  Store.uiState = UIState.Login;
});

EventBus.on('CharacterInformation', packet => {
  const p = new CharacterInformationPacket(packet);

  const playerData = Store.playerData;
  playerData.money = p.Money;
  playerData.x = p.X;
  playerData.y = p.Y;

  Store.uiState = UIState.World;
});

// EventBus.on('ServerMessage', packet => {
//   const p = new ServerMessagePacket(packet);
//   console.log(p);
// });

// EventBus.on('WeatherStatusUpdate', packet => {
//   const p = new WeatherStatusUpdatePacket(packet);
//   console.log(p);
// });
// EventBus.on('MessengerInitialization', packet => {
//   const p = new MessengerInitializationPacket(packet);
//   console.log(`MessengerInitialization, friends: ${p.FriendCount} letters: ${p.LetterCount}/${p.MaximumLetterCount}`);
// });

EventBus.on('CurrentHealthAndShield', packet => {
  const p = new CurrentHealthAndShieldPacket(packet);

  const playerEntity = Store.world?.playerEntity;
  if (!playerEntity) return;
  playerEntity.attributeSystem.setValue('currentHealth', p.Health);
});

EventBus.on('CurrentManaAndAbility', packet => {
  const p = new CurrentManaAndAbilityPacket(packet);

  const playerEntity = Store.world?.playerEntity;
  if (!playerEntity) return;

  playerEntity.attributeSystem.setValue('currentMana', p.Mana);
});

EventBus.on('AddNpcsToScope', packet => {
  const p = new AddNpcsToScopePacket(packet);
  const npcs = p.getNPCs();
  console.log(p, npcs);

  const world = Store.world;
  if (!world) return;

  npcs.forEach(npc => {
    const definedModelFactory = ModelFactoryPerId[npc.TypeNumber];
    if (!definedModelFactory) {
      console.warn(
        `No model factory found for NPC type ${npc.TypeNumber}. Using default PlayerObject.`
      );
    }

    const modelFactory = definedModelFactory || PlayerObject;

    const npcEntity = world.add({
      netId: npc.Id,
      npcType: npc.TypeNumber,
      transform: {
        pos: new Vector3(npc.CurrentPositionX, npc.CurrentPositionY, 1.7),
        rot: new Vector3(0, 0, convertDirectionToAngle(npc.Rotation)),
        scale: modelFactory.OverrideScale >= 0 ? modelFactory.OverrideScale : 1,
      },
      modelFactory,
      pathfinding: {
        from: { x: 0, y: 0 },
        to: { x: 0, y: 0 },
        path: [],
        calculated: true,
      },
      playerMoveTo: {
        point: { x: 0, y: 0 },
        handled: true as boolean,
      },
      movement: {
        velocity: { x: 0, y: 0 },
      },
      monsterAnimation: {
        action: MonsterActionType.Stop1,
      },
      attributeSystem: createAttributeSystem(),
    });

    npcEntity.attributeSystem.setValue('isFemale', 0);
    npcEntity.attributeSystem.setValue('isFlying', 0);
  });
});

EventBus.on('AddCharactersToScope', packet => {
  const p = new AddCharactersToScopePacket(packet);
  const chars = p.getCharacters();
  console.log(p, chars);

  const world = Store.world;
  if (!world) return;

  chars.forEach(char => {
    const playerEntity = spawnPlayer(world);
    world.addComponent(playerEntity, 'netId', char.Id);
    playerEntity.transform.pos.x = char.CurrentPositionX;
    playerEntity.transform.pos.y = char.CurrentPositionY;
    playerEntity.transform.rot.z = convertDirectionToAngle(char.Rotation);

    if (Store.playerId === char.Id) {
      world.addComponent(playerEntity, 'localPlayer', true);
    }
  });
});

EventBus.on('MapObjectOutOfScope', packet => {
  const p = new MapObjectOutOfScopePacket(packet);
  p.getObjects(p.ObjectCount).forEach(obj => {
    console.log(`Object out of scope: ${obj.Id}`);
    const world = Store.world;
    if (!world) return;

    const objEntity = world.netObjsQuery.entities.find(
      e => e.netId === obj.Id && !e.objOutOfScope
    );
    if (objEntity) {
      world.addComponent(objEntity, 'objOutOfScope', true);
    }
  });
});

EventBus.on('ObjectWalked', packet => {
  const p = new ObjectWalkedPacket(packet);

  const world = Store.world;
  if (!world) return;

  const obj = world.netObjsQuery.entities.find(e => e.netId === p.ObjectId);
  if (!obj) return;

  if (obj.localPlayer) return;

  if (obj.playerMoveTo) {
    obj.playerMoveTo.handled = false;
    obj.playerMoveTo.point.x = p.TargetX;
    obj.playerMoveTo.point.y = p.TargetY;
  } else {
    obj.transform.pos.x = p.TargetX;
    obj.transform.pos.y = p.TargetY;
    obj.transform.rot.z = convertDirectionToAngle(p.TargetRotation);
  }

  const dirs = new Array(p.StepCount).fill(0);
  for (let i = 0; i < p.StepCount; i++) {
    dirs[i] = p.StepData.getUint8(i);
  }

  // C1 09 D4 02 04 B1 7E 60 00

  console.log(
    `ObjectWalked: ${p.ObjectId}, steps: ${
      p.StepCount
    }, directions: ${dirs.join('->')}`,
    packet
  );
});

EventBus.on('ChatMessage', packet => {
  const p = new ChatMessagePacket(packet);
  console.log(p);
});
