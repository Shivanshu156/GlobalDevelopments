var global_data;
let global_data_headers;
let columns_to_visualize;
let selected_countries;
let width = 1600;
let height = 1000;

 Promise.all([d3.csv('data/global_development.csv', (d) => { return d  }),
                d3.csv('data/countries_regions.csv', (d) => { return d  })  ])
        .then(function (data) {
            // console.log('loaded global_development.csv and countries_regions.csv');
            global_data = data[0];
            country_data = data[1];
            selected_countries = country_data.map(country => country.name).slice(10,20)
            // console.log(selected_countries)
            // console.log(country_data)
            global_data_headers = Object.keys(global_data[0])
            // console.log(global_data)
            columns_to_visualize = global_data_headers.slice(2,12)
            // console.log(global_data_headers)
            // console.log(columns_to_visualize)
            
            // drawControlPanel(selected_countries, global_data_headers);ss
            })


document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(' .x-axis').forEach(function (item) {   
        item.addEventListener('click', function () {

        const x_axis_value = item.getAttribute('x-axis-value');
        document.getElementById('x-axis-selected').textContent = x_axis_value;
        });
    });


    document.querySelectorAll(' .size').forEach(function (item) {
        item.addEventListener('click', function () {

        const selectedValue = item.getAttribute('size-value');
        document.getElementById('size-selected').textContent = selectedValue;
        console.log(selectedValue)
        });
  });
});


    document.addEventListener("DOMContentLoaded", function () {
      const selectAllCheckbox = document.getElementById("selectAll");
      const checkboxes = document.querySelectorAll('.checkbox-item');
      const selectedItems = document.getElementById("selectedItems");
      
      selectAllCheckbox.addEventListener("change", function () {
        checkboxes.forEach((checkbox) => {
          checkbox.checked = selectAllCheckbox.checked;
        });
        // updateSelectedItems();
      });
      
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", function () {
                //     checkbox.parentElement.addEventListener("click", function () {
    //       checkbox.checked = !checkbox.checked;
          const allChecked = [...checkboxes].every((checkbox) => checkbox.checked);
          selectAllCheckbox.checked = allChecked;
          updateSelectedItems();
        });
      });
    
      
    //   document.getElementById("dropdownItems").addEventListener("click", function (e) {
    //     e.stopPropagation();
    //   });
      function updateSelectedItems() {
        const selected = Array.from(checkboxes)
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => checkbox.parentElement.textContent.trim())
          .join(", ");
        selectedItems.textContent = selected || "None";
      }


    const slider = document.getElementById("slider");
    const sliderValue = document.getElementById("slider-value");

    slider.addEventListener("input", function() {
        let value = slider.value;
        sliderValue.textContent = value;
      });
    });

    
    var isPlaying = false; // Initialize the animation state
    var animationInterval; // Variable to store the animation interval

    // Replace this with your D3 animation code
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
        playIcon.className = "fas fa-pause"; // Change to the pause icon
        playText.textContent = "Pause";
        isPlaying = true;
      } else {
        stopAnimation();
        playIcon.className = "fas fa-play"; // Change back to the play icon
        playText.textContent = "Play";
        isPlaying = false;
      }
    }

