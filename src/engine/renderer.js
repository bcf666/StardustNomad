import * as THREE from 'three';

// 渲染管理器 - 处理所有Three.js渲染相关
export class Renderer {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // 天空蓝
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.width / this.height,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 0);

        // 创建WebGL渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 初始化光照
        this.setupLighting();

        // 添加天空背景
        this.setupSky();

        // 窗口大小改变
        window.addEventListener('resize', () => this.onResize());
    }

    // 设置光照
    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x6688cc, 0.4);
        this.scene.add(ambientLight);

        // 主方向光 (太阳)
        const sunLight = new THREE.DirectionalLight(0xffffee, 1.0);
        sunLight.position.set(100, 200, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        this.sunLight = sunLight;

        // 补光
        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.2);
        fillLight.position.set(-50, 100, -50);
        this.scene.add(fillLight);

        // 半球光 (天空/地面)
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.3);
        this.scene.add(hemiLight);
    }

    // 设置天空背景
    setupSky() {
        // 简单的天空渐变
        const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0044ff) },
                bottomColor: { value: new THREE.Color(0x87CEEB) },
                offset: { value: 20 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        this.skyMaterial = skyMaterial;
    }

    // 设置为太空背景
    setSpaceBackground() {
        this.skyMaterial.uniforms.topColor.value.setHex(0x000011);
        this.skyMaterial.uniforms.bottomColor.value.setHex(0x000022);
        this.scene.fog = new THREE.Fog(0x000011, 100, 500);
    }

    // 设置为行星大气背景
    setAtmosphereBackground() {
        this.skyMaterial.uniforms.topColor.value.setHex(0x0044ff);
        this.skyMaterial.uniforms.bottomColor.value.setHex(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }

    // 渲染
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    // 窗口大小改变
    onResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    // 获取相机
    getCamera() {
        return this.camera;
    }

    // 销毁
    dispose() {
        this.renderer.dispose();
        window.removeEventListener('resize', () => this.onResize());
    }
}
