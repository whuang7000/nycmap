// Width and height for the visualization
const width = 800;
const height = 600;

// Create SVG container
const svg = d3.select('#map')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// Create a projection for NYC
const projection = d3.geoMercator()
    .center([-73.94, 40.70]) // Approximate center of NYC
    .scale(50000)
    .translate([width / 2, height / 2]);

// Create a path generator
const path = d3.geoPath()
    .projection(projection);

// Load and render the TopoJSON data
d3.json('nyc_hexes.topojson')
    .then(function(topology) {
        console.log('Raw topology:', topology); // Log the raw data
        
        if (!topology || typeof topology !== 'object') {
            throw new Error('Invalid TopoJSON data structure');
        }

        if (!topology.objects) {
            throw new Error('TopoJSON missing "objects" property');
        }

        // Log the available objects
        console.log('Available objects:', Object.keys(topology.objects));

        // Get the first object if hexagons is not found
        const objectName = topology.objects.hexagons ? 'hexagons' : Object.keys(topology.objects)[0];
        
        if (!objectName) {
            throw new Error('No valid geometry objects found in TopoJSON');
        }

        console.log('Using object:', objectName);
        
        // Convert TopoJSON to GeoJSON
        const geometries = topojson.feature(topology, topology.objects[objectName]);
        
        console.log('Converted GeoJSON:', geometries);

        // Create a tooltip div
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background-color', 'white')
            .style('padding', '5px')
            .style('border', '1px solid #ddd')
            .style('border-radius', '3px');

        // Draw the hexagons with interaction
        svg.selectAll('path')
            .data(geometries.features)
            .enter()
            .append('path')
            .attr('d', path)
            .style('fill', '#69b3a2')
            .style('stroke', '#fff')
            .style('stroke-width', '0.5px')
            // Add hover effects
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .style('fill', '#4a7b6f')  // Darker shade on hover
                    .style('stroke-width', '1.5px');
                
                // Show tooltip with feature properties
                tooltip
                    .style('visibility', 'visible')
                    .html(`
                        ${Object.entries(d.properties)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('<br>')}
                    `);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('fill', '#69b3a2')
                    .style('stroke-width', '0.5px');
                tooltip.style('visibility', 'hidden');
            })
            .on('click', function(event, d) {
                console.log('Clicked feature:', d);
                // You can add custom click behavior here
                // For example, zooming to the clicked hexagon:
                const bounds = path.bounds(d);
                const dx = bounds[1][0] - bounds[0][0];
                const dy = bounds[1][1] - bounds[0][1];
                const x = (bounds[0][0] + bounds[1][0]) / 2;
                const y = (bounds[0][1] + bounds[1][1]) / 2;
                const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
                const translate = [width / 2 - scale * x, height / 2 - scale * y];

                svg.transition()
                    .duration(750)
                    .call(
                        zoom.transform,
                        d3.zoomIdentity
                            .translate(translate[0], translate[1])
                            .scale(scale)
                    );
            });

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', zoomed);

        svg.call(zoom);

        function zoomed(event) {
            svg.selectAll('path')
                .attr('transform', event.transform);
        }
    })
    .catch(function(error) {
        console.error('Error processing the TopoJSON file:', error);
        d3.select('#map')
            .append('div')
            .style('color', 'red')
            .style('padding', '20px')
            .text(`Error: ${error.message}`);
    }); 