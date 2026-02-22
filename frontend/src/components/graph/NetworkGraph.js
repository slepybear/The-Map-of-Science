import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const keyOf = (a, b) => `${a}→${b}`;

export default function NetworkGraph({ data, highlightedNodes, highlightedLinks, onNodeClick, lowPerf }) {
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const zoomRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const nodes = useMemo(() => (data?.nodes || []).map((n) => ({ ...n })), [data]);
  const links = useMemo(() => (data?.links || []).map((l) => ({ ...l })), [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const { width, height } = svgRef.current.getBoundingClientRect();
    svg.attr('viewBox', [0, 0, width || 1200, height || 700]);
    svg.style('background', '#0B1020');

    const root = svg.selectAll('g.graphRoot').data([1]);
    const rootEnter = root.enter().append('g').attr('class', 'graphRoot');
    rootEnter.append('g').attr('class', 'links');
    rootEnter.append('g').attr('class', 'nodes');
    const rootMerge = rootEnter.merge(root);

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => rootMerge.attr('transform', event.transform));
    svg.call(zoom).on('dblclick.zoom', null);
    zoomRef.current = zoom;

    const sim = d3
      .forceSimulation()
      .force(
        'link',
        d3
          .forceLink()
          .id((d) => d.id)
          .distance((d) => (d.type === 'INCLUDES' ? 120 : 180))
          .strength((d) => (d.type === 'INCLUDES' ? 0.8 : 0.3))
      )
      .force('charge', d3.forceManyBody().strength(lowPerf ? -450 : -800))
      .force('center', d3.forceCenter((width || 1200) / 2, (height || 700) / 2))
      .force('collide', d3.forceCollide().radius((d) => (lowPerf ? 22 : 32)).iterations(2));
    simRef.current = sim;

    const onResize = () => {
      const { width: w, height: h } = svgRef.current.getBoundingClientRect();
      svg.attr('viewBox', [0, 0, w || 1200, h || 700]);
      if (simRef.current) {
        simRef.current.force('center', d3.forceCenter((w || 1200) / 2, (h || 700) / 2));
        simRef.current.alpha(0.3).restart();
      }
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      sim.stop();
    };
  }, [lowPerf]);

  useEffect(() => {
    if (!simRef.current) return;
    const svg = d3.select(svgRef.current);
    const linkG = svg.select('g.graphRoot g.links');
    const nodeG = svg.select('g.graphRoot g.nodes');
    const sim = simRef.current;

    const linkSel = linkG
      .selectAll('line')
      .data(links, (d) => d.id || keyOf(d.source, d.target));
    linkSel.exit().remove();
    const linkEnter = linkSel
      .enter()
      .append('line')
      .attr('stroke-width', 1.8)
      .attr('stroke-opacity', 0.7);
    const linkMerge = linkEnter.merge(linkSel);

    const nodeSel = nodeG.selectAll('g.node').data(nodes, (d) => d.id);
    nodeSel.exit().remove();

    const nodeEnter = nodeSel
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.15).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    nodeEnter
      .on('mouseenter', (event, d) => {
        setHover(d);
        setPos({ x: event.clientX, y: event.clientY });
      })
      .on('mousemove', (event) => setPos({ x: event.clientX, y: event.clientY }))
      .on('mouseleave', () => setHover(null))
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d, event);
      });

    nodeEnter
      .append('circle')
      .attr('r', 16)
      .attr('fill', '#111A33')
      .attr('stroke-width', 2);

    nodeEnter
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 30)
      .style('font-size', '11px')
      .style('fill', '#C7D2FE')
      .style('pointer-events', 'none')
      .text((d) => (d.name || '').slice(0, 10));

    const nodeMerge = nodeEnter.merge(nodeSel);

    const highlightedNodeSet = highlightedNodes || new Set();
    const highlightedLinkSet = highlightedLinks || new Set();

    nodeMerge.select('circle').attr('stroke', (d) => {
      if (highlightedNodeSet.has(d.id)) return '#4F8CFF';
      if (d.level === 0) return '#FFFFFF';
      if (d.level === 1) return '#4F8CFF';
      return '#2C5F8D';
    });

    nodeMerge.attr('opacity', (d) => {
      if (!highlightedNodeSet.size) return 1;
      return highlightedNodeSet.has(d.id) ? 1 : 0.22;
    });

    linkMerge
      .attr('stroke', (d) => (highlightedLinkSet.has(keyOf(d.source, d.target)) ? '#4F8CFF' : '#38557A'))
      .attr('stroke-opacity', (d) => (highlightedLinkSet.size ? (highlightedLinkSet.has(keyOf(d.source, d.target)) ? 1 : 0.12) : 0.65))
      .attr('stroke-width', (d) => (highlightedLinkSet.has(keyOf(d.source, d.target)) ? 3.2 : 1.8));

    sim.nodes(nodes);
    sim.force('link').links(links);
    sim.alpha(0.35).restart();

    sim.on('tick', () => {
      linkMerge
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      nodeMerge.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });
  }, [nodes, links, highlightedNodes, highlightedLinks, onNodeClick]);

  return (
    <>
      <svg ref={svgRef} className="graphSvg" />
      {hover ? (
        <div className="tooltip" style={{ left: pos.x + 12, top: pos.y + 12 }}>
          <div className="tooltip__title">{hover.name}</div>
          {hover.en_name ? <div className="tooltip__line">{hover.en_name}</div> : null}
          {hover.discipline ? <div className="tooltip__line">{hover.discipline}</div> : null}
          {typeof hover.year === 'number' ? <div className="tooltip__line">{hover.year}</div> : null}
        </div>
      ) : null}
    </>
  );
}
