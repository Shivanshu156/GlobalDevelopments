var global_data;
var country_data;
var allChecked;
var x_axis_value;
var x_axis_display;
var selectedSize;
var checkboxes;
var year = 1980;
let region_to_countries = {};
let country_to_region = {};
var checked_regions
let width = 1300;
let height = 600;
let colorScale;
let margin = { top: 40, right: 40, bottom: 40, left: 40 };
let data = []
let all_countries = []
let xScale;
let sizeScale;
let svg, g;
let beeswarm;


Promise.all([d3.csv('data/global_development.csv', (d) => { return d  }),
                d3.csv('data/countries_regions.csv', (d) => { return d  })  ])
    .then(function (data) {
        console.log('loaded global_development.csv and countries_regions.csv');
        global_data = data[0];
        country_data = data[1];
        country_data.forEach(function(data){
            let region = data['World bank region'];
            let country = data['name'];
            if (!(region in region_to_countries)) {
            region_to_countries[region] = [];
            }

            if (!region_to_countries[region].includes(country)) {
            region_to_countries[region].push(country);
            }
            if(!(country in country_to_region))
                country_to_region[country] = region });
        colorScale = d3.scaleOrdinal().domain(Object.keys(region_to_countries)).range(d3.schemeCategory10);
        $(document).ready(function() {

            // $('[x-axis-nav-value="Data.Health.Birth Rate"]').click();
            $('[x-axis-nav-value="Data.Urban Development.Population Density"]').click();
            $('[size-value="Data.Health.Death Rate"]').click();
            $('[year-value=1980]').click();
            $('#selectAll').click();
            updateChart()
          });
});

document.addEventListener("DOMContentLoaded", function () {
    
    // Select and show selected X-axis value
    document.querySelectorAll('.x-axis-nav').forEach(function (item) {   
        item.addEventListener('click', function () {
        x_axis_value = item.getAttribute('x-axis-nav-value');
        x_axis_display = item.textContent
        document.getElementById('x-axis-nav-selected').textContent = x_axis_display;
        updateChart('x-axis');
        });
    });

    // Select and show selected Size value
    document.querySelectorAll(' .size').forEach(function (item) {
        item.addEventListener('click', function () {
        selectedSize = item.getAttribute('size-value');
        document.getElementById('size-selected').textContent = item.textContent;
        updateChart('size');
        });
    });

    // Select regional checkbox values
    const selectAllCheckbox = document.getElementById("selectAll");
    checkboxes = document.querySelectorAll('.checkbox-item');
      
    selectAllCheckbox.addEventListener("change", function () {
    checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAllCheckbox.checked;
        });
        checked_regions = collectCheckedRegions()
        updateChart('region');
    });
      
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", function () {
            allChecked = [...checkboxes].every((checkbox) => checkbox.checked);
            selectAllCheckbox.checked = allChecked;
        checked_regions = collectCheckedRegions()

            updateChart('region');
        });
    });
    
    // Select and show selected year value
    var yearInput = document.getElementById("year-input");
    const slider = document.getElementById("slider");
    const sliderValue = document.getElementById("slider-value");

    yearInput.addEventListener("change", function() {
        year = parseInt(yearInput.value);
        slider.value = year;
        updateChart('year');
      });
    slider.addEventListener("input", function() {
        year = slider.value;
        yearInput.value = year;
        updateChart('year');
      });
    document.querySelectorAll(' .year-event').forEach(function (item) {
        item.addEventListener('click', function () {
        year = parseInt(item.getAttribute('year-value'));
        yearInput.value = year;
        slider.value = year;
        updateChart('year');
        });
    });

    // creeating svg element
    svg = d3.select("#svg-chart svg");
    console.log(svg.attr("width"))

    // loading data files




    // Select and show play/pause button value
    var isPlaying = false; 
    var animationInterval; 

    function startAnimation() {
      // Your D3 animation logic here
    }

    function stopAnimation() {
      // Your code to stop or pause the animation
    }

    function togglePlayPause() {
      var playIcon = document.getElementById("playIcon");
      var playText = document.getElementById("playText");

      if (!isPlaying) {
        startAnimation();
        playIcon.className = "fas fa-pause"; 
        playText.textContent = "Pause";
        isPlaying = true;
      } else {
        stopAnimation();
        playIcon.className = "fas fa-play"; 
        playText.textContent = "Play";
        isPlaying = false;
      }
    }

});

