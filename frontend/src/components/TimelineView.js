import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const TimelineView = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/timeline?limit=2000`);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (loading || !data.length) return;

    const width = window.innerWidth;
    const height = window.innerHeight - 100;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#02040A")
      .style("width", "100%")
      .style("height", "100%");

    svg.selectAll("*").remove();

    // Zoom support
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        gX.call(xAxis.scale(event.transform.rescaleX(xScale)));
      });

    svg.call(zoom);

    const g = svg.append("g");

    // Scales
    const minYear = d3.min(data, d => d.year) || 1500;
    const maxYear = d3.max(data, d => d.year) || 2025;
    
    const xScale = d3.scaleLinear()
      .domain([minYear - 10, maxYear + 10])
      .range([margin.left, width - margin.right]);

    // Y scale based on disciplines to group them vertically
    const disciplines = Array.from(new Set(data.map(d => d.discipline))).sort();
    const yScale = d3.scalePoint()
      .domain(disciplines)
      .range([margin.top, height - margin.bottom])
      .padding(0.5);

    const colorScale = d3.scaleOrdinal()
      .domain(disciplines)
      .range(d3.schemeTableau10);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const gX = svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .attr("class", "x-axis")
      .style("color", "#8899A6");

    // Add Y axis labels (disciplines)
    g.append("g")
      .selectAll("text")
      .data(disciplines)
      .join("text")
      .attr("x", margin.left - 10)
      .attr("y", d => yScale(d))
      .attr("text-anchor", "end")
      .attr("alignment-baseline", "middle")
      .text(d => d)
      .style("fill", "#8899A6")
      .style("font-size", "10px");

    // Nodes
    const nodes = g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.discipline) + (Math.random() - 0.5) * 20) // Add jitter
      .attr("r", d => d.level === 1 ? 8 : d.level === 2 ? 6 : 4)
      .attr("fill", d => colorScale(d.discipline))
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.7)
      .style("cursor", "pointer");

    // Interactions
    nodes.on("mouseenter", (event, d) => {
      setHoveredNode(d);
      setTooltipPos({ x: event.clientX, y: event.clientY });
      d3.select(event.currentTarget).attr("r", 10).attr("opacity", 1);
    }).on("mouseleave", (event, d) => {
      setHoveredNode(null);
      d3.select(event.currentTarget)
        .attr("r", d.level === 1 ? 8 : d.level === 2 ? 6 : 4)
        .attr("opacity", 0.7);
    });

  }, [data, loading]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
          padding: '10px',
          maxWidth: '250px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 1000,
          pointerEvents: 'none',
          color: '#E4E7F1'
        }}>
          <div style={{ fontWeight: 'bold', color: '#4facfe' }}>{hoveredNode.name}</div>
          <div style={{ fontSize: '12px', color: '#8899A6' }}>{hoveredNode.year}</div>
          <div style={{ fontSize: '12px' }}>{hoveredNode.discipline}</div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
