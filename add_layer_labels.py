from PIL import Image, ImageDraw, ImageFont
import os

def add_layer_labels_to_gif(input_gif_path, output_gif_path, layer_labels):
    """
    在GIF的每一帧右上角添加Layer标签
    
    Args:
        input_gif_path: 输入GIF文件路径
        output_gif_path: 输出GIF文件路径
        layer_labels: 标签列表，例如 ['Layer_1', 'Layer_2', ...]
    """
    # 打开GIF文件
    gif = Image.open(input_gif_path)
    
    frames = []
    durations = []
    
    # 获取字体（如果系统有的话，否则使用默认字体）
    try:
        # 尝试使用系统字体
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
    except:
        try:
            # Windows系统字体
            font = ImageFont.truetype("arial.ttf", 40)
        except:
            # 使用默认字体
            font = ImageFont.load_default()
    
    frame_count = 0
    
    try:
        while True:
            # 复制当前帧并转换为RGBA模式（支持透明度）
            frame = gif.copy()
            if frame.mode != 'RGBA':
                frame = frame.convert('RGBA')
            
            # 创建绘图对象
            draw = ImageDraw.Draw(frame)
            
            # 获取帧的尺寸
            width, height = frame.size
            
            # 确定要显示的标签（循环使用标签列表）
            if frame_count < len(layer_labels):
                label = layer_labels[frame_count]
            else:
                # 如果帧数超过标签数，循环使用
                label = layer_labels[frame_count % len(layer_labels)]
            
            # 计算文字位置（右上角，留一些边距）
            text = label
            # 获取文字边界框
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # 设置位置（右上角，留10像素边距）
            x = width - text_width - 10
            y = 10
            
            # 绘制文字背景（半透明白色矩形，增加可读性）
            padding = 5
            # 创建半透明背景层
            overlay = Image.new('RGBA', frame.size, (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            overlay_draw.rectangle(
                [x - padding, y - padding, x + text_width + padding, y + text_height + padding],
                fill=(255, 255, 255, 200),  # 半透明白色
                outline=(0, 0, 0, 255)  # 黑色边框
            )
            # 将背景层合成到原图上
            frame = Image.alpha_composite(frame, overlay)
            draw = ImageDraw.Draw(frame)
            
            # 绘制文字（黑色）
            draw.text((x, y), text, fill=(0, 0, 0, 255), font=font)
            
            frames.append(frame)
            
            # 获取当前帧的持续时间
            duration = gif.info.get('duration', 100)  # 默认100ms
            durations.append(duration)
            
            frame_count += 1
            
            # 移动到下一帧
            try:
                gif.seek(gif.tell() + 1)
            except EOFError:
                break
                
    except EOFError:
        pass
    
    # 保存新的GIF
    if frames:
        # 将RGBA模式转换回P模式（调色板模式）以保存为GIF
        frames_p = []
        for frame in frames:
            if frame.mode == 'RGBA':
                # 转换为RGB，然后转换为P模式
                rgb_frame = Image.new('RGB', frame.size, (255, 255, 255))
                rgb_frame.paste(frame, mask=frame.split()[3])  # 使用alpha通道作为mask
                frames_p.append(rgb_frame.convert('P', palette=Image.ADAPTIVE))
            else:
                frames_p.append(frame.convert('P', palette=Image.ADAPTIVE))
        
        frames_p[0].save(
            output_gif_path,
            save_all=True,
            append_images=frames_p[1:],
            duration=durations,
            loop=0,  # 无限循环
            optimize=False
        )
        print(f"成功处理 {frame_count} 帧，保存到: {output_gif_path}")
    else:
        print("错误：没有提取到任何帧")


if __name__ == "__main__":
    # 输入和输出路径
    input_gif = "/mnt/data1/SKEL_project/project-page/SKEL-CF/static/images/per-layer-1.gif"
    output_gif = "/mnt/data1/SKEL_project/project-page/SKEL-CF/static/images/per-layer-1-labeled.gif"
    
    # Layer标签列表
    layer_labels = ['Layer_1', 'Layer_2', 'Layer_3', 'Layer_4', 'Layer_5', 'Layer_6']
    
    # 处理GIF
    add_layer_labels_to_gif(input_gif, output_gif, layer_labels)
    
    print("处理完成！")

