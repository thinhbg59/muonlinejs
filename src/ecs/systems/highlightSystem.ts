import { VertexBuffer, type StandardMaterial } from '@babylonjs/core';
import { ISystemFactory } from '../world';
import { createCustomMaterial } from '../../../common/BMD/createMeshes';
import type { CustomMaterial } from '@babylonjs/materials';

export const HighlightSystem: ISystemFactory = world => {
  const query = world.with('highlighted', 'modelObject', 'visibility');

  query.onEntityRemoved.subscribe(entity => {
    const layer = entity.highlighted.layer;
    if (entity.modelObject && layer) {
      entity.modelObject.getMeshes(false).forEach(mesh => {
        layer.removeMesh(mesh);
      });
    }

    entity.highlighted.layer = null;
  });

  return {
    update: () => {
      const layer = world.scene.hl;

      return;
      for (const { highlighted, modelObject, visibility } of query) {
        if (visibility.state === 'hidden') continue;
        if (!modelObject.Ready) continue;
        if (highlighted.layer) continue;

        modelObject.getMeshes(true).forEach(mesh => {
          // layer.addMesh(mesh, highlighted.color, false);
          const clonedMesh = mesh.clone('hl_' + mesh.name);
          clonedMesh.makeGeometryUnique();
          // clonedMesh.setVerticesBuffer(mesh.getVertexBuffer())

          clonedMesh.position.x += 100;

          // clonedMesh._unFreeze();

          const colors = clonedMesh
            .getVerticesData(VertexBuffer.ColorKind)!;
           

          // if(clonedMesh.isVertexBufferUpdatable(VertexBuffer.UV2Kind)){}else{
          //   console.error(`UV2Kind not found in ${clonedMesh.name}`);
          //   return;
          // }

          for (let i = 0; i < colors.length; i += 4) {
            colors[i] = highlighted.color.r; // R
            colors[i + 1] = highlighted.color.g; // G
            colors[i + 2] = 0; // B
            colors[i + 3] = 1; // A
          }

          clonedMesh.setVerticesData(VertexBuffer.ColorKind, colors, false);

          // const m = createCustomMaterial(world.scene,'abc');
          // clonedMesh.material = m;
// clonedMesh.material=m;

          // clonedMesh.material!.onBindObservable.add(ev => {
          //   if (ev === clonedMesh) {
             
          //     ev.material!.alpha=0.5;
          //     ev.material!.transparencyMode=2;
          //   }else{
          //     ev.material!.alpha=1;
          //     ev.material!.transparencyMode=0;
          //     ev.material!.depthFunction = 1;

          //   }
          // });
          // layer.setMaterialForRendering(mesh, m);
          highlighted.layer = layer;
        });
      }
    },
  };
};
