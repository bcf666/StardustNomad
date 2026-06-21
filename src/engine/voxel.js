// 体素类型定义
export const BlockType = {
    AIR: 0,
    STONE: 1,
    DIRT: 2,
    GRASS: 3,
    IRON_ORE: 4,
    COPPER_ORE: 5,
    SILICON: 6,
    ICE: 7,
    LAVA: 8,
    WATER: 9,
    SAND: 10,
    WOOD: 11,
    LEAVES: 12,
    GLASS: 13,
    METAL: 14,
    SCI_FI_PANEL: 15,
    COAL_ORE: 16,
    GOLD_ORE: 17
};

// 方块属性
export const BlockData = {
    [BlockType.AIR]: { name: '空气', solid: false, transparent: true },
    [BlockType.STONE]: { name: '石头', solid: true, transparent: false, color: 0x888888 },
    [BlockType.DIRT]: { name: '泥土', solid: true, transparent: false, color: 0x8B4513 },
    [BlockType.GRASS]: { name: '草方块', solid: true, transparent: false, color: 0x567d46 },
    [BlockType.IRON_ORE]: { name: '铁矿', solid: true, transparent: false, color: 0xD2691E },
    [BlockType.COPPER_ORE]: { name: '铜矿', solid: true, transparent: false, color: 0xB87333 },
    [BlockType.SILICON]: { name: '硅矿', solid: true, transparent: false, color: 0x87CEEB },
    [BlockType.ICE]: { name: '冰', solid: true, transparent: true, color: 0xADD8E6 },
    [BlockType.LAVA]: { name: '岩浆', solid: true, transparent: false, color: 0xFF4500, emissive: true },
    [BlockType.WATER]: { name: '水', solid: false, transparent: true, color: 0x4169E1 },
    [BlockType.SAND]: { name: '沙子', solid: true, transparent: false, color: 0xF4A460 },
    [BlockType.WOOD]: { name: '木头', solid: true, transparent: false, color: 0xDEB887 },
    [BlockType.LEAVES]: { name: '树叶', solid: true, transparent: true, color: 0x228B22 },
    [BlockType.GLASS]: { name: '玻璃', solid: true, transparent: true, color: 0xE0FFFF },
    [BlockType.METAL]: { name: '金属板', solid: true, transparent: false, color: 0xC0C0C0 },
    [BlockType.SCI_FI_PANEL]: { name: '科幻面板', solid: true, transparent: false, color: 0x4a5568 },
    [BlockType.COAL_ORE]: { name: '煤矿', solid: true, transparent: false, color: 0x2F1810 },
    [BlockType.GOLD_ORE]: { name: '金矿', solid: true, transparent: false, color: 0xFFD700 }
};

// 资源类型（可采集的方块对应的资源）
export const BlockResources = {
    [BlockType.IRON_ORE]: { item: 'iron_ore', amount: 1 },
    [BlockType.COPPER_ORE]: { item: 'copper_ore', amount: 1 },
    [BlockType.SILICON]: { item: 'silicon', amount: 1 },
    [BlockType.COAL_ORE]: { item: 'coal', amount: 1 },
    [BlockType.GOLD_ORE]: { item: 'gold_ore', amount: 1 },
    [BlockType.STONE]: { item: 'stone', amount: 1 },
    [BlockType.DIRT]: { item: 'dirt', amount: 1 },
    [BlockType.SAND]: { item: 'sand', amount: 1 },
    [BlockType.WOOD]: { item: 'wood', amount: 1 },
    [BlockType.GLASS]: { item: 'glass', amount: 1 }
};

// 方块是否透明（用于面剔除）
export function isBlockTransparent(type) {
    return BlockData[type]?.transparent || false;
}

// 方块是否 solid（用于碰撞）
export function isBlockSolid(type) {
    return BlockData[type]?.solid || false;
}

// 根据方块类型获取颜色
export function getBlockColor(type) {
    return BlockData[type]?.color || 0xffffff;
}

// 方块是否发光
export function isBlockEmissive(type) {
    return BlockData[type]?.emissive || false;
}