function updateChart(change) {
    if(change=='year'){
        console.log('Year change event occured')
        updateData()

        let b_data = beeswarm(data)
        g.selectAll('circle')
                .data(b_data)
                .join('circle')
                .transition()
                .duration(1000)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", d => d.r)
                .delay(function(d,i){return(i*5)})            
        }
    else if(change=='region') {
        console.log('region change event occured')
        updateAllCountries();
        updateXminmax();
        // svg.select(".x-axis-line")
        //         .transition()
        //         .duration(1000) // Adjust the duration as needed
        //         .call(d3.axisBottom(xScale))
        //         .on('end', function(){let s=1});
        updateData();
    drawBeeswarmChart(year, x_axis_value, selectedSize, checked_regions);

    }else if(change=='x-axis'){
        console.log('x-axis change event occured')
        updateXminmax();
        svg.selectAll('.x-axis-title')
            .transition()
            .duration(1000)
            .style("opacity", 0)
            .on('end', function () {
                // After the transition completes, continue with the next step
                svg.select(".x-axis-line")
                .transition()
                .duration(1000) // Adjust the duration as needed
                .call(d3.axisBottom(xScale))
                .on('end', function(){
                    svg.select('.x-axis-title')
                    .transition()
                    .duration(1000)
                    .text(x_axis_display)
                    .style("opacity", 1)
                    .on('end', function(){
                        let b_data = beeswarm(data)
                        g.selectAll('circle')
                                .data(b_data)
                                .join('circle')
                                .transition()
                                .duration(1000)
                                .attr("cx", d => d.x)
                                .attr("cy", d => d.y)
                                .attr("r", d => d.r)
                                .delay(function(d,i){return(i*5)}) 
                    });

                });
              });

        updateData();
    // drawBeeswarmChart(year, x_axis_value, selectedSize, checked_regions);

    }else if(change=='size'){
        console.log('size change event occured')
        updateData();
        let b_data = beeswarm(data)
        g.selectAll('circle')
                .data(b_data)
                .join('circle')
                .transition()
                .duration(1000)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", d => d.r)
                .delay(function(d,i){return(i*5)})      
    // drawBeeswarmChart(year, x_axis_value, selectedSize, checked_regions);

    }
    console.log('drawing chart for: ')
    console.log(year)
    console.log(x_axis_value)
    console.log(selectedSize)
    console.log(checked_regions)
}


function collectCheckedRegions() {
    checked_regions = []; 

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            checked_regions.push(checkbox.getAttribute('value'));
        }
    });


   return checked_regions
}


function drawBeeswarmChart(year, x_axis_value, selectedSize, regions) {
    
    // let all_countries = []
    // if(regions.length == 0){
    //     // clearing everything if no region is selected
    //     console.log('here')
    //     const svg = d3.select("#svg-chart svg")
    //     svg.selectAll('*').remove()
    //     return
    // }
        
    // regions.forEach(function(region){
    //     all_countries.push(...region_to_countries[region])
    // })

    // let data = []
    // let x_min=9999999999999999.0, x_max = -x_min;
    // global_data.forEach(function(data_point){
    //     //  calculate the x min max for each year

    //     if( all_countries.includes(data_point['Country'])){
    //         x_min = Math.min(x_min, parseFloat(data_point[x_axis_value]))
    //         x_max = Math.max(x_max, parseFloat(data_point[x_axis_value]))
    //         if(parseInt(data_point['Year'])==year ){
    //         let object = {}
    //         object['x'] = parseFloat(data_point[x_axis_value])
    //         object['size'] = parseFloat(data_point[selectedSize])
    //         object['country'] = data_point['Country']
    //         object['region'] = country_to_region[data_point['Country']]
    //         data.push(object)
    //         }
    //     }
    // });

    console.log(data)

    svg = d3.select("#svg-chart svg")
    svg.attr('width', width)
    svg.attr('height', height)

    svg.selectAll('circle').remove();
    svg.selectAll('.x-axis-line').remove();
    svg.selectAll('.y-axis').remove();
    svg.selectAll('g').remove();

    svg.selectAll('*').remove()

    g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);


    // let domain = [x_min - x_max*0.2, x_max*1.2]
    // console.log('domain is : '+JSON.stringify(domain))
    // const xScale = d3.scaleLinear()
    //         .domain(domain)
    //         .range([margin.left, width - margin.right]);
    // const sizeScale = d3.scaleSqrt()
    //     .domain([0, d3.max(data, d => parseFloat(d.size))])
    //     .range([2, 20]); // Adjust the size range as needed
    const xAxis = d3.axisBottom(xScale);
    
        // Append the x-axis to the chart
    svg.append('g')
    .attr('id', 'x-axis-line')
    .attr('class', 'x-axis-line')
    .attr('transform', `translate(0, ${height- 2*margin.bottom})`)
    .call(xAxis);
    svg.append('text')
    .attr('class', 'x-axis-title') 
    .attr('x', width / 2) 
    .attr('y', height - margin.bottom) 
    .text(x_axis_display);


    beeswarm = beeswarmForce()
                .x(d => xScale(d.x))
                .y(height / 3)
                .r(d => sizeScale(d.size))
   
    let b_data = beeswarm(data)
    console.log(b_data)
    g.selectAll('circle')
            .data(b_data)
            // .enter()
            .join("circle")
            .attr("stroke", "black")
            .attr("fill-opacity", 0.8)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.r)
            .style('fill', d => colorScale(d.data.region))
            .style('stroke', 'black')
            .style('stroke-width', 1);

}

