import { BlockType, getBlockColor } from '../engine/voxel.js';
import * as THREE from 'three';

// 飞船模块定义
export const ShipModuleType = {
    FRAME_LIGHT: { name: '轻量框架', mass: 1, thrust: 0, power: 0, blockType: BlockType.METAL },
    FRAME_HEAVY: { name: '重型框架', mass: 3, thrust: 0, power: 0, blockType: BlockType.SCI_FI_PANEL },
    CHEMICAL_ENGINE: { name: '化学引擎', mass: 5, thrust: 100, power: 10, blockType: BlockType.SCI_FI_PANEL },
    ION_ENGINE: { name: '离子引擎', mass: 3, thrust: 50, power: 5, efficient: true, blockType: BlockType.SCI_FI_PANEL },
    COCKPIT: { name: '驾驶舱', mass: 2, thrust: 0, power: 0, required: true, blockType: BlockType.GLASS },
    CARGO: { name: '货舱', mass: 2, thrust: 0, power: 0, capacity: 1000, blockType: BlockType.METAL },
    MINING_LASER: { name: '采矿激光', mass: 4, thrust: 0, power: -50, miningSpeed: 5, blockType: BlockType.SCI_FI_PANEL },
    SOLAR_PANEL: { name: '太阳能板', mass: 1, thrust: 0, power: 20, blockType: BlockType.METAL },
    FISSION_REACTOR: { name: '裂变反应堆', mass: 10, thrust: 0, power: 1000, blockType: BlockType.SCI_FI_PANEL },
    SHIELD_GENERATOR: { name: '护盾发生器', mass: 6, thrust: 0, power: -30, shield: 200, blockType: BlockType.SCI_FI_PANEL }
};

// 飞船
export class Ship {
    constructor() {
        // 网格字典: "x,y,z" => blockType
        this.blocks = new Map();

        // 飞船位置和旋转
        this.position = new THREE.Vector3(0, 70, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.velocity = new THREE.Vector3(0, 0, 0);

        // 物理属性
        this.totalMass = 0;
        this.totalThrust = 0;
        this.totalPower = 0;
        this.maxSpeed = 50;

        // 飞船尺寸
        this.size = { x: 0, y: 0, z: 0 };

        // 模块
        this.modules = [];
    }

    // 添加方块
    addBlock(x, y, z, blockType) {
        const key = `${x},${y},${z}`;
        this.blocks.set(key, blockType);
        this.updateStats();
    }

    // 移除方块
    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        this.blocks.delete(key);
        this.updateStats();
    }

    // 获取方块
    getBlock(x, y, z) {
        return this.blocks.get(`${x},${y},${z}`) || BlockType.AIR;
    }

    // 更新物理属性
    updateStats() {
        this.totalMass = 0;
        this.totalThrust = 0;
        this.totalPower = 0;
        this.modules = [];

        // 遍历所有方块
        for (const [key, blockType] of this.blocks) {
            const [x, y, z] = key.split(',').map(Number);

            // 查找对应的模块定义
            for (const [moduleName, moduleDef] of Object.entries(ShipModuleType)) {
                if (moduleDef.blockType === blockType) {
                    this.totalMass += moduleDef.mass || 1;
                    this.totalThrust += moduleDef.thrust || 0;
                    this.totalPower += moduleDef.power || 0;
                    break;
                }
            }

            // 更新尺寸
            this.size.x = Math.max(this.size.x, x + 1);
            this.size.y = Math.max(this.size.y, y + 1);
            this.size.z = Math.max(this.size.z, z + 1);
        }

        // 计算最大速度
        if (this.totalMass > 0 && this.totalThrust > 0) {
            this.maxSpeed = Math.min(100, this.totalThrust / this.totalMass * 2);
        }
    }

    // 创建默认飞船
    static createDefault() {
        const ship = new Ship();

        // 简单飞船结构
        const structure = [
            // 驾驶舱 (中心)
            { x: 0, y: 0, z: 0, type: BlockType.GLASS },

            // 框架
            { x: 1, y: 0, z: 0, type: BlockType.METAL },
            { x: -1, y: 0, z: 0, type: BlockType.METAL },
            { x: 0, y: 0, z: 1, type: BlockType.METAL },
            { x: 0, y: 0, z: -1, type: BlockType.METAL },
            { x: 0, y: 1, z: 0, type: BlockType.METAL },
            { x: 0, y: -1, z: 0, type: BlockType.SCI_FI_PANEL },

            // 引擎 (后方)
            { x: 0, y: 0, z: -2, type: BlockType.SCI_FI_PANEL },
            { x: 1, y: 0, z: -2, type: BlockType.SCI_FI_PANEL },
            { x: -1, y: 0, z: -2, type: BlockType.SCI_FI_PANEL },

            // 货舱
            { x: 1, y: 1, z: 0, type: BlockType.METAL },
            { x: -1, y: 1, z: 0, type: BlockType.METAL },

            // 太阳能板
            { x: 2, y: 0, z: 0, type: BlockType.METAL },
            { x: -2, y: 0, z: 0, type: BlockType.METAL },
        ];

        for (const block of structure) {
            ship.addBlock(block.x, block.y, block.z, block.type);
        }

        return ship;
    }

