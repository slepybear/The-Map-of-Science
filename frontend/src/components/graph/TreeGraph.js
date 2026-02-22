import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

const nodeKey = (d) => d.data?.id || d.data?.name;

export default function TreeGraph({ tree, highlightedNodes, onNodeClick }) {
  const ref = useRef(null);

  const root = useMemo(() => {
    if (!tree) return null;
    return d3.hierarchy(tree, (d) => d.children || []);
  }, [tree]);

  useEffect(() => {
    if (!root) return;
    const svg = d3.select(ref.current);
    const { width, height } = ref.current.getBoundingClientRect();
    const w = width || 1200;
    const h = height || 700;
    svg.attr('viewBox', [0, 0, w, h]).style('background', '#0B1020');

    const g = svg.selectAll('g.treeRoot').data([1]);
    const gEnter = g.enter().append('g').attr('class', 'treeRoot');
    const gMerge = gEnter.merge(g);
    gMerge.attr('transform', `translate(60, 40)`);

    const layout = d3.tree().size([h - 80, w - 120]);
    layout(root);

    const links = root.links();
    const nodes = root.descendants();

    const linkSel = gMerge.selectAll('path.link').data(links, (d) => `${nodeKey(d.source)}-${nodeKey(d.target)}`);
    linkSel.exit().remove();
    linkSel
      .enter()
      .append('path')
      .attr('class', 'link')
      .merge(linkSel)
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x((d) => d.y)
          .y((d) => d.x)
      )
      .attr('fill', 'none')
      .attr('stroke', '#38557A')
      .attr('stroke-opacity', highlightedNodes?.size ? 0.15 : 0.7)
      .attr('stroke-width', 1.8);

    const nodeSel = gMerge.selectAll('g.node').data(nodes, (d) => nodeKey(d));
    nodeSel.exit().remove();
    const nodeEnter = nodeSel.enter().append('g').attr('class', 'node').style('cursor', 'pointer');
    nodeEnter.append('circle').attr('r', 9).attr('fill', '#111A33').attr('stroke-width', 2);
    nodeEnter
      .append('text')
      .attr('dy', 4)
      .attr('x', 14)
      .style('font-size', '12px')
      .style('fill', '#E5E7EB')
      .style('pointer-events', 'none');

    const merged = nodeEnter.merge(nodeSel);
    merged.attr('transform', (d) => `translate(${d.y},${d.x})`);

    merged
      .select('circle')
      .attr('stroke', (d) => (highlightedNodes?.has(nodeKey(d)) ? '#4F8CFF' : d.depth <= 1 ? '#4F8CFF' : '#2C5F8D'))
      .attr('opacity', (d) => {
        if (!highlightedNodes?.size) return 1;
        return highlightedNodes.has(nodeKey(d)) ? 1 : 0.25;
      });

    merged
      .select('text')
      .text((d) => (d.data?.name || '').slice(0, 18))
      .attr('opacity', (d) => {
        if (!highlightedNodes?.size) return 1;
        return highlightedNodes.has(nodeKey(d)) ? 1 : 0.25;
      });

    merged.on('click', (event, d) => {
      event.stopPropagation();
      onNodeClick?.(d.data, event);
    });
  }, [root, highlightedNodes, onNodeClick]);

  return <svg ref={ref} className="graphSvg" />;
}
