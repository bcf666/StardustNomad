import { Renderer } from '../engine/renderer.js';
import { Chunk, CHUNK_SIZE } from '../engine/chunk.js';
import { TerrainGenerator } from './terrain.js';
import { BlockType, getBlockProperty } from '../engine/voxel.js';
import { Player, PlayerState } from '../player/player.js';
import { Inventory, Item, ItemType } from '../inventory/inventory.js';

// 世界管理器
export class World {
    constructor(seed = Date.now()) {
        this.seed = seed;
        this.scene = null; // 由Renderer提供
        
        // Chunk管理
        this.chunks = new Map(); // key: "x,y,z" -> Chunk
        this.chunkRadius = 4; // 加载半径
        
        // 地形生成器
        this.terrainGenerator = new TerrainGenerator(seed);
        
        // 玩家
        this.player = null;
        
        // 物品栏
        this.inventory = new Inventory(36);
        
        // 挖掘状态
        this.miningProgress = 0;
        this.miningTarget = null;
        
        // 放置状态
        this.placeTarget = null;
    }

    // 初始化 (需要renderer)
    async init(renderer) {
        this.scene = renderer.getScene();
        
        // 创建玩家
        this.player = new Player(this);
        
        // 加载初始区域
        this.loadChunksAround(this.player.position, this.chunkRadius);
        
        // 构建所有chunk的网格
        this.buildAllChunks();
    }

    // 获取场景
    getScene() {
        return this.scene;
    }

    // 获取Chunk key
    getChunkKey(chunkX, chunkY, chunkZ) {
        return `${chunkX},${chunkY},${chunkZ}`;
    }

    // 获取Chunk
    getChunk(chunkX, chunkY, chunkZ) {
        return this.chunks.get(this.getChunkKey(chunkX, chunkY, chunkZ));
    }

