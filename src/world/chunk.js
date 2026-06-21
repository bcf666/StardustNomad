import * as THREE from 'three';
import { BlockType, getBlockColor, isBlockTransparent, isBlockSolid, isBlockEmissive } from './voxel.js';

const CHUNK_SIZE = 32; // 32x32x32 chunk

// 面朝向
const FACES = {
    TOP: { dir: [0, 1, 0], corners: [[0,1,1], [1,1,1], [1,1,0], [0,1,0]] },
    BOTTOM: { dir: [0, -1, 0], corners: [[0,0,0], [1,0,0], [1,0,1], [0,0,1]] },
    FRONT: { dir: [0, 0, 1], corners: [[0,0,1], [1,0,1], [1,1,1], [0,1,1]] },
    BACK: { dir: [0, 0, -1], corners: [[1,0,0], [0,0,0], [0,1,0], [1,1,0]] },
    RIGHT: { dir: [1, 0, 0], corners: [[1,0,1], [1,0,0], [1,1,0], [1,1,1]] },
    LEFT: { dir: [-1, 0, 0], corners: [[0,0,0], [0,0,1], [0,1,1], [0,1,0]] }
};

export class Chunk {
    constructor(chunkX, chunkY, chunkZ, world) {
        this.chunkX = chunkX;
        this.chunkY = chunkY;
        this.chunkZ = chunkZ;
        this.world = world;

        // 方块数据 - 使用 TypedArray 存储
        this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);

        // 网格对象
        this.mesh = null;
        this.dirty = true;

        // 世界坐标偏移
        this.worldOffset = new THREE.Vector3(
            chunkX * CHUNK_SIZE,
            chunkY * CHUNK_SIZE,
            chunkZ * CHUNK_SIZE
        );
    }

    // 获取方块索引
    getIndex(x, y, z) {
        return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
    }

    // 设置方块
    setBlock(x, y, z, type) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
            return;
        }
        const index = this.getIndex(x, y, z);
        this.blocks[index] = type;
        this.dirty = true;
    }

    // 获取方块
    getBlock(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
            return BlockType.AIR;
        }
        return this.blocks[this.getIndex(x, y, z)];
    }

    // 获取世界坐标对应的方块
    getBlockWorld(x, y, z) {
        return this.getBlock(
            x - this.worldOffset.x,
            y - this.worldOffset.y,
            z - this.worldOffset.z
        );
    }

    // 设置世界坐标对应的方块
    setBlockWorld(x, y, z, type) {
        this.setBlock(
            x - this.worldOffset.x,
            y - this.worldOffset.y,
            z - this.worldOffset.z,
            type
        );
    }

    // 生成网格
    generateMesh() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const indices = [];

        let vertexCount = 0;

        // 遍历所有方块
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_SIZE; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const blockType = this.getBlock(x, y, z);
                    if (blockType === BlockType.AIR) continue;

                    const worldX = x + this.worldOffset.x;
                    const worldY = y + this.worldOffset.y;
                    const worldZ = z + this.worldOffset.z;

                    const color = new THREE.Color(getBlockColor(blockType));
                    const emissive = isBlockEmissive(blockType);

                    // 检查每个面
                    for (const [faceName, face] of Object.entries(FACES)) {
                        const nx = x + face.dir[0];
                        const ny = y + face.dir[1];
                        const nz = z + face.dir[2];

                        // 获取相邻方块
                        let neighbor;
                        if (nx < 0 || nx >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE) {
                            neighbor = this.world.getBlockWorld(
                                worldX + face.dir[0],
                                worldY + face.dir[1],
                                worldZ + face.dir[2]
                            );
                        } else {
                            neighbor = this.getBlock(nx, ny, nz);
                        }

                        // 如果相邻方块不透明，渲染这个面
                        const neighborTransparent = isBlockTransparent(neighbor);
                        const neighborSolid = isBlockSolid(neighbor);

                        if (!neighborSolid || neighborTransparent) {
                            // 添加面
                            for (const corner of face.corners) {
                                positions.push(
                                    worldX + corner[0],
                                    worldY + corner[1],
                                    worldZ + corner[2]
                                );

                                if (emissive) {
                                    colors.push(color.r * 0.5, color.g * 0.5, color.b * 0.5);
                                } else {
                                    colors.push(color.r, color.g, color.b);
                                }
                            }

                            indices.push(
                                vertexCount, vertexCount + 1, vertexCount + 2,
                                vertexCount, vertexCount + 2, vertexCount + 3
                            );
                            vertexCount += 4;
                        }
                    }
                }
            }
        }

        if (vertexCount === 0) {
            this.mesh = null;
            return;
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            side: THREE.FrontSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.dirty = false;
    }

    // 序列化 (用于存档)
    serialize() {
        return {
            chunkX: this.chunkX,
            chunkY: this.chunkY,
            chunkZ: this.chunkZ,
            blocks: Array.from(this.blocks)
        };
    }

    // 反序列化 (用于加载)
    static deserialize(data, world) {
        const chunk = new Chunk(data.chunkX, data.chunkY, data.chunkZ, world);
        chunk.blocks = new Uint8Array(data.blocks);
        chunk.dirty = true;
        return chunk;
    }
}

export { CHUNK_SIZE };
