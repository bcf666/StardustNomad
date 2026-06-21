import { Renderer } from './engine/renderer.js';
import { BlockType, BlockResources, isBlockSolid } from './engine/voxel.js';
import { World } from './world/world.js';
import { Player } from './player/player.js';
import { Ship, ShipModuleType } from './ship/ship.js';
import { InputManager, FirstPersonController } from './controls/input-manager.js';
import * as THREE from 'three';

// 游戏状态
const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    SHIP_BUILD: 'ship_build',
    PAUSED: 'paused'
};

class Game {
    constructor() {
        this.state = GameState.LOADING;
        this.lastTime = 0;
        this.deltaTime = 0;

        // 初始化组件
        this.init();
    }

    async init() {
        this.updateLoadingProgress(10);

        // 创建渲染器
        this.renderer = new Renderer(document.getElementById('game-container'));
        this.updateLoadingProgress(20);

        // 创建世界
        this.world = new World(Date.now());
        this.updateLoadingProgress(30);

        // 创建玩家
        this.player = new Player();
        this.updateLoadingProgress(40);

        // 创建飞船
        this.ship = Ship.createDefault();
        this.updateLoadingProgress(50);

        // 创建输入管理器
        this.inputManager = new InputManager();
        this.updateLoadingProgress(60);

        // 创建第一人称控制器
        this.controller = new FirstPersonController(this.renderer.camera, this.player);
        this.updateLoadingProgress(70);

        // 游戏模式
        this.gameMode = 'explore'; // 'explore' | 'fly' | 'ship_build'

        // 预加载一些 Chunk
        this.updateLoadingProgress(80);

        // 加载完成后进入菜单
        this.updateLoadingProgress(100);
        this.showMenu();
    }

    updateLoadingProgress(percent) {
        const progressBar = document.getElementById('loading-progress');
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
    }

    showMenu() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
        document.getElementById('hud').style.display = 'none';

