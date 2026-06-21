import * as THREE from 'three';

// 渲染器管理
export class Renderer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // 相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 20, 0);

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // 光照
        this.setupLighting();

        // 雾效
        this.scene.fog = new THREE.Fog(0x1a1a2e, 100, 500);

        // 窗口大小调整
        window.addEventListener('resize', () => this.onResize());
    }

    setupLighting() {
        // 环境光
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambient);

        // 太阳光
        const sun = new THREE.DirectionalLight(0xffffcc, 1);
        sun.position.set(100, 200, 100);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 1000;
        sun.shadow.camera.left = -200;
        sun.shadow.camera.right = 200;
        sun.shadow.camera.top = 200;
        sun.shadow.camera.bottom = -200;
        this.scene.add(sun);
        this.sun = sun;

        // 补光
        const fill = new THREE.DirectionalLight(0x4466ff, 0.3);
        fill.position.set(-50, 100, -50);
        this.scene.add(fill);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }

    // 设置天空颜色
    setSkyColor(color) {
        this.scene.background = new THREE.Color(color);
    }

    // 设置雾效范围
    setFog(near, far) {
        this.scene.fog.near = near;
        this.scene.fog.far = far;
    }

    // 更新太阳位置
    setSunPosition(x, y, z) {
        this.sun.position.set(x, y, z);
    }

    dispose() {
        this.renderer.dispose();
        window.removeEventListener('resize', this.onResize);
    }
}
