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

function initSingleModel(containerId, objPath, options = {}) {
    // 默认选项
    const config = {
        scale: options.scale || 3.0, // 模型缩放因子，可以手动调整（1.0 = 默认大小，2.0 = 2倍大小，3.0 = 3倍大小）
        useFixedScale: options.useFixedScale !== false, // 是否使用固定缩放倍数（true）或自动缩放（false）
        ...options
    };
    
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
    let modelRotationX = 0; // 模型在X轴的旋转（上下）
    let modelRotationY = 0; // 模型在Y轴的旋转（左右）
    let distance = 5;
    let modelScale = 1.0; // 模型缩放因子，控制模型大小
    
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
        
        // 修复上下颠倒：尝试不同的旋转方式
        // 如果模型上下颠倒，可以取消下面某个选项的注释来尝试：
        // object.rotation.x = Math.PI;     // X轴旋转180度
        // object.rotation.y = Math.PI;     // Y轴旋转180度  
        // object.rotation.z = Math.PI;     // Z轴旋转180度
        // object.rotation.x = Math.PI / 2; // X轴旋转90度
        // object.rotation.z = Math.PI / 2; // Z轴旋转90度
        
        // 如果上面都不行，可能需要组合旋转，例如：
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
        
        // 计算合适的初始相机距离和模型缩放
        const maxDim = Math.max(size.x, size.y, size.z);
        
        if (config.useFixedScale) {
            // 方式1：直接使用配置的缩放倍数（更直接，推荐）
            modelScale = config.scale;
            console.log('使用固定缩放倍数:', modelScale);
        } else {
            // 方式2：基于视口自动计算缩放，然后应用配置的倍数
            const targetSize = Math.min(width, height) * 0.8;
            
            if (maxDim > 0) {
                let autoScale = targetSize / maxDim;
                modelScale = autoScale * config.scale;
                console.log('使用自动缩放计算:', {
                    autoScale: autoScale.toFixed(2),
                    configScale: config.scale,
                    finalScale: modelScale.toFixed(2)
                });
            } else {
                modelScale = config.scale;
            }
        }
        
        // 限制缩放范围，避免过大或过小
        modelScale = Math.max(0.1, Math.min(50, modelScale));
        
        // 直接设置模型组的缩放
        modelGroup.scale.set(modelScale, modelScale, modelScale);
        
        // 根据缩放后的模型大小计算相机距离
        const scaledSize = maxDim > 0 ? maxDim * modelScale : 1;
        distance = scaledSize * 1.5; // 相机距离是模型大小的1.5倍
        distance = Math.max(1, Math.min(200, distance)); // 扩大相机距离范围
        
        console.log('模型加载完成 - 缩放信息:', {
            '原始模型尺寸': {x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2)},
            '最大维度': maxDim.toFixed(2),
            '配置的缩放因子': config.scale,
            '最终缩放值': modelScale.toFixed(2),
            '模型组当前缩放': {
                x: modelGroup.scale.x.toFixed(2),
                y: modelGroup.scale.y.toFixed(2),
                z: modelGroup.scale.z.toFixed(2)
            },
            '相机距离': distance.toFixed(2)
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
        
        // 直接旋转模型组，而不是移动相机
        // 这样更简单，也允许完全自由的360度旋转
        if (modelGroup) {
            modelGroup.rotation.x = modelRotationX;
            modelGroup.rotation.y = modelRotationY;
            // 确保缩放应用正确（只在模型已加载且缩放值有效时）
            if (modelScale > 0 && Math.abs(modelGroup.scale.x - modelScale) > 0.001) {
                modelGroup.scale.set(modelScale, modelScale, modelScale);
            }
        }
        
        // 相机保持在固定位置，只调整距离
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
