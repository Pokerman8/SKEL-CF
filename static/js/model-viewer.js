// 3D模型查看器 - 简洁版本
// 使用Three.js加载OBJ模型并支持鼠标交互

// 等待Three.js加载完成
window.addEventListener('DOMContentLoaded', function() {
    // 等待Three.js库加载
    if (typeof THREE === 'undefined') {
        console.error('Three.js未加载');
        return;
    }

    // 初始化所有3D模型查看器
    initModelViewers();
});

function initModelViewers() {
    // OBJ文件路径配置
    const modelConfigs = [
        { 
            containerId: 'model-viewer-skeleton', 
            objPath: './static/obj/dancer-skelcf-skeleton.obj',
            title: 'SKEL Skeleton',
            color: '#8fbfda',
            scale: 1,
            rotation: { x: Math.PI, y: 0, z: 0 },
            cameraMargin: 1.14
        },
        { 
            containerId: 'model-viewer-skin', 
            objPath: './static/obj/dancer-skelcf-skin.obj',
            title: 'SKEL Skin',
            color: '#bfc7cc',
            scale: 1,
            rotation: { x: Math.PI, y: 0, z: 0 },
            cameraMargin: 1.14
        }
    ];

    modelConfigs.forEach(config => {
        const container = document.getElementById(config.containerId);
        if (container) {
            initSingleModel(config.containerId, config.objPath, {
                color: container.dataset.modelColor || config.color,
                scale: config.scale,
                rotation: config.rotation,
                cameraMargin: config.cameraMargin
            });
        }
    });
}

function initSingleModel(containerId, objPath, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        return null;
    }

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(0, 0, 5);
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = ''; // 清空容器
    container.appendChild(renderer.domElement);

    // 添加光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, 0.5, -1);
    scene.add(directionalLight2);

    // 简化的鼠标控制器
    let isRotating = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let rotationX = 0;
    let rotationY = 0;
    let distance = 5;
    let minDistance = 0.5;
    let maxDistance = 10;
    let currentObject = null;
    let currentPath = '';
    
    function onMouseDown(event) {
        isRotating = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }
    
    function onMouseMove(event) {
        if (!isRotating) return;
        const deltaX = event.clientX - lastMouseX;
        const deltaY = event.clientY - lastMouseY;
        
        rotationY += deltaX * 0.01;
        rotationX += deltaY * 0.01;
        
        // 限制垂直旋转角度
        rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));
        
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    }
    
    function onMouseUp() {
        isRotating = false;
    }
    
    function onWheel(event) {
        event.preventDefault();
        distance += event.deltaY * distance * 0.001;
        distance = Math.max(minDistance, Math.min(maxDistance, distance));
    }
    
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    renderer.domElement.style.cursor = 'grab';

    function loadModel(path, modelOptions = {}) {
        if (!path || path === currentPath) return;

        const requestedPath = path;
        currentPath = requestedPath;
        container.classList.add('is-loading');

        loadOBJModel(requestedPath, function(object) {
            if (requestedPath !== currentPath) return;

            if (currentObject) {
                scene.remove(currentObject);
            }

            // Center the raw OBJ geometry before applying the view transform.
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            centerObjectGeometry(object, center);
            object.position.set(0, 0, 0);

            const viewRotation = modelOptions.rotation || options.rotation || {};
            object.rotation.set(
                viewRotation.x || 0,
                viewRotation.y || 0,
                viewRotation.z || 0
            );
            object.scale.setScalar(modelOptions.scale || options.scale || 1);

            object.updateMatrixWorld(true);
            const displayBox = new THREE.Box3().setFromObject(object);
            const size = displayBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const verticalFov = camera.fov * Math.PI / 180;
            const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
            const fitHeightDistance = size.y / (2 * Math.tan(verticalFov / 2));
            const fitWidthDistance = size.x / (2 * Math.tan(horizontalFov / 2));
            const fitDistance = Math.max(fitHeightDistance, fitWidthDistance);
            const cameraMargin = modelOptions.cameraMargin || options.cameraMargin || 1.2;
            minDistance = Math.max(0.05, maxDim * 0.15);
            maxDistance = Math.max(1, maxDim * 8);
            distance = Math.max(minDistance, Math.min(maxDistance, fitDistance * cameraMargin));
            
            // 添加材质
            object.traverse(function(child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: modelOptions.color || options.color || 0x888888,
                        flatShading: false,
                        metalness: 0.2,
                        roughness: 0.75
                    });
                }
            });
            
            currentObject = object;
            scene.add(object);
            container.classList.remove('is-loading');
        }, function(error) {
            if (requestedPath !== currentPath) return;

            console.error('加载模型失败:', error);
            container.classList.remove('is-loading');
            container.innerHTML = '<p style="padding: 2rem; text-align: center; color: #777;">Mesh failed to load. Please view this page through an HTTP server and confirm the OBJ file path exists.</p>';
        });
    }

    // 窗口大小改变时调整渲染器
    function onWindowResize() {
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 400;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
    window.addEventListener('resize', onWindowResize);

    if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(onWindowResize);
        resizeObserver.observe(container);
    }

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        
        // 更新相机位置（基于鼠标旋转和滚轮缩放）
        const x = Math.sin(rotationY) * Math.cos(rotationX) * distance;
        const y = Math.sin(rotationX) * distance;
        const z = Math.cos(rotationY) * Math.cos(rotationX) * distance;
        
        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
        
        renderer.render(scene, camera);
    }
    animate();

    loadModel(objPath, options);

    return {
        loadModel
    };
}

