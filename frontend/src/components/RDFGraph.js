import React, { useEffect, useRef } from "react";
import { Network } from "vis-network";
import "vis-network/styles/vis-network.css";

const RDFGraph = ({ triples }) => {
  const networkRef = useRef(null);
  const resizeObserver = useRef(null);

  useEffect(() => {
    if (!triples || triples.length === 0) return;

    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    triples.forEach((triple) => {
      if (!triple.subject || !triple.predicate || !triple.object) {
        return;
      }

      if (!nodeSet.has(triple.subject)) {
        nodes.push({
          id: triple.subject,
          label: triple.subject,
          shape: "box",
          color: { background: "#4CAF50", border: "#388E3C" },
          font: { color: "white", size: 14 },
          title: triple.subject,
        });
        nodeSet.add(triple.subject);
      }

      if (!nodeSet.has(triple.object)) {
        nodes.push({
          id: triple.object,
          label: triple.object,
          shape: "ellipse",
          color: { background: "#FFC107", border: "#FFA000" },
          font: { color: "black", size: 14 },
          title: triple.object,
        });
        nodeSet.add(triple.object);
      }

      edges.push({
        from: triple.subject,
        to: triple.object,
        label: triple.fullPredicate,
        font: { align: "middle", size: 12 },
        arrows: "to",
        color: { color: "#000000", highlight: "#ff0000" },
      });
    });

    const data = { nodes, edges };
    const options = {
      nodes: {
        shape: "dot",
        size: 20,
        font: { size: 16 },
        borderWidth: 2,
      },
      edges: {
        width: 1.5,
        arrows: { to: { enabled: true, scaleFactor: 1.2 } },
        smooth: false,
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -30000,
          centralGravity: 0.3,
          springLength: 200,
          springConstant: 0.04,
        },
      },
      layout: {
        hierarchical: {
          enabled: false,
        },
      },
    };

    const network = new Network(networkRef.current, data, options);

    setTimeout(() => {
      resizeObserver.current = new ResizeObserver(() => {
        network.redraw();
      });
      resizeObserver.current.observe(networkRef.current);
    }, 100);

    return () => {
      network.destroy();
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, [triples]);

  return <div ref={networkRef} className="rdf-graph-container" />;
};

export default RDFGraph;