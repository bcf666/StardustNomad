import * as THREE from 'three';
import { BlockType, isSolid, isTransparent, getBlockColor } from './voxel.js';

export const CHUNK_SIZE = 32;
export const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE;

// Chunk类 - 管理32x32x32的体素块
export class Chunk {
    constructor(chunkX, chunkY, chunkZ, world) {
        this.chunkX = chunkX;
        this.chunkY = chunkY;
        this.chunkZ = chunkZ;
        this.world = world;
        
        // 块数据 - 使用Uint8Array存储
        this.blocks = new Uint8Array(CHUNK_VOLUME);
        
        // 是否需要重建网格
        this.dirty = true;
        // 网格对象
        this.mesh = null;
        // 是否已加载
        this.loaded = false;
    }

    // 获取块索引
    getBlockIndex(x, y, z) {
        return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
    }

    // 设置块
    setBlock(x, y, z, blockType) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
            return false;
        }
        const index = this.getBlockIndex(x, y, z);
        if (this.blocks[index] !== blockType) {
            this.blocks[index] = blockType;
            this.dirty = true;
        }
        return true;
    }

    // 获取块
    getBlock(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
            return BlockType.AIR;
        }
        return this.blocks[this.getBlockIndex(x, y, z)];
    }

    // 世界坐标转局部坐标
    worldToLocal(worldX, worldY, worldZ) {
        return {
            x: worldX - this.chunkX * CHUNK_SIZE,
            y: worldY - this.chunkY * CHUNK_SIZE,
            z: worldZ - this.chunkZ * CHUNK_SIZE
        };
    }

    // 构建网格
    buildMesh() {
        if (!this.dirty) return;
        
        // 移除旧网格
        if (this.mesh) {
            this.world.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => m.dispose());
            } else {
                this.mesh.material.dispose();
            }
        }

        const positions = [];
        const colors = [];
        const indices = [];
        let vertexCount = 0;

        // 遍历所有块
        for (let z = 0; z < CHUNK_SIZE; z++) {
            for (let y = 0; y < CHUNK_SIZE; y++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const blockType = this.getBlock(x, y, z);
                    if (blockType === BlockType.AIR) continue;

                    const blockColor = getBlockColor(blockType);
                    
                    // 世界坐标
                    const worldX = this.chunkX * CHUNK_SIZE + x;
                    const worldY = this.chunkY * CHUNK_SIZE + y;
                    const worldZ = this.chunkZ * CHUNK_SIZE + z;

                    // 检查每个面是否可见
                    // 只需要检查与当前块相邻的块是否阻挡
                    const faces = [
                        { dir: [1, 0, 0], face: 'right' },   // +X
                        { dir: [-1, 0, 0], face: 'left' },   // -X
                        { dir: [0, 1, 0], face: 'top' },    // +Y
                        { dir: [0, -1, 0], face: 'bottom' }, // -Y
                        { dir: [0, 0, 1], face: 'front' },  // +Z
                        { dir: [0, 0, -1], face: 'back' }   // -Z
                    ];

                    for (const { dir, face } of faces) {
                        const nx = worldX + dir[0];
                        const ny = worldY + dir[1];
                        const nz = worldZ + dir[2];
                        
                        const neighbor = this.world.getBlock(nx, ny, nz);
                        const neighborProp = this.world.getBlockProperty(neighbor);
                        
                        // 如果相邻块不是完全阻挡的，则渲染当前面
                        if (!neighborProp.solid || (neighborProp.transparent && neighbor !== blockType)) {
                            this.addFace(positions, colors, indices, worldX, worldY, worldZ, face, blockColor, vertexCount);
                            vertexCount += 4;
                        }
                    }
                }
            }
        }

        if (positions.length === 0) {
            this.dirty = false;
            return;
        }

        // 创建几何体
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        // 创建材质
        const material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            side: THREE.FrontSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            this.chunkX * CHUNK_SIZE,
            this.chunkY * CHUNK_SIZE,
            this.chunkZ * CHUNK_SIZE
        );
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.world.scene.add(this.mesh);
        this.dirty = false;
        this.loaded = true;
    }

    // 添加单个面
    addFace(positions, colors, indices, x, y, z, face, color, vertexCount) {
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;

        let vertices;
        switch (face) {
            case 'right': // +X
                vertices = [
                    [1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]
                ];
                break;
            case 'left': // -X
                vertices = [
                    [0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]
                ];
                break;
            case 'top': // +Y
                vertices = [
                    [0, 1, 1], [0, 1, 0], [1, 1, 0], [1, 1, 1]
                ];
                break;
            case 'bottom': // -Y
                vertices = [
                    [0, 0, 0], [0, 0, 1], [1, 0, 1], [1, 0, 0]
                ];
                break;
            case 'front': // +Z
                vertices = [
                    [1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]
                ];
                break;
            case 'back': // -Z
                vertices = [
                    [0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]
                ];
                break;
        }

        for (const v of vertices) {
            positions.push(x + v[0], y + v[1], z + v[2]);
            colors.push(r, g, b);
        }

        indices.push(
            vertexCount, vertexCount + 1, vertexCount + 2,
            vertexCount, vertexCount + 2, vertexCount + 3
        );
    }

    // 卸载
    unload() {
        if (this.mesh) {
            this.world.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => m.dispose());
            } else {
                this.mesh.material.dispose();
            }
            this.mesh = null;
        }
        this.loaded = false;
    }

    // 序列化为JSON (用于存档)
    toJSON() {
        return {
            chunkX: this.chunkX,
            chunkY: this.chunkY,
            chunkZ: this.chunkZ,
            blocks: Array.from(this.blocks)
        };
    }

    // 从JSON加载
    static fromJSON(json, world) {
        const chunk = new Chunk(json.chunkX, json.chunkY, json.chunkZ, world);
        chunk.blocks = new Uint8Array(json.blocks);
        chunk.dirty = true;
        return chunk;
    }
}
