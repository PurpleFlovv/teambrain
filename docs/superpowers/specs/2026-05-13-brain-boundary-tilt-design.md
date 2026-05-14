# 脑区分界线倾斜调整

## 概述

将 gen_points.py 中 classify_point 的脑区分界线从与坐标轴平行的固定阈值改为随 Y 轴（上下方向）变化的倾斜边界，参考真实神经解剖沟/裂走行方向。

## 解剖依据

| 分界线 | 解剖对应 | 走行方向 |
|--------|---------|---------|
| 前额叶/额叶 | 前中央沟前部 | 顶部略后倾 |
| 额叶/顶叶 | 中央沟 | 底部大幅前倾 |
| 顶叶/枕叶 | 顶枕沟 | 顶部更靠后 |
| 颞叶上界 | 外侧裂 | 前下方向后上方 |

## classify_point 修改

```python
# 倾斜边界（z 阈值随 y_norm 变化）
z_occipital  = 0.28 - 0.12 * y_norm   # 顶枕沟: 顶0.16, 底0.28
z_central    = 0.50 - 0.16 * y_norm   # 中央沟:  顶0.34, 底0.50
z_prefrontal = 0.70 - 0.10 * y_norm   # 前额叶:  顶0.60, 底0.70
y_temporal   = 0.36 + 0.14 * z_norm   # 外侧裂:  前0.46, 后0.39

# 分类
if y_norm < y_temporal and x_abs > 0.08 and z_norm > z_occipital:
    return 'temporal'
elif z_norm > z_prefrontal:
    return 'prefrontal'
elif z_norm > z_central:
    return 'frontal'
elif z_norm > z_occipital:
    return 'parietal'
else:
    return 'occipital'
```

## 标签修改

- 脑区名称 `额叶` → `额叶后部`（修改 gen_points.py REGIONS 和 data.sql）
- data.sql: `INSERT IGNORE INTO brain_region ... (2, '额叶后部', ...)` 或更安全地用 `ON DUPLICATE KEY UPDATE`

## 影响范围

- `util_scripts/gen_points.py` — classify_point 函数、REGIONS 字典
- `backend/src/main/resources/brain_points_labeled.json` — 重新生成
- `backend/src/main/resources/data.sql` — 脑区名称更新
- 数据库 — 重新导入点云（brain_region 名称需先更新）

## 验证

重新运行 gen_points.py 观察 6 区点云分布，重建后浏览器查看分区边界是否符合解剖预期。
