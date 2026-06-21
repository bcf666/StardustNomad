import { noise } from './noise.js';
import { BlockType } from '../engine/voxel.js';

// 地形生成器
export class TerrainGenerator {
    constructor(seed) {
        this.seed = seed;
        this.noise = noise;
    }

    // 生成地形高度
    getHeight(worldX, worldZ) {
        // 使用多层噪声生成地形
        const scale1 = 0.01;
        const scale2 = 0.03;
        const scale3 = 0.005;

        // 基本地形
        let height = this.noise.fbm(worldX * scale1, worldZ * scale1, 4, 2.0, 0.5);
        
        // 添加细节
        height += this.noise.fbm(worldX * scale2, worldZ * scale2, 2, 2.0, 0.5) * 0.3;
        
        // 大尺度特征 (山脉等)
        height += this.noise.fbm(worldX * scale3, worldZ * scale3, 2, 2.0, 0.5) * 0.5;

        // 归一化到0-1
        height = (height + 1) * 0.5;
        
        // 映射到实际高度范围 (10-60)
        return Math.floor(10 + height * 50);
    }

    // 获取矿物分布
    getOre(worldX, worldY, worldZ) {
        const oreNoise = this.noise.noise3D(worldX * 0.1, worldY * 0.1, worldZ * 0.1);
        
        // 矿物生成的阈值
        if (oreNoise > 0.7) {
            // 煤矿 - 较浅
            if (worldY < 30) {
                return BlockType.COAL_ORE;
            }
        }
        if (oreNoise > 0.75) {
            // 铁矿 - 中等深度
            if (worldY < 40) {
                return BlockType.IRON_ORE;
            }
        }
        if (oreNoise > 0.8) {
            // 铜矿 - 较深
            if (worldY < 35) {
                return BlockType.COPPER_ORE;
            }
        }
        if (oreNoise > 0.85) {
            // 硅矿 - 深
            if (worldY < 25) {
                return BlockType.SILICON_ORE;
            }
        }
        
        return null;
    }

    // 生成单个chunk的地形数据
    generateChunkData(chunkX, chunkY, chunkZ, chunkSize) {
        const blocks = new Uint8Array(chunkSize * chunkSize * chunkSize);
        const CHUNK_VOLUME = chunkSize * chunkSize * chunkSize;

        for (let z = 0; z < chunkSize; z++) {
            for (let y = 0; y < chunkSize; y++) {
                for (let x = 0; x < chunkSize; x++) {
                    const worldX = chunkX * chunkSize + x;
                    const worldY = chunkY * chunkSize + y;
                    const worldZ = chunkZ * chunkSize + z;
                    
                    const index = x + y * chunkSize + z * chunkSize * chunkSize;
                    blocks[index] = this.getBlockAt(worldX, worldY, worldZ);
                }
            }
        }

        return blocks;
    }

    // 获取世界坐标对应的方块
    getBlockAt(worldX, worldY, worldZ) {
        const height = this.getHeight(worldX, worldZ);
        
        // 基岩层 (最底层)
        if (worldY === 0) {
            return BlockType.BEDROCK;
        }
        
        // 地下
        if (worldY < height - 5) {
            // 检查矿物
            const ore = this.getOre(worldX, worldY, worldZ);
            if (ore) return ore;
            return BlockType.STONE;
        }
        
        // 近地表
        if (worldY < height - 1) {
            return BlockType.DIRT;
        }
        
        // 地表
        if (worldY === height - 1 || worldY === height) {
            // 草地
            return BlockType.GRASS;
        }
        
        // 空气
        return BlockType.AIR;
    }

    // 获取地形类型
    getBiome(worldX, worldZ) {
        const temp = this.noise.fbm(worldX * 0.005, worldZ * 0.005, 2, 2.0, 0.5);
        const humidity = this.noise.fbm(worldX * 0.007 + 100, worldZ * 0.007 + 100, 2, 2.0, 0.5);
        
        // 简化的生物群系判断
        if (temp < -0.3) return 'snow';
        if (temp > 0.3) {
            if (humidity < -0.2) return 'desert';
            return 'savanna';
        }
        if (humidity > 0.3) return 'forest';
        return 'plains';
    }
}
