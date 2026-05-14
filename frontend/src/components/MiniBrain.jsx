import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const MiniBrain = ({ brainPoints, regions, width = 400, height = 400 }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!brainPoints?.length || !mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 3);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.3;
    controls.zoomSpeed = 0.5;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    const ambientLight = new THREE.AmbientLight(0x606060, 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00aaff, 2, 50);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    const pointsByRegion = {};
    brainPoints.forEach(p => {
      if (!pointsByRegion[p.regionId]) pointsByRegion[p.regionId] = { points: [], color: p.colorHex };
      pointsByRegion[p.regionId].points.push(p);
    });

    Object.values(pointsByRegion).forEach(region => {
      const r = parseInt(region.color.slice(1, 3), 16);
      const g = parseInt(region.color.slice(3, 5), 16);
      const b = parseInt(region.color.slice(5, 7), 16);
      const color = new THREE.Color(r / 255, g / 255, b / 255);

      region.points.forEach(p => {
        const geom = new THREE.SphereGeometry(0.02, 8, 8);
        const mat = new THREE.MeshPhongMaterial({ color, emissive: color.clone().multiplyScalar(0.5), transparent: true, opacity: 0.85 });
        const sphere = new THREE.Mesh(geom, mat);
        // Y/Z swap for correct brain orientation
        const x = p.x;
        const y = p.z;
        const z = p.y;
        sphere.position.set(x, y, z);
        scene.add(sphere);
      });
    });

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [brainPoints, width, height]);

  return <div ref={mountRef} style={{ width, height, borderRadius: 12, overflow: 'hidden' }} />;
};

export default MiniBrain;
