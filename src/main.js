import { Renderer } from './engine/renderer.js';
import { World } from './world/world.js';
import { InputManager } from './controls/input-manager.js';
import { UIManager } from './ui/ui-manager.js';
import { PlayerState } from './player/player.js';
import { Item, ItemType, ItemProperties } from './inventory/inventory.js';
import { BlockType } from './engine/voxel.js';

// 游戏主类
class Game {
    constructor() {
        this.renderer = null;
        this.world = null;
        this.inputManager = null;
        this.uiManager = null;
        
        // 游戏状态
        this.state = 'loading'; // loading, menu, playing, paused
        
        // 时间
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // 摄像机控制
        this.cameraPitch = 0;
        this.cameraYaw = 0;
        
        // 初始化
        this.init();
    }

    async init() {
        // 创建渲染器
        const container = document.getElementById('game-container');
        this.renderer = new Renderer(container);
        
        // 创建输入管理器
        this.inputManager = new InputManager();
        
        // 创建UI管理器
        this.uiManager = new UIManager(this);
        
        // 初始化输入回调
        this.initInputCallbacks();
        
        // 隐藏加载屏幕，显示主菜单
        this.uiManager.hideLoading();
        this.uiManager.showMainMenu();
        
        this.state = 'menu';
        
        // 开始游戏循环
        this.lastTime = performance.now();
        this.gameLoop();
    }

