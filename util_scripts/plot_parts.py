import json
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from pathlib import Path

def visualize_partitions():
    script_dir = Path(__file__).resolve().parent
    json_path = script_dir / 'brain_vertices.json'
    
    if not json_path.exists():
        print(f"错误：找不到文件 {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        partitions = json.load(f)

    # 创建画布
    fig = plt.figure(figsize=(12, 10))
    ax = fig.add_subplot(111, projection='3d')
    
    # 遍历每个分区
    for part in partitions:
        name = part.get("part_name", "Unknown")
        color_rgba = part.get("color", [0, 0, 0, 255])
        
        # 将 RGBA [0-255] 转换为 Matplotlib 需要的 [0-1] 格式
        c_mapped = [c / 255.0 for c in color_rgba]
        
        points = np.array(part["points"])
        if len(points) == 0:
            continue
        
        # 绘制该分区的点云，alpha 设置小一点以展示“内部结构”
        ax.scatter(points[:, 0], points[:, 1], points[:, 2], 
                   color=c_mapped, s=2, alpha=0.3, label=name)

    ax.set_title("Volumetric Brain Point Cloud (5 Partitions)")
    ax.set_xlabel("X")
    ax.set_ylabel("Y")
    ax.set_zlabel("Z")
    
    # 将图例放到外面
    ax.legend(loc='center left', bbox_to_anchor=(1.05, 0.5))
    ax.view_init(elev=20, azim=45)

    plt.tight_layout()
    output_img = script_dir / 'brain_partitions_volumetric.png'
    plt.savefig(output_img, dpi=150, bbox_inches='tight')
    print(f"分区可视化结果已保存至: {output_img}")
    plt.show()

if __name__ == "__main__":
    visualize_partitions()