    // 创建Chunk
    createChunk(chunkX, chunkY, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkY, chunkZ);
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }
        
        const chunk = new Chunk(chunkX, chunkY, chunkZ, this);
        
        // 生成地形数据
        const blocks = this.terrainGenerator.generateChunkData(chunkX, chunkY, chunkZ, CHUNK_SIZE);
        chunk.blocks = blocks;
        chunk.dirty = true;
        
        this.chunks.set(key, chunk);
        return chunk;
    }

    // 加载指定区域周围的Chunks
    loadChunksAround(position, radius) {
        const playerChunkX = Math.floor(position.x / CHUNK_SIZE);
        const playerChunkY = Math.floor(position.y / CHUNK_SIZE);
        const playerChunkZ = Math.floor(position.z / CHUNK_SIZE);
        
        for (let x = -radius; x <= radius; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -radius; z <= radius; z++) {
                    const chunkX = playerChunkX + x;
                    const chunkY = playerChunkY + y;
                    const chunkZ = playerChunkZ + z;
                    
                    if (!this.getChunk(chunkX, chunkY, chunkZ)) {
                        this.createChunk(chunkX, chunkY, chunkZ);
                    }
                }
            }
        }
        
        // 卸载远处的chunks
        this.unloadFarChunks(playerChunkX, playerChunkY, playerChunkZ, radius + 2);
    }

    // 卸载远处的Chunks
    unloadFarChunks(playerChunkX, playerChunkY, playerChunkZ, radius) {
        for (const [key, chunk] of this.chunks) {
            const dx = Math.abs(chunk.chunkX - playerChunkX);
            const dy = Math.abs(chunk.chunkY - playerChunkY);
            const dz = Math.abs(chunk.chunkZ - playerChunkZ);
            
            if (dx > radius || dy > 1 || dz > radius) {
                chunk.unload();
                this.chunks.delete(key);
            }
        }
    }

    // 构建所有chunks的网格
    buildAllChunks() {
        for (const chunk of this.chunks.values()) {
            chunk.buildMesh();
        }
    }

    // 获取世界方块
    getBlock(worldX, worldY, worldZ) {
        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkY = Math.floor(worldY / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
        
        const chunk = this.getChunk(chunkX, chunkY, chunkZ);
        if (!chunk) return BlockType.AIR;
        
        const localX = worldX - chunkX * CHUNK_SIZE;
        const localY = worldY - chunkY * CHUNK_SIZE;
        const localZ = worldZ - chunkZ * CHUNK_SIZE;
        
        return chunk.getBlock(localX, localY, localZ);
    }

    // 设置世界方块
    setBlock(worldX, worldY, worldZ, blockType) {
        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkY = Math.floor(worldY / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
        
        const chunk = this.getChunk(chunkX, chunkY, chunkZ);
        if (!chunk) return false;
        
        const localX = worldX - chunkX * CHUNK_SIZE;
        const localY = worldY - chunkY * CHUNK_SIZE;
        const localZ = worldZ - chunkZ * CHUNK_SIZE;
        
        chunk.setBlock(localX, localY, localZ, blockType);
        
        // 标记相邻chunks也需要重建
        this.markNeighborsDirty(chunkX, chunkY, chunkZ, localX, localY, localZ);
        
        return true;
    }

    // 标记相邻chunks为dirty
    markNeighborsDirty(chunkX, chunkY, chunkZ, localX, localY, localZ) {
        if (localX === 0) {
            const neighbor = this.getChunk(chunkX - 1, chunkY, chunkZ);
            if (neighbor) neighbor.dirty = true;
        }
        if (localX === CHUNK_SIZE - 1) {
            const neighbor = this.getChunk(chunkX + 1, chunkY, chunkZ);
            if (neighbor) neighbor.dirty = true;
        }
        if (localY === 0) {
            const neighbor = this.getChunk(chunkX, chunkY - 1, chunkZ);
            if (neighbor) neighbor.dirty = true;
        }
        if (localY === CHUNK_SIZE - 1) {
            const neighbor = this.getChunk(chunkX, chunkY + 1, chunkZ);
            if (neighbor) neighbor.dirty = true;
        }
        if (localZ === 0) {
            const neighbor = this.getChunk(chunkX, chunkY, chunkZ - 1);
            if (neighbor) neighbor.dirty = true;
        }
        if (localZ === CHUNK_SIZE - 1) {
            const neighbor = this.getChunk(chunkX, chunkY, chunkZ + 1);
            if (neighbor) neighbor.dirty = true;
        }
    }

    // 获取方块属性
    getBlockProperty(blockType) {
        return getBlockProperty(blockType);
    }

    // 挖掘方块
    mineBlock(worldX, worldY, worldZ, progress) {
        const block = this.getBlock(worldX, worldY, worldZ);
        if (!getBlockProperty(block).solid) return null;
        
        this.miningTarget = { x: worldX, y: worldY, z: worldZ };
        this.miningProgress = progress;
        
        if (progress >= 1.0) {
            // 完成挖掘
            this.setBlock(worldX, worldY, worldZ, BlockType.AIR);
            
            // 给予物品
            const item = this.blockToItem(block);
            if (item) {
                this.inventory.addItem(item);
            }
            
            this.miningTarget = null;
            this.miningProgress = 0;
            
            return block;
        }
        
        return null;
    }

    // 方块转物品
    blockToItem(blockType) {
        const mapping = {
            [BlockType.DIRT]: new Item(ItemType.DIRT, 1),
            [BlockType.STONE]: new Item(ItemType.STONE, 1),
            [BlockType.WOOD]: new Item(ItemType.WOOD, 1),
            [BlockType.GLASS]: new Item(ItemType.GLASS, 1),
            [BlockType.IRON_ORE]: new Item(ItemType.IRON_ORE, 1),
            [BlockType.COPPER_ORE]: new Item(ItemType.COPPER_ORE, 1),
            [BlockType.SILICON_ORE]: new Item(ItemType.SILICON_ORE, 1),
            [BlockType.COAL_ORE]: new Item(ItemType.COAL, 1)
        };
        return mapping[blockType] || null;
    }

    // 放置方块
    placeBlock(worldX, worldY, worldZ, blockType) {
        const currentBlock = this.getBlock(worldX, worldY, worldZ);
        if (getBlockProperty(currentBlock).solid) return false;
        
        // 检查玩家位置
        const player = this.player;
        const halfWidth = player.width / 2;
        const playerMin = {
            x: player.position.x - halfWidth,
            y: player.position.y,
            z: player.position.z - halfWidth
        };
        const playerMax = {
            x: player.position.x + halfWidth,
            y: player.position.y + player.height,
            z: player.position.z + halfWidth
        };
        
        // 检查是否会与玩家碰撞
        if (worldX + 1 > playerMin.x && worldX < playerMax.x &&
            worldY + 1 > playerMin.y && worldY < playerMax.y &&
            worldZ + 1 > playerMin.z && worldZ < playerMax.z) {
            return false;
        }
        
        this.setBlock(worldX, worldY, worldZ, blockType);
        return true;
    }

    // 更新
    update(deltaTime) {
        // 更新玩家
        if (this.player) {
            this.player.update(deltaTime, this.game?.inputManager);
            
            // 动态加载chunks
            this.loadChunksAround(this.player.position, this.chunkRadius);
            
            // 重建dirty chunks
            for (const chunk of this.chunks.values()) {
                if (chunk.dirty) {
                    chunk.buildMesh();
                }
            }
        }
    }

    // 序列化 (存档用)
    toJSON() {
        const modifiedChunks = [];
        for (const chunk of this.chunks.values()) {
            // 只保存有修改的chunks (简化处理)
            modifiedChunks.push(chunk.toJSON());
        }
        
        return {
            seed: this.seed,
            modifiedChunks: modifiedChunks,
            playerPosition: this.player ? {
                x: this.player.position.x,
                y: this.player.position.y,
                z: this.player.position.z
            } : null,
            inventory: this.inventory.toJSON()
        };
    }

    // 反序列化 (加载用)
    static fromJSON(json, renderer) {
        const world = new World(json.seed);
        world.scene = renderer.getScene();
        world.terrainGenerator = new TerrainGenerator(json.seed);
        
        // 加载modified chunks
        for (const chunkData of json.modifiedChunks) {
            const chunk = Chunk.fromJSON(chunkData, world);
            world.chunks.set(world.getChunkKey(chunk.chunkX, chunk.chunkY, chunk.chunkZ), chunk);
        }
        
        // 重建网格
        world.buildAllChunks();
        
        // 加载玩家
        if (json.playerPosition) {
            world.player = new Player(world);
            world.player.position.set(
                json.playerPosition.x,
                json.playerPosition.y,
                json.playerPosition.z
            );
        }
        
        // 加载物品
        if (json.inventory) {
            world.inventory = Inventory.fromJSON(json.inventory);
        }
        
        return world;
    }
}
