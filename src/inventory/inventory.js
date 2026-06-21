// 物品类型定义
export const ItemType = {
    // 基础资源
    IRON_ORE: 'iron_ore',
    COPPER_ORE: 'copper_ore',
    SILICON_ORE: 'silicon_ore',
    COAL: 'coal',
    
    // 精炼材料
    IRON_INGOT: 'iron_ingot',
    COPPER_INGOT: 'copper_ingot',
    STEEL: 'steel',
    GLASS: 'glass',
    PLASTIC: 'plastic',
    
    // 高级零件
    CIRCUIT_BOARD: 'circuit_board',
    QUANTUM_CPU: 'quantum_cpu',
    
    // 工具
    PICKAXE: 'pickaxe',
    MINING_LASER: 'mining_laser',
    
    // 方块 (作为物品)
    STONE: 'stone',
    DIRT: 'dirt',
    WOOD: 'wood',
    GLASS: 'glass_item'
};

// 物品属性
export const ItemProperties = {
    [ItemType.IRON_ORE]: { name: '铁矿石', stackable: true, maxStack: 64, blockType: 4 },
    [ItemType.COPPER_ORE]: { name: '铜矿石', stackable: true, maxStack: 64, blockType: 5 },
    [ItemType.SILICON_ORE]: { name: '硅矿石', stackable: true, maxStack: 64, blockType: 6 },
    [ItemType.COAL]: { name: '煤炭', stackable: true, maxStack: 64, blockType: null },
    [ItemType.IRON_INGOT]: { name: '铁锭', stackable: true, maxStack: 64, blockType: null },
    [ItemType.COPPER_INGOT]: { name: '铜锭', stackable: true, maxStack: 64, blockType: null },
    [ItemType.STEEL]: { name: '钢材', stackable: true, maxStack: 64, blockType: null },
    [ItemType.GLASS]: { name: '玻璃', stackable: true, maxStack: 64, blockType: 13 },
    [ItemType.PLASTIC]: { name: '塑料', stackable: true, maxStack: 64, blockType: null },
    [ItemType.CIRCUIT_BOARD]: { name: '电路板', stackable: true, maxStack: 64, blockType: null },
    [ItemType.QUANTUM_CPU]: { name: '量子处理器', stackable: true, maxStack: 64, blockType: null },
    [ItemType.PICKAXE]: { name: '镐子', stackable: false, durability: 100 },
    [ItemType.MINING_LASER]: { name: '采矿激光', stackable: true, maxStack: 1, blockType: null },
    [ItemType.STONE]: { name: '石头', stackable: true, maxStack: 64, blockType: 1 },
    [ItemType.DIRT]: { name: '泥土', stackable: true, maxStack: 64, blockType: 2 },
    [ItemType.WOOD]: { name: '木头', stackable: true, maxStack: 64, blockType: 11 }
};

// 物品类
export class Item {
    constructor(type, count = 1) {
        this.type = type;
        this.count = count;
        this.properties = ItemProperties[type] || { name: '未知物品', stackable: true, maxStack: 64 };
    }

    // 获取名称
    getName() {
        return this.properties.name;
    }

    // 是否可堆叠
    isStackable() {
        return this.properties.stackable;
    }

    // 获取最大堆叠数
    getMaxStack() {
        return this.properties.maxStack || 64;
    }

    // 复制
    clone() {
        return new Item(this.type, this.count);
    }

    // 序列化
    toJSON() {
        return { type: this.type, count: this.count };
    }

    // 反序列化
    static fromJSON(json) {
        return new Item(json.type, json.count);
    }
}

// 物品栏类
export class Inventory {
    constructor(size = 36) {
        this.size = size;
        this.slots = new Array(size).fill(null);
    }

    // 添加物品
    addItem(item) {
        let remaining = item.count;
        
        // 先尝试堆叠到已有槽位
        if (item.isStackable()) {
            for (let i = 0; i < this.size && remaining > 0; i++) {
                if (this.slots[i] && this.slots[i].type === item.type) {
                    const canAdd = this.slots[i].getMaxStack() - this.slots[i].count;
                    if (canAdd > 0) {
                        const toAdd = Math.min(canAdd, remaining);
                        this.slots[i].count += toAdd;
                        remaining -= toAdd;
                    }
                }
            }
        }
        
        // 放到空槽位
        while (remaining > 0) {
            const emptySlot = this.findEmptySlot();
            if (emptySlot === -1) break;
            
            if (item.isStackable()) {
                const toAdd = Math.min(item.getMaxStack(), remaining);
                this.slots[emptySlot] = new Item(item.type, toAdd);
                remaining -= toAdd;
            } else {
                this.slots[emptySlot] = item.clone();
                remaining = 0;
            }
        }
        
        return item.count - remaining;
    }

    // 移除物品
    removeItem(slotIndex, count = 1) {
        if (slotIndex < 0 || slotIndex >= this.size || !this.slots[slotIndex]) {
            return null;
        }
        
        const item = this.slots[slotIndex];
        const removed = Math.min(count, item.count);
        item.count -= removed;
        
        if (item.count <= 0) {
            this.slots[slotIndex] = null;
        }
        
        return new Item(item.type, removed);
    }

    // 获取物品
    getItem(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.size) return null;
        return this.slots[slotIndex];
    }

    // 设置物品
    setItem(slotIndex, item) {
        if (slotIndex < 0 || slotIndex >= this.size) return false;
        this.slots[slotIndex] = item;
        return true;
    }

    // 交换物品
    swap(slot1, slot2) {
        [this.slots[slot1], this.slots[slot2]] = [this.slots[slot2], this.slots[slot1]];
    }

    // 查找空槽位
    findEmptySlot() {
        for (let i = 0; i < this.size; i++) {
            if (!this.slots[i]) return i;
        }
        return -1;
    }

    // 计算物品数量
    countItem(type) {
        let total = 0;
        for (const item of this.slots) {
            if (item && item.type === type) {
                total += item.count;
            }
        }
        return total;
    }

    // 是否有某物品
    hasItem(type, count = 1) {
        return this.countItem(type) >= count;
    }

    // 清空
    clear() {
        this.slots = new Array(this.size).fill(null);
    }

    // 序列化
    toJSON() {
        return {
            size: this.size,
            slots: this.slots.map(item => item ? item.toJSON() : null)
        };
    }

    // 反序列化
    static fromJSON(json) {
        const inv = new Inventory(json.size || 36);
        inv.slots = json.slots.map(itemData => 
            itemData ? Item.fromJSON(itemData) : null
        );
        return inv;
    }
}

// 快捷栏类
export class Hotbar extends Inventory {
    constructor(size = 9) {
        super(size);
        this.selectedSlot = 0;
    }

    // 选择槽位
    selectSlot(index) {
        if (index >= 0 && index < this.size) {
            this.selectedSlot = index;
            return true;
        }
        return false;
    }

    // 获取选中的物品
    getSelectedItem() {
        return this.slots[this.selectedSlot];
    }

    // 序列化
    toJSON() {
        const json = super.toJSON();
        json.selectedSlot = this.selectedSlot;
        return json;
    }
}