    // 初始化输入回调
    initInputCallbacks() {
        // 鼠标移动 - 视角控制
        this.inputManager.on('mousemove', (data) => {
            if (this.state !== 'playing') return;
            if (!this.inputManager.mouse.locked) return;
            
            this.cameraYaw -= data.x;
            this.cameraPitch -= data.y;
            
            // 限制俯仰角
            this.cameraPitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.cameraPitch));
        });
        
        // 鼠标点击 - 指针锁定
        this.inputManager.on('click', () => {
            if (this.state !== 'playing') return;
            if (!this.inputManager.mouse.locked) {
                this.inputManager.requestPointerLock(document.body);
            }
        });
        
        // 键盘按下
        this.inputManager.on('keydown', (e) => {
            if (this.state !== 'playing') return;
            
            switch (e.code) {
                case 'Escape':
                    this.inputManager.exitPointerLock();
                    break;
                    
                case 'KeyB':
                    this.uiManager.toggleBuildMenu();
                    break;
                    
                case 'KeyG':
                    // 切换飞行模式
                    if (this.world && this.world.player) {
                        const newState = this.world.player.state === PlayerState.WALKING 
                            ? PlayerState.FLYING 
                            : PlayerState.WALKING;
                        this.world.player.setState(newState);
                        this.uiManager.showNotification(
                            newState === PlayerState.FLYING ? '切换到飞行模式' : '切换到行走模式'
                        );
                    }
                    break;
                    
                case 'Space':
                    // 空格键 - 在飞行模式下上升
                    if (this.world && this.world.player && this.world.player.state === PlayerState.FLYING) {
                        // 在flying update中处理
                    }
                    break;
                    
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                case 'Digit5':
                case 'Digit6':
                case 'Digit7':
                case 'Digit8':
                case 'Digit9':
                    const slotIndex = parseInt(e.code.replace('Digit', '')) - 1;
                    this.uiManager.updateHotbarSelection(slotIndex);
                    break;
            }
        });
        
        // 鼠标按下 - 挖掘/放置
        this.inputManager.on('mousedown', (data) => {
            if (this.state !== 'playing') return;
            if (!this.inputManager.mouse.locked) return;
            
            if (data.button === 0) {
                // 左键 - 挖掘
                this.startMining();
            } else if (data.button === 2) {
                // 右键 - 放置
                this.placeBlock();
            }
        });
        
        this.inputManager.on('mouseup', (data) => {
            if (data.button === 0) {
                this.stopMining();
            }
        });
    }

    // 开始挖掘
    startMining() {
        if (!this.world || !this.world.player) return;
        
        const target = this.world.player.getLookingBlock(5);
        if (target) {
            this.world.placeTarget = target;
        }
    }

    // 停止挖掘
    stopMining() {
        if (this.world) {
            this.world.miningTarget = null;
            this.world.miningProgress = 0;
        }
    }

    // 放置方块
    placeBlock() {
        if (!this.world || !this.world.player) return;
        
        const target = this.world.player.getLookingBlock(5);
        if (!target) return;
        
        const hotbar = this.uiManager.getHotbar();
        const item = hotbar.getSelectedItem();
        
        if (!item) return;
        
        // 获取物品对应的方块类型
        let blockType = null;
        if (item.properties.blockType !== null) {
            blockType = item.properties.blockType;
        } else {
            // 尝试从ItemType映射
            const blockMapping = {
                [ItemType.DIRT]: BlockType.DIRT,
                [ItemType.STONE]: BlockType.STONE,
                [ItemType.WOOD]: BlockType.WOOD,
                [ItemType.GLASS]: BlockType.GLASS
            };
            blockType = blockMapping[item.type];
        }
        
        if (blockType === null) return;
        
        // 放置方块
        const pos = target.placePosition;
        if (this.world.placeBlock(pos.x, pos.y, pos.z, blockType)) {
            // 移除物品
            hotbar.removeItem(hotbar.selectedSlot, 1);
            this.uiManager.updateHotbarDisplay();
        }
    }

    // 更新挖掘进度
    updateMining(deltaTime) {
        if (!this.world || !this.world.player) return;
        
        const target = this.world.player.getLookingBlock(5);
        if (!target) {
            this.world.miningTarget = null;
            this.world.miningProgress = 0;
            return;
        }
        
        // 检查是否在挖掘同一个方块
        if (this.world.miningTarget &&
            this.world.miningTarget.x === target.block.x &&
            this.world.miningTarget.y === target.block.y &&
            this.world.miningTarget.z === target.block.z) {
            // 继续挖掘
            this.world.miningProgress += deltaTime * 2; // 挖掘速度
            this.world.mineBlock(target.block.x, target.block.y, target.block.z, this.world.miningProgress);
        } else {
            // 开始挖掘新方块
            this.world.miningTarget = target.block;
            this.world.miningProgress = 0;
        }
    }

    // 开始新游戏
    async startNewGame() {
        this.state = 'loading';
        this.uiManager.showLoading('正在生成世界...');
        
        // 等待一帧
        await new Promise(r => setTimeout(r, 100));
        
        // 创建世界
        this.world = new World(Date.now());
        await this.world.init(this.renderer);
        this.world.game = this; // 循环引用
        
        // 初始化相机
        this.cameraPitch = 0;
        this.cameraYaw = 0;
        
        // 请求指针锁定
        this.inputManager.requestPointerLock(document.body);
        
        this.state = 'playing';
        this.uiManager.hideLoading();
        this.uiManager.showNotification('欢迎来到星尘牧歌！按G切换飞行模式');
    }

    // 加载游戏
    async loadGame() {
        // 简化处理 - 开始新游戏
        await this.startNewGame();
    }

    // 保存游戏
    saveGame() {
        if (!this.world) return;
        
        const saveData = {
            version: 1,
            timestamp: Date.now(),
            world: this.world.toJSON()
        };
        
        localStorage.setItem('stardust_nomad_save', JSON.stringify(saveData));
        this.uiManager.showNotification('游戏已保存');
    }

    // 游戏循环
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        
        const currentTime = performance.now();
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (this.state === 'playing') {
            this.update(this.deltaTime);
            this.render();
        }
    }

    // 更新
    update(deltaTime) {
        // 更新世界
        if (this.world) {
            this.world.update(deltaTime);
        }
        
        // 更新挖掘
        if (this.inputManager.mouse.leftButton && this.inputManager.mouse.locked) {
            this.updateMining(deltaTime);
        }
        
        // 更新HUD
        if (this.world && this.world.player) {
            this.uiManager.updateHUD(this.world.player, this.world);
        }
    }

    // 渲染
    render() {
        if (!this.world || !this.world.player) {
            this.renderer.render();
            return;
        }
        
        // 更新相机
        const camera = this.renderer.getCamera();
        const player = this.world.player;
        
        // 设置相机位置
        camera.position.copy(player.getCameraPosition());
        
        // 设置相机旋转
        camera.rotation.order = 'YXZ';
        camera.rotation.x = this.cameraPitch;
        camera.rotation.y = this.cameraYaw;
        
        // 同步玩家朝向
        player.pitch = this.cameraPitch;
        player.yaw = this.cameraYaw;
        
        // 渲染场景
        this.renderer.render();
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
