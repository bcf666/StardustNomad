import { BlockType } from '../engine/voxel.js';
import { SimplexNoise } from './noise.js';

// 星球地表生成器
export class TerrainGenerator {
    constructor(seed = Math.random()) {
        this.seed = seed;
        this.noise = new SimplexNoise(seed);
        this.noise2 = new SimplexNoise(seed + 1);
        this.noise3 = new SimplexNoise(seed + 2);
    }

    // 生成地表高度 (使用噪声)
    getHeight(x, z) {
        const scale1 = 0.01;
        const scale2 = 0.03;
        const scale3 = 0.005;

        // 多层噪声叠加
        let height = 0;
        height += this.noise.fbm(x * scale1, z * scale1, 4, 2, 0.5) * 30;
        height += this.noise2.noise2D(x * scale2, z * scale2) * 10;
        height += this.noise3.noise2D(x * scale3, z * scale3) * 50;

        return Math.floor(height + 50); // 基础高度50
    }

    // 生成矿石分布
    getOre(x, y, z) {
        const scale = 0.1;
        const threshold = 0.7;

        // 不同深度不同矿石
        if (y < 30) {
            // 深处 - 金矿
            if (this.noise3.noise3D(x * scale, y * scale, z * scale) > threshold) {
                return BlockType.GOLD_ORE;
            }
        }

        if (y < 50) {
            // 中层 - 铁矿和铜矿
            const val = this.noise.noise3D(x * scale * 2, y * scale * 2, z * scale * 2);
            if (val > 0.8) return BlockType.IRON_ORE;
            if (val > 0.75) return BlockType.COPPER_ORE;
            if (val > 0.7) return BlockType.COAL_ORE;
        }

        if (y < 40) {
            // 浅层 - 硅矿
            if (this.noise2.noise3D(x * scale, y * scale, z * scale) > 0.8) {
                return BlockType.SILICON;
            }
        }

        return null;
    }

    // 生成一个 Chunk 的地形数据
    generateChunk(chunkX, chunkY, chunkZ, chunk) {
        const CHUNK_SIZE = 32;

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const worldX = chunkX * CHUNK_SIZE + x;
                const worldZ = chunkZ * CHUNK_SIZE + z;

                const surfaceHeight = this.getHeight(worldX, worldZ);

                for (let y = 0; y < CHUNK_SIZE; y++) {
                    const worldY = chunkY * CHUNK_SIZE + y;

                    let blockType = BlockType.AIR;

                    if (worldY < surfaceHeight) {
                        // 地表
                        if (worldY === surfaceHeight - 1) {
                            blockType = BlockType.GRASS;
                        } else if (worldY === surfaceHeight - 2) {
                            blockType = BlockType.DIRT;
                        } else {
                            // 检查矿石
                            const ore = this.getOre(worldX, worldY, worldZ);
                            blockType = ore || BlockType.STONE;
                        }

                        // 基岩层
                        if (worldY < 5) {
                            blockType = BlockType.STONE;
                        }
                    }

                    chunk.setBlock(x, y, z, blockType);
                }
            }
        }
    }

    // 生成一整颗星球 (简化版，用于测试)
    static generateTestPlanet(size = 200) {
        const blocks = new Map();

        for (let x = -size; x < size; x++) {
            for (let y = -size; y < size; y++) {
                for (let z = -size; z < size; z++) {
                    const dist = Math.sqrt(x*x + y*y + z*z);
                    if (dist < size) {
                        blocks.set(`${x},${y},${z}`, BlockType.STONE);
                    }
                }
            }
        }

        return blocks;
    }
}
