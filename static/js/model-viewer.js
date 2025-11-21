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
    // ===== 模型大小和相机距离控制 =====
    // ⭐⭐ 版本标记：v3.0 - 修复版：固定参数，旋转修复 ⭐⭐
    // ⭐ 修改下面的值来直接控制模型大小和相机距离 ⭐
    
    // 缩放因子：直接控制模型大小（1.0 = 原始大小，2.0 = 2倍，30.0 = 30倍）
    // ⚠️ 修改 DEFAULT_SCALE 的值来改变模型大小
    const DEFAULT_SCALE = 2; // ← 改这里：模型放大倍数（建议1-50，值越大模型越大）
    const scale = options.scale !== undefined ? options.scale : DEFAULT_SCALE;
    
    // 相机距离：直接控制相机距离（固定值，不会自动计算）
    // ⚠️ 重要：距离越小，模型看起来越大；距离越大，模型看起来越小
    // ⚠️ 修改 DEFAULT_DISTANCE 的值来固定相机距离
    // 建议：设置为 2-10 左右，太小会超出视口，太大模型会很小
    const DEFAULT_DISTANCE = 5; // ← 改这里：固定相机距离（建议2-10，值越小模型越大）
    let distance = options.cameraDistance !== undefined ? options.cameraDistance : DEFAULT_DISTANCE;
    
    // ⚠️ 确保distance不会被自动计算覆盖（锁死距离值）
    const originalDistance = distance;
    
    // 输出初始参数值（用于调试）
    console.log('=== 初始化模型查看器 v3.0 ===');
    console.log('⭐ 固定相机距离模式（无自动计算）');
    console.log('📌 修复：参数固定，旋转修复');
    console.log('容器ID:', containerId);
    console.log('设置的缩放因子(scale):', scale);
    console.log('设置的相机距离(distance):', distance, '(固定值，不会改变)');
    console.log('传入的options:', options);
    console.log('=============================');
    
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
        
        // ⚠️ 重要：这里修改的是旋转角度，不是位置！
        // 左右旋转（绕Y轴）：鼠标左右移动 = 模型绕Y轴旋转
        modelRotationY += deltaX * 0.01;
        
        // 上下旋转（绕X轴）：鼠标上下移动 = 模型绕X轴旋转
        // 允许360度自由旋转，不限制角度
        modelRotationX += deltaY * 0.01;
        
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
        // 滚轮缩放：临时调整相机距离（不影响默认设置）
        // 如果需要滚轮缩放，取消下面的注释
        // 注意：这只会临时改变距离，刷新页面后会恢复默认值
        /*
        distance += event.deltaY * 0.01;
        distance = Math.max(0.5, Math.min(50, distance));
        */
        
        // 或者：调整模型缩放（推荐，不改变相机距离）
        // 使用滚轮直接缩放模型组
        if (modelGroup) {
            const scaleDelta = event.deltaY > 0 ? 0.95 : 1.05; // 每次缩放5%
            modelGroup.scale.multiplyScalar(scaleDelta);
        }
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
        
        // ⚠️ 关键：确保模型以正确的顺序居中和旋转
        // 步骤1：先添加到组中（这样可以在组坐标系中操作）
        modelGroup.add(object);
        
        // 步骤2：先应用旋转（如果需要）
        object.rotation.x = Math.PI; // 当前设置：X轴旋转180度
        
        // 步骤3：更新世界矩阵，让旋转生效
        object.updateMatrixWorld(true);
        
        // 步骤4：计算旋转后的包围盒（这样才能正确居中）
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // 步骤5：将object在modelGroup中的位置调整，使其几何中心与组原点(0,0,0)重合
        // 这是关键：将object的position设置为负的center，这样object的几何中心就在组原点
        object.position.sub(center);
        
        // 步骤6：确保modelGroup本身也在原点（旋转中心）
        modelGroup.position.set(0, 0, 0);
        
        // 步骤7：应用缩放
        modelGroup.scale.set(scale, scale, scale);
        modelGroup.updateMatrixWorld(true);
        
        // 计算模型尺寸（用于相机距离计算）
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaledMaxDim = maxDim * scale;
        
        // 验证：计算最终的包围盒中心，确保在原点
        const finalBox = new THREE.Box3().setFromObject(modelGroup);
        const finalCenter = finalBox.getCenter(new THREE.Vector3());
        console.log('✓ 模型居中验证:', {
            'object在组中的位置': {
                x: object.position.x.toFixed(4),
                y: object.position.y.toFixed(4),
                z: object.position.z.toFixed(4)
            },
            'modelGroup位置': {
                x: modelGroup.position.x.toFixed(4),
                y: modelGroup.position.y.toFixed(4),
                z: modelGroup.position.z.toFixed(4)
            },
            '最终包围盒中心': {
                x: finalCenter.x.toFixed(4),
                y: finalCenter.y.toFixed(4),
                z: finalCenter.z.toFixed(4)
            },
            '居中状态': finalCenter.length() < 0.01 ? '✓ 已完美居中' : '⚠️ 可能有偏差'
        });
        
        // ⚠️ 重要：相机距离已固定，不会自动计算
        // 使用函数开始处设置的distance值，确保不会被覆盖
        distance = originalDistance; // 强制使用原始设置的distance值
        console.log('✓ 使用固定的相机距离:', distance.toFixed(2), '(已锁定，不会被自动计算覆盖)');
        
        // 更新相机位置（确保使用最新的distance值）
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        
        // 强制渲染一次，确保变化立即显示
        renderer.render(scene, camera);
        
        // 输出调试信息，确认参数已正确应用
        console.log('=== 模型加载完成，参数设置 ===');
        console.log('缩放因子(scale):', scale);
        console.log('模型原始尺寸:', {
            x: size.x.toFixed(2),
            y: size.y.toFixed(2),
            z: size.z.toFixed(2),
            '最大维度': maxDim.toFixed(2)
        });
        console.log('缩放后的模型大小:', {
            '最大维度': scaledMaxDim.toFixed(2)
        });
        console.log('相机距离(distance):', distance.toFixed(2));
        console.log('模型组缩放:', {
            x: modelGroup.scale.x,
            y: modelGroup.scale.y,
            z: modelGroup.scale.z
        });
        console.log('相机位置:', {
            x: camera.position.x.toFixed(2),
            y: camera.position.y.toFixed(2),
            z: camera.position.z.toFixed(2)
        });
        console.log('============================');
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
            // 应用旋转到模型组（不是相机位置！）
            modelGroup.rotation.x = modelRotationX;
            modelGroup.rotation.y = modelRotationY;
            // 确保缩放始终保持正确
            if (modelGroup.scale.x !== scale) {
                modelGroup.scale.set(scale, scale, scale);
            }
        }
        
        // 使用原始设置的distance值，不受滚轮影响（如果需要）
        // 如果希望滚轮可以缩放，可以注释掉下面这行
        distance = originalDistance;
        
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
