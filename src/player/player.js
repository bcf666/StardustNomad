import * as THREE from 'three';
import { BlockType, getBlockProperty } from '../engine/voxel.js';

// 玩家状态
export const PlayerState = {
    WALKING: 'walking',
    FLYING: 'flying',
    BUILDING: 'building'
};

// 玩家类
export class Player {
    constructor(world) {
        this.world = world;
        
        // 位置 (世界坐标)
        this.position = new THREE.Vector3(0, 40, 0);
        
        // 速度
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // 朝向
        this.pitch = 0; // 俯仰角
        this.yaw = 0;    // 偏航角
        
        // 状态
        this.state = PlayerState.WALKING;
        
        // 碰撞体积
        this.width = 0.6;
        this.height = 1.8;
        
        // 生命值
        this.health = 10;
        this.maxHealth = 10;
        
        // 氧气值
        this.oxygen = 100;
        this.maxOxygen = 100;
        
        // 重力
        this.gravity = 20;
        
        // 跳跃速度
        this.jumpSpeed = 8;
        
        // 行走速度
        this.walkSpeed = 5;
        
        // 飞行速度
        this.flySpeed = 15;
        
        // 地面检测
        this.onGround = false;
        
        // 饥饿值 (未来用)
        this.hunger = 100;
        
        // 初始化位置
        this.findSpawnPoint();
    }

    // 找到合适的生成点
    findSpawnPoint() {
        // 在世界中心附近找一个安全位置
        const spawnX = 0;
        const spawnZ = 0;
        
        // 找到地表高度
        let groundY = 0;
        for (let y = 100; y >= 0; y--) {
            const block = this.world.getBlock(spawnX, y, spawnZ);
            if (getBlockProperty(block).solid) {
                groundY = y + 2;
                break;
            }
        }
        
        this.position.set(spawnX, groundY, spawnZ);
    }

    // 更新玩家
    update(deltaTime, inputManager) {
        // 根据状态更新
        if (this.state === PlayerState.WALKING) {
            this.updateWalking(deltaTime, inputManager);
        } else if (this.state === PlayerState.FLYING) {
            this.updateFlying(deltaTime, inputManager);
        }
        
        // 更新氧气
        this.updateOxygen(deltaTime);
        
        // 应用重力
        this.applyGravity(deltaTime);
        
        // 应用速度
        this.applyVelocity(deltaTime);
        
        // 碰撞检测
        this.handleCollisions();
    }

    // 行走模式更新
    updateWalking(deltaTime, inputManager) {
        const moveDir = new THREE.Vector3();
        
        // 获取输入方向
        if (inputManager.isKeyDown('KeyW')) moveDir.z -= 1;
        if (inputManager.isKeyDown('KeyS')) moveDir.z += 1;
        if (inputManager.isKeyDown('KeyA')) moveDir.x -= 1;
        if (inputManager.isKeyDown('KeyD')) moveDir.x += 1;
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            
            // 根据相机朝向旋转移动方向
            const cameraDir = new THREE.Euler(0, this.yaw, 0);
            moveDir.applyEuler(cameraDir);
            
            // 设置水平速度
            this.velocity.x = moveDir.x * this.walkSpeed;
            this.velocity.z = moveDir.z * this.walkSpeed;
        } else {
            // 减速
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
        }
        
