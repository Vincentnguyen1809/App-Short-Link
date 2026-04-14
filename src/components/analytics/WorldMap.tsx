import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

interface WorldMapProps {
  data: { name: string; value: number }[];
}

export default function WorldMap({ data }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 400;

    svg.selectAll('*').remove();

    const projection = d3.geoMercator()
      .scale(120)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleThreshold<number, string>()
      .domain([1, 10, 50, 100, 500, 1000])
      .range(d3.schemeOranges[7]);

    // Fetch world map data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((worldData: any) => {
      const countries = topojson.feature(worldData, worldData.objects.countries) as any;

      svg.append('g')
        .selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', (d: any) => {
          const countryName = d.properties.name;
          const countryData = data.find(item => item.name === countryName);
          return countryData ? colorScale(countryData.value) : '#262626';
        })
        .attr('stroke', '#141414')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event, d: any) {
          d3.select(this).attr('stroke', '#f97316').attr('stroke-width', 1);
          const countryName = d.properties.name;
          const countryData = data.find(item => item.name === countryName);
          
          // Simple tooltip
          svg.append('text')
            .attr('id', 'tooltip')
            .attr('x', 10)
            .attr('y', height - 10)
            .attr('fill', 'white')
            .attr('font-size', '12px')
            .text(`${countryName}: ${countryData ? countryData.value : 0} clicks`);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke', '#141414').attr('stroke-width', 0.5);
          svg.select('#tooltip').remove();
        });
    });
  }, [data]);

  return (
    <div className="w-full overflow-hidden bg-[#141414] rounded-xl border border-[#262626] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Global Click Distribution</h3>
        <div className="flex gap-2">
          {[0, 10, 100, 1000].map((val, i) => (
            <div key={val} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d3.schemeOranges[7][i+1] }} />
              <span className="text-[10px] text-gray-500">{val}+</span>
            </div>
          ))}
        </div>
      </div>
      <svg 
        ref={svgRef} 
        viewBox="0 0 800 400" 
        className="w-full h-auto"
      />
    </div>
  );
}
