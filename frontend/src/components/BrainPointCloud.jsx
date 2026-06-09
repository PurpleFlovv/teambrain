import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';

const BrainPointCloud = ({ brainPoints, regions, team, nodes, connRules, onRefresh }) => {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const tooltipRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredObjectRef = useRef(null);
  const originalMaterialsRef = useRef(new Map());
  const [representativeNodes, setRepresentativeNodes] = useState([]);
  const representativeNodesRef = useRef([]);
  const [connectedNodes, setConnectedNodes] = useState([]);
  const [isNodeListExpanded, setIsNodeListExpanded] = useState(false);
  const connectionLinesRef = useRef([]);
  const flowParticlesRef = useRef([]);
  const highlightedNodeRef = useRef(null);
  const [showConnections, setShowConnections] = useState(true);
  const showConnectionsRef = useRef(true);
  const activeFlowParticlesRef = useRef([]);
  const mouseDownPos = useRef({ x: 0, y: 0 });

  const [isSaving, setIsSaving] = useState(false);
  // 添加UI准备状态
  const [uiReady, setUiReady] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Mobile drawer state
  const [drawerTab, setDrawerTab] = useState(0);
  const [drawerHeight, setDrawerHeight] = useState(window.innerHeight * 0.2);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartHeight, setTouchStartHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrawerTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartX(e.touches[0].clientX);
    setTouchStartHeight(drawerHeight);
    setIsDragging(true);
  };

  const handleDrawerTouchMove = (e) => {
    if (!isDragging) return;
    const dy = touchStartY - e.touches[0].clientY;
    const dx = e.touches[0].clientX - touchStartX;
    const newHeight = touchStartHeight + dy;
    const maxH = window.innerHeight * 0.5;
    const minH = 48;
    if (Math.abs(dy) > Math.abs(dx) && newHeight > minH && newHeight < maxH) {
      setDrawerHeight(newHeight);
    }
  };

  const handleDrawerTouchEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      setDrawerTab(dx > 0 ? 0 : 1);
    }
  };

  // 脑区信息数据 - 从 nodes prop 和 regions prop 构建
  const brainRegionInfo = useMemo(() => {
    const info = {};
    // Initialize all brain regions with empty arrays
    if (regions) {
      regions.forEach(r => { info[r.id] = []; });
    }
    // Fill in from nodes
    if (nodes) {
      nodes.forEach(node => {
        const rid = node.brainRegionId;
        if (!info[rid]) info[rid] = [];
        info[rid].push({ id: node.id, name: node.name, description: node.description || '' });
      });
    }
    return info;
  }, [nodes, regions]);

  // 定义连接规则（用节点名匹配，兼容策略服务和手动连接两种格式）
  const connectionRules = useMemo(() => (connRules || [])
    .filter(c => c.fromNodeName)
    .map(c => ({
      from: [c.fromNodeName],
      to: c.toNodeName && c.toNodeName !== '*' ? [c.toNodeName] : '*',
      type: c.connectionType,
      color: c.colorHex ? parseInt(c.colorHex.replace('#', ''), 16) : 0xffffff,
      width: c.lineWidth || 0.02,
      flowColor: c.flowColorHex ? parseInt(c.flowColorHex.replace('#', ''), 16) : 0xffffff,
      opacity: c.opacity || 0.5,
    })), [connRules]);

  // 连接类型图例（从策略服务数据动态生成）
  const connectionLegend = useMemo(() => {
    const seen = new Set();
    return (connRules || []).filter(c => {
      const key = c.connectionType;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(c => ({
      type: c.connectionType,
      name: c.connectionType || c.strategy || '连接',
      color: c.colorHex || '#ffffff',
    }));
  }, [connRules]);

  // 创建代表节点
  const createRepresentativeNodes = (pointMeshes) => {
    // 收集所有信息条目
    const infoEntries = new Set();
    const infoToPointsMap = new Map();

    // 遍历所有光点，收集信息条目
    pointMeshes.forEach(mesh => {
      const { infoName } = mesh.userData;
      infoEntries.add(infoName);

      if (!infoToPointsMap.has(infoName)) {
        infoToPointsMap.set(infoName, []);
      }
      infoToPointsMap.get(infoName).push(mesh);
    });

    // 为每个信息条目创建代表节点
    const representativeNodes = [];
    infoEntries.forEach(infoName => {
      const pointsWithInfo = infoToPointsMap.get(infoName);
      if (pointsWithInfo && pointsWithInfo.length > 0) {
        // 随机选择一个光点作为代表节点
        const randomIndex = Math.floor(Math.random() * pointsWithInfo.length);
        const representativePoint = pointsWithInfo[randomIndex];

        // 创建代表节点数据
        const representativeNode = {
          infoKey: infoName,
          brainRegionId: representativePoint.userData.brainRegionId,
          position: {
            x: representativePoint.position.x,
            y: representativePoint.position.y,
            z: representativePoint.position.z
          },
          color: representativePoint.userData.partitionColor.getHex(),
          partitionIndex: representativePoint.userData.partitionIndex,
          description: representativePoint.userData.infoDescription
        };

        representativeNodes.push(representativeNode);

        // 为光点添加infoKey属性
        representativePoint.userData.infoKey = infoName;
      }
    });

    // 保存代表节点列表
    setRepresentativeNodes(representativeNodes);
    representativeNodesRef.current = representativeNodes;

    // 输出代表节点列表到控制台
    console.log("代表节点列表:", representativeNodes);

    return representativeNodes;
  };

  // 创建全光点动态神经连接
  const createDynamicConnections = (pointMeshes) => {
    // 清空现有连接线和流动粒子
    connectionLinesRef.current.forEach(line => {
      sceneRef.current.remove(line);
    });
    flowParticlesRef.current.forEach(particle => {
      sceneRef.current.remove(particle.mesh);
      // 清理拖尾粒子
      if (particle.tailParticles) {
        particle.tailParticles.forEach(tail => sceneRef.current.remove(tail));
      }
    });
    connectionLinesRef.current = [];
    flowParticlesRef.current = [];

    // 建立连接池
    const connectionPool = [];
    const connectionSet = new Set(); // 用于去重

    // 遍历所有光点
    pointMeshes.forEach((startPoint, startIdx) => {
      const startInfoKey = startPoint.userData.infoKey;

      // 查找适用的连接规则
      connectionRules.forEach(rule => {
        if (rule.from.includes(startInfoKey)) {
          let targetInfoKeys = [];

          if (rule.to === "*") {
            // 如果是 "*"，连接到所有其他节点
            targetInfoKeys = [...new Set(pointMeshes.map(p => p.userData.infoKey))].filter(key => key !== startInfoKey);
          } else {
            // 否则连接到指定的节点
            targetInfoKeys = rule.to.filter(key => key !== startInfoKey);
          }

          // 性能控制：每个光点最多与3个不同的目标infoKey建立连接
          if (targetInfoKeys.length > 3) {
            // 随机选择3个
            const shuffled = [...targetInfoKeys].sort(() => 0.5 - Math.random());
            targetInfoKeys = shuffled.slice(0, 3);
          }

          // 为每个目标infoKey寻找连接目标
          targetInfoKeys.forEach(targetInfoKey => {
            // 找到所有具有目标infoKey的光点
            const targetPoints = pointMeshes.filter(p => p.userData.infoKey === targetInfoKey);

            if (targetPoints.length > 0) {
              // 性能控制：如果目标光点数量超过10，随机选择10个
              let candidateTargets = targetPoints;
              if (targetPoints.length > 10) {
                candidateTargets = [...targetPoints].sort(() => 0.5 - Math.random()).slice(0, 10);
              }

              // 随机选择一个目标光点（排除自身）
              const validTargets = candidateTargets.filter(p => p !== startPoint);
              if (validTargets.length > 0) {
                const endPoint = validTargets[Math.floor(Math.random() * validTargets.length)];
                const endIdx = pointMeshes.indexOf(endPoint);

                // 使用Set去重，确保同一对光点之间只有一条线
                const connectionKey1 = `${startIdx}_${endIdx}`;
                const connectionKey2 = `${endIdx}_${startIdx}`;

                if (!connectionSet.has(connectionKey1) && !connectionSet.has(connectionKey2)) {
                  connectionSet.add(connectionKey1);
                  connectionPool.push({
                    startPoint,
                    endPoint,
                    rule,
                    startIdx,
                    endIdx
                  });
                }
              }
            }
          });
        }
      });
    });

    // 性能控制：最终生成的连线总数量应控制在2000条以内
    let finalConnections = connectionPool;
    if (connectionPool.length > 2000) {
      finalConnections = [...connectionPool].sort(() => 0.5 - Math.random()).slice(0, 2000);
    }

    // 生成连接线
    finalConnections.forEach(connection => {
      const { startPoint, endPoint, rule } = connection;
      const { type, color, width, flowColor, opacity = 0.8 } = rule;

      // LOD: distance-based rendering - skip very far connections, simplify medium distance
      const lodMidPoint = new THREE.Vector3(
        (startPoint.position.x + endPoint.position.x) / 2,
        (startPoint.position.y + endPoint.position.y) / 2,
        (startPoint.position.z + endPoint.position.z) / 2
      );
      const dist = cameraRef.current ? cameraRef.current.position.distanceTo(lodMidPoint) : 0;

      if (dist > 30) return; // Skip very far connections

      if (dist > 15) {
        // Simple line for medium distance (no TubeGeometry, no particles)
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          startPoint.position, endPoint.position
        ]);
        const colorHex = typeof color === 'number' ? color : parseInt(String(color), 10);
        const lineMat = new THREE.LineBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: (opacity || 0.5) * 0.3,
        });
        const simpleLine = new THREE.Line(lineGeo, lineMat);
        simpleLine.userData = {
          from: startPoint.userData.infoKey,
          to: endPoint.userData.infoKey,
          type,
          startPoint: startPoint,
          endPoint: endPoint,
          originalOpacity: (opacity || 0.5) * 0.3
        };
        sceneRef.current?.add(simpleLine);
        connectionLinesRef.current.push(simpleLine);
        return; // Don't create flow particles for LOD lines
      }

      // 创建曲线
      const points = [
        new THREE.Vector3(startPoint.position.x, startPoint.position.y, startPoint.position.z),
        new THREE.Vector3(endPoint.position.x, endPoint.position.y, endPoint.position.z)
      ];

      // 添加中间点使曲线更自然
      const midPoint = new THREE.Vector3(
        (startPoint.position.x + endPoint.position.x) / 2 + (Math.random() - 0.5) * 0.2,
        (startPoint.position.y + endPoint.position.y) / 2 + (Math.random() - 0.5) * 0.2,
        (startPoint.position.z + endPoint.position.z) / 2 + (Math.random() - 0.5) * 0.2
      );
      points.splice(1, 0, midPoint);

      const curve = new THREE.CatmullRomCurve3(points);
      const curvePoints = curve.getPoints(50);
      const geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(curvePoints),
        50,
        0.003, // 将线条宽度改为最细
        8,
        false
      );

      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: opacity,
        side: THREE.DoubleSide
      });

      const line = new THREE.Mesh(geometry, material);
      line.userData = {
        from: startPoint.userData.infoKey,
        to: endPoint.userData.infoKey,
        type,
        startPoint: startPoint,
        endPoint: endPoint,
        originalOpacity: opacity // 保存原始透明度
      };
      sceneRef.current.add(line);
      connectionLinesRef.current.push(line);

      // 创建流动粒子（但不立即激活）
      const particleGeometry = new THREE.SphereGeometry(0.003 * 3, 12, 12); // 增大流动光点半径为线条宽度的3倍
      const particleColor = new THREE.Color(flowColor);
      // 提高亮度
      particleColor.offsetHSL(0, 0, 0.3);

      const particleMaterial = new THREE.MeshBasicMaterial({
        color: particleColor,
        transparent: true,
        opacity: 1.0,
        emissive: particleColor, // 添加自发光
        emissiveIntensity: 0.8 // 设置自发光强度
      });

      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      sceneRef.current.add(particle);

      // 创建拖尾粒子（增加到8个）
      const tailParticles = [];
      for (let i = 0; i < 8; i++) {
        const tailGeometry = new THREE.SphereGeometry(0.003 * 2.5, 8, 8);
        const tailMaterial = new THREE.MeshBasicMaterial({
          color: particleColor,
          transparent: true,
          opacity: 0.6 - i * 0.07 // 更平滑的透明度递减
        });
        const tailParticle = new THREE.Mesh(tailGeometry, tailMaterial);
        sceneRef.current.add(tailParticle);
        tailParticles.push(tailParticle);
      }

      flowParticlesRef.current.push({
        mesh: particle,
        curve: curve,
        speed: 0.01 + Math.random() * 0.01, // 加快速度到0.01-0.02之间
        progress: Math.random(), // 随机起始位置
        direction: 1, // 1表示从from到to，-1表示从to到from
        tailParticles: tailParticles,
        tailPositions: [],
        isActive: false // 默认不激活流动
      });
    });

    // 在控制台输出生成的连接总数
    console.log(`生成的连接总数: ${finalConnections.length}`);
  };

  // 清除所有流动粒子
  const clearAllFlowParticles = () => {
    activeFlowParticlesRef.current.forEach(particle => {
      // 从场景中移除流动粒子网格
      if (particle.mesh && sceneRef.current) {
        sceneRef.current.remove(particle.mesh);
      }

      // 从场景中移除拖尾粒子
      if (particle.tailParticles && sceneRef.current) {
        particle.tailParticles.forEach(tail => {
          sceneRef.current.remove(tail);
        });
      }
    });

    // 清空活动粒子数组
    activeFlowParticlesRef.current = [];
  };

  // 启动指定节点的流动动画
  const startFlowAnimation = (nodeKey) => {
    // 先清除所有现有的流动粒子
    clearAllFlowParticles();

    // 找到与指定节点相关的连接线
    const relatedConnections = connectionLinesRef.current.filter(line => {
      return line.userData.from === nodeKey || line.userData.to === nodeKey;
    });

    // 启动相关连接线的流动动画
    relatedConnections.forEach(connection => {
      // 找到对应的流动粒子
      const flowParticle = flowParticlesRef.current.find(particle => {
        return (
          (particle.curve.points[0].distanceTo(connection.userData.startPoint.position) < 0.01 &&
           particle.curve.points[particle.curve.points.length - 1].distanceTo(connection.userData.endPoint.position) < 0.01) ||
          (particle.curve.points[0].distanceTo(connection.userData.endPoint.position) < 0.01 &&
           particle.curve.points[particle.curve.points.length - 1].distanceTo(connection.userData.startPoint.position) < 0.01)
        );
      });

      if (flowParticle) {
        flowParticle.isActive = true;
        flowParticle.progress = 0; // 重置进度
        flowParticle.direction = connection.userData.from === nodeKey ? 1 : -1; // 设置流动方向
        activeFlowParticlesRef.current.push(flowParticle);
      }
    });
  };

  // 高亮显示与指定节点相关的连接线
  const highlightConnections = (nodeKey) => {
    // 重置所有连接线透明度
    connectionLinesRef.current.forEach(line => {
      line.material.opacity = line.userData.originalOpacity || 0.8;
    });

    // 如果点击的是同一个节点，取消高亮
    if (highlightedNodeRef.current === nodeKey) {
      highlightedNodeRef.current = null;
      setIsNodeListExpanded(false);
      // 停止所有流动动画
      clearAllFlowParticles();
      return;
    }

    // 设置新的高亮节点
    highlightedNodeRef.current = nodeKey;
    setIsNodeListExpanded(true);

    // 高亮相关连接线，非相关连接线降低透明度
    connectionLinesRef.current.forEach(line => {
      const { from, to } = line.userData;
      if (from === nodeKey || to === nodeKey) {
        line.material.opacity = 1.0;
      } else {
        line.material.opacity = 0.3; // 降低非相关连接线透明度
      }
    });

    // 启动流动动画
    startFlowAnimation(nodeKey);

    // 更新相关节点列表
    const connectedNodesList = [];
    connectionLinesRef.current.forEach(line => {
      const { from, to, type } = line.userData;
      if (from === nodeKey) {
        const connectedNode = representativeNodesRef.current.find(node => node.infoKey === to);
        if (connectedNode) {
          connectedNodesList.push({ ...connectedNode, connectionType: type });
        }
      } else if (to === nodeKey) {
        const connectedNode = representativeNodesRef.current.find(node => node.infoKey === from);
        if (connectedNode) {
          connectedNodesList.push({ ...connectedNode, connectionType: type });
        }
      }
    });

    setConnectedNodes(connectedNodesList);
  };

  // 切换连接线显示状态
  const toggleConnectionsVisibility = (visible) => {
    connectionLinesRef.current.forEach(line => {
      line.visible = visible;
    });

    flowParticlesRef.current.forEach(particle => {
      particle.mesh.visible = visible;
      if (particle.tailParticles) {
        particle.tailParticles.forEach(tail => {
          tail.visible = visible;
        });
      }
    });
  };


  useEffect(() => {
    if (!mountRef.current || !brainPoints || brainPoints.length === 0) return;

    // Mobile: downsample points to prevent GPU crash
    const renderPoints = isMobile && brainPoints.length > 600
      ? brainPoints.filter((_, i) => i % Math.ceil(brainPoints.length / 600) === 0)
      : brainPoints;

    // 场景、相机、渲染器
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // 调整相机位置，让大脑朝前而不是纵向
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost, pausing render');
    });
    mountRef.current.appendChild(renderer.domElement);

    // 控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    // 创建点云(使用单独的球体 Mesh)
    const createPointCloud = () => {
      const localPointMeshes = [];

      // Group brainPoints by regionId
      const pointsByRegion = {};
      renderPoints.forEach(p => {
        if (!pointsByRegion[p.regionId]) {
          pointsByRegion[p.regionId] = { points: [], color: p.colorHex, name: p.regionName };
        }
        pointsByRegion[p.regionId].points.push([p.x, p.y, p.z]);
      });

      // 统计每个脑区的光点数量和信息条目分布
      const partitionStats = {};
      Object.keys(pointsByRegion).forEach(regionId => {
        partitionStats[regionId] = {
          pointCount: pointsByRegion[regionId].points.length,
          infoDistribution: {}
        };
      });

      Object.entries(pointsByRegion).forEach(([regionId, regionData]) => {
        const partitionIndex = parseInt(regionId);
        const r = parseInt(regionData.color.slice(1, 3), 16);
        const g = parseInt(regionData.color.slice(3, 5), 16);
        const b = parseInt(regionData.color.slice(5, 7), 16);
        const pointColor = new THREE.Color(r / 255, g / 255, b / 255);

        regionData.points.forEach((point, pointIndex) => {
          // 调整点的坐标，让大脑朝前
          // 交换Y和Z轴，让大脑从前到后而不是从上到下
          const x = point[0];
          const y = point[2];
          const z = point[1];

          // 创建球体几何体 - 减小半径从0.05到0.03
          const segments = isMobile ? 8 : 16;
          const geometry = new THREE.SphereGeometry(0.02, segments, segments); // 进一步减小半径

          // 创建材质 - 增加基础亮度
          const material = new THREE.MeshPhongMaterial({
            color: pointColor,
            transparent: true,
            opacity: 0.9, // 增加不透明度
            shininess: 30,
            emissive: pointColor.clone().multiplyScalar(0.5), // 增加自发光，使用点本身的颜色
            emissiveIntensity: 0.5 // 设置自发光强度
          });

          // 创建网格对象
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(x, y, z);

          // 为每个点分配脑区信息（从 nodes prop，按 brainRegionId 匹配）
          const regionNodes = nodes.filter(n => n.brainRegionId === parseInt(regionId));
          const randomNode = regionNodes.length > 0
            ? regionNodes[Math.floor(Math.random() * regionNodes.length)]
            : { name: regionData.name || '未分配', description: '' };

          sphere.userData = {
            partitionIndex,
            partitionName: regionData.name,
            partitionColor: pointColor,
            infoName: randomNode.name,
            infoDescription: randomNode.description || '',
            infoKey: randomNode.name || `unassigned_${pointIndex}`,
            brainRegionId: partitionIndex
          };

          // 更新统计信息
          if (!partitionStats[regionId].infoDistribution[randomNode.name]) {
            partitionStats[regionId].infoDistribution[randomNode.name] = 0;
          }
          partitionStats[regionId].infoDistribution[randomNode.name]++;

          scene.add(sphere);
          localPointMeshes.push(sphere);

          // 保存原始材质以便恢复
          originalMaterialsRef.current.set(sphere.uuid, {
            color: pointColor.clone(),
            emissive: pointColor.clone().multiplyScalar(0.5), // 更新原始emissive值
            scale: 1
          });
        });
      });

      // 输出统计信息到控制台
      console.log("脑区光点数量和信息条目分布情况:");
      Object.keys(partitionStats).forEach(partitionIndex => {
        const stats = partitionStats[partitionIndex];
        console.log(`脑区 ${partitionIndex}:`);
        console.log(`  光点总数: ${stats.pointCount}`);
        console.log(`  信息条目分布:`);
        Object.keys(stats.infoDistribution).forEach(infoName => {
          console.log(`    ${infoName}: ${stats.infoDistribution[infoName]} 个光点`);
        });
      });

      // 创建代表节点
      const representativeNodes = createRepresentativeNodes(localPointMeshes);

      // 创建全光点动态神经连接
      createDynamicConnections(localPointMeshes);
      if (!showConnectionsRef.current) {
        toggleConnectionsVisibility(false);
      }

      // 保存光点网格引用（local variable, no state needed since no edit/regen)
      // setPointMeshes removed - dead code

      // 大脑渲染完成后，设置UI准备状态
      setTimeout(() => {
        setUiReady(true);
      }, 500);

      return localPointMeshes;
    };

    // 添加星空背景 - 增强星光效果
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    const starSizes = [];
    const starColors = [];

    // 减少星星数量：桌面4000，移动端500
    const starCount = isMobile ? 200 : 4000;
    for (let i = 0; i < starCount; i++) {
      // 扩大分布范围到±150
      starVertices.push((Math.random() - 0.5) * 300);
      starVertices.push((Math.random() - 0.5) * 300);
      starVertices.push((Math.random() - 0.5) * 300);

      // 随机大小，少数星星更大更亮
      let size = 0.08; // 基础大小增加到0.08
      if (Math.random() < 0.1) { // 10%的星星更大
        size = 0.15 + Math.random() * 0.1;
      }
      starSizes.push(size);

      // 颜色：大多数为蓝白色，少数为纯白色
      if (Math.random() < 0.8) {
        // 蓝白色星星
        starColors.push(0.53, 0.67, 1.0); // 0x88aaff
      } else {
        // 纯白色星星
        starColors.push(1.0, 1.0, 1.0);
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starVertices), 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(starSizes), 1));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(starColors), 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1, // 这个值会被每个顶点的size属性覆盖
      vertexColors: true,
      transparent: true,
      opacity: 0.9, // 增加不透明度
      sizeAttenuation: true
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // 光照(帮助点云颜色显示) - 增强光照
    const ambientLight = new THREE.AmbientLight(0x606060, 0.8); // 增强环境光强度
    scene.add(ambientLight);
    const blueLight = new THREE.PointLight(0x00aaff, 2.0, 100); // 增强点光源强度
    blueLight.position.set(0, 10, 10);
    scene.add(blueLight);
    const redLight = new THREE.PointLight(0xff00aa, 1.5, 100); // 添加额外光源
    redLight.position.set(10, 0, 10);
    scene.add(redLight);

    // 生成点云
    const localPointMeshes = createPointCloud();

    // WASD移动控制 - 修改为仅W/S上下移动
    const moveSpeed = 0.1;
    const keys = {};

    const handleKeyDown = (event) => {
      keys[event.key.toLowerCase()] = true;
    };

    const handleKeyUp = (event) => {
      keys[event.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const moveCamera = () => {
      if (!cameraRef.current) return;

      const camera = cameraRef.current;

      // 仅保留W/S键的上下移动控制
      if (keys['w']) {
        camera.position.y += moveSpeed;
      }
      if (keys['s']) {
        camera.position.y -= moveSpeed;
      }
      // 移除了A/D键的水平移动控制
    };

    // 鼠标交互处理
    const handleMouseMove = (event) => {
      // 更新鼠标位置
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // 更新工具提示位置
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${event.clientX + 10}px`;
        tooltipRef.current.style.top = `${event.clientY + 10}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 创建工具提示元素
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed z-50 px-4 py-3 text-sm text-white bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-lg pointer-events-none opacity-0 transition-opacity duration-200';
    tooltip.style.fontFamily = 'sans-serif';
    tooltip.style.fontSize = '14px';
    tooltip.style.maxWidth = '300px';
    tooltip.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
    tooltip.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    tooltip.style.background = 'rgba(255, 255, 255, 0.05)';
    tooltip.style.backdropFilter = 'blur(10px)';
    tooltip.style.borderRadius = '12px';
    tooltip.style.color = '#ffffff';
    tooltip.style.fontWeight = '500';
    tooltip.style.lineHeight = '1.5';
    tooltip.style.letterSpacing = '0.025em';
    document.body.appendChild(tooltip);
    tooltipRef.current = tooltip;

    // 动画循环
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // 更新流动粒子（仅更新活动的粒子，移动端跳过）
      if (!isMobile) activeFlowParticlesRef.current.forEach(particle => {
        if (!particle.isActive) return;

        // 更新粒子位置
        particle.progress += particle.speed * particle.direction;

        // 如果粒子到达终点，反向移动
        if (particle.progress > 1) {
          particle.progress = 1;
          particle.direction = -1;
        } else if (particle.progress < 0) {
          particle.progress = 0;
          particle.direction = 1;
        }

        // 设置粒子位置
        const position = particle.curve.getPoint(particle.progress);
        particle.mesh.position.copy(position);

        // 更新拖尾粒子
        if (particle.tailParticles) {
          // 保存当前位置到历史记录
          particle.tailPositions.push(position.clone());

          // 保持历史记录长度
          if (particle.tailPositions.length > 8) {
            particle.tailPositions.shift();
          }

          // 更新拖尾粒子位置
          for (let i = 0; i < particle.tailParticles.length; i++) {
            const tailIndex = particle.tailPositions.length - 2 - i;
            if (tailIndex >= 0) {
              particle.tailParticles[i].position.copy(particle.tailPositions[tailIndex]);
              particle.tailParticles[i].visible = true;
            } else {
              particle.tailParticles[i].visible = false;
            }
          }
        }
      });

      // 更新射线投射器
      if (cameraRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

        // 检测与点的相交
        const intersects = raycasterRef.current.intersectObjects(localPointMeshes);

        // 如果当前有悬停的对象，先恢复其状态
        if (hoveredObjectRef.current && intersects.length === 0) {
          const originalData = originalMaterialsRef.current.get(hoveredObjectRef.current.uuid);
          if (originalData) {
            hoveredObjectRef.current.scale.setScalar(originalData.scale);
            hoveredObjectRef.current.material.emissive.copy(originalData.emissive);
            hoveredObjectRef.current.material.opacity = 0.9; // 更新恢复值
          }
          hoveredObjectRef.current = null;
          tooltip.style.opacity = '0';
        }

        // 如果有新的相交对象
        if (intersects.length > 0) {
          const intersectedObject = intersects[0].object;

          // 如果这是一个新的对象
          if (intersectedObject !== hoveredObjectRef.current) {
            // 恢复之前悬停对象的状态
            if (hoveredObjectRef.current) {
              const originalData = originalMaterialsRef.current.get(hoveredObjectRef.current.uuid);
              if (originalData) {
                hoveredObjectRef.current.scale.setScalar(originalData.scale);
                hoveredObjectRef.current.material.emissive.copy(originalData.emissive);
                hoveredObjectRef.current.material.opacity = 0.9; // 更新恢复值
              }
            }

            // 设置新悬停对象的状态
            intersectedObject.scale.setScalar(1.5);
            intersectedObject.material.emissive.set(0x444444);
            intersectedObject.material.opacity = 1.0;

            // 更新工具提示内容
            if (tooltipRef.current) {
              const { infoName, infoDescription, partitionColor } = intersectedObject.userData;
              tooltipRef.current.innerHTML = `
                <div class="flex flex-col space-y-2">
                  <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${partitionColor.getStyle()}"></div>
                    <span class="font-bold">${infoName}</span>
                  </div>
                  <div class="text-xs opacity-90">${infoDescription}</div>
                </div>
              `;
              tooltipRef.current.style.opacity = '1';
            }

            hoveredObjectRef.current = intersectedObject;
          }
        }
      }

      controls.update(); // 更新控制器
      moveCamera(); // 更新相机位置
      renderer.render(scene, camera);
    };
    animate();

    // 窗口适配
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    // 点击事件处理 - mousedown + mouseup 配合，拖拽时不触发
    const handleMouseDown = (event) => {
      mouseDownPos.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = (event) => {
      // 拖拽距离超过阈值则不触发点击
      const dx = event.clientX - mouseDownPos.current.x;
      const dy = event.clientY - mouseDownPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 3) return;

      // 更新鼠标位置
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // 更新射线投射器
      if (cameraRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

        // 检测与代表节点的相交
        const intersects = raycasterRef.current.intersectObjects(localPointMeshes);

        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          const nodeKey = clickedObject.userData.infoKey;

          if (nodeKey) {
            // 临时显示连接线（覆盖复选框状态）
            if (!showConnections) {
              toggleConnectionsVisibility(true);
            }

            highlightConnections(nodeKey);
          }
        }
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (tooltipRef.current && document.body.contains(tooltipRef.current)) {
        document.body.removeChild(tooltipRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [brainRegionInfo, brainPoints, connRules]); // 使用 props 数据作为依赖

  // 监听 showConnections 状态变化，控制连接线显隐
  useEffect(() => {
    showConnectionsRef.current = showConnections;
    if (showConnections) {
      toggleConnectionsVisibility(true);
    } else {
      // 只有在没有高亮节点时才隐藏连接线
      if (!highlightedNodeRef.current) {
        toggleConnectionsVisibility(false);
      }
    }
  }, [showConnections]);

  // 当高亮节点变化时，如果 showConnections 为 false，需要临时显示连接线
  useEffect(() => {
    if (highlightedNodeRef.current && !showConnections) {
      toggleConnectionsVisibility(true);
    } else if (!highlightedNodeRef.current && !showConnections) {
      toggleConnectionsVisibility(false);
    }
  }, [highlightedNodeRef.current, showConnections]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      {/* 保存时加载叠加层 */}
      {isSaving && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-sm">更新中...</p>
          </div>
        </div>
      )}
      {/* 根据 uiReady 状态控制 UI 元素的显示 */}
      <div className={`absolute top-8 left-8 text-white z-10 transition-opacity duration-500 ${uiReady ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="text-2xl md:text-4xl font-bold">{team?.teamName || 'TeamBrain'}大脑</h1>
        <p className="text-sm opacity-80">基于真实大脑分区数据</p>
      </div>

      {/* 更新提示文字：将"WASD移动"改为"W/S上下移动" */}
      <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center opacity-60 z-10 transition-opacity duration-500 ${uiReady ? 'opacity-60' : 'opacity-0'}`}>
        <p className="text-xs md:text-sm">拖拽旋转 · 滚轮缩放 · W/S移动</p>
      </div>

      {/* 控制面板 - desktop only */}
      {!isMobile && (
      <div className={`absolute bottom-4 md:bottom-8 right-4 md:right-8 bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-4 text-white z-10 max-w-[calc(100vw-1rem)] md:max-w-xs transition-opacity duration-500 ${uiReady ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-lg font-bold mb-1">{team?.teamName || 'TeamBrain'} · 团队大脑</h2>
        <p className="text-xs opacity-80 mb-3">无限进步 | 全网粉丝2800万+</p>

        <div className="space-y-2 mb-3">
          {regions && regions.length > 0 ? (
            regions.map(r => (
              <div key={r.id} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.colorHex }}></div>
                <span className="text-xs">{r.name}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-xs">加载脑区数据中...</span>
            </div>
          )}
        </div>

        {/* 连接类型图例 */}
        <div className="mb-3">
          <h3 className="text-sm font-bold mb-2">连接类型图例</h3>
          <div className="space-y-1">
            {connectionLegend.map((legend, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-1 rounded-full" style={{ backgroundColor: legend.color }}></div>
                <span className="text-xs">{legend.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 添加显示连接线的复选框 */}
        <div className="mb-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showConnections}
              onChange={(e) => setShowConnections(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-xs">显示全脑连接线</span>
          </label>
        </div>

        <p className="text-xs opacity-70 animate-pulse">点击任意光点，了解团队详情</p>
      </div>
      )}

      {/* 代表节点信息面板 - desktop only */}
      {!isMobile && (
      <div className={`hidden md:block absolute bottom-8 left-8 bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg p-4 text-white z-10 max-w-xs max-h-80 overflow-y-auto scrollbar-hide transition-opacity duration-500 ${uiReady ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-lg font-bold mb-2">
          {isNodeListExpanded ? `相关节点列表` : `代表节点列表`}
        </h2>
        <div className="space-y-2">
          {isNodeListExpanded ? (
            connectedNodes.length > 0 ? (
              connectedNodes.map((node, index) => (
                <div key={index} className="text-xs border-b border-white border-opacity-10 pb-2">
                  <div className="font-bold">{node.infoKey}</div>
                  <div className="opacity-80">
                    连接类型: {connectionLegend.find(l => l.type === node.connectionType)?.name || node.connectionType}
                  </div>
                  <div className="opacity-80">
                    位置: ({node.position.x.toFixed(2)}, {node.position.y.toFixed(2)}, {node.position.z.toFixed(2)})
                  </div>
                  <div className="opacity-80">
                    脑区: {node.partitionIndex}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs opacity-70">该节点暂无连接</div>
            )
          ) : (
            representativeNodes.map((node, index) => (
              <div key={index} className="text-xs border-b border-white border-opacity-10 pb-2">
                <div className="font-bold">{node.infoKey}</div>
                <div className="opacity-80">
                  位置: ({node.position.x.toFixed(2)}, {node.position.y.toFixed(2)}, {node.position.z.toFixed(2)})
                </div>
                <div className="opacity-80">
                  脑区: {node.partitionIndex}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {/* Mobile bottom drawer */}
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 z-20"
             onTouchStart={handleDrawerTouchStart}
             onTouchMove={handleDrawerTouchMove}
             onTouchEnd={handleDrawerTouchEnd}>
          {/* Handle bar */}
          <div className="flex flex-col items-center pt-4 pb-3 bg-black bg-opacity-80 rounded-t-xl">
            <div className="w-12 h-1.5 bg-white bg-opacity-50 rounded-full mb-3" />
            {/* Tab indicators */}
            <div className="flex gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${drawerTab === 0 ? 'bg-white' : 'bg-white bg-opacity-30'}`} />
              <div className={`w-2 h-2 rounded-full ${drawerTab === 1 ? 'bg-white' : 'bg-white bg-opacity-30'}`} />
            </div>
          </div>
          {/* Panel content */}
          <div className="bg-black bg-opacity-90 px-4 pb-6 overflow-y-auto"
               style={{ maxHeight: `${drawerHeight}px` }}>
            {drawerTab === 0 ? (
              /* Control panel */
              <div>
                <h2 className="text-lg font-bold mb-1">{team?.teamName || 'TeamBrain'} · 团队大脑</h2>
                <p className="text-xs opacity-80 mb-3">无限进步 | 全网粉丝2800万+</p>

                <div className="space-y-2 mb-3">
                  {regions && regions.length > 0 ? (
                    regions.map(r => (
                      <div key={r.id} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.colorHex }}></div>
                        <span className="text-xs">{r.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span className="text-xs">加载脑区数据中...</span>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-bold mb-2">连接类型图例</h3>
                  <div className="space-y-1">
                    {connectionLegend.map((legend, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-1 rounded-full" style={{ backgroundColor: legend.color }}></div>
                        <span className="text-xs">{legend.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showConnections}
                      onChange={(e) => setShowConnections(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs">显示全脑连接线</span>
                  </label>
                </div>

                <p className="text-xs opacity-70 animate-pulse">点击任意光点，了解团队详情</p>
              </div>
            ) : (
              /* Node list panel */
              <div>
                <h2 className="text-lg font-bold mb-2">
                  {isNodeListExpanded ? `相关节点列表` : `代表节点列表`}
                </h2>
                <div className="space-y-2">
                  {isNodeListExpanded ? (
                    connectedNodes.length > 0 ? (
                      connectedNodes.map((node, index) => (
                        <div key={index} className="text-xs border-b border-white border-opacity-10 pb-2">
                          <div className="font-bold">{node.infoKey}</div>
                          <div className="opacity-80">
                            连接类型: {connectionLegend.find(l => l.type === node.connectionType)?.name || node.connectionType}
                          </div>
                          <div className="opacity-80">
                            位置: ({node.position.x.toFixed(2)}, {node.position.y.toFixed(2)}, {node.position.z.toFixed(2)})
                          </div>
                          <div className="opacity-80">
                            脑区: {node.partitionIndex}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs opacity-70">该节点暂无连接</div>
                    )
                  ) : (
                    representativeNodes.map((node, index) => (
                      <div key={index} className="text-xs border-b border-white border-opacity-10 pb-2">
                        <div className="font-bold">{node.infoKey}</div>
                        <div className="opacity-80">
                          位置: ({node.position.x.toFixed(2)}, {node.position.y.toFixed(2)}, {node.position.z.toFixed(2)})
                        </div>
                        <div className="opacity-80">
                          脑区: {node.partitionIndex}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 自定义滚动条样式 */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          width: 4px;
          background-color: rgba(0, 0, 0, 0.5);
        }

        .scrollbar-hide::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        .scrollbar-hide::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.6);
        }

        .scrollbar-hide {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default BrainPointCloud;