        // 跳跃
        if (inputManager.isKeyDown('Space') && this.onGround) {
            this.velocity.y = this.jumpSpeed;
            this.onGround = false;
        }
    }

    // 飞行模式更新
    updateFlying(deltaTime, inputManager) {
        const moveDir = new THREE.Vector3();
        
        // 获取输入方向
        if (inputManager.isKeyDown('KeyW')) moveDir.z -= 1;
        if (inputManager.isKeyDown('KeyS')) moveDir.z += 1;
        if (inputManager.isKeyDown('KeyA')) moveDir.x -= 1;
        if (inputManager.isKeyDown('KeyD')) moveDir.x += 1;
        if (inputManager.isKeyDown('Space')) moveDir.y += 1;
        if (inputManager.isKeyDown('ShiftLeft')) moveDir.y -= 1;
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            
            // 根据相机朝向旋转移动方向
            const cameraDir = new THREE.Euler(this.pitch, this.yaw, 0);
            moveDir.applyEuler(cameraDir);
            
            // 设置速度
            this.velocity.copy(moveDir.multiplyScalar(this.flySpeed));
        } else {
            // 悬停 - 缓慢减速
            this.velocity.multiplyScalar(0.9);
        }
    }

    // 应用重力
    applyGravity(deltaTime) {
        if (this.state === PlayerState.WALKING && !this.onGround) {
            this.velocity.y -= this.gravity * deltaTime;
            // 下限
            if (this.velocity.y < -50) this.velocity.y = -50;
        }
    }

    // 应用速度
    applyVelocity(deltaTime) {
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }

    // 碰撞检测与处理
    handleCollisions() {
        const halfWidth = this.width / 2;
        
        // 获取玩家周围的方块
        const minX = Math.floor(this.position.x - halfWidth);
        const maxX = Math.floor(this.position.x + halfWidth);
        const minY = Math.floor(this.position.y);
        const maxY = Math.floor(this.position.y + this.height);
        const minZ = Math.floor(this.position.z - halfWidth);
        const maxZ = Math.floor(this.position.z + halfWidth);
        
        this.onGround = false;
        
        // 检查每个方块
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const block = this.world.getBlock(x, y, z);
                    if (!getBlockProperty(block).solid) continue;
                    
                    // AABB碰撞检测
                    const blockMin = { x: x, y: y, z: z };
                    const blockMax = { x: x + 1, y: y + 1, z: z + 1 };
                    
                    const playerMin = {
                        x: this.position.x - halfWidth,
                        y: this.position.y,
                        z: this.position.z - halfWidth
                    };
                    const playerMax = {
                        x: this.position.x + halfWidth,
                        y: this.position.y + this.height,
                        z: this.position.z + halfWidth
                    };
                    
                    // 检测碰撞
                    if (playerMax.x > blockMin.x && playerMin.x < blockMax.x &&
                        playerMax.y > blockMin.y && playerMin.y < blockMax.y &&
                        playerMax.z > blockMin.z && playerMin.z < blockMax.z) {
                        
                        // 计算每个方向的穿透深度
                        const overlapX = Math.min(playerMax.x - blockMin.x, blockMax.x - playerMin.x);
                        const overlapY = Math.min(playerMax.y - blockMin.y, blockMax.y - playerMin.y);
                        const overlapZ = Math.min(playerMax.z - blockMin.z, blockMax.z - playerMin.z);
                        
                        // 选择最小重叠方向进行推回
                        if (overlapY < overlapX && overlapY < overlapZ) {
                            // Y方向
                            if (this.velocity.y < 0) {
                                this.position.y = blockMax.y;
                                this.velocity.y = 0;
                                this.onGround = true;
                            } else {
                                this.position.y = blockMin.y - this.height;
                                this.velocity.y = 0;
                            }
                        } else if (overlapX < overlapZ) {
                            // X方向
                            if (this.velocity.x > 0) {
                                this.position.x = blockMin.x - halfWidth;
                            } else {
                                this.position.x = blockMax.x + halfWidth;
                            }
                            this.velocity.x = 0;
                        } else {
                            // Z方向
                            if (this.velocity.z > 0) {
                                this.position.z = blockMin.z - halfWidth;
                            } else {
                                this.position.z = blockMax.z + halfWidth;
                            }
                            this.velocity.z = 0;
                        }
                    }
                }
            }
        }
        
        // 底部边界
        if (this.position.y < 1) {
            this.position.y = 1;
            this.velocity.y = 0;
            this.onGround = true;
        }
    }

    // 更新氧气
    updateOxygen(deltaTime) {
        // 在水中或太空中消耗氧气
        const block = this.world.getBlock(
            Math.floor(this.position.x),
            Math.floor(this.position.y + this.height / 2),
            Math.floor(this.position.z)
        );
        
        if (block === BlockType.WATER || block === BlockType.LAVA) {
            this.oxygen -= deltaTime * 10;
            if (this.oxygen < 0) {
                this.oxygen = 0;
                // 溺水伤害
                this.takeDamage(deltaTime * 2);
            }
        } else if (this.oxygen < this.maxOxygen) {
            // 在空气中恢复氧气
            this.oxygen += deltaTime * 20;
            if (this.oxygen > this.maxOxygen) {
                this.oxygen = this.maxOxygen;
            }
        }
    }

    // 造成伤害
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // 死亡处理
        if (this.health <= 0) {
            this.respawn();
        }
    }

    // 复活
    respawn() {
        this.health = this.maxHealth;
        this.oxygen = this.maxOxygen;
        this.findSpawnPoint();
        this.velocity.set(0, 0, 0);
    }

    // 获取视线方向的方块
    getLookingBlock(maxDist = 5) {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
        
        const origin = this.position.clone();
        origin.y += this.height * 0.7; // 眼睛高度
        
        // 步进检测
        for (let t = 0; t < maxDist; t += 0.1) {
            const pos = origin.clone().add(dir.clone().multiplyScalar(t));
            const blockX = Math.floor(pos.x);
            const blockY = Math.floor(pos.y);
            const blockZ = Math.floor(pos.z);
            
            const block = this.world.getBlock(blockX, blockY, blockZ);
            if (getBlockProperty(block).solid) {
                // 返回击中的方块和之前的位置
                const prevPos = origin.clone().add(dir.clone().multiplyScalar(t - 0.1));
                return {
                    block: { x: blockX, y: blockY, z: blockZ, type: block },
                    placePosition: {
                        x: Math.floor(prevPos.x),
                        y: Math.floor(prevPos.y),
                        z: Math.floor(prevPos.z)
                    }
                };
            }
        }
        
        return null;
    }

    // 切换状态
    setState(state) {
        this.state = state;
        if (state === PlayerState.FLYING) {
            this.velocity.set(0, 0, 0);
        }
    }

    // 获取相机位置
    getCameraPosition() {
        const pos = this.position.clone();
        pos.y += this.height * 0.9; // 眼睛高度
        return pos;
    }

    // 获取相机朝向
    getCameraRotation() {
        return { pitch: this.pitch, yaw: this.yaw };
    }
}
