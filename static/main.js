const data = {
  name: "My portfolio",
  children: [
    {
      name: "Project 1",
      children: [
        {
          name: "",
          url: "",
          desc: ""
        },
        {
          name: "",
          url: "",
          desc: ""
        }
      ]
    },
    {
      name: "",
      children: [
        {
          name: "",
          url: "",
          desc: ""
        }
      ]
    },
    {
      name: "",
      children: [
        {
          name: "",
          url: "",
          desc: ""
        }
      ]
    }
  ]
};

// -----------------------------
// SETUP
// -----------------------------
const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("svg")
  .attr("width", width)
  .attr("height", height);

// Start the group in the exact center of the screen
const g = svg.append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Calculate D3 Tree Layout (Zoomed in spacing)
const root = d3.hierarchy(data);
const verticalSpacing = 240; 
const treeLayout = d3.tree().nodeSize([220, verticalSpacing]); 
treeLayout(root); 

const nodes = root.descendants();
const links = root.links();
const totalNodes = nodes.length;

// Find the deepest point of the tree for the camera tracking
const maxTreeY = d3.max(nodes, d => d.y);

// Assign a global index to each node for the scroll reveal sequence
nodes.forEach((d, i) => {
  d.index = i; 
});

// -----------------------------
// LINKS 
// -----------------------------
const link = g.selectAll(".link")
  .data(links)
  .enter()
  .append("path")
  .attr("class", "link")
  .style("opacity", 0)
  .attr("d", d => {
    const x1 = d.source.x;
    const y1 = d.source.y;
    const x2 = d.target.x;
    const y2 = d.target.y;
    return `M${x1},${y1} L${x2},${y2}`;
  })
  .style("transition", "opacity 0.3s ease");

// -----------------------------
// NODES & TOOLTIPS
// -----------------------------
const node = g.selectAll(".node")
  .data(nodes)
  .enter()
  .append("g")
  .attr("class", "node")
  .style("opacity", 0)
  .style("transform", d => `translate(${d.x}px, ${d.y}px) scale(0.6)`)
  .style("transform-origin", d => `${d.x}px ${d.y}px`)
  .style("transition", "all 0.4s ease");

const tooltip = document.getElementById("tooltip");

node.append("circle")
  .attr("r", 14) // Larger clickable area
  .on("click", (event, d) => {
    // Prevent this click from triggering the window "click outside" listener
    event.stopPropagation();

    // Populate the tooltip HTML
    tooltip.innerHTML = `
      <h3>${d.data.name}</h3>
      <p>${d.data.desc ?? "No description"}</p>
      ${d.data.url ? `<a href="${d.data.url}" target="_blank">Open Project &rarr;</a>` : ""}
    `;

    // Position it slightly offset from the mouse click
    tooltip.style.left = `${event.clientX + 20}px`;
    tooltip.style.top = `${event.clientY + 20}px`;

    // Show it
    tooltip.classList.add("visible");
  });

node.append("text")
  .attr("dx", 22) // Pushed out further to accommodate the larger circle
  .attr("dy", 6)
  .text(d => d.data.name);

// -----------------------------
// UX ENHANCEMENT: Hide Tooltip
// -----------------------------
// Click anywhere else on the background to close the tooltip
window.addEventListener("click", () => {
  tooltip.classList.remove("visible");
});

// -----------------------------
// SCROLL SYSTEM
// -----------------------------
window.addEventListener("scroll", () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const p = Math.max(0, Math.min(1, window.scrollY / maxScroll)); 
  
  // Hide tooltip the moment they scroll away
  tooltip.classList.remove("visible"); 

  update(p);
});

// -----------------------------
// REVEAL SYSTEM
// -----------------------------
function update(p) {
  // Calculate camera position based on scroll percentage
  const focusY = p * maxTreeY;
  const currentCameraY = (height / 2) - focusY;

  // Move the camera
  g.attr("transform", `translate(${width / 2}, ${currentCameraY})`);

  // Reveal nodes based on scroll progress
  node.style("opacity", d => p >= (d.index / totalNodes) ? 1 : 0)
      .style("transform", d => 
        p >= (d.index / totalNodes)
          ? `translate(${d.x}px, ${d.y}px) scale(1)`
          : `translate(${d.x}px, ${d.y}px) scale(0.6)`
      );

  // Reveal links slightly after the target node appears
  link.style("opacity", d => {
    const revealPoint = d.target.index / totalNodes;
    return p >= revealPoint ? 1 : 0;
  });
}

// Initialize the first frame
update(0);