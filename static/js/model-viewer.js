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
        // 可以为每个模型单独设置参数，或者使用默认值
        initSingleModel(config.containerId, config.objPath, {
            // scale: 1,        // 取消注释并修改值来改变模型大小
            // cameraDistance: 5 // 取消注释并修改值来改变相机距离
        });
    });
}

function initSingleModel(containerId, objPath, options = {}) {
    // 缩放因子：直接控制模型大小（1.0 = 原始大小，2.0 = 2倍，3.0 = 3倍）
    const scale = options.scale !== undefined ? options.scale : 6;
    // 相机距离：直接控制相机距离（默认值：5，可在options中通过cameraDistance参数传入）
    // 距离越小，模型看起来越大；距离越大，模型看起来越小
    let distance = options.cameraDistance !== undefined ? options.cameraDistance : 2;
    
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
    camera.position.set(0, 0, distance);
    
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
    
    // 鼠标控制器
    let isRotating = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let modelRotationX = 0;
    let modelRotationY = 0;
    
    function onMouseDown(event) {
        isRotating = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        renderer.domElement.style.cursor = 'grabbing';
        event.preventDefault();
    }
    
    function onMouseMove(event) {
        if (!isRotating) return;
        
        const deltaX = event.clientX - lastMouseX;
        const deltaY = event.clientY - lastMouseY;
        
        // 左右旋转（绕Y轴）
        modelRotationY += deltaX * 0.01;
        // 上下旋转（绕X轴），允许360度自由旋转
        modelRotationX += deltaY * 0.01;
        
        // 不限制任何角度，允许完全自由旋转
        
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        event.preventDefault();
    }
    
    function onMouseUp(event) {
        isRotating = false;
        renderer.domElement.style.cursor = 'grab';
    }
    
    function onWheel(event) {
        event.preventDefault();
        distance += event.deltaY * 0.01;
        // 增加相机距离范围，让模型可以更近或更远
        distance = Math.max(0.5, Math.min(50, distance));
    }
    
    // 绑定鼠标事件
    // mousedown 只绑定到canvas，开始拖拽
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    // mousemove 和 mouseup 绑定到document，确保拖拽过程中即使鼠标移出canvas也能继续工作
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    // wheel 事件绑定到canvas，用于缩放
    renderer.domElement.addEventListener('wheel', onWheel);
    renderer.domElement.style.cursor = 'grab';

    // 创建一个组来包含模型，便于统一控制旋转和缩放
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    
    // 加载OBJ模型（使用简化的OBJLoader）
    loadOBJModel(objPath, function(object) {
        // 计算模型边界，自动调整相机位置和缩放
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // 居中模型
        object.position.sub(center);

        object.rotation.x = Math.PI; // 当前设置：X轴旋转180度
        
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
        
        modelGroup.add(object);
        
        // 直接应用缩放因子控制模型大小
        modelGroup.scale.set(scale, scale, scale);
        
        // 输出调试信息，确认参数已正确应用
        console.log('模型加载完成，参数设置:', {
            '缩放因子(scale)': scale,
            '相机距离(distance)': distance,
            '模型组缩放': {
                x: modelGroup.scale.x,
                y: modelGroup.scale.y,
                z: modelGroup.scale.z
            },
            '相机位置': {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z
            },
            '模型原始尺寸': {
                x: size.x.toFixed(2),
                y: size.y.toFixed(2),
                z: size.z.toFixed(2)
            }
        });
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
        
        if (modelGroup) {
            modelGroup.rotation.x = modelRotationX;
            modelGroup.rotation.y = modelRotationY;
        }
        
        camera.position.set(0, 0, distance);
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
