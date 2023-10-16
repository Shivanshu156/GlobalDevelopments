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
let all_countries = new Set()
let xScale;
let sizeScale;
let svg, g;
let beeswarm;
let remaining_data;
let addedCheckboxes, removedCheckboxes;


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
            region_to_countries[region] = new Set();
            }

            if (!region_to_countries[region].has(country)) {
            region_to_countries[region].add(country);
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


            drawBeeswarmChart();

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
    checkboxes = document.querySelectorAll(".checkbox-item");
    const selectAllCheckbox = document.getElementById("selectAll");
    const previousState = new Set();
  
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        if (checkbox === selectAllCheckbox) {
          checkboxes.forEach((cb) => {
            cb.checked = selectAllCheckbox.checked;
          });
        } else {
          updateState();
        }
      });
    });
  
    selectAllCheckbox.addEventListener("change", function () {
      checkboxes.forEach((cb) => {
        cb.checked = selectAllCheckbox.checked;
      });
      updateState();
    });
  
    function updateState() {
      const currentState = new Set();
      checkboxes.forEach((cb) => {
        if (cb.checked) {
          currentState.add(cb.value);
        }
      });
  
    addedCheckboxes = new Set(
        [...currentState].filter((id) => !previousState.has(id))
      );
  
    removedCheckboxes = new Set(
        [...previousState].filter((id) => !currentState.has(id))
      );

    previousState.clear();
    currentState.forEach((id) => {
    previousState.add(id);
    });
    updateChart(change='region');
    }


    // Select and show selected year value
    var yearInput = document.getElementById("year-input");
    const slider = document.getElementById("slider");
    // const sliderValue = document.getElementById("slider-value");

    yearInput.addEventListener("change", function(event) {
        event.stopPropagation();
        console.log("nahi chal rha bc 1")
        year = parseInt(yearInput.value);
        slider.value = year;
        updateChart('year');
      });
    slider.addEventListener("input", function(event) {
        event.stopPropagation();
        year = slider.value;
        console.log("nahi chal rha bc 2")

        yearInput.value = year;
        updateChart('year');
      });
    document.querySelectorAll(' .year-event').forEach(function (item) {
        item.addEventListener('click', function (event) {
            event.stopPropagation();
        year = parseInt(item.getAttribute('value'));
        console.log("nahi chal rha bc 3")

        yearInput.value = year;
        slider.value = year;
        updateChart('year');
        });
    });
      
    


});


