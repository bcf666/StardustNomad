import * as THREE from 'three';

// 输入管理器
export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            left: false,
            right: false,
            wheel: 0
        };

        this.locked = false;
        this.pointerLocked = false;

        this.setupListeners();
    }

    setupListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.onKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.onKeyUp(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.pointerLocked) {
                this.mouse.deltaX = e.movementX;
                this.mouse.deltaY = e.movementY;
            }
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.left = true;
            if (e.button === 2) this.mouse.right = true;
            this.onMouseDown(e);
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 2) this.mouse.right = false;
            this.onMouseUp(e);
        });

        document.addEventListener('wheel', (e) => {
            this.mouse.wheel = e.deltaY;
        });

        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement !== null;
        });

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    onKeyDown(e) {}
    onKeyUp(e) {}
    onMouseDown(e) {}
    onMouseUp(e) {}

    // 请求鼠标锁定
    requestPointerLock(element) {
        element.requestPointerLock();
    }

    // 退出鼠标锁定
    exitPointerLock() {
        document.exitPointerLock();
    }

    // 更新 (每帧调用)
    update() {
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.mouse.wheel = 0;
    }

    // 检查按键是否按下
    isKeyDown(code) {
        return this.keys[code] === true;
    }

    // 获取鼠标移动
    getMouseDelta() {
        return {
            x: this.mouse.deltaX,
            y: this.mouse.deltaY
        };
    }
}

// 第一人称控制器
export class FirstPersonController {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;

        this.sensitivity = 0.002;
        this.enabled = false;

        this.pitch = 0;
        this.yaw = 0;
    }

    enable(inputManager) {
        this.enabled = true;
        inputManager.requestPointerLock(document.body);
    }

    disable(inputManager) {
        this.enabled = false;
        inputManager.exitPointerLock();
    }

    update(inputManager) {
        if (!this.enabled) return;

        // 鼠标视角
        const delta = inputManager.getMouseDelta();
        this.yaw -= delta.x * this.sensitivity;
        this.pitch -= delta.y * this.sensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

        // 更新相机旋转
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.x = this.pitch;
        this.camera.rotation.y = this.yaw;

        // 移动方向
        const moveDir = new THREE.Vector3();

        if (inputManager.isKeyDown('KeyW')) moveDir.z -= 1;
        if (inputManager.isKeyDown('KeyS')) moveDir.z += 1;
        if (inputManager.isKeyDown('KeyA')) moveDir.x -= 1;
        if (inputManager.isKeyDown('KeyD')) moveDir.x += 1;

        if (moveDir.length() > 0) {
            moveDir.normalize();

            // 根据 yaw 旋转移动方向
            const sin = Math.sin(this.yaw);
            const cos = Math.cos(this.yaw);

            const moveX = moveDir.x * cos - moveDir.z * sin;
            const moveZ = moveDir.x * sin + moveDir.z * cos;

            this.player.velocity.x = moveX * this.player.speed;
            this.player.velocity.z = moveZ * this.player.speed;
        } else {
            // 减速
            this.player.velocity.x *= 0.8;
            this.player.velocity.z *= 0.8;
        }

        // 跳跃
        if (inputManager.isKeyDown('Space') && this.player.onGround) {
            this.player.velocity.y = this.player.jumpForce;
            this.player.onGround = false;
        }

        // 更新玩家位置
        this.player.position.copy(this.camera.position);
    }

    updateCamera() {
        this.camera.position.copy(this.player.position);
    }
}
