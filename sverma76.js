var global_data;
var country_data;
var country_flags;
var allChecked;
var x_axis_value, boxplot_value;
var x_axis_display, boxplot_display;
var selectedSize;
var checkboxes;
var year = 1980;
let region_to_countries = {};
let country_to_region = {};
let country_to_flag = {}
var checked_regions
let beeswarm_width = 800;
let height = 600;
let colorScale;
let margin = { top: 0, right: 40, bottom: 40, left: 20 };
let data = []
let boxplot_data;
let all_countries = new Set()
let xScale;
let sizeScale;
let beeswarm_svg, g;
let beeswarm;
let boxplot_height = 700;
let remaining_data;
let addedCheckboxes, removedCheckboxes;
let circleMax = 15, circleMin = 3;
let legend;
let circleSizes, circleSizesDomain;
let minSizeDomain, maxSizeDomain;
const circleSpacing = 150;
let innerPadding = 1.3;
let boxplotContainer, boxplotTooltip;


const labels = ["Smallest", "Medium", "Largest"];

Promise.all([d3.csv('data/global_development.csv', (d) => { return d }),
d3.csv('data/countries_regions.csv', (d) => { return d }),
d3.csv('data/Country_Flags.csv', (d) => { return d })
])
  .then(function (data) {
    console.log('loaded global_development.csv and countries_regions.csv');
    global_data = data[0];
    country_data = data[1];
    country_flags = data[2];

    country_data.forEach(function (data) {
      let region = data['World bank region'];
      let country = data['name'];
      if (!(region in region_to_countries)) {
        region_to_countries[region] = new Set();
      }

      if (!region_to_countries[region].has(country)) {
        region_to_countries[region].add(country);
      }
      if (!(country in country_to_region))
        country_to_region[country] = region
    });
    colorScale = d3.scaleOrdinal().domain(Object.keys(region_to_countries)).range(d3.schemeCategory10);

    country_flags.forEach(function (data) {
      let country = data['Country'];
      country_to_flag[country] = data['ImageURL']
    });


    $(document).ready(function () {

      // $('[x-axis-nav-value="Data.Health.Birth Rate"]').click();
      $('[x-axis-nav-value="Data.Health.Birth Rate"]').click();
      $('[size-value="Data.Health.Death Rate"]').click();
      $('[year-value=1980]').click();
      $('#selectAll').click();
      $('[boxplot-nav-value="Data.Health.Birth Rate"]').click();


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
  const deselectAllCheckbox = document.getElementById("deselectAll");
  const previousState = new Set();

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function (event) {
      console.log("inside checkbox change event")
        updateState();
    });
  });

  selectAllCheckbox.addEventListener("click", function () {
    checkboxes.forEach((cb) => {
      cb.checked = true;
    });
    updateState();
  });

  deselectAllCheckbox.addEventListener("click", function () {
    checkboxes.forEach((cb) => {
      cb.checked = false;
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
    updateChart(change = 'region');
  }

  // Select and show selected boxplot attribute value
  document.querySelectorAll('.boxplot-nav').forEach(function (item) {
    item.addEventListener('click', function () {
      boxplot_value = item.getAttribute('boxplot-nav-value');
      boxplot_display = item.textContent
      document.getElementById('boxplot-nav-selected').textContent = boxplot_display;
      updateChart(change = 'boxplot-attribute')
    });
  });

  // Select and show selected year value
  var yearInput = document.getElementById("year-input");
  const slider = document.getElementById("slider");

  yearInput.addEventListener("change", function (event) {
    event.stopPropagation();
    year = parseInt(yearInput.value);
    slider.value = year;
    updateChart('year');
  });
  slider.addEventListener("input", function (event) {
    event.stopPropagation();
    year = slider.value;

    yearInput.value = year;
    updateChart('year');
  });
  document.querySelectorAll(' .year-event').forEach(function (item) {
    item.addEventListener('click', function (event) {
      event.stopPropagation();
      year = parseInt(item.getAttribute('value'));

      yearInput.value = year;
      slider.value = year;
      updateChart('year');
    });
  });

});


function updateChart(change) {
  if (change == 'year') {
    console.log('Year change event occured')
    d3.selectAll('#beeswarmTooltip').remove()
    d3.selectAll('#boxplotTooltip').remove()
    updateData()

    let b_data = beeswarm(data)
    //  we are seeing new data coming from (0,0) as 
    // some countries don't have data for some years and changing year adds new data
    console.log('total data points are ' + JSON.stringify(b_data.length))
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

      .delay(function (d, i) { return (i * 5) })

    updateBoxplotData()
    // Some stuff to update boxplots using animations or something
    //  no animation this time, maybe later ;-)
    d3.selectAll('.sub-box').remove()
    d3.selectAll('.boxplot-title').remove()
    drawBoxplots()
  }
  else if (change == 'region') {
    console.log('region change event occured')
    updateAllCountries();
    updateXminmax();
    updateData();
    console.log('these checkboxes are removed')
    console.log(removedCheckboxes)
    // update min max axis
    beeswarm_svg.select(".x-axis-line")
      .transition()
      .duration(1000)
      .call(d3.axisBottom(xScale))

    // fade old countries data and adjust beeswarm chart
    if (removedCheckboxes.size) {
      g.selectAll('circle').filter(function () {
        return removedCheckboxes.has(d3.select(this).data()[0].data.region);
      })
        .transition()
        .duration(1000)
        .style('opacity', 0)
        .style('stroke-width', 0)
        .remove()
        .on('end', function () {
          if (g.selectAll('circle').filter(function () {
            return removedCheckboxes.has(d3.select(this).data()[0].data.region);
          }).empty()) {
            remaining_data = g.selectAll('circle').data().map(d => d.data)
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
              .delay(function (d, i) { return (i * 5) })
          }
        });
    }

    // add new countries
    if (addedCheckboxes.size) {
      let new_data = beeswarm(data)
      console.log('new data is')
      console.log(new_data)
      g.selectAll('circle')
        .data(new_data, d => d.data.country)
        .join('circle')
        .each(function (d) {

          if (addedCheckboxes.has(d.data.region)) {
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
              .delay(function(da,i){return(i*50)}) 
              .style('opacity', 1)
          }
          else {
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
              .delay(function (d, i) { return (i * 5) })
          }
        })

    }

    // addToolTip()         
    updateBoxplotData()
    // Some stuff to update boxplots using animations or something
        
    d3.selectAll('.sub-box').remove()
    d3.selectAll('.boxplot-title').remove()
    drawBoxplots()


  } else if (change == 'x-axis') {
    console.log('x-axis change event occured')
    updateXminmax();
    beeswarm_svg.selectAll('.x-axis-title')
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .on('end', function () {
        beeswarm_svg.select(".x-axis-line")
          .transition()
          .duration(1000)
          .call(d3.axisBottom(xScale))
          .on('end', function () {
            beeswarm_svg.select('.x-axis-title')
              .transition()
              .duration(1000)
              .text(x_axis_display)
              .style("opacity", 1)
              .on('end', function () {
                let b_data = beeswarm(data)
                g.selectAll('circle')
                  .data(b_data, d => d.data.country)
                  .join('circle')
                  .transition()
                  .duration(1000)
                  .attr("cx", d => d.x)
                  .attr("cy", d => d.y)
                  .attr("r", d => d.r)
                  .delay(function (d, i) { return (i * 5) })
              });

          });
      });

    updateData();
    addToolTip()


  } else if (change == 'size') {
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
      .delay(function (d, i) { return (i * 5) })

    addToolTip()


  } else if (change == 'boxplot-attribute') {
    console.log('Boxplot attribute change event occured')
    updateBoxplotData()
    // Some stuff to update boxplots using animations or something
    d3.selectAll('.sub-box').remove()
    d3.selectAll('.boxplot-title').remove()
    drawBoxplots()
  }



  const beeswarmTooltip = d3.select("body").append("div")
    .attr("id", "beeswarmTooltip")
    .style("position", "absolute")
    .style("border", "2px solid black")
    .style("padding", "5px")
    .style("opacity", 0.9)
    .style("display", "none");

  g.selectAll('circle')
    .on('mouseover', function (event, d) {
      d3.select(this)
        .style('stroke-width', 4)

      const xPosition = event.pageX + 10;
      const yPosition = event.pageY - 30;
      console.log(d)
      beeswarmTooltip.html("<div><img src='" + country_to_flag[d.data.country] + "' alt='Image' style='border: 2px solid #000; width: 50px; height: 50px;'><span>Country: " + d.data.country + "<br>Region: " + country_to_region[d.data.country] + " <br>" +
        x_axis_value + ": " + d.data.x + " <br>" + selectedSize + ": " + d.data.size + "</span></div>")
      beeswarmTooltip.style('left', xPosition + 'px')
        .style('top', yPosition + 'px');
      beeswarmTooltip.style('display', 'inline-block')
      beeswarmTooltip.style('background-color', colorScale(d.data.region))
        .style('color', '#000')

    })
    .on('mousemove', function (event, d) {
      const xPosition = event.pageX + 10;
      const yPosition = event.pageY - 30;
      beeswarmTooltip.style('left', xPosition + 'px')
        .style('top', yPosition + 'px');
    })
    .on('mouseout', function () {
      d3.select(this)
        .style('stroke-width', 1);
      beeswarmTooltip.style('display', 'none');
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


  beeswarm_svg = d3.select(".beeswarm-container").append('svg').attr("class", 'beeswarm-svg')
  beeswarm_svg.attr('width', beeswarm_width)
  beeswarm_svg.attr('height', height)

  console.log('height is ' + height + 'width is ' + beeswarm_width)
  g = beeswarm_svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  const xAxis = d3.axisBottom(xScale);

  // Append the x-axis  and label to the chart
  beeswarm_svg.append('g')
    .attr('id', 'x-axis-line')
    .attr('class', 'x-axis-line')
    .attr('transform', `translate(0, ${height - 2 * margin.bottom})`)
    .call(xAxis);
  beeswarm_svg.append('text')
    .attr('class', 'x-axis-title')
    .attr('x', beeswarm_width / 2 - margin.right - margin.left)
    .attr('y', height - margin.bottom)
    .text(x_axis_value);

  beeswarm = beeswarmForce()
    .x(d => xScale(d.x))
    .y(height / 2)
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

  // key for beeswarm

  legend = beeswarm_svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + margin.left + "," + 5 + " )");

  legend.append("rect")
    .attr("width", beeswarm_width - margin.left - margin.right)
    .attr("height", 50)
    .attr("fill", "#D6CC99")
    .attr("stroke", "#445D48")
    .attr("stroke-width", 1)
    .style('opacity', 1)

  legend.selectAll("circle")
    .data(circleSizes)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => (i + innerPadding) * circleSpacing + d)
    .attr("cy", 25)
    .attr("r", d => d)
    .style("fill", "#445D48")
    .style('stroke', 'black');

  legend.selectAll("text")
    .data(labels)
    .attr('class', 'label-value')
    .enter()
    .append("text")
    .attr("x", (d, i) => (i + innerPadding) * circleSpacing + 3 * circleSizes[i])
    .attr("y", 30)
    .style('fill', '#445D48')
    .text((d, i) => circleSizesDomain[i]);

  legend.append("text")
    .attr("x", 15)
    .attr("y", 30)
    .style("fill", "#445D48")
    .text("Size:");

}


function drawBoxplots() {
  console.log('inside drawboxplots')

  const boxplotWidth = 500;
  const boxplotHeight = 70;
  const boxMargin = { top: 10, right: 30, bottom: 30, left: 20 };
  boxplotContainer = d3.select(".boxplot-container").attr('height', boxplot_height);
  
  boxplotTitle = boxplotContainer.append('g')
  .attr("class", "boxplot-title")
  .html('<strong>'+boxplot_value+'</strong><br><br><br>');


  boxplotTitle.style("display", "flex");
  boxplotTitle.style("justify-content", "center");
  boxplotTitle.style("align-items", "center");
  


  function drawBoxPlot(key, boxplotData) {
    // console.log('inside drawplotbox and key is '+ key.replace(/\s+/g, '-').replace(/&/g, ''))

    const min = d3.min(boxplotData);
    const max = d3.max(boxplotData);
    const q1 = d3.quantile(boxplotData, 0.25);
    const median = d3.median(boxplotData);
    const q3 = d3.quantile(boxplotData, 0.75);

    const boxplotSvg = boxplotContainer.append("svg")
      .attr("width", boxplotWidth)
      .attr("height", boxplotHeight)
      .attr("class", "sub-box")
      // .attr("class", key.replace(/\s+/g, '-').replace(/&/g, ''))
      .on("mouseover", (event, d) => showTooltip(key, min, q1, median, q3, max, event))
      .on("mouseout", hideTooltip)
      .on('mousemove', (event, d) => moveTooltip(event))


    const xScaleBoxplot = d3.scaleLinear()
      .domain([d3.min(boxplotData), d3.max(boxplotData)])
      .range([boxMargin.left, boxplotWidth - boxMargin.right]);

    boxplotSvg.append("rect")
      .attr("x", xScaleBoxplot(q1))
      .attr("y", boxMargin.top)
      .attr("width", xScaleBoxplot(q3) - xScaleBoxplot(q1))
      .attr("height", boxplotHeight - boxMargin.top - boxMargin.bottom)
      .attr("class", "box")
      .style("fill", colorScale(key));

    boxplotSvg.selectAll(".whisker")
      .data([min, max])
      .enter().append("line")
      .attr("x1", d => xScaleBoxplot(d))
      .attr("x2", d => xScaleBoxplot(d))
      .attr("y1", boxMargin.top)
      .attr("y2", boxplotHeight - boxMargin.bottom)
      .attr("class", "whisker");

    boxplotSvg.append("line")
      .attr("x1", xScaleBoxplot(median))
      .attr("x2", xScaleBoxplot(median))
      .attr("y1", boxMargin.top)
      .attr("y2", boxplotHeight - boxMargin.bottom)
      .attr("class", "median-line");


    boxplotSvg.append("line")
      .attr("x1", xScaleBoxplot(min))
      .attr("x2", xScaleBoxplot(q1))
      .attr("y1", (boxplotHeight - boxMargin.bottom) / 2 + boxMargin.top / 2)
      .attr("y2", (boxplotHeight - boxMargin.bottom) / 2 + boxMargin.top / 2)
      .attr("class", "median-line");

    boxplotSvg.append("line")
      .attr("x1", xScaleBoxplot(q3))
      .attr("x2", xScaleBoxplot(max))
      .attr("y1", (boxplotHeight - boxMargin.bottom + boxMargin.top) / 2)
      .attr("y2", (boxplotHeight - boxMargin.bottom + boxMargin.top) / 2)
      .attr("class", "median-line");

    boxplotSvg.append("text")
      .attr("class", "boxplot-text")
      .attr("x", xScaleBoxplot(q1))
      .attr("y", boxplotHeight - boxMargin.bottom + 20)
      .text("Q1");

    boxplotSvg.append("text")
      .attr("class", "boxplot-text")
      .attr("x", xScaleBoxplot(median))
      .attr("y", boxplotHeight - boxMargin.bottom + 20)
      .text("Q2");

    boxplotSvg.append("text")
      .attr("class", "boxplot-text")
      .attr("x", xScaleBoxplot(q3))
      .attr("y", boxplotHeight - boxMargin.bottom + 20)
      .text("Q3");

    boxplotSvg.append("text")
      .attr("class", "boxplot-text-min")
      .attr("x", xScaleBoxplot(min))
      .attr("y", boxplotHeight - boxMargin.bottom + 20)
      .text("Min");

    boxplotSvg.append("text")
      .attr("class", "boxplot-text-max")
      .attr("x", xScaleBoxplot(max))
      .attr("y", boxplotHeight - boxMargin.bottom + 20)
      .text("Max");
  }

  function showTooltip(key, min, q1, median, q3, max, event) {
    console.log('inside show tool tip')
    boxplotTooltip = d3.select("body").append("div")
      .attr("id", "boxplotTooltip")
      .style("position", "absolute")
      .style("border", "2px solid black")
      .style("padding", "5px")
      .style("opacity", 1)
      .style("background-color", colorScale(key))
      .style("display", "none");
    boxplotTooltip.html(`<strong>${key}</strong><br>Attribute: ${boxplot_value}<br>Min: ${min}<br>Q1: ${q1}<br>Median: ${median}<br>Q3: ${q3}<br>Max: ${max}`)
      .style("left", (event.pageX) + "px")
      .style("top", (event.pageY) + "px")
      .style("display", "block");
  }

  function hideTooltip() {
    boxplotTooltip.style("display", "none");
  }

  function moveTooltip(event) {
    const xPosition = event.pageX + 10;
    const yPosition = event.pageY - 30;
    boxplotTooltip.style('left', xPosition + 'px')
      .style('top', yPosition + 'px');

  }

  for (const key in boxplot_data) {
    if (boxplot_data.hasOwnProperty(key)) {
      drawBoxPlot(key, boxplot_data[key]);
    }
  }

}

beeswarmForce = function () {
  let x = d => parseFloat(d[0]);
  let y = d => d[1];
  let r = d => parseFloat(d[2]);
  // let c = d => d[3];
  // console.log('beeswarm force called')
  let ticks = 500;

  function beeswarm(data) {
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


function updateData() {
  data = []
  global_data.forEach(function (data_point) {
    if (all_countries.has(data_point['Country']) && parseInt(data_point['Year']) == year) {
      let object = {}
      object['x'] = parseFloat(data_point[x_axis_value])
      object['size'] = parseFloat(data_point[selectedSize])
      object['country'] = data_point['Country']
      object['region'] = country_to_region[data_point['Country']]
      data.push(object)

    }
  });
  console.log('data is')
  console.log(data)
  if (data.length) {
    minSizeDomain = d3.min(data, d => parseFloat(d.size))
    maxSizeDomain = d3.max(data, d => parseFloat(d.size))

    // updating size scale
    sizeScale = d3.scaleSqrt()
      .domain([minSizeDomain, maxSizeDomain])
      .range([circleMin, circleMax]);
    console.log('UpdateData(): Data and Size scale updated.')
    circleSizes = [circleMin, (circleMin + circleMax) / 2, circleMax]
    circleSizesDomain = [minSizeDomain.toFixed(2), ((minSizeDomain + maxSizeDomain) / 2).toFixed(2), maxSizeDomain.toFixed(2)]

    legend.selectAll('text')
      .filter(function () {
        return this.textContent !== "Size:";
      })
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .on('end', function () {
        legend.selectAll("text")
          .filter(function () {
            return this.textContent !== "Size:";
          })
          .transition()
          .duration(1000)
          .attr("x", (d, i) => (i + innerPadding) * circleSpacing + 3 * circleSizes[i])
          .text((d, i) => circleSizesDomain[i])
          .style("opacity", 1);
      });
  }
}

function updateXminmax() {
  x_min = Infinity;
  x_max = -x_min;
  global_data.forEach(function (data_point) {
    //  calculate the x min max for each year
    if (all_countries.has(data_point['Country'])) {
      x_min = Math.min(x_min, parseFloat(data_point[x_axis_value]))
      x_max = Math.max(x_max, parseFloat(data_point[x_axis_value]))
    }
  });

  let domain = [x_min - x_max * 0.3, x_max * 1.4]
  console.log('Update x-axis domain is : ' + JSON.stringify(domain))
  xScale = d3.scaleLinear()
    .domain(domain)
    .range([margin.left, beeswarm_width - margin.right]);
}

function updateAllCountries() {

  let addedCountries = new Set(), removedCountries = new Set();
  addedCheckboxes.forEach(function (region) {
    region_to_countries[region].forEach(item => { addedCountries.add(item); });
  });

  removedCheckboxes.forEach(function (region) {
    region_to_countries[region].forEach((item) => { removedCountries.add(item); });
  })

  all_countries = new Set([...all_countries].filter(d => !removedCountries.has(d)))
  addedCountries.forEach(function (country) {
    all_countries.add(country)
  })
  console.log('Countries updated successfully')
}

function updateBoxplotData() {
  boxplot_data = {}
  global_data.forEach(function (data_point) {
    if (all_countries.has(data_point['Country']) && parseInt(data_point['Year']) == year) {

      if (!boxplot_data.hasOwnProperty(country_to_region[data_point['Country']]))
        boxplot_data[country_to_region[data_point['Country']]] = []

      boxplot_data[country_to_region[data_point['Country']]].push(parseFloat(data_point[boxplot_value]))

    }
  });
  console.log('Boxplot Data is updated and new boxplot_data is')
  console.log(boxplot_data)

}
beeswarm = beeswarmForce()
  .x(d => xScale(d.x))
  .y(height / 3)
  .r(d => sizeScale(d.size))

function addToolTip() {

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
      if (year == 2013) {
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

