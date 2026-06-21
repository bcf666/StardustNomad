import { Hotbar, Item, ItemType, ItemProperties } from '../inventory/inventory.js';

// UI管理器
export class UIManager {
    constructor(game) {
        this.game = game;
        
        // DOM元素
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            loadingText: document.getElementById('loading-text'),
            mainMenu: document.getElementById('main-menu'),
            hud: document.getElementById('hud'),
            buildMenu: document.getElementById('build-menu'),
            notifications: document.getElementById('notifications'),
            hotbar: document.getElementById('hotbar'),
            healthBar: document.getElementById('health-bar'),
            oxygenBar: document.getElementById('oxygen-bar'),
            positionDisplay: document.getElementById('position-display'),
            chunkDisplay: document.getElementById('chunk-display'),
            modeDisplay: document.getElementById('mode-display')
        };
        
        // 快捷栏
        this.hotbar = new Hotbar(9);
        
        // 初始化
        this.initMenu();
        this.initHotbar();
    }

    // 初始化菜单
    initMenu() {
        const btnNewGame = document.getElementById('btn-new-game');
        const btnContinue = document.getElementById('btn-continue');
        const btnSettings = document.getElementById('btn-settings');
        
        btnNewGame.addEventListener('click', () => {
            this.hideMainMenu();
            this.showHUD();
            this.game.startNewGame();
        });
        
        btnContinue.addEventListener('click', () => {
            this.hideMainMenu();
            this.showHUD();
            this.game.loadGame();
        });
        
        btnSettings.addEventListener('click', () => {
            this.showNotification('设置功能开发中...');
        });
    }

    // 初始化快捷栏
    initHotbar() {
        this.elements.hotbar.innerHTML = '';
        
        // 初始物品
        this.hotbar.setItem(0, new Item(ItemType.DIRT, 64));
        this.hotbar.setItem(1, new Item(ItemType.STONE, 64));
        this.hotbar.setItem(2, new Item(ItemType.WOOD, 32));
        this.hotbar.setItem(3, new Item(ItemType.GLASS, 32));
        this.hotbar.setItem(4, new Item(ItemType.PICKAXE, 1));
        this.hotbar.setItem(5, new Item(ItemType.MINING_LASER, 1));
        
        this.updateHotbarDisplay();
    }

    // 更新快捷栏显示
    updateHotbarDisplay() {
        this.elements.hotbar.innerHTML = '';
        
        for (let i = 0; i < this.hotbar.size; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot' + (i === this.hotbar.selectedSlot ? ' selected' : '');
            
            const item = this.hotbar.getItem(i);
            if (item) {
                // 物品图标 (使用emoji代替)
                const icon = document.createElement('span');
                icon.textContent = this.getItemIcon(item.type);
                icon.style.fontSize = '24px';
                slot.appendChild(icon);
                
                // 数量
                if (item.count > 1) {
                    const count = document.createElement('span');
                    count.className = 'item-count';
                    count.textContent = item.count;
                    slot.appendChild(count);
                }
            }
            
            // 快捷键提示
            const keyHint = document.createElement('span');
            keyHint.style.cssText = 'position:absolute;bottom:-2px;left:2px;font-size:9px;color:#888;';
            keyHint.textContent = i + 1;
            slot.appendChild(keyHint);
            
            this.elements.hotbar.appendChild(slot);
        }
    }

    // 获取物品图标
    getItemIcon(type) {
        const icons = {
            [ItemType.IRON_ORE]: '�ite',
            [ItemType.COPPER_ORE]: '�ite',
            [ItemType.SILICON_ORE]: '�ite',
            [ItemType.COAL]: '⬛',
            [ItemType.IRON_INGOT]: '�ite',
            [ItemType.COPPER_INGOT]: '�ite',
            [ItemType.STEEL]: '�ite',
            [ItemType.GLASS]: '💎',
            [ItemType.PICKAXE]: '⛏️',
            [ItemType.MINING_LASER]: '⚡',
            [ItemType.STONE]: '�ite',
            [ItemType.DIRT]: '🟫',
            [ItemType.WOOD]: '🟫'
        };
        return icons[type] || '❓';
    }

    // 显示加载屏幕
    showLoading(text = '正在加载...') {
        this.elements.loadingScreen.classList.remove('hidden');
        this.elements.loadingText.textContent = text;
    }

    // 隐藏加载屏幕
    hideLoading() {
        this.elements.loadingScreen.classList.add('hidden');
    }

    // 显示主菜单
    showMainMenu() {
        this.elements.mainMenu.classList.remove('hidden');
    }

    // 隐藏主菜单
    hideMainMenu() {
        this.elements.mainMenu.classList.add('hidden');
    }

    // 显示HUD
    showHUD() {
        this.elements.hud.classList.add('active');
    }

    // 隐藏HUD
    hideHUD() {
        this.elements.hud.classList.remove('active');
    }

    // 显示建造菜单
    showBuildMenu() {
        this.elements.buildMenu.classList.add('active');
    }

    // 隐藏建造菜单
    hideBuildMenu() {
        this.elements.buildMenu.classList.remove('active');
    }

    // 切换建造菜单
    toggleBuildMenu() {
        this.elements.buildMenu.classList.toggle('active');
    }

    // 显示通知
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        this.elements.notifications.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 更新HUD
    updateHUD(player, world) {
        if (!player) return;
        
        // 生命值
        const healthPercent = (player.health / player.maxHealth) * 100;
        this.elements.healthBar.style.width = healthPercent + '%';
        
        // 氧气值
        const oxygenPercent = (player.oxygen / player.maxOxygen) * 100;
        this.elements.oxygenBar.style.width = oxygenPercent + '%';
        
        // 坐标
        const pos = player.position;
        this.elements.positionDisplay.textContent = 
            `X: ${Math.floor(pos.x)} Y: ${Math.floor(pos.y)} Z: ${Math.floor(pos.z)}`;
        
        // Chunk坐标
        const chunkX = Math.floor(pos.x / 32);
        const chunkZ = Math.floor(pos.z / 32);
        this.elements.chunkDisplay.textContent = `Chunk: ${chunkX}, ${chunkZ}`;
        
        // 模式
        this.elements.modeDisplay.textContent = 
            player.state === 'walking' ? '行走模式' : 
            player.state === 'flying' ? '飞行模式' : 
            player.state === 'building' ? '建造模式' : player.state;
    }

    // 更新快捷栏选择
    updateHotbarSelection(index) {
        this.hotbar.selectSlot(index);
        this.updateHotbarDisplay();
    }

    // 获取快捷栏
    getHotbar() {
        return this.hotbar;
    }
}