// 简化的OBJ加载器
function loadOBJModel(url, onLoad, onError) {
    const loader = new THREE.FileLoader();
    loader.load(
        url,
        function(text) {
            try {
                const object = parseOBJ(text);
                onLoad(object);
            } catch (e) {
                if (onError) onError(e);
                else console.error(e);
            }
        },
        undefined,
        onError
    );
}

function centerObjectGeometry(object, center) {
    object.traverse(function(child) {
        if (child.isMesh && child.geometry) {
            child.geometry.translate(-center.x, -center.y, -center.z);
            child.geometry.computeBoundingBox();
            child.geometry.computeBoundingSphere();
        }
    });
}

// 简化的OBJ解析器
function parseOBJ(text) {
    const lines = text.split('\n');
    const vertices = [];
    const normals = [];
    const uvs = [];
    const faces = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;
        const command = parts[0];
        
        if (command === 'v') {
            vertices.push(
                parseFloat(parts[1]) || 0,
                parseFloat(parts[2]) || 0,
                parseFloat(parts[3]) || 0
            );
        } else if (command === 'vn') {
            normals.push(
                parseFloat(parts[1]) || 0,
                parseFloat(parts[2]) || 0,
                parseFloat(parts[3]) || 0
            );
        } else if (command === 'vt') {
            uvs.push(
                parseFloat(parts[1]) || 0,
                parseFloat(parts[2]) || 0
            );
        } else if (command === 'f') {
            const faceIndices = [];
            for (let j = 1; j < parts.length; j++) {
                const indices = parts[j].split('/');
                const vIndex = parseInt(indices[0]) - 1;
                if (vIndex >= 0 && vIndex * 3 + 2 < vertices.length) {
                    faceIndices.push(vIndex);
                }
            }
            if (faceIndices.length >= 3) {
                faces.push(faceIndices);
            }
        }
    }
    
    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        // 将多边形面划分为三角形（扇形三角剖分）
        const v0 = face[0];
        for (let j = 1; j < face.length - 1; j++) {
            const v1 = face[j];
            const v2 = face[j + 1];
            
            // 添加三个顶点的坐标
            positions.push(
                vertices[v0 * 3], vertices[v0 * 3 + 1], vertices[v0 * 3 + 2],
                vertices[v1 * 3], vertices[v1 * 3 + 1], vertices[v1 * 3 + 2],
                vertices[v2 * 3], vertices[v2 * 3 + 1], vertices[v2 * 3 + 2]
            );
        }
    }
    
    if (positions.length === 0) {
        console.warn('未找到有效的面数据');
        return new THREE.Mesh(new THREE.BufferGeometry());
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    
    return new THREE.Mesh(geometry);
}
