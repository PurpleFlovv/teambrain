import json
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from scipy.spatial import ConvexHull
from pathlib import Path

def visualize():
    # 1. 加载数据
    script_dir = Path(__file__).resolve().parent
    json_path = script_dir / 'brain_vertices.json'
    
    if not json_path.exists():
        print(f"错误：找不到文件 {json_path}")
        return

    with open(json_path, 'r') as f:
        points = np.array(json.load(f))

    if points.shape[0] < 4:
        print("点云数量太少，无法构网。")
        return

    # 2. 创建画布
    fig = plt.figure(figsize=(16, 8))
    
    # --- 子图 1: 原始三维点图 ---
    ax1 = fig.add_subplot(121, projection='3d')
    ax1.scatter(points[:, 0], points[:, 1], points[:, 2], c='royalblue', s=10, alpha=0.8)
    ax1.set_title("3D Point Cloud (Original Samples)")
    ax1.set_xlabel("X")
    ax1.set_ylabel("Y")
    ax1.set_zlabel("Z")
    # 调整视角以便观察
    ax1.view_init(elev=20, azim=45)

    # --- 子图 2: 构网还原 (Convex Hull 策略) ---
    ax2 = fig.add_subplot(122, projection='3d')
    
    try:
        # 使用凸包算法构建网格面
        # 这是计算几何中最经典的构网策略之一，适用于还原物体的外轮廓
        hull = ConvexHull(points)
        
        # 绘制网格面 (Tri-surface)
        # points[hull.simplices] 包含了构成凸包的所有三角形面片
        ax2.plot_trisurf(points[:, 0], points[:, 1], points[:, 2], 
                        triangles=hull.simplices, 
                        color='salmon', alpha=0.5, edgecolor='darkred', linewidth=0.2)
        
        # 同时叠加上原始点，增强视觉效果
        ax2.scatter(points[:, 0], points[:, 1], points[:, 2], c='black', s=5, alpha=0.5)
        
        ax2.set_title("Restored Surface (Convex Hull Strategy)")
    except Exception as e:
        ax2.text2D(0.5, 0.5, f"Mesh Construction Failed:\n{e}", 
                   transform=ax2.transAxes, ha='center')

    ax2.set_xlabel("X")
    ax2.set_ylabel("Y")
    ax2.set_zlabel("Z")
    ax2.view_init(elev=20, azim=45)

    # 3. 保存并展示
    plt.tight_layout()
    output_img = script_dir / 'brain_visualization.png'
    plt.savefig(output_img, dpi=150)
    print(f"可视化结果已保存至: {output_img}")
    plt.show()

if __name__ == "__main__":
    visualize()