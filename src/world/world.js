import { Chunk, CHUNK_SIZE } from './chunk.js';
import { BlockType, isBlockSolid } from '../engine/voxel.js';
import { TerrainGenerator } from './terrain-generator.js';
import * as THREE from 'three';

// 世界管理器
export class World {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.chunks = new Map();
        this.terrainGenerator = new TerrainGenerator(seed);
        this.chunkRadius = 5; // 加载范围

        // 调试
        this.debugChunks = false;
    }

    // 获取 Chunk 键
    getChunkKey(cx, cy, cz) {
        return `${cx},${cy},${cz}`;
    }

    // 获取或创建 Chunk
    getChunk(cx, cy, cz) {
        const key = this.getChunkKey(cx, cy, cz);

        if (!this.chunks.has(key)) {
            const chunk = new Chunk(cx, cy, cz, this);
            this.terrainGenerator.generateChunk(cx, cy, cz, chunk);
            this.chunks.set(key, chunk);
        }

        return this.chunks.get(key);
    }

    // 根据世界坐标获取 Chunk
    getChunkAtWorld(worldX, worldY, worldZ) {
        const cx = Math.floor(worldX / CHUNK_SIZE);
        const cy = Math.floor(worldY / CHUNK_SIZE);
        const cz = Math.floor(worldZ / CHUNK_SIZE);
        return this.getChunk(cx, cy, cz);
    }

    // 获取世界坐标的方块
    getBlockWorld(worldX, worldY, worldZ) {
        const cx = Math.floor(worldX / CHUNK_SIZE);
        const cy = Math.floor(worldY / CHUNK_SIZE);
        const cz = Math.floor(worldZ / CHUNK_SIZE);

        const chunk = this.getChunk(cx, cy, cz);
        return chunk.getBlockWorld(worldX, worldY, worldZ);
    }

    // 获取指定位置的地表高度
    getHeightAt(worldX, worldZ) {
        return this.terrainGenerator.getHeight(worldX, worldZ);
    }

    // 设置世界坐标的方块
    setBlockWorld(worldX, worldY, worldZ, type) {
        const cx = Math.floor(worldX / CHUNK_SIZE);
        const cy = Math.floor(worldY / CHUNK_SIZE);
        const cz = Math.floor(worldZ / CHUNK_SIZE);

        const chunk = this.getChunk(cx, cy, cz);
        chunk.setBlockWorld(worldX, worldY, worldZ, type);

        // 标记相邻 Chunk 需要重新生成
        this.markDirtyAround(worldX, worldY, worldZ);
    }

    // 标记周围 Chunk 为脏
    markDirtyAround(worldX, worldY, worldZ) {
        const cx = Math.floor(worldX / CHUNK_SIZE);
        const cy = Math.floor(worldY / CHUNK_SIZE);
        const cz = Math.floor(worldZ / CHUNK_SIZE);

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const key = this.getChunkKey(cx + dx, cy + dy, cz + dz);
                    const chunk = this.chunks.get(key);
                    if (chunk) chunk.dirty = true;
                }
            }
        }
    }

    // 检查方块是否固体
    isBlockSolid(type) {
        return isBlockSolid(type);
    }

    // 加载以玩家为中心的 Chunks
    loadChunksAround(worldX, worldY, worldZ) {
        const playerChunkX = Math.floor(worldX / CHUNK_SIZE);
        const playerChunkY = Math.floor(worldY / CHUNK_SIZE);
        const playerChunkZ = Math.floor(worldZ / CHUNK_SIZE);

        for (let x = -this.chunkRadius; x <= this.chunkRadius; x++) {
            for (let y = -2; y <= 2; y++) {
                for (let z = -this.chunkRadius; z <= this.chunkRadius; z++) {
                    this.getChunk(
                        playerChunkX + x,
                        playerChunkY + y,
                        playerChunkZ + z
                    );
                }
            }
        }
    }

    // 更新 Chunk 网格
    updateChunks(scene) {
        for (const [key, chunk] of this.chunks) {
            if (chunk.dirty && chunk.mesh) {
                scene.remove(chunk.mesh);
                chunk.mesh.geometry.dispose();
                chunk.generateMesh();
                if (chunk.mesh) {
                    scene.add(chunk.mesh);
                }
            } else if (chunk.dirty && !chunk.mesh) {
                chunk.generateMesh();
                if (chunk.mesh) {
                    scene.add(chunk.mesh);
                }
            }
        }
    }

    // 卸载远处的 Chunks
    unloadFarChunks(worldX, worldY, worldZ) {
        const playerChunkX = Math.floor(worldX / CHUNK_SIZE);
        const playerChunkY = Math.floor(worldY / CHUNK_SIZE);
        const playerChunkZ = Math.floor(worldZ / CHUNK_SIZE);

        const unloadRadius = this.chunkRadius + 2;

        for (const [key, chunk] of this.chunks) {
            const dx = Math.abs(chunk.chunkX - playerChunkX);
            const dy = Math.abs(chunk.chunkY - playerChunkY);
            const dz = Math.abs(chunk.chunkZ - playerChunkZ);

            if (dx > unloadRadius || dy > unloadRadius || dz > unloadRadius) {
                if (chunk.mesh) {
                    chunk.mesh.geometry.dispose();
                    chunk.mesh.material.dispose();
                }
                this.chunks.delete(key);
            }
        }
    }

    // 射线投射 (用于选择方块)
    raycast(origin, direction, maxDistance = 10) {
        const step = 0.1;
        const pos = origin.clone();

        for (let d = 0; d < maxDistance; d += step) {
            pos.addScaledVector(direction, step);

            const block = this.getBlockWorld(
                Math.floor(pos.x),
                Math.floor(pos.y),
                Math.floor(pos.z)
            );

            if (this.isBlockSolid(block)) {
                // 返回击中的方块位置 (前一格)
                const hitPos = pos.clone().addScaledVector(direction, -step);
                return {
                    hit: true,
                    block: block,
                    position: new THREE.Vector3(
                        Math.floor(hitPos.x),
                        Math.floor(hitPos.y),
                        Math.floor(hitPos.z)
                    ),
                    normal: direction.clone().negate()
                };
            }
        }

        return { hit: false };
    }

    // 获取视线指向的方块
    getTargetBlock(origin, direction, maxDistance = 10) {
        const step = 0.05;
        const pos = origin.clone();

        let prevBlockPos = null;

        for (let d = 0; d < maxDistance; d += step) {
            pos.addScaledVector(direction, step);

            const bx = Math.floor(pos.x);
            const by = Math.floor(pos.y);
            const bz = Math.floor(pos.z);
            const blockPos = `${bx},${by},${bz}`;

            const block = this.getBlockWorld(bx, by, bz);

            if (this.isBlockSolid(block)) {
                return {
                    block: block,
                    position: new THREE.Vector3(bx, by, bz),
                    adjacent: prevBlockPos ? new THREE.Vector3(...prevBlockPos.split(',').map(Number)) : null
                };
            }

            prevBlockPos = blockPos;
        }

        return null;
    }

    // 序列化所有 Chunk (用于存档)
    serialize() {
        const data = {};
        for (const [key, chunk] of this.chunks) {
            data[key] = chunk.serialize();
        }
        return data;
    }
}
