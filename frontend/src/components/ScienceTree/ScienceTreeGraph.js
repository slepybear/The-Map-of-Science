import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3';
import treeData from '../../data/scienceTreeData.json';

const ScienceTreeGraph = ({ onNodeClick, lang = 'zh', collapsedNodes = new Set(), onNodeCollapse }) => {
  const graphRef = useRef();
  
  // Reheat simulation when collapsedNodes changes (to handle layout updates smoothly)
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3ReheatSimulation();
    }
  }, [collapsedNodes]);


  const getNodeLabel = useCallback((node) => {
    if (lang === 'en') return node.name_en || node.name;
    return node.name;
  }, [lang]);

  const estimateNodeRadius = useCallback((label) => {
    const baseHeight = 28;
    let width = 20;
    for (const ch of String(label)) {
      width += ch.charCodeAt(0) > 255 ? 14 : 9;
    }
    const w = Math.max(44, width);
    const h = baseHeight;
    return Math.sqrt((w / 2) ** 2 + (h / 2) ** 2);
  }, []);

  // Keep track of node positions to preserve them across re-renders
  const nodePositions = useRef(new Map());
  // Flatten the tree data based on collapsed state
  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];

    const traverse = (node, parentId = null, depth = 0) => {
      // Create a shallow copy
      const newNode = { ...node };
      newNode.__depth = depth;
      const label = (lang === 'en' ? (newNode.name_en || newNode.name) : newNode.name);
      newNode.__radius = estimateNodeRadius(label);
      
      // Restore position if available
      const savedPos = nodePositions.current.get(node.id);
      if (savedPos) {
        newNode.x = savedPos.x;
        newNode.y = savedPos.y;
        newNode.vx = savedPos.vx;
        newNode.vy = savedPos.vy;
      }
      
      nodes.push(newNode); 
      
      if (parentId) {
        links.push({ source: parentId, target: node.id });
      }

      // If node is NOT collapsed, traverse children
      if (!collapsedNodes.has(node.id) && node.children) {
        node.children.forEach(child => traverse(child, node.id, depth + 1));
      }
    };

    traverse(treeData, null, 0);
    return { nodes, links };
  }, [collapsedNodes, estimateNodeRadius, lang]);

  // Keep a ref to the latest graphData so callbacks can access it without closure issues
  const graphDataRef = useRef(graphData);
  useEffect(() => {
    graphDataRef.current = graphData;
  }, [graphData]);

  useEffect(() => {
    if (!graphRef.current) return;
    const fg = graphRef.current;

    const collide = d3.forceCollide((n) => (n && n.__radius ? n.__radius : 22)).strength(1).iterations(3);
    fg.d3Force('collide', collide);

    const linkForce = fg.d3Force('link');
    if (linkForce && typeof linkForce.distance === 'function') {
      linkForce.distance((l) => {
        const s = l.source;
        const t = l.target;
        const sr = s && s.__radius ? s.__radius : 22;
        const tr = t && t.__radius ? t.__radius : 22;
        const sd = s && typeof s.__depth === 'number' ? s.__depth : 0;
        const td = t && typeof t.__depth === 'number' ? t.__depth : 0;
        return 18 + sr + tr + 6 * Math.max(sd, td);
      });
    }

    const chargeForce = fg.d3Force('charge');
    if (chargeForce && typeof chargeForce.strength === 'function') {
      chargeForce.strength(-120);
    }

    fg.d3ReheatSimulation();
  }, [graphData]);

  // Update node positions map whenever graph updates
  const handleEngineTick = useCallback(() => {
    // Instead of calling graphRef.current.graphData(), we use our local data
    // The force graph simulation mutates the nodes in graphDataRef.current
    const { nodes } = graphDataRef.current;
    if (nodes) {
        nodes.forEach(node => {
            if (node.x !== undefined && node.y !== undefined) {
                nodePositions.current.set(node.id, { x: node.x, y: node.y, vx: node.vx, vy: node.vy });
            }
        });
    }
  }, []);

  const handleNodeClick = useCallback((node) => {
    // Save current positions before updating state
    const { nodes } = graphDataRef.current;
    if (nodes) {
        nodes.forEach(n => {
            nodePositions.current.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
        });
    }

    if (node.children && node.children.length > 0) {
      if (onNodeCollapse) {
        const newSet = new Set(collapsedNodes);
        if (newSet.has(node.id)) {
          newSet.delete(node.id); // Expand
        } 
        // We do NOT collapse nodes on click anymore, per user request.
        // Once expanded, they stay expanded.
        onNodeCollapse(newSet);
      }
    }

    if (onNodeClick) {
      onNodeClick(node);
    }

    // Center view on clicked node
    if (graphRef.current) {
      // Use the current node position directly
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(4, 2000);
    }
  }, [onNodeClick, collapsedNodes, onNodeCollapse]);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = getNodeLabel(node);
    const fontSize = 14 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.5); // padding

    const width = bckgDimensions[0];
    const height = bckgDimensions[1];
    const x = node.x - width / 2;
    const y = node.y - height / 2;
    const r = 4; // corner radius

    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    // Add shadow/glow for modern look
    ctx.shadowBlur = 10;
    ctx.shadowColor = node.color || 'rgba(255, 255, 255, 0.5)';
    
    ctx.fillStyle = 'rgba(17, 26, 51, 0.85)'; // Darker, semi-transparent background
    ctx.fill();
    
    // Reset shadow for border and text
    ctx.shadowBlur = 0;

    ctx.strokeStyle = node.color || '#4F8CFF'; // Use node color for border
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#E5E7EB'; // Lighter text color for better contrast
    ctx.fillText(label, node.x, node.y);

  }, [getNodeLabel]);

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={(node, color, ctx) => {
        // Increase interaction area to match visual size roughly
        // We re-calculate dimensions similar to nodeCanvasObject but simplified
        const label = getNodeLabel(node);
        const fontSize = 14; // Base font size
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        const width = textWidth + fontSize * 0.5;
        const height = fontSize + fontSize * 0.5;
        
        ctx.fillStyle = color;
        ctx.fillRect(node.x - width / 2, node.y - height / 2, width, height);
      }}
      onNodeClick={handleNodeClick}
      onEngineTick={handleEngineTick}
      backgroundColor="rgba(0,0,0,0)" // Transparent to show starry background
      linkColor={() => 'rgba(255,255,255,0.2)'}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      // Add warmup ticks to stabilize layout if positions are restored
      warmupTicks={10}
      cooldownTicks={50}
    />
  );
};

export default ScienceTreeGraph;
