import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';

const GraphVisualization = ({ data, onNodeSelect, pathData }) => {
  const svgRef = useRef();
  const simulationRef = useRef();
  const zoomRef = useRef(); // Add ref for zoom behavior
  const nodesMapRef = useRef(new Map());

  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState(new Set(['科学']));

  // Filter visible nodes and links
  const { visibleNodes, visibleLinks } = useMemo(() => {
    if (!data || !data.nodes) return { visibleNodes: [], visibleLinks: [] };

    const activeNodeIds = new Set();
    const pathNodeIds = new Set();
    const pathLinkIds = new Set();

    if (pathData) {
      pathData.nodes.forEach(n => {
        activeNodeIds.add(n.name);
        pathNodeIds.add(n.name);
      });
      pathData.links.forEach(l => {
        pathLinkIds.add(`${l.source}-${l.target}`);
      });
    } else {
      data.nodes.forEach(n => {
         if (n.level === 1 || n.name === '科学') {
           activeNodeIds.add(n.name);
         }
      });

      data.links.forEach(link => {
         const sourceId = typeof link.source === 'object' ? link.source.name : link.source;
         const targetId = typeof link.target === 'object' ? link.target.name : link.target;
         if (expandedNodes.has(sourceId)) activeNodeIds.add(targetId);
      });
    }

    // Use persistent node objects if possible
    const nodes = data.nodes.filter(n => activeNodeIds.has(n.name)).map(d => {
       // Inherit position if exists
       const existing = nodesMapRef.current.get(d.name);
       const isPathNode = pathNodeIds.has(d.name);
       
       let nodeObj = { ...d, isPathNode };

       if (existing) {
         nodeObj = { ...nodeObj, x: existing.x, y: existing.y, fx: existing.x, fy: existing.y };
       } else {
         // If new node, try to find parent's position to spawn from
         const parentLink = data.links.find(l => {
            const targetId = typeof l.target === 'object' ? l.target.name : l.target;
            return targetId === d.name;
         });
         if (parentLink) {
            const sourceId = typeof parentLink.source === 'object' ? parentLink.source.name : parentLink.source;
            const parent = nodesMapRef.current.get(sourceId);
            if (parent) {
               nodeObj = { ...nodeObj, x: parent.x, y: parent.y }; 
            }
         }
       }
       return nodeObj;
    });
    
    // Update map with current nodes
    nodes.forEach(n => nodesMapRef.current.set(n.name, n));

    const links = data.links.filter(link => {
       const sourceId = typeof link.source === 'object' ? link.source.name : link.source;
       const targetId = typeof link.target === 'object' ? link.target.name : link.target;
       return activeNodeIds.has(sourceId) && activeNodeIds.has(targetId);
    }).map(d => {
       const sourceId = typeof d.source === 'object' ? d.source.name : d.source;
       const targetId = typeof d.target === 'object' ? d.target.name : d.target;
       const isPathLink = pathLinkIds.has(`${sourceId}-${targetId}`);
       return {...d, isPathLink};
    });

    return { visibleNodes: nodes, visibleLinks: links };
  }, [data, expandedNodes, pathData]);

  // Initial Setup
  useEffect(() => {
    // Get dimensions dynamically
    const updateDimensions = () => {
       const width = window.innerWidth;
       const height = window.innerHeight - 60;
       
       const svg = d3.select(svgRef.current);
       svg.attr("viewBox", [0, 0, width, height]);
       
       if (simulationRef.current) {
          simulationRef.current.force("center", d3.forceCenter(width / 2, height / 2));
          simulationRef.current.force("x", d3.forceX(width / 2).strength(0.06));
          simulationRef.current.force("y", d3.forceY(height / 2).strength(0.06));
          simulationRef.current.alpha(0.3).restart();
       }
    };

    window.addEventListener('resize', updateDimensions);
    const width = window.innerWidth;
    const height = window.innerHeight - 60;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("width", "100%")
      .style("height", "100%")
      .style("background-color", "#02040A")
      .style("font-family", '"Source Han Sans", sans-serif');

    // Defs for filters
    const defs = svg.append("defs");
    // ... filters ...
    const glow = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    glow.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
    const feMerge = glow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const hotGlow = defs.append("filter").attr("id", "hot-glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    hotGlow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const hotFeMerge = hotGlow.append("feMerge");
    hotFeMerge.append("feMergeNode").attr("in", "coloredBlur");
    hotFeMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Groups
    const g = svg.append("g").attr("class", "graph-container");
    g.append("g").attr("class", "links");
    g.append("g").attr("class", "nodes");

    // Zoom - Enable user interaction
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
      
    svg.call(zoom)
       .on("dblclick.zoom", null); // Disable double click zoom to avoid conflict
       
    zoomRef.current = zoom; // Store zoom instance

    // Simulation
    simulationRef.current = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.name).distance(d => d.target.level === 3 ? 120 : 200)) // Increased distance
      .force("charge", d3.forceManyBody().strength(-1200)) // Stronger repulsion
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(100).iterations(2)) // Larger collision radius and more iterations
      .force("x", d3.forceX(width / 2).strength(0.06))
      .force("y", d3.forceY(height / 2).strength(0.06));

    // Cleanup
    return () => {
      simulationRef.current.stop();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Update Graph
  useEffect(() => {
    if (!simulationRef.current || !visibleNodes.length) return;

    const svg = d3.select(svgRef.current);
    const linkGroup = svg.select(".links");
    const nodeGroup = svg.select(".nodes");
    const simulation = simulationRef.current;

    // Update nodes/links data
    simulation.nodes(visibleNodes);
    simulation.force("link").links(visibleLinks);

    // Reheat simulation gently
    simulation.alpha(0.3).restart();

    // JOIN Links
    const link = linkGroup.selectAll("line")
      .data(visibleLinks, d => `${d.source.name || d.source}-${d.target.name || d.target}`);

    link.exit().remove();

    const linkEnter = link.enter().append("line")
      .attr("stroke", d => d.isPathLink ? "#FFD700" : "#4B5E78") // Gold for path, Blue-ish for others
      .attr("stroke-opacity", d => d.isPathLink ? 1 : 0.8)
      .attr("stroke-width", d => d.isPathLink ? 4 : 2);

    const linkMerge = linkEnter.merge(link)
      .attr("stroke", d => d.isPathLink ? "#FFD700" : "#4B5E78")
      .attr("stroke-width", d => d.isPathLink ? 4 : 2);

    // JOIN Nodes
    const node = nodeGroup.selectAll("g")
      .data(visibleNodes, d => d.name);

    node.exit()
      .transition().duration(300).attr("opacity", 0).remove();

    const nodeEnter = node.enter().append("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .attr("opacity", 0) // Fade in
      .attr("transform", d => {
         // Initially set scale to 0.1 for pop effect (at spawn position)
         return `translate(${d.x},${d.y}) scale(0.1)`;
      })
      .call(d3.drag() // Add drag back but make it gentle
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.1).restart(); // Low alpha target
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add click listener (separate from drag)
    nodeEnter.on("click", (event, d) => {
      event.stopPropagation();
      
      // Notify parent
      if (onNodeSelect) onNodeSelect(d);

      // Store current state for camera pan target
      // We want to pan to the clicked node
      const targetX = d.x;
      const targetY = d.y;

      setExpandedNodes(prev => {
        const next = new Set(prev);
        if (next.has(d.name)) next.delete(d.name);
        else next.add(d.name);
        return next;
      });
      
      // Camera Pan to the clicked node (Parent of the new expansion)
      // Delay slightly to let state update trigger
      setTimeout(() => {
         // Get current dimensions from SVG directly to handle resize
         const svgNode = svgRef.current;
         const { width, height } = svgNode.getBoundingClientRect();
         const scale = 1.2; // Gentle zoom
         
         // Center on the clicked node
         if (zoomRef.current) {
            d3.select(svgRef.current).transition()
                .duration(1000)
                .call(zoomRef.current.transform, d3.zoomIdentity.translate(width/2 - targetX*scale, height/2 - targetY*scale).scale(scale));
         }
      }, 100);
    });

    // Hover effects
    nodeEnter.on("mouseenter", (event, d) => {
       setHoveredNode(d);
       setTooltipPos({ x: event.clientX, y: event.clientY });
       d3.select(event.currentTarget).select("rect").attr("filter", "url(#glow)");
    }).on("mouseleave", (event, d) => {
       setHoveredNode(null);
       d3.select(event.currentTarget).select("rect").attr("filter", null);
    });

    // Node Visuals
    nodeEnter.append("rect")
      .attr("width", 120)
      .attr("height", 60)
      .attr("x", -60)
      .attr("y", -30)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", d => d.isPathNode ? "#2A1A05" : "#0B1021") // Dark gold background for path
      .attr("stroke", d => {
         if (d.isPathNode) return "#FFD700";
         if (d.citation_growth >= 10) return "#FF7A45";
         if (d.name === '科学') return "#FFFFFF";
         if (d.level === 1) return "#4facfe";
         return "#2C5F8D";
      })
      .attr("stroke-width", d => d.isPathNode ? 3 : (d.citation_growth >= 10 ? 3 : 1.5))
      .style("filter", d => (d.citation_growth >= 10 || d.isPathNode) ? "url(#hot-glow)" : "drop-shadow(0px 4px 8px rgba(0,0,0,0.5))");

    nodeEnter.append("text")
      .attr("dy", "-0.2em")
      .attr("text-anchor", "middle")
      .text(d => d.name)
      .style("font-size", "14px")
      .style("font-weight", "500")
      .style("fill", "#E4E7F1")
      .style("pointer-events", "none")
      .each(function(d) {
        if (d.name.length > 8) d3.select(this).style("font-size", "12px");
      });

    nodeEnter.append("text")
      .attr("dy", "1.2em")
      .attr("text-anchor", "middle")
      .text(d => d.en_name ? d.en_name.split(' ')[0] : '')
      .style("font-size", "10px")
      .style("fill", "#6D7E99")
      .style("pointer-events", "none");

    // Staged Animation: Link grows -> Node appears
    // Delay node appearance by 300ms to let link stretch first
    nodeEnter.transition()
      .delay(300) 
      .duration(500)
      .ease(d3.easeBackOut.overshoot(1.7)) // Bouncy effect
      .attr("opacity", 1)
      .attrTween("transform", function(d) {
        // Interpolate scale from 0.1 to 1 while respecting position updates from simulation
        // However, standard d3 transition might conflict with force tick updates if we animate 'transform' directly.
        // The force tick updates transform based on x,y.
        // We can animate a 'scale' attribute on a child group instead? Or just animate opacity.
        // Let's stick to opacity delay + simple scale if possible.
        // Since force updates transform on every tick, animating transform here is tricky.
        // Instead, let's animate the <g> content (rect, text) scale? No, that's complex.
        
        // Alternative: Just animate opacity with delay. The position movement (link stretching) happens naturally.
        return null; 
      });
      
    // Let's try animating the children (rect, text) scale instead of the group transform
    nodeEnter.selectAll("rect, text")
       .attr("transform", "scale(0)")
       .transition()
       .delay(300)
       .duration(500)
       .ease(d3.easeBackOut)
       .attr("transform", "scale(1)");
       
    nodeEnter.transition().delay(300).duration(500).attr("opacity", 1);

    const nodeMerge = nodeEnter.merge(node);

    // Tick function
    simulation.on("tick", () => {
      linkMerge
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      nodeMerge
        .attr("transform", d => `translate(${d.x},${d.y})`);
      
      // Update persistent map positions
      visibleNodes.forEach(n => {
        nodesMapRef.current.set(n.name, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
      });
    });

  }, [visibleNodes, visibleLinks]);

  return (
    <>
      <svg ref={svgRef}></svg>
      {hoveredNode && (
        <div style={{
          position: 'fixed',
          top: tooltipPos.y + 10,
          left: tooltipPos.x + 10,
          background: 'rgba(11, 16, 33, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #2C5F8D',
          borderRadius: '8px',
          padding: '15px',
          maxWidth: '300px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 1000,
          pointerEvents: 'none',
          color: '#E4E7F1'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#4facfe', fontSize: '16px' }}>{hoveredNode.name}</h3>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#8899A6' }}><strong>English:</strong> {hoveredNode.en_name}</p>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>{hoveredNode.description}</p>
          {hoveredNode.keywords && (
             <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#8899A6' }}><strong>关键词:</strong> {hoveredNode.keywords}</p>
          )}
          {hoveredNode.citation_growth !== undefined && (
             <div style={{ marginTop: '10px', fontSize: '12px', color: hoveredNode.citation_growth >= 10 ? '#FF7A45' : '#8899A6' }}>
               引用增长率: {hoveredNode.citation_growth}% 
               {hoveredNode.citation_growth >= 10 && ' 🔥'}
             </div>
          )}
        </div>
      )}
    </>
  );
};

export default GraphVisualization;
