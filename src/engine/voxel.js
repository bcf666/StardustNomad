// ============================================
// Block Type Definitions
// ============================================

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
    SCI_FI_PANEL: 15
};

// Block visual colors (RGB)
export const BlockColors = {
    [BlockType.AIR]: null,
    [BlockType.STONE]: 0x808080,
    [BlockType.DIRT]: 0x8B4513,
    [BlockType.GRASS]: 0x567d46,
    [BlockType.IRON_ORE]: 0xB87333,
    [BlockType.COPPER_ORE]: 0xCD7F32,
    [BlockType.SILICON]: 0x6E6E6E,
    [BlockType.ICE]: 0xADD8E6,
    [BlockType.LAVA]: 0xFF4500,
    [BlockType.WATER]: 0x4169E1,
    [BlockType.SAND]: 0xF4A460,
    [BlockType.WOOD]: 0xDEB887,
    [BlockType.LEAVES]: 0x228B22,
    [BlockType.GLASS]: 0x87CEEB,
    [BlockType.METAL]: 0xC0C0C0,
    [BlockType.SCI_FI_PANEL]: 0x4169E1
};

// Block properties
export const BlockProperties = {
    [BlockType.AIR]: { transparent: true, solid: false },
    [BlockType.STONE]: { transparent: false, solid: true, miningTime: 1.5 },
    [BlockType.DIRT]: { transparent: false, solid: true, miningTime: 0.8 },
    [BlockType.GRASS]: { transparent: false, solid: true, miningTime: 0.8 },
    [BlockType.IRON_ORE]: { transparent: false, solid: true, miningTime: 2.0, resource: 'iron_ore' },
    [BlockType.COPPER_ORE]: { transparent: false, solid: true, miningTime: 2.0, resource: 'copper_ore' },
    [BlockType.SILICON]: { transparent: false, solid: true, miningTime: 2.0, resource: 'silicon' },
    [BlockType.ICE]: { transparent: true, solid: true, miningTime: 1.0 },
    [BlockType.LAVA]: { transparent: true, solid: true, miningTime: 3.0, damage: 10 },
    [BlockType.WATER]: { transparent: true, solid: true, miningTime: 0.5 },
    [BlockType.SAND]: { transparent: false, solid: true, miningTime: 0.6 },
    [BlockType.WOOD]: { transparent: false, solid: true, miningTime: 1.0 },
    [BlockType.LEAVES]: { transparent: true, solid: true, miningTime: 0.4 },
    [BlockType.GLASS]: { transparent: true, solid: true, miningTime: 0.5 },
    [BlockType.METAL]: { transparent: false, solid: true, miningTime: 2.5 },
    [BlockType.SCI_FI_PANEL]: { transparent: false, solid: true, miningTime: 1.5 }
};

// Ship block types
export const ShipBlockType = {
    FRAME_LIGHT: 100,
    FRAME_HEAVY: 101,
    ENGINE_CHEMICAL: 102,
    ENGINE_ION: 103,
    ENGINE_WARP: 104,
    COCKPIT: 105,
    CARGO: 106,
    MINING_LASER: 107,
    SHIELD_GENERATOR: 108,
    SOLAR_PANEL: 109,
    ARMOR_PLATE: 110
};

export const ShipBlockColors = {
    [ShipBlockType.FRAME_LIGHT]: 0x888888,
    [ShipBlockType.FRAME_HEAVY]: 0x555555,
    [ShipBlockType.ENGINE_CHEMICAL]: 0xFF6600,
    [ShipBlockType.ENGINE_ION]: 0x00FFFF,
    [ShipBlockType.ENGINE_WARP]: 0xFF00FF,
    [ShipBlockType.COCKPIT]: 0x00FF00,
    [ShipBlockType.CARGO]: 0xFFFF00,
    [ShipBlockType.MINING_LASER]: 0xFF0000,
    [ShipBlockType.SHIELD_GENERATOR]: 0x0088FF,
    [ShipBlockType.SOLAR_PANEL]: 0x0000FF,
    [ShipBlockType.ARMOR_PLATE]: 0x666666
};

// Resource definitions
export const ResourceType = {
    // Raw ores
    IRON_ORE: 'iron_ore',
    COPPER_ORE: 'copper_ore',
    SILICON_ORE: 'silicon',

    // Refined ingots
    IRON_INGOT: 'iron_ingot',
    COPPER_INGOT: 'copper_ingot',

    // Materials
    STEEL: 'steel',
    GLASS: 'glass',
    PLASTIC: 'plastic',
    CIRCUIT: 'circuit',

    // Parts
    ADVANCED_CIRCUIT: 'advanced_circuit',
    QUANTUM_PROCESSOR: 'quantum_processor',

    // Equipment
    MINING_LASER_MK1: 'mining_laser_mk1',
    SHIELD_MODULE: 'shield_module'
};

export const ResourceNames = {
    [ResourceType.IRON_ORE]: '铁矿石',
    [ResourceType.COPPER_ORE]: '铜矿石',
    [ResourceType.SILICON_ORE]: '硅矿石',
    [ResourceType.IRON_INGOT]: '铁锭',
    [ResourceType.COPPER_INGOT]: '铜锭',
    [ResourceType.STEEL]: '钢材',
    [ResourceType.GLASS]: '玻璃',
    [ResourceType.PLASTIC]: '塑料',
    [ResourceType.CIRCUIT]: '电路板',
    [ResourceType.ADVANCED_CIRCUIT]: '高级电路',
    [ResourceType.QUANTUM_PROCESSOR]: '量子处理器',
    [ResourceType.MINING_LASER_MK1]: '采矿激光Mk1',
    [ResourceType.SHIELD_MODULE]: '护盾模块'
};

// Item definitions
export const ItemType = {
    // Tools
    PICKAXE: 'pickaxe',
    MINING_LASER: 'mining_laser',

    // Blocks
    WOOD_BLOCK: 'wood_block',
    STONE_BLOCK: 'stone_block',
    METAL_BLOCK: 'metal_block',
    GLASS_BLOCK: 'glass_block',

    // Ship parts
    SHIP_FRAME: 'ship_frame',
    SHIP_ENGINE: 'ship_engine',
    SHIP_CARGO: 'ship_cargo'
};

export const ItemNames = {
    [ItemType.PICKAXE]: '镐',
    [ItemType.MINING_LASER]: '采矿激光'
};
