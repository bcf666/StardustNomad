// 体素类型定义
export const BlockType = {
    AIR: 0,
    STONE: 1,
    DIRT: 2,
    GRASS: 3,
    IRON_ORE: 4,
    COPPER_ORE: 5,
    SILICON_ORE: 6,
    ICE: 7,
    LAVA: 8,
    WATER: 9,
    SAND: 10,
    WOOD: 11,
    LEAVES: 12,
    GLASS: 13,
    METAL_PLATE: 14,
    SCI_FI_PANEL: 15,
    SANDSTONE: 16,
    SNOW: 17,
    BEDROCK: 18,
    COAL_ORE: 19
};

// 方块名称映射
export const BlockNames = {
    [BlockType.AIR]: '空气',
    [BlockType.STONE]: '石头',
    [BlockType.DIRT]: '泥土',
    [BlockType.GRASS]: '草方块',
    [BlockType.IRON_ORE]: '铁矿石',
    [BlockType.COPPER_ORE]: '铜矿石',
    [BlockType.SILICON_ORE]: '硅矿石',
    [BlockType.ICE]: '冰',
    [BlockType.LAVA]: '岩浆',
    [BlockType.WATER]: '水',
    [BlockType.SAND]: '沙子',
    [BlockType.WOOD]: '木头',
    [BlockType.LEAVES]: '树叶',
    [BlockType.GLASS]: '玻璃',
    [BlockType.METAL_PLATE]: '金属板',
    [BlockType.SCI_FI_PANEL]: '科幻面板',
    [BlockType.SANDSTONE]: '沙岩',
    [BlockType.SNOW]: '雪',
    [BlockType.BEDROCK]: '基岩',
    [BlockType.COAL_ORE]: '煤矿石'
};

// 方块属性
export const BlockProperties = {
    [BlockType.AIR]: { solid: false, transparent: true, gravity: 0 },
    [BlockType.STONE]: { solid: true, transparent: false, gravity: 1, hardness: 3 },
    [BlockType.DIRT]: { solid: true, transparent: false, gravity: 1, hardness: 1 },
    [BlockType.GRASS]: { solid: true, transparent: false, gravity: 1, hardness: 1 },
    [BlockType.IRON_ORE]: { solid: true, transparent: false, gravity: 1, hardness: 3, ore: 'iron' },
    [BlockType.COPPER_ORE]: { solid: true, transparent: false, gravity: 1, hardness: 3, ore: 'copper' },
    [BlockType.SILICON_ORE]: { solid: true, transparent: false, gravity: 1, hardness: 3, ore: 'silicon' },
    [BlockType.COAL_ORE]: { solid: true, transparent: false, gravity: 1, hardness: 3, ore: 'coal' },
    [BlockType.ICE]: { solid: true, transparent: true, gravity: 1, hardness: 2 },
    [BlockType.LAVA]: { solid: false, transparent: true, gravity: 0, damage: 5 },
    [BlockType.WATER]: { solid: false, transparent: true, gravity: 0 },
    [BlockType.SAND]: { solid: true, transparent: false, gravity: 1, hardness: 1 },
    [BlockType.WOOD]: { solid: true, transparent: false, gravity: 1, hardness: 2 },
    [BlockType.LEAVES]: { solid: true, transparent: true, gravity: 1, hardness: 1 },
    [BlockType.GLASS]: { solid: true, transparent: true, gravity: 1, hardness: 1 },
    [BlockType.METAL_PLATE]: { solid: true, transparent: false, gravity: 1, hardness: 4 },
    [BlockType.SCI_FI_PANEL]: { solid: true, transparent: false, gravity: 1, hardness: 3 },
    [BlockType.SANDSTONE]: { solid: true, transparent: false, gravity: 1, hardness: 2 },
    [BlockType.SNOW]: { solid: true, transparent: false, gravity: 1, hardness: 1 },
    [BlockType.BEDROCK]: { solid: true, transparent: false, gravity: 1, hardness: -1 }
};

// 方块颜色 (用于程序化贴图)
export const BlockColors = {
    [BlockType.STONE]: { r: 128, g: 128, b: 128 },
    [BlockType.DIRT]: { r: 139, g: 90, b: 43 },
    [BlockType.GRASS]: { r: 76, g: 140, b: 50 },
    [BlockType.IRON_ORE]: { r: 180, g: 140, b: 120 },
    [BlockType.COPPER_ORE]: { r: 180, g: 120, b: 80 },
    [BlockType.SILICON_ORE]: { r: 140, g: 180, b: 200 },
    [BlockType.COAL_ORE]: { r: 60, g: 60, b: 60 },
    [BlockType.ICE]: { r: 200, g: 230, b: 255 },
    [BlockType.LAVA]: { r: 255, g: 80, b: 0 },
    [BlockType.WATER]: { r: 30, g: 100, b: 200 },
    [BlockType.SAND]: { r: 230, g: 210, b: 160 },
    [BlockType.WOOD]: { r: 140, g: 100, b: 60 },
    [BlockType.LEAVES]: { r: 60, g: 140, b: 40 },
    [BlockType.GLASS]: { r: 200, g: 220, b: 255, a: 0.3 },
    [BlockType.METAL_PLATE]: { r: 160, g: 165, b: 180 },
    [BlockType.SCI_FI_PANEL]: { r: 80, g: 120, b: 180 },
    [BlockType.SANDSTONE]: { r: 210, g: 180, b: 140 },
    [BlockType.SNOW]: { r: 240, g: 250, b: 255 },
    [BlockType.BEDROCK]: { r: 40, g: 40, b: 40 }
};

// 获取方块属性
export function getBlockProperty(blockType) {
    return BlockProperties[blockType] || BlockProperties[BlockType.STONE];
}

// 判断方块是否固体
export function isSolid(blockType) {
    return getBlockProperty(blockType).solid;
}

// 判断方块是否透明
export function isTransparent(blockType) {
    return getBlockProperty(blockType).transparent;
}

// 获取方块颜色
export function getBlockColor(blockType) {
    return BlockColors[blockType] || BlockColors[BlockType.STONE];
}
