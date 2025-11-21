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
            title: 'SKEL Skeleton'
        },
        { 
            containerId: 'model-viewer-skin', 
            objPath: './static/obj/dancer-skelcf-skin.obj',
            title: 'SKEL Skin'
        }
    ];

    modelConfigs.forEach(config => {
        initSingleModel(config.containerId, config.objPath);
    });
}

function initSingleModel(containerId, objPath) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('容器不存在:', containerId);
        return;
    }

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
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
        distance += event.deltaY * 0.01;
        distance = Math.max(1, Math.min(10, distance));
    }
    
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    renderer.domElement.style.cursor = 'grab';

    // 加载OBJ模型（使用简化的OBJLoader）
    loadOBJModel(objPath, function(object) {
        // 计算模型边界，自动调整相机位置
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // 居中模型
        object.position.sub(center);
        
        // 修正上下颠倒：绕X轴旋转180度
        object.rotation.x = Math.PI;
        
        // 计算合适的初始相机距离
        const maxDim = Math.max(size.x, size.y, size.z);
        distance = maxDim * 2;
        distance = Math.max(2, Math.min(8, distance));
        
        // 添加材质
        object.traverse(function(child) {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    flatShading: false,
                    metalness: 0.3,
                    roughness: 0.7
                });
            }
        });
        
        scene.add(object);
    }, function(error) {
        console.error('加载模型失败:', error);
        container.innerHTML = '<p style="padding: 2rem; text-align: center; color: #999;">模型加载失败</p>';
    });

    // 窗口大小改变时调整渲染器
    function onWindowResize() {
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 400;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
    window.addEventListener('resize', onWindowResize);

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
