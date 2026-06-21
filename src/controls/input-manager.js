// 输入管理器
export class InputManager {
    constructor() {
        // 按下的键
        this.keys = new Set();
        
        // 鼠标状态
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            leftButton: false,
            rightButton: false,
            locked: false
        };
        
        // 鼠标灵敏度
        this.mouseSensitivity = 0.002;
        
        // 回调函数
        this.callbacks = {
            keydown: [],
            keyup: [],
            mousedown: [],
            mouseup: [],
            mousemove: [],
            click: []
        };
        
        // 初始化事件监听
        this.init();
    }

    init() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.keys.has(e.code)) return;
            this.keys.add(e.code);
            this.trigger('keydown', e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
            this.trigger('keyup', e);
        });
        
        // 鼠标事件
        document.addEventListener('mousemove', (e) => {
            if (!this.mouse.locked) return;
            
            this.mouse.deltaX = e.movementX;
            this.mouse.deltaY = e.movementY;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            this.trigger('mousemove', this.mouse);
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.leftButton = true;
            if (e.button === 2) this.mouse.rightButton = true;
            this.trigger('mousedown', { button: e.button, mouse: this.mouse });
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.leftButton = false;
            if (e.button === 2) this.mouse.rightButton = false;
            this.trigger('mouseup', { button: e.button, mouse: this.mouse });
        });
        
        document.addEventListener('click', (e) => {
            this.trigger('click', e);
        });
        
        // 右键菜单禁用
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // 指针锁定
        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement !== null;
        });
    }

    // 请求指针锁定
    requestPointerLock(element) {
        element.requestPointerLock();
    }

    // 退出指针锁定
    exitPointerLock() {
        document.exitPointerLock();
    }

    // 检查键是否按下
    isKeyDown(code) {
        return this.keys.has(code);
    }

    // 获取鼠标增量
    getMouseDelta() {
        const delta = {
            x: this.mouse.deltaX * this.mouseSensitivity,
            y: this.mouse.deltaY * this.mouseSensitivity
        };
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        return delta;
    }

    // 添加回调
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    // 触发回调
    trigger(event, data) {
        if (this.callbacks[event]) {
            for (const callback of this.callbacks[event]) {
                callback(data);
            }
        }
    }

    // 移除回调
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index !== -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    // 清空状态
    clear() {
        this.keys.clear();
        this.mouse.leftButton = false;
        this.mouse.rightButton = false;
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
}
