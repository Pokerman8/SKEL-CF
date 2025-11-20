window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];
function preloadInterpolationImages() {
  for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
    var path = INTERP_BASE + '/' + String(i).padStart(6, '0') + '.jpg';
    interp_images[i] = new Image();
    interp_images[i].src = path;
  }
}

function setInterpolationImage(i) {
  var image = interp_images[i];
  image.ondragstart = function() { return false; };
  image.oncontextmenu = function() { return false; };
  $('#interpolation-image-wrapper').empty().append(image);
}


$(document).ready(function() {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 1,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    preloadInterpolationImages();

    $('#interpolation-slider').on('input', function(event) {
      setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $('#interpolation-slider').prop('max', NUM_INTERP_FRAMES - 1);

    bulmaSlider.attach();

    // 初始化3D模型查看器
    initModelViewers();

})

// 3D模型查看器初始化函数
function initModelViewers() {
    // OBJ文件路径配置
    const modelConfigs = [
        { containerId: 'model-viewer-1', objPath: './static/obj/01_dance_000008.obj' },
        { containerId: 'model-viewer-2', objPath: './static/obj/HSMR-pexels-willians_photography-2157111846-34620975.jpg_inst00_skel.obj' },
        { containerId: 'model-viewer-3', objPath: './static/obj/pexels-willians_photography-2157111846-34620975_skel.obj' },
        { containerId: 'model-viewer-4', objPath: './static/obj/pexels-willians_photography-2157111846-34620975_skin.obj' }
    ];

    modelConfigs.forEach(config => {
        initSingleModel(config.containerId, config.objPath);
    });
}

// 初始化单个3D模型
function initSingleModel(containerId, objPath) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 创建场景、相机、渲染器
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 添加光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 添加坐标轴辅助线（可选）
    // const axesHelper = new THREE.AxesHelper(2);
    // scene.add(axesHelper);

    // 鼠标控制（旋转、缩放、平移）
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 平滑旋转
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 10;

    // 加载OBJ模型
    const loader = new THREE.OBJLoader();
    loader.load(
        objPath,
        function(object) {
            // 计算模型边界，自动调整相机位置
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // 居中模型
            object.position.sub(center);
            
            // 计算合适的相机距离
            const maxDim = Math.max(size.x, size.y, size.z);
            const distance = maxDim * 2;
            camera.position.set(0, 0, distance);
            controls.update();
            
            // 添加简单的材质（如果没有材质）
            object.traverse(function(child) {
                if (child.isMesh) {
                    if (!child.material || !child.material.color) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xcccccc,
                            flatShading: true
                        });
                    }
                }
            });
            
            scene.add(object);
        },
        function(xhr) {
            // 加载进度（可选）
            if (xhr.lengthComputable) {
                const percentComplete = xhr.loaded / xhr.total * 100;
                // console.log('模型加载进度: ' + percentComplete.toFixed(2) + '%');
            }
        },
        function(error) {
            console.error('加载模型失败:', error);
            // 显示错误信息
            container.innerHTML = '<p style="padding: 2rem; text-align: center; color: #999;">模型加载失败</p>';
        }
    );

    // 窗口大小改变时调整渲染器
    function onWindowResize() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
    window.addEventListener('resize', onWindowResize);

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // 更新控制器
        renderer.render(scene, camera);
    }
    animate();
}