        // 绑定菜单按钮
        document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-continue').addEventListener('click', () => this.continueGame());
        document.getElementById('btn-settings').addEventListener('click', () => this.openSettings());
    }

    startNewGame() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('hud').style.display = 'block';

        // 重置游戏
        this.world = new World(Date.now());
        this.player = new Player();
        this.player.position.set(0, 70, 0);
        this.ship = Ship.createDefault();
        this.ship.position.set(0, 75, 0);

        // 初始化快捷栏
        this.initHotbar();

        // 启用控制器
        this.controller.enable(this.inputManager);

        // 设置初始相机位置
        this.renderer.camera.position.copy(this.player.position);

        this.state = GameState.PLAYING;
        this.gameLoop(0);
    }

    continueGame() {
        // TODO: 从 IndexedDB 加载存档
        this.showMessage('继续功能开发中...');
        setTimeout(() => this.showMenu(), 1500);
    }

    openSettings() {
        this.showMessage('设置功能开发中...');
        setTimeout(() => this.showMenu(), 1500);
    }

    initHotbar() {
        const hotbar = document.getElementById('hotbar');
        hotbar.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot' + (i === this.player.selectedSlot ? ' selected' : '');
            slot.innerHTML = `<span class="slot-number">${i + 1}</span>`;
            hotbar.appendChild(slot);
        }

        // 给玩家一些初始物品
        this.player.addItem('stone', 32);
        this.player.addItem('wood', 16);
        this.player.addItem('dirt', 32);
    }

    showMessage(text, duration = 2000) {
        const msg = document.getElementById('message');
        msg.textContent = text;
        msg.classList.add('show');
        setTimeout(() => msg.classList.remove('show'), duration);
    }

    updateHUD() {
        // 坐标
        document.getElementById('position').textContent =
            `X: ${Math.floor(this.player.position.x)} Y: ${Math.floor(this.player.position.y)} Z: ${Math.floor(this.player.position.z)}`;

        // 模式
        document.getElementById('mode').textContent =
            `模式: ${this.gameMode === 'explore' ? '探索' : this.gameMode === 'fly' ? '飞船驾驶' : '飞船建造'}`;

        // 生命值
        document.getElementById('health').textContent =
            `❤ 生命: ${Math.floor(this.player.health)}/${this.player.maxHealth}`;

        // 氧气
        document.getElementById('oxygen').textContent =
            `🫁 氧气: ${Math.floor(this.player.oxygen)}/${this.player.maxOxygen}`;

        // 温度
        document.getElementById('temperature').textContent =
            `🌡️ 温度: ${Math.floor(this.player.temperature)}°C`;

        // 更新快捷栏
        this.updateHotbar();
    }

    updateHotbar() {
        const hotbar = document.getElementById('hotbar');
        const slots = hotbar.querySelectorAll('.hotbar-slot');

        slots.forEach((slot, i) => {
            const item = this.player.hotbar.getSlot(i);
            slot.className = 'hotbar-slot' + (i === this.player.selectedSlot ? ' selected' : '');

            if (item && item.item) {
                slot.innerHTML = `
                    <span class="slot-number">${i + 1}</span>
                    <div style="font-size: 20px;">${this.getItemIcon(item.item)}</div>
                    <span class="item-count">${item.count}</span>
                `;
            } else {
                slot.innerHTML = `<span class="slot-number">${i + 1}</span>`;
            }
        });
    }

    getItemIcon(item) {
        const icons = {
            'stone': '🪨',
            'dirt': '🟫',
            'wood': '🪵',
            'iron_ore': '⬜',
            'copper_ore': '🟧',
            'coal': '⚫',
            'gold_ore': '🟡',
            'sand': '🏖️',
            'glass': '🔷'
        };
        return icons[item] || '📦';
    }

    gameLoop(time) {
        if (this.state !== GameState.PLAYING && this.state !== GameState.SHIP_BUILD) {
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        // 计算 deltaTime
        this.deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        this.update();
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update() {
        // 处理输入
        this.handleInput();

        if (this.gameMode === 'explore') {
            // 第一人称探索模式
            this.controller.update(this.inputManager);
            this.player.update(this.deltaTime, this.world);

            // 加载周围的 Chunk
            this.world.loadChunksAround(
                this.player.position.x,
                this.player.position.y,
                this.player.position.z
            );

            // 卸载远处的 Chunk
            this.world.unloadFarChunks(
                this.player.position.x,
                this.player.position.y,
                this.player.position.z
            );
        } else if (this.gameMode === 'fly') {
            // 飞船飞行模式
            this.ship.updateFlight(this.deltaTime, this.inputManager, this.world);
            this.renderer.camera.position.copy(this.ship.position);
            this.renderer.camera.rotation.copy(this.ship.rotation);
        }

        // 更新 HUD
        this.updateHUD();
    }

    handleInput() {
        // 模式切换
        if (this.inputManager.isKeyDown('KeyB') && !this.inputManager._keyB) {
            this.inputManager._keyB = true;
            this.toggleShipBuildMode();
        }
        if (!this.inputManager.isKeyDown('KeyB')) {
            this.inputManager._keyB = false;
        }

        // 快捷栏选择
        for (let i = 1; i <= 9; i++) {
            if (this.inputManager.isKeyDown(`Digit${i}`)) {
                this.player.selectedSlot = i - 1;
            }
        }

        // 采矿/放置 (探索模式)
        if (this.gameMode === 'explore') {
            // 左键采矿
            if (this.inputManager.mouse.left) {
                this.handleMining();
            } else {
                this.player.stopMine();
            }

            // 右键放置
            if (this.inputManager.mouse.right) {
                this.handlePlacing();
            }
        }

        // 退出鼠标锁定
        if (this.inputManager.isKeyDown('Escape')) {
            if (this.gameMode === 'ship_build') {
                this.exitShipBuild();
            } else if (this.controller.enabled) {
                this.controller.disable(this.inputManager);
            }
        }
    }

    handleMining() {
        const target = this.world.getTargetBlock(
            this.renderer.camera.position,
            this.renderer.camera.getWorldDirection(new THREE.Vector3()),
            this.player.reachDistance
        );

        if (target && target.block !== BlockType.AIR) {
            if (!this.player.isMining) {
                this.player.startMine();
            }

            if (this.player.mine(this.world)) {
                // 采矿完成，破坏方块
                this.world.setBlockWorld(target.position.x, target.position.y, target.position.z, BlockType.AIR);

                // 掉落物品
                const resource = BlockResources[target.block];
                if (resource) {
                    this.player.addItem(resource.item, resource.amount);
                    this.showMessage(`+${resource.amount} ${resource.item}`);
                }
            }
        } else {
            this.player.stopMine();
        }
    }

    handlePlacing() {
        if (this.inputManager._placing) return;
        this.inputManager._placing = true;

        const target = this.world.getTargetBlock(
            this.renderer.camera.position,
            this.renderer.camera.getWorldDirection(new THREE.Vector3()),
            this.player.reachDistance
        );

        if (target && target.adjacent) {
            const item = this.player.getEquippedItem();
            if (item && item.item) {
                // 获取物品对应的方块类型
                const blockType = this.getBlockTypeFromItem(item.item);
                if (blockType !== BlockType.AIR) {
                    this.world.setBlockWorld(
                        target.adjacent.x,
                        target.adjacent.y,
                        target.adjacent.z,
                        blockType
                    );
                    this.player.consumeItem(item.item, 1);
                }
            }
        }

        setTimeout(() => { this.inputManager._placing = false; }, 200);
    }

    getBlockTypeFromItem(item) {
        const map = {
            'stone': BlockType.STONE,
            'dirt': BlockType.DIRT,
            'wood': BlockType.WOOD,
            'sand': BlockType.SAND,
            'glass': BlockType.GLASS,
            'metal': BlockType.METAL,
            'sci_fi_panel': BlockType.SCI_FI_PANEL
        };
        return map[item] || BlockType.AIR;
    }

    toggleShipBuildMode() {
        if (this.gameMode === 'explore') {
            // 进入飞船建造模式
            this.gameMode = 'ship_build';
            document.getElementById('ship-build-overlay').style.display = 'block';
            this.updateShipStats();
            document.body.requestPointerLock();
        } else if (this.gameMode === 'ship_build') {
            this.exitShipBuild();
        }
    }

    exitShipBuild() {
        this.gameMode = 'explore';
        document.getElementById('ship-build-overlay').style.display = 'none';
        this.controller.enable(this.inputManager);
    }

    updateShipStats() {
        document.getElementById('ship-mass').textContent = Math.floor(this.ship.totalMass);
        document.getElementById('ship-thrust').textContent = Math.floor(this.ship.totalThrust);
        document.getElementById('ship-power').textContent = Math.floor(this.ship.totalPower);
    }

    render() {
        // 更新世界 Chunk 网格
        this.world.updateChunks(this.renderer.scene);

        // 渲染
        this.renderer.render();
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
