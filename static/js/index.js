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

    // 根据GIF实际尺寸调整轮播容器大小
    function adjustCarouselHeight() {
      var carousel = document.querySelector('#layer-carousel');
      if (!carousel) return;
      
      // 查找当前活动的item（bulma-carousel使用.is-active类）
      var activeItem = carousel.querySelector('.item.is-active') || 
                       carousel.querySelector('.item:not(.is-hidden)') ||
                       carousel.querySelector('.item');
      if (!activeItem) return;
      
      var img = activeItem.querySelector('img.layer-gif');
      if (img && img.complete && img.naturalHeight && img.naturalWidth) {
        // 如果图片已加载，根据实际尺寸和容器宽度计算显示高度
        var containerWidth = carousel.offsetWidth || carousel.clientWidth;
        if (containerWidth === 0) {
          // 如果容器宽度为0，使用父容器的宽度
          containerWidth = carousel.parentElement ? carousel.parentElement.offsetWidth : window.innerWidth;
        }
        
        // 计算宽高比，保持图片比例
        var imgAspectRatio = img.naturalWidth / img.naturalHeight;
        var displayHeight = Math.min(containerWidth / imgAspectRatio, img.naturalHeight);
        
        // 设置容器高度，添加一点过渡效果
        carousel.style.transition = 'height 0.3s ease';
        carousel.style.height = displayHeight + 'px';
        carousel.style.minHeight = displayHeight + 'px';
      }
    }

    // 监听所有GIF的加载完成事件
    var layerGifs = document.querySelectorAll('img.layer-gif');
    var loadedCount = 0;
    var totalGifs = layerGifs.length;
    
    function checkAllLoaded() {
      loadedCount++;
      if (loadedCount === totalGifs) {
        // 所有图片加载完成后，延迟一点再调整（确保DOM完全渲染）
        setTimeout(adjustCarouselHeight, 100);
      }
    }
    
    layerGifs.forEach(function(img) {
      if (img.complete && img.naturalHeight > 0) {
        checkAllLoaded();
      } else {
        img.addEventListener('load', checkAllLoaded);
        img.addEventListener('error', checkAllLoaded); // 即使加载失败也继续
      }
    });

    // 监听轮播切换事件，动态调整容器高度
    var layerCarousel = document.querySelector('#layer-carousel');
    if (layerCarousel) {
      // 查找layer-carousel对应的carousel实例
      var layerCarouselInstance = null;
      for(var i = 0; i < carousels.length; i++) {
        // 尝试不同的方式查找对应的实例
        if (carousels[i].element === layerCarousel || 
            (carousels[i].element && carousels[i].element.id === 'layer-carousel') ||
            (typeof carousels[i].element === 'object' && layerCarousel.bulmaCarousel === carousels[i])) {
          layerCarouselInstance = carousels[i];
          break;
        }
      }
      
      // 如果找到了实例，监听切换事件
      if (layerCarouselInstance) {
        layerCarouselInstance.on('before:show', function(state) {
          setTimeout(adjustCarouselHeight, 150); // 延迟确保DOM更新完成
        });
      }
      
      // 使用MutationObserver作为备用方案监听DOM变化
      var observer = new MutationObserver(function(mutations) {
        var hasClassChange = mutations.some(function(mutation) {
          return mutation.type === 'attributes' && mutation.attributeName === 'class';
        });
        if (hasClassChange) {
          setTimeout(adjustCarouselHeight, 100);
        }
      });
      observer.observe(layerCarousel, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
        childList: false
      });

      // 窗口大小改变时也重新调整
      var resizeTimer;
      window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(adjustCarouselHeight, 200);
      });
      
      // 初始调整（延迟一下确保页面完全加载）
      setTimeout(adjustCarouselHeight, 300);
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

})
