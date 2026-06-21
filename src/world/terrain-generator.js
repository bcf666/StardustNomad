import { BlockType } from '../engine/voxel.js';
import { SimplexNoise } from './noise.js';

// 生物群系类型
export const BiomeType = {
    PLAINS: 'plains',
    DESERT: 'desert',
    SNOW: 'snow',
    FOREST: 'forest',
    MOUNTAINS: 'mountains',
    OCEAN: 'ocean'
};

// 星球地表生成器
export class TerrainGenerator {
    constructor(seed = Math.random()) {
        this.seed = seed;
        this.noise = new SimplexNoise(seed);
        this.noise2 = new SimplexNoise(seed + 1);
        this.noise3 = new SimplexNoise(seed + 2);
        this.noise4 = new SimplexNoise(seed + 3); // 生物群系噪声
        this.noise5 = new SimplexNoise(seed + 4); // 洞穴噪声
    }

    // 获取生物群系
    getBiome(x, z) {
        const scale = 0.005;
        const value = this.noise4.noise2D(x * scale, z * scale);
        
        if (value < -0.4) return BiomeType.OCEAN;
        if (value < -0.2) return BiomeType.DESERT;
        if (value < 0.1) return BiomeType.PLAINS;
        if (value < 0.3) return BiomeType.FOREST;
        if (value < 0.5) return BiomeType.SNOW;
        return BiomeType.MOUNTAINS;
    }

    // 生成地表高度 (使用噪声)
    getHeight(x, z) {
        const biome = this.getBiome(x, z);
        const scale1 = 0.01;
        const scale2 = 0.03;
        const scale3 = 0.005;

        // 多层噪声叠加
        let height = 0;
        height += this.noise.fbm(x * scale1, z * scale1, 4, 2, 0.5) * 30;
        height += this.noise2.noise2D(x * scale2, z * scale2) * 10;
        height += this.noise3.noise2D(x * scale3, z * scale3) * 50;

        // 根据生物群系调整高度
        switch (biome) {
            case BiomeType.OCEAN:
                height = Math.min(height, 30);
                break;
            case BiomeType.DESERT:
                height = Math.max(height, 45);
                break;
            case BiomeType.SNOW:
                height += 10;
                break;
            case BiomeType.MOUNTAINS:
                height += 30;
                break;
        }

        return Math.floor(height + 50); // 基础高度50
    }

    // 检查是否为洞穴
    isCave(x, y, z) {
        const scale = 0.08;
        const threshold = 0.6;
        
        // 3D噪声生成洞穴
        const value = this.noise5.noise3D(x * scale, y * scale, z * scale);
        
        // 洞穴只在地下生成
        if (y > 40) return false;
        
        // 洞穴形状
        return value > threshold;
    }

    // 生成矿石分布
    getOre(x, y, z, biome) {
        const scale = 0.1;
        const threshold = 0.7;

        // 最深处 - 基岩层
        if (y < 2) return BlockType.BEDROCK;

        // 深层矿石
        if (y < 15) {
            // 铀矿（最深处，稀有）
            if (this.noise5.noise3D(x * scale * 0.5, y * scale * 0.5, z * scale * 0.5) > 0.85) {
                return BlockType.URANIUM_ORE;
            }
            // 黑曜石
            if (this.noise3.noise3D(x * scale, y * scale, z * scale) > 0.9) {
                return BlockType.OBSIDIAN;
            }
        }

        if (y < 25) {
            // 钛矿（深层）
            if (this.noise3.noise3D(x * scale, y * scale, z * scale) > 0.82) {
                return BlockType.TITANIUM_ORE;
            }
            // 水晶
            if (this.noise2.noise3D(x * scale * 2, y * scale * 2, z * scale * 2) > 0.88) {
                return BlockType.CRYSTAL;
            }
        }

        if (y < 30) {
            // 金矿
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

    // 获取地表方块类型（根据生物群系）
    getSurfaceBlock(biome, y, surfaceHeight) {
        if (y === surfaceHeight - 1) {
            switch (biome) {
                case BiomeType.DESERT:
                    return BlockType.SAND;
                case BiomeType.SNOW:
                    return BlockType.SNOW;
                case BiomeType.OCEAN:
                    return y < 35 ? BlockType.SAND : BlockType.GRASS;
                case BiomeType.FOREST:
                    return BlockType.GRASS;
                case BiomeType.MOUNTAINS:
                    return y > 80 ? BlockType.SNOW : BlockType.STONE;
                default:
                    return BlockType.GRASS;
            }
        }
        
        if (y === surfaceHeight - 2) {
            switch (biome) {
                case BiomeType.DESERT:
                    return BlockType.SAND;
                case BiomeType.SNOW:
                    return BlockType.PERMAFROST;
                case BiomeType.OCEAN:
                    return BlockType.SAND;
                default:
                    return BlockType.DIRT;
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
                const biome = this.getBiome(worldX, worldZ);

                for (let y = 0; y < CHUNK_SIZE; y++) {
                    const worldY = chunkY * CHUNK_SIZE + y;

                    let blockType = BlockType.AIR;

                    if (worldY < surfaceHeight) {
                        // 检查洞穴
                        if (this.isCave(worldX, worldY, worldZ)) {
                            blockType = BlockType.AIR;
                        } else {
                            // 地表方块
                            const surfaceBlock = this.getSurfaceBlock(biome, worldY, surfaceHeight);
                            if (surfaceBlock) {
                                blockType = surfaceBlock;
                            } else {
                                // 检查矿石
                                const ore = this.getOre(worldX, worldY, worldZ, biome);
                                blockType = ore || BlockType.STONE;
                            }
                        }

                        // 基岩层
                        if (worldY < 3) {
                            blockType = BlockType.BEDROCK;
                        }
                    } else if (worldY < 35 && biome === BiomeType.OCEAN) {
                        // 海洋
                        blockType = BlockType.WATER;
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
