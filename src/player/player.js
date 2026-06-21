import * as THREE from 'three';
import { BlockType } from '../engine/voxel.js';

// 玩家状态管理
export class Player {
    constructor() {
        // 位置和移动
        this.position = new THREE.Vector3(0, 60, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');

        // 物理参数
        this.speed = 5;
        this.jumpForce = 8;
        this.gravity = 20;
        this.onGround = false;

        // 生命值
        this.health = 100;
        this.maxHealth = 100;

        // 氧气 (太空/水下)
        this.oxygen = 100;
        this.maxOxygen = 100;
        this.inSpace = false;

        // 温度
        this.temperature = 20; // 摄氏度
        this.minTemperature = -50;
        this.maxTemperature = 60;

        // 宇航服等级
        this.armorRating = 0;

        // 快捷栏
        this.hotbar = new Hotbar(9);
        this.selectedSlot = 0;

        // 控制器引用
        this.controls = null;

        // 物品交互
        this.reachDistance = 6;
        this.miningProgress = 0;
        this.isMining = false;
    }

    // 更新玩家状态
    update(deltaTime, world) {
        // 氧气消耗 (太空或水下)
        if (this.inSpace) {
            this.oxygen -= deltaTime * 0.5;
            if (this.oxygen < 0) {
                this.oxygen = 0;
                this.health -= deltaTime * 5;
            }
        } else {
            this.oxygen = Math.min(this.maxOxygen, this.oxygen + deltaTime * 2);
        }

        // 温度伤害
        if (this.temperature < this.minTemperature || this.temperature > this.maxTemperature) {
            this.health -= deltaTime * 2;
        }

        // 重力
        if (!this.onGround) {
            this.velocity.y -= this.gravity * deltaTime;
        }

        // 应用速度
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        // 碰撞检测
        this.checkCollision(world);

        // 更新状态
        if (this.health <= 0) {
            this.respawn();
        }
    }

    // 碰撞检测
    checkCollision(world) {
        const playerHeight = 1.8;
        const playerRadius = 0.3;

        // 简化的 AABB 碰撞
        const checkY = [
            this.position.y,
            this.position.y + playerHeight * 0.5,
            this.position.y + playerHeight
        ];

        this.onGround = false;

        for (const y of checkY) {
            const block = world.getBlock(
                Math.floor(this.position.x),
                Math.floor(y),
                Math.floor(this.position.z)
            );

            if (world.isBlockSolid(block)) {
                // 简单的碰撞响应
                if (this.velocity.y < 0 && y < this.position.y + 0.5) {
                    this.position.y = Math.floor(y) + 1;
                    this.velocity.y = 0;
                    this.onGround = true;
                }
            }
        }

        // 防止掉出世界
        if (this.position.y < -50) {
            this.position.y = 60;
            this.velocity.set(0, 0, 0);
        }
    }

    // 复活
    respawn() {
        this.position.set(0, 60, 0);
        this.velocity.set(0, 0, 0);
        this.health = this.maxHealth;
        this.oxygen = this.maxOxygen;
    }

    // 采矿
    mine(world) {
        if (this.isMining) {
            this.miningProgress += 0.1;
            if (this.miningProgress >= 1) {
                this.miningProgress = 0;
                this.isMining = false;
                return true; // 采矿完成
            }
        }
        return false;
    }

    // 开始采矿
    startMine() {
        this.isMining = true;
        this.miningProgress = 0;
    }

    // 停止采矿
    stopMine() {
        this.isMining = false;
        this.miningProgress = 0;
    }

    // 获取当前手持物品
    getEquippedItem() {
        return this.hotbar.getSlot(this.selectedSlot);
    }

    // 添加物品到背包
    addItem(item, count = 1) {
        return this.hotbar.addItem(item, count);
    }

    // 消耗物品
    consumeItem(item, count = 1) {
        return this.hotbar.removeItem(item, count);
    }
}

// 快捷栏系统
class Hotbar {
    constructor(size) {
        this.size = size;
        this.slots = new Array(size).fill(null).map(() => ({ item: null, count: 0 }));
    }

    getSlot(index) {
        if (index < 0 || index >= this.size) return null;
        return this.slots[index];
    }

    addItem(item, count = 1) {
        // 先尝试堆叠到已有物品槽
        for (const slot of this.slots) {
            if (slot.item === item && slot.count < 64) {
                const space = 64 - slot.count;
                const add = Math.min(space, count);
                slot.count += add;
                count -= add;
                if (count === 0) return true;
            }
        }

        // 尝试放到空槽
        for (const slot of this.slots) {
            if (slot.item === null) {
                slot.item = item;
                slot.count = Math.min(count, 64);
                return true;
            }
        }

        return false; // 背包满了
    }

    removeItem(item, count = 1) {
        let remaining = count;

        for (const slot of this.slots) {
            if (slot.item === item) {
                const remove = Math.min(slot.count, remaining);
                slot.count -= remove;
                remaining -= remove;

                if (slot.count === 0) {
                    slot.item = null;
                }

                if (remaining === 0) return true;
            }
        }

        return remaining === 0;
    }

    hasItem(item, count = 1) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot.item === item) {
                total += slot.count;
                if (total >= count) return true;
            }
        }
        return total >= count;
    }

    // 获取所有物品
    getAllItems() {
        return this.slots.filter(s => s.item !== null);
    }
}
