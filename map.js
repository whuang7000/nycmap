// Initialize the map centered on NYC
const map = L.map('map').setView([40.7128, -74.0060], 11);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Color scale function
function getColorForDistance(distance) {
    if (distance <= 10) return '#ff0000';  // red
    if (distance <= 20) return '#ffa500';  // orange
    if (distance <= 30) return '#ffff00';  // yellow
    if (distance <= 40) return '#90ee90';  // light green
    if (distance <= 50) return '#008000';  // green
    if (distance <= 60) return '#008080';  // teal
    if (distance <= 75) return '#add8e6';  // light blue
    if (distance <= 90) return '#0000ff';  // blue
    return '#800080';  // purple for distances > 90
}

// Store the layer references for easy access
let hexagonLayers = [];

// Fetch and load the TopoJSON data
fetch('nyc_hexes.topojson')
    .then(response => response.json())
    .then(topology => {
        const geojson = topojson.feature(topology, Object.values(topology.objects)[0]);
        
        // Add GeoJSON layer with styling
        L.geoJSON(geojson, {
            style: {
                fillColor: '#3388ff',
                fillOpacity: 0.1,
                color: '#ffffff',
                weight: 1
            },
            onEachFeature: function(feature, layer, index) {
                // Store reference to layer with its index
                const hexIndex = geojson.features.indexOf(feature);
                hexagonLayers[hexIndex] = layer;

                // Add click event to each hexagon
                layer.on('click', async function(e) {
                    try {
                        // Load distance data for clicked hexagon
                        const response = await fetch(`json/${hexIndex + 1}.json`);
                        const distances = await response.json();

                        // Update colors for all hexagons
                        hexagonLayers.forEach((hexLayer, idx) => {
                            const distance = distances[idx + 1];
                            const color = getColorForDistance(distance);
                            hexLayer.setStyle({
                                fillColor: color,
                                fillOpacity: 0.25
                            });
                        });

                        // Highlight clicked hexagon
                        layer.setStyle({
                            fillColor: '#ff0000',
                            fillOpacity: 0.6
                        });

                    } catch (error) {
                        console.error('Error loading distance data:', error);
                    }
                });

                // Add hover effects
                layer.on('mouseover', function() {
                    this.setStyle({
                        fillOpacity: 0.4
                    });
                });
                
                layer.on('mouseout', function() {
                    this.setStyle({
                        fillOpacity: 0.25
                    });
                });
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading the TopoJSON file:', error)); 

// After initializing the map, add this code to create the legend
const legend = L.control({ position: 'topright' });

legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'legend');
    const ranges = [
        { range: '0-10', color: '#ff0000' },
        { range: '11-20', color: '#ffa500' },
        { range: '21-30', color: '#ffff00' },
        { range: '31-40', color: '#90ee90' },
        { range: '41-50', color: '#008000' },
        { range: '51-60', color: '#008080' },
        { range: '61-75', color: '#add8e6' },
        { range: '76-90', color: '#0000ff' },
        { range: '>90', color: '#800080' }
    ];

    div.innerHTML = '<h4>Distance (minutes)</h4>';
    ranges.forEach(({ range, color }) => {
        div.innerHTML += `
            <div class="legend-item">
                <span class="legend-color" style="background: ${color}"></span>
                <span>${range}</span>
            </div>
        `;
    });

    return div;
};

legend.addTo(map); 