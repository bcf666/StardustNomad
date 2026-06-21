import { Renderer } from './engine/renderer.js';
import { BlockType, BlockResources, isBlockSolid } from './engine/voxel.js';
import { World } from './world/world.js';
import { Player } from './player/player.js';
import { Ship, ShipModuleType } from './ship/ship.js';
import { InputManager, FirstPersonController } from './controls/input-manager.js';
import { Chunk } from './world/chunk.js';
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

    async startNewGame() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('loading').querySelector('div').textContent = '正在生成世界...';

        // 重置游戏
        this.world = new World(Date.now());
        this.player = new Player();
        this.player.position.set(0, 70, 0);
        this.ship = Ship.createDefault();
        this.ship.position.set(0, 75, 0);

        // 初始化快捷栏
        this.initHotbar();

        // 分帧生成 chunks
        const worldX = this.player.position.x;
        const worldY = this.player.position.y;
        const worldZ = this.player.position.z;
        await this.world.generateChunksAroundAsync(worldX, worldY, worldZ, (progress) => {
            this.updateLoadingProgress(Math.floor(20 + progress * 60));
        });

        // 分帧生成网格
        await this.world.generateMeshesAsync(this.renderer.scene, (progress) => {
            this.updateLoadingProgress(Math.floor(80 + progress * 20));
        });

        // 隐藏加载屏幕，显示 HUD
        document.getElementById('loading').style.display = 'none';
        document.getElementById('hud').style.display = 'block';

        // 添加飞船到场景
        this.shipMesh = this.ship.generateMesh();
        if (this.shipMesh) {
            this.shipMesh.position.copy(this.ship.position);
            this.renderer.scene.add(this.shipMesh);
        }

        // 设置初始相机位置
        this.renderer.camera.position.copy(this.player.position);

        this.state = GameState.PLAYING;

        // 添加点击事件来请求 pointer lock（浏览器安全要求）
        this.setupPointerLockHandler();

        this.gameLoop(performance.now());
    }

    setupPointerLockHandler() {
        // 点击 canvas 时请求 pointer lock
        const canvas = this.renderer.renderer.domElement;
        
        const requestLock = () => {
            if (this.state === GameState.PLAYING && !this.inputManager.pointerLocked) {
                this.controller.enable(this.inputManager);
            }
        };

        canvas.addEventListener('click', requestLock);

        // 当 pointer lock 失效时（如按 ESC），显示提示
        document.addEventListener('pointerlockchange', () => {
            if (this.state === GameState.PLAYING && !document.pointerLockElement) {
                // pointer lock 已退出，可以显示提示或等待用户点击重新获得
                this.showMessage('点击屏幕继续游戏', 3000);
            }
        });
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

    openSettings() {
        document.getElementById('settings-panel').style.display = 'flex';
        
        // 绑定设置按钮
        document.getElementById('settings-back').addEventListener('click', () => this.closeSettings());
        document.getElementById('settings-apply').addEventListener('click', () => this.applySettings());
    }

    closeSettings() {
        document.getElementById('settings-panel').style.display = 'none';
    }

    applySettings() {
        // 应用渲染距离
        const renderDistance = parseInt(document.getElementById('setting-render-distance').value);
        this.world.chunkRadius = renderDistance;
        
        // 应用阴影质量
        const shadowQuality = document.getElementById('setting-shadow-quality').value;
        this.applyShadowQuality(shadowQuality);
        
        // 应用雾效
        const fogEnabled = document.getElementById('setting-fog').value === 'on';
        this.renderer.scene.fog = fogEnabled ? new THREE.Fog(0x1a1a2e, 100, 500) : null;
        
        this.showMessage('设置已应用');
        this.closeSettings();
    }

    applyShadowQuality(quality) {
        const sun = this.renderer.sun;
        if (!sun) return;
        
        switch (quality) {
            case 'off':
                sun.castShadow = false;
                break;
            case 'low':
                sun.castShadow = true;
                sun.shadow.mapSize.width = 512;
                sun.shadow.mapSize.height = 512;
                break;
            case 'medium':
                sun.castShadow = true;
                sun.shadow.mapSize.width = 2048;
                sun.shadow.mapSize.height = 2048;
                break;
            case 'high':
                sun.castShadow = true;
                sun.shadow.mapSize.width = 4096;
                sun.shadow.mapSize.height = 4096;
                break;
        }
    }

    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            document.getElementById('pause-menu').style.display = 'flex';
            this.controller.disable(this.inputManager);
            
            // 绑定暂停菜单按钮
            document.getElementById('pause-continue').addEventListener('click', () => this.resumeGame());
            document.getElementById('pause-save').addEventListener('click', () => this.saveGame());
            document.getElementById('pause-settings').addEventListener('click', () => this.openSettingsFromPause());
            document.getElementById('pause-help').addEventListener('click', () => this.openHelp());
            document.getElementById('pause-quit').addEventListener('click', () => this.quitToMenu());
        }
    }

    resumeGame() {
        this.state = GameState.PLAYING;
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('settings-panel').style.display = 'none';
        document.getElementById('help-panel').style.display = 'none';
        // 需要用户点击来重新获得 pointer lock
        this.showMessage('点击屏幕继续游戏', 2000);
    }

    saveGame() {
        // 保存游戏数据到 localStorage
        const saveData = {
            player: {
                position: this.player.position.toArray(),
                health: this.player.health,
                oxygen: this.player.oxygen,
                hotbar: this.player.hotbar.getAllItems()
            },
            ship: this.ship.serialize(),
            world: this.world.serialize(),
            seed: this.world.seed,
            timestamp: Date.now()
        };
        
        localStorage.setItem('stardust_nomad_save', JSON.stringify(saveData));
        this.showMessage('游戏已保存', 2000);
    }

    loadGame() {
        const saveData = localStorage.getItem('stardust_nomad_save');
        if (!saveData) {
            this.showMessage('没有找到存档', 2000);
            return false;
        }
        
        try {
            const data = JSON.parse(saveData);
            this.player.position.fromArray(data.player.position);
            this.player.health = data.player.health;
            this.player.oxygen = data.player.oxygen;
            // 恢复物品
            for (const item of data.player.hotbar) {
                this.player.addItem(item.item, item.count);
            }
            this.ship = Ship.deserialize(data.ship);
            // 恢复世界数据
            for (const [key, chunkData] of Object.entries(data.world)) {
                const [cx, cy, cz] = key.split(',').map(Number);
                const chunk = Chunk.deserialize(chunkData, this.world);
                this.world.chunks.set(key, chunk);
            }
            return true;
        } catch (e) {
            console.error('加载存档失败:', e);
            return false;
        }
    }

    openSettingsFromPause() {
        document.getElementById('pause-menu').style.display = 'none';
        this.openSettings();
    }

    openHelp() {
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('help-panel').style.display = 'flex';
        
        document.getElementById('help-back').addEventListener('click', () => {
            document.getElementById('help-panel').style.display = 'none';
            if (this.state === GameState.PAUSED) {
                document.getElementById('pause-menu').style.display = 'flex';
            }
        });
    }

    quitToMenu() {
        this.state = GameState.MENU;
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
        
        // 清理场景中的 chunks
        for (const [key, chunk] of this.world.chunks) {
            if (chunk.mesh) {
                this.renderer.scene.remove(chunk.mesh);
            }
        }
        this.world.chunks.clear();
    }

    continueGame() {
        // 尝试加载存档
        const saveData = localStorage.getItem('stardust_nomad_save');
        if (!saveData) {
            this.showMessage('没有找到存档，请开始新游戏');
            return;
        }
        
        // 开始加载存档
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('loading').querySelector('div').textContent = '正在加载存档...';
        
        this.updateLoadingProgress(20);
        
        // 重置世界
        this.world = new World(JSON.parse(saveData).seed || Date.now());
        this.updateLoadingProgress(40);
        
        // 加载存档数据
        if (this.loadGame()) {
            this.updateLoadingProgress(80);
            
            // 分帧生成网格
            this.world.generateMeshesAsync(this.renderer.scene, (progress) => {
                this.updateLoadingProgress(Math.floor(80 + progress * 20));
            }).then(() => {
                // 隐藏加载屏幕，显示 HUD
                document.getElementById('loading').style.display = 'none';
                document.getElementById('hud').style.display = 'block';
                
                // 添加飞船到场景
                this.shipMesh = this.ship.generateMesh();
                if (this.shipMesh) {
                    this.shipMesh.position.copy(this.ship.position);
                    this.renderer.scene.add(this.shipMesh);
                }
                
                // 设置相机位置
                this.renderer.camera.position.copy(this.player.position);
                
                this.state = GameState.PLAYING;
                this.setupPointerLockHandler();
                this.gameLoop(performance.now());
            });
        } else {
            this.showMessage('加载存档失败');
            document.getElementById('loading').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        }
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

        // 更新生物群系指示器（每秒更新一次）
        if (!this._lastBiomeUpdate || Date.now() - this._lastBiomeUpdate > 1000) {
            this.updateBiomeIndicator();
            this._lastBiomeUpdate = Date.now();
        }
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
            'glass': '🔷',
            // 新增物品图标
            'titanium_ore': '🔩',
            'uranium_ore': '☢️',
            'crystal': '💎',
            'obsidian': '🖤',
            'snow': '❄️',
            'permafrost': '🧊',
            'cactus': '🌵',
            'deadwood': '🪵',
            'silicon': '💠'
        };
        return icons[item] || '📦';
    }

    initShipBuildUI() {
        const moduleGrid = document.getElementById('module-grid');
        moduleGrid.innerHTML = '';
        
        for (const [key, module] of Object.entries(ShipModuleType)) {
            const item = document.createElement('div');
            item.className = 'module-item';
            item.dataset.module = key;
            item.innerHTML = `
                <div class="module-icon">${module.icon}</div>
                <div>${module.name}</div>
            `;
            item.addEventListener('click', () => this.selectModule(key));
            moduleGrid.appendChild(item);
        }
        
        document.getElementById('ship-build-panel').style.display = 'block';
    }

    selectModule(moduleKey) {
        this.selectedModule = moduleKey;
        
        // 更新 UI
        const items = document.querySelectorAll('.module-item');
        items.forEach(item => {
            item.classList.toggle('selected', item.dataset.module === moduleKey);
        });
        
        const module = ShipModuleType[moduleKey];
        this.showMessage(`已选择: ${module.name}`, 1500);
    }

    updateBiomeIndicator() {
        const biome = this.world.terrainGenerator.getBiome(
            this.player.position.x,
            this.player.position.z
        );
        
        const biomeNames = {
            'plains': '平原',
            'desert': '沙漠',
            'snow': '雪山',
            'forest': '森林',
            'mountains': '山地',
            'ocean': '海洋'
        };
        
        const indicator = document.getElementById('biome-indicator');
        indicator.textContent = `🌍 生物群系: ${biomeNames[biome] || biome}`;
        indicator.style.display = 'block';
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
        // 清零鼠标移动数据（每帧开始时）
        this.inputManager.update();

        // 处理输入
        this.handleInput();

        if (this.gameMode === 'explore') {
            // 第一人称探索模式
            this.controller.update(this.inputManager);
            this.player.update(this.deltaTime, this.world);

            // 相机跟随玩家位置
            this.renderer.camera.position.copy(this.player.position);

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

        // 更新飞船网格位置
        if (this.shipMesh) {
            this.shipMesh.position.copy(this.ship.position);
        }

        // 更新 HUD
        this.updateHUD();
    }

    handleInput() {
        // ESC 暂停（优先处理）
        if (this.inputManager.isKeyDown('Escape') && !this.inputManager._escHandled) {
            this.inputManager._escHandled = true;
            if (this.gameMode === 'ship_build') {
                this.exitShipBuild();
            } else {
                this.togglePause();
            }
            return;
        }
        if (!this.inputManager.isKeyDown('Escape')) {
            this.inputManager._escHandled = false;
        }

        // 如果暂停了，不处理其他输入
        if (this.state === GameState.PAUSED) return;

        // 模式切换
        if (this.inputManager.isKeyDown('KeyB') && !this.inputManager._keyB) {
            this.inputManager._keyB = true;
            this.toggleShipBuildMode();
        }
        if (!this.inputManager.isKeyDown('KeyB')) {
            this.inputManager._keyB = false;
        }

        // 飞行模式切换
        if (this.inputManager.isKeyDown('KeyF') && !this.inputManager._keyF) {
            this.inputManager._keyF = true;
            this.toggleFlyMode();
        }
        if (!this.inputManager.isKeyDown('KeyF')) {
            this.inputManager._keyF = false;
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
    }

    toggleFlyMode() {
        if (this.gameMode === 'explore') {
            // 检查飞船是否可以飞行
            if (this.ship.totalThrust > 0) {
                this.gameMode = 'fly';
                this.showMessage('进入飞船驾驶模式');
            } else {
                this.showMessage('飞船需要引擎才能飞行');
            }
        } else if (this.gameMode === 'fly') {
            this.gameMode = 'explore';
            this.player.position.copy(this.ship.position);
            this.player.position.y += 2;
            this.showMessage('退出飞船驾驶模式');
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
            this.initShipBuildUI();
            this.updateShipStats();
            document.body.requestPointerLock();
        } else if (this.gameMode === 'ship_build') {
            this.exitShipBuild();
        }
    }

    exitShipBuild() {
        this.gameMode = 'explore';
        document.getElementById('ship-build-overlay').style.display = 'none';
        document.getElementById('ship-build-panel').style.display = 'none';
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