function updateChart(change) {
    if(change=='year'){
        console.log('Year change event occured')
        d3.selectAll('#tooltip').remove()
        updateData()

        let b_data = beeswarm(data)
        //  we are seeing new data coming from (0,0) as 
        // some countries don't have data for some years and changing year adds new data
        console.log('total data points are '+ JSON.stringify(b_data.length))
        g.selectAll('circle')
                .data(b_data, d => d.data.country)
                .join('circle')
                .style('stroke', 'black')
                .style('stroke-width', 1)
                .transition()
                .duration(1000)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", d => d.r)
                .style('fill', d => colorScale(d.data.region))

                .delay(function(d,i){return(i*5)})   
        addToolTip()         
        }
    else if(change=='region') {
        console.log('region change event occured')
        updateAllCountries();
        updateXminmax();
        updateData();

        // update min max axis
        svg.select(".x-axis-line")
        .transition()
        .duration(1000) 
        .call(d3.axisBottom(xScale))

        // fade old countries data and adjust beeswarm chart
        if(removedCheckboxes.size){
        d3.selectAll('circle').filter(function() {
            return removedCheckboxes.has(d3.select(this).data()[0].data.region); })
            .transition()
            .duration(1000) 
            .style('opacity', 0)
            .style('stroke-width', 0)
            .remove()
            .on('end', function(){
                if (d3.selectAll('circle').filter(function() {
                    return removedCheckboxes.has(d3.select(this).data()[0].data.region);
                  }).empty()) {
                remaining_data = d3.selectAll('circle').data().map(d=>d.data)
                console.log('remaining data is')
                console.log(remaining_data)
                let b_remaining_data = beeswarm(remaining_data)
                g.selectAll('circle')
                .data(b_remaining_data, d => d.data.country)
                .join('circle')
                .transition()
                .duration(1000)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", d => d.r)
                .style('fill', d => colorScale(d.data.region))
                .delay(function(d,i){return(i*5)}) 
                }
            });
        }

        // add new countries
        if (addedCheckboxes.size){
            let new_data = beeswarm(data)
            console.log('new data is')
            console.log(new_data)
            g.selectAll('circle')
                .data(new_data, d => d.data.country)
                .join('circle')
                .each(function(d){
                    
                    if( addedCheckboxes.has(d.data.region) ){
                        console.log('inside newly added circles and data point is')
                        console.log(d3.select(this))
                        d3.select(this)

                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y)
                        .attr("r", d => d.r)
                        .style('fill', d => colorScale(d.data.region))
                        .style('opacity', 0)
                        .style('stroke', 'black')
                        .style('stroke-width', 1);
                        d3.select(this)
                        .transition()
                        .duration(2000)
                        .style('opacity', 1)
                        // .delay(function(d,i){return(i*5)}) 

                    }
                    else{
                        d3.select(this)
                        // .join('circle')
                        .transition()
                        .duration(2000)
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y)
                        .attr("r", d => d.r)
                        .style('fill', d => colorScale(d.data.region))
                        .style('opacity', 1)
                        .style('stroke', 'black')
                        .style('stroke-width', 1)
                        // .style('fill', d => colorScale(d.data.region))
                        .delay(function(d,i){return(i*5)}) 
                    }
                })
        }

        addToolTip()         


    }else if(change=='x-axis'){
        console.log('x-axis change event occured')
        updateXminmax();
        svg.selectAll('.x-axis-title')
            .transition()
            .duration(1000)
            .style("opacity", 0)
            .on('end', function () {
                svg.select(".x-axis-line")
                .transition()
                .duration(1000) 
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
                                .data(b_data, d => d.data.country)
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
        addToolTip()         


    }else if(change=='size'){
        console.log('size change event occured')
        updateData();
        let b_data = beeswarm(data)
        g.selectAll('circle')
                .data(b_data, d => d.data.country)
                .join('circle')
                .transition()
                .duration(1000)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", d => d.r)
                .delay(function(d,i){return(i*5)})      

        addToolTip()         
    

    }
    const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    // .style("background-color", "white")
    .style("border", "2px solid black")
    .style("padding", "5px")
    .style("opacity", 0.9)
    .style("display", "none");

    g.selectAll('circle')
    .on('mouseover', function(event,d){
      d3.select(this)
    //   .attr('stroke-width', 4)
      .style('stroke-width', 4)
      
      const xPosition = event.pageX + 10; 
      const yPosition = event.pageY - 30; 
      console.log(d)
      tooltip.html("<span> Country: " + d.data.country + " <br>" + 
      x_axis_value + ": "+d.data.x +" <br>" +selectedSize + ": "+d.data.size+ "</span>" )
      tooltip.style('left', xPosition + 'px')
             .style('top', yPosition + 'px');
      tooltip.style('display', 'inline-block')
      tooltip.style('background-color',   colorScale(d.data.region))
      .style('color', '#000')

    })
    .on('mousemove', function(event, d){
        const xPosition = event.pageX + 10; 
        const yPosition = event.pageY - 30; 
        tooltip.style('left', xPosition + 'px')
        .style('top', yPosition + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
        .style('stroke-width', 1);
        tooltip.style('display', 'none');
      })
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


function drawBeeswarmChart() {
    

    svg = d3.select("#svg-chart svg")
    svg.attr('width', width)
    svg.attr('height', height)
    g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xAxis = d3.axisBottom(xScale);
    
    // Append the x-axis  and label to the chart
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
    g.selectAll('circle')
            .data(b_data, d => d.data.country)
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
        if ( all_countries.has(data_point['Country']) && parseInt(data_point['Year'])==year) {
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
    .range([5, 20]);
    console.log('UpdateData(): Data and Size scale updated.')
}

function updateXminmax(){
    x_min=Infinity;
    x_max = -x_min;
    global_data.forEach(function(data_point){
        //  calculate the x min max for each year
        if( all_countries.has(data_point['Country'])){
            x_min = Math.min(x_min, parseFloat(data_point[x_axis_value]))
            x_max = Math.max(x_max, parseFloat(data_point[x_axis_value]))
        }});
 
    let domain = [x_min - x_max*0.2, x_max*1.2]
    console.log('Update x-axis domain is : '+JSON.stringify(domain))    
    xScale = d3.scaleLinear()
            .domain(domain)
            .range([margin.left, width - margin.right]);
}

function updateAllCountries(){

    let addedCountries=new Set(), removedCountries=new Set();
    addedCheckboxes.forEach(function(region){
        region_to_countries[region].forEach(item => {addedCountries.add(item);});
    });

    removedCheckboxes.forEach(function(region){
        region_to_countries[region].forEach((item) => {removedCountries.add(item);});
    })
  
    all_countries = new Set([...all_countries].filter(d => !removedCountries.has(d)))
    addedCountries.forEach(function(country){
        all_countries.add(country)
    })
    console.log('Countries updated successfully')
}

beeswarm = beeswarmForce()
            .x(d => xScale(d.x))
            .y(height / 3)
            .r(d => sizeScale(d.size))

function addToolTip(){

}

//  animation stuff you know ;)
 var currently_playing = false;
 var each_year_time;
 
 function play_animation_pleaaaassssseeeee() {
    currently_playing = true;
    dispatchEventForYear();
  
    each_year_time = setInterval(function () {
      year++; 
      if (year <= 2013) {
        dispatchEventForYear();
        if (year == 2013){
            togglePlayPause()
        }
      } else {
      
        stoooooopiiitttttttt();
      }
    }, 2000); 
  }
  
  function dispatchEventForYear() {
    console.log('Year is ' + year);
    const slider = document.getElementById("slider");
    slider.value = year;
  
    // Dispatch an input event to trigger the change
    const inputEvent = new Event("input", {
      bubbles: true,
      cancelable: true,
    });
    slider.dispatchEvent(inputEvent);
  }
  
  function stoooooopiiitttttttt() {
    currently_playing = false;
    clearInterval(each_year_time);
  }
  
 function togglePlayPause() {
   var playIcon = document.getElementById("playIcon");
   var playText = document.getElementById("playText");
 
   if (!currently_playing) {
     play_animation_pleaaaassssseeeee();
     playIcon.className = "fas fa-pause"; 
     playText.textContent = "Pause";
     currently_playing = true;
   } else {
     stoooooopiiitttttttt();
     playIcon.className = "fas fa-play"; 
     playText.textContent = "Play";
     currently_playing = false;
   }
 }