beeswarmForce = function(){
    let x = d => parseFloat(d[0]);
    let y = d => d[1];
    let r = d => parseFloat(d[2]);
    // let c = d => d[3];
    // console.log('beeswarm force called')
    let ticks = 500;
    
    function beeswarm(data){
    // console.log('beeswarm called')

      const entries = data.map(d => {
        return {
          x0: typeof x === "function" ? x(d) : x,
          y0: typeof y === "function" ? y(d) : y,
          r: typeof r === "function" ? r(d) : r,
        //   c: typeof c === "function" ? c(d) : c,
          data: d
        }
      });
      
      const simulation = d3.forceSimulation(entries)
          .force("x", d3.forceX(d => d.x0))
          .force("y", d3.forceY(d => d.y0))
          .force("collide", d3.forceCollide(d => d.r));
      
      for (let i = 0; i < ticks; i++) simulation.tick();
      
      return entries;
    }
    
    beeswarm.x = f => f ? (x = f, beeswarm) : x;
    beeswarm.y = f => f ? (y = f, beeswarm) : y;
    beeswarm.r = f => f ? (r = f, beeswarm) : r;
    beeswarm.ticks = n => n ? (ticks = n, beeswarm) : ticks;
    
    return beeswarm;
  }


function updateData(){
    data = []
    global_data.forEach(function(data_point){
        if ( all_countries.includes(data_point['Country']) && parseInt(data_point['Year'])==year) {
            let object = {}
            object['x'] = parseFloat(data_point[x_axis_value])
            object['size'] = parseFloat(data_point[selectedSize])
            object['country'] = data_point['Country']
            object['region'] = country_to_region[data_point['Country']]
            data.push(object)
            
        }
    });
    sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => parseFloat(d.size))])
    .range([5, 30]);
    // updateBeeSwarm();
    console.log('UpdateData(): Data and Size scale updated.')
}

function updateXminmax(){
    x_min=9999999999999999.0;
    x_max = -x_min;
    global_data.forEach(function(data_point){
        //  calculate the x min max for each year
        if( all_countries.includes(data_point['Country'])){
            x_min = Math.min(x_min, parseFloat(data_point[x_axis_value]))
            x_max = Math.max(x_max, parseFloat(data_point[x_axis_value]))
        }});
    let domain = [x_min - x_max*0.2, x_max*1.2]
    console.log('Update x-axis domain is : '+JSON.stringify(domain))    
    xScale = d3.scaleLinear()
            .domain(domain)
            .range([margin.left, width - margin.right]);
    // updateBeeSwarm();
}

function updateAllCountries(){
    all_countries = []
    if(checked_regions.length == 0){
        // clearing everything if no region is selected
        console.log('here')
        const svg = d3.select("#svg-chart svg")
        svg.selectAll('*').remove()
        return
    }
    checked_regions.forEach(function(region){
        all_countries.push(...region_to_countries[region])
    })
}
// function updateBeeSwarm(){
    beeswarm = beeswarmForce()
    .x(d => xScale(d.x))
    .y(height / 3)
    .r(d => sizeScale(d.size))
// }