    // 生成飞船网格
    generateMesh() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        for (const [key, blockType] of this.blocks) {
            const [x, y, z] = key.split(',').map(Number);
            const color = new THREE.Color(getBlockColor(blockType));

            // 简单的立方体网格
            const size = 0.95; // 留一点间隙

            // 6个面
            const faces = [
                // 前面
                { verts: [[x,y,z], [x+size,y,z], [x+size,y+size,z], [x,y+size,z]], col: color },
                // 后面
                { verts: [[x+size,y,z+size], [x,y,z+size], [x,y+size,z+size], [x+size,y+size,z+size]], col: color },
                // 左面
                { verts: [[x,y,z+size], [x,y,z], [x,y+size,z], [x,y+size,z+size]], col: color },
                // 右面
                { verts: [[x+size,y,z], [x+size,y,z+size], [x+size,y+size,z+size], [x+size,y+size,z]], col: color },
                // 顶面
                { verts: [[x,y+size,z], [x+size,y+size,z], [x+size,y+size,z+size], [x,y+size,z+size]], col: color },
                // 底面
                { verts: [[x,y,z+size], [x+size,y,z+size], [x+size,y,z], [x,y,z]], col: color }
            ];

            for (const face of faces) {
                for (const vert of face.verts) {
                    positions.push(vert[0], vert[1], vert[2]);
                    colors.push(face.col.r, face.col.g, face.col.b);
                }
            }
        }

        if (positions.length === 0) return null;

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.MeshLambertMaterial({ vertexColors: true });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    // 应用推力
    applyThrust(thrustDirection, deltaTime) {
        const acceleration = this.totalThrust / this.totalMass;
        this.velocity.addScaledVector(thrustDirection, acceleration * deltaTime);

        // 限制最大速度
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.setLength(this.maxSpeed);
        }
    }

    // 飞行物理更新
    updateFlight(deltaTime, input, world) {
        // 推力方向
        const thrustDir = new THREE.Vector3(0, 0, -1);
        thrustDir.applyEuler(this.rotation);

        // 前进/后退
        if (input.isKeyDown('KeyW')) {
            this.applyThrust(thrustDir, deltaTime);
        }
        if (input.isKeyDown('KeyS')) {
            this.applyThrust(thrustDir.clone().negate(), deltaTime);
        }

        // 上升/下降
        if (input.isKeyDown('Space')) {
            this.velocity.y += (this.totalThrust / this.totalMass) * deltaTime;
        }
        if (input.isKeyDown('ShiftLeft')) {
            this.velocity.y -= (this.totalThrust / this.totalMass) * deltaTime;
        }

        // 旋转
        const rotSpeed = 2;
        if (input.isKeyDown('KeyA')) {
            this.rotation.y += rotSpeed * deltaTime;
        }
        if (input.isKeyDown('KeyD')) {
            this.rotation.y -= rotSpeed * deltaTime;
        }

        // 应用速度
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // 阻力
        this.velocity.multiplyScalar(0.99);

        // 简单重力
        this.velocity.y -= 5 * deltaTime;

        // 地面碰撞
        const groundHeight = world ? world.getHeightAt(this.position.x, this.position.z) : 0;
        if (this.position.y < groundHeight + 5) {
            this.position.y = groundHeight + 5;
            this.velocity.y = Math.max(0, this.velocity.y);
        }
    }

    // 序列化
    serialize() {
        return {
            blocks: Array.from(this.blocks.entries()),
            position: this.position.toArray(),
            rotation: [this.rotation.x, this.rotation.y, this.rotation.z]
        };
    }

    // 反序列化
    static deserialize(data) {
        const ship = new Ship();
        ship.blocks = new Map(data.blocks);
        ship.position.fromArray(data.position);
        ship.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
        ship.updateStats();
        return ship;
    }
}
