console.log("hello, world!");
// get page parameters with let
let params = new URLSearchParams(window.location.search);
let insee = params.get("insee");
let city = params.get("ville");

// date calculs
let timestamp_today = Date.parse(new Date()) / 1000;
let timestamp_lastyear = timestamp_today - 31536000;
let lastyear_to_date = new Date(timestamp_lastyear * 1000)
  .toISOString()
  .split("T")[0];

const months = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

if (city && insee) {
  const cityTitle = document.querySelector("#active_city");
  cityTitle.innerHTML = city + "&nbsp;";

  const recommendations = document.querySelector("#todayReco");

  const loaders = document.querySelectorAll(".loading-div"),
    iqaValue = document.querySelector(".iqa_value"),
    iqaGauge = document.querySelector(".fill-gauge"),
    skeletons = document.querySelectorAll(".skeleton");

  async function getInfos(insee) {
    const response = await fetch(
      `https://api.atmosud.org/siam/v1/communes/${insee}`
    );
    const data = await response.json();
    return data.data;
  }

  let cityInfos = getInfos(insee);

  cityInfos.then((data) => {
    console.log(data);
    // stop displaying loaders when promise is resolved
    loaders.forEach((loader) => {
      loader.style.display = "none";
    });

    skeletons.forEach((skeleton) => {
      skeleton.classList.remove("skeleton");
    });

    // assigning good values[x] to good variables
    let infos = data;

    // get current date and convert it to the format : yyyy-mm-dd
    let actualDate = new Date();
    actualDate = actualDate.toISOString().split("T")[0];

    let todayIndicesAtmos = infos.indices_atmo[actualDate];

    let todayIQA = Math.round(todayIndicesAtmos.indice_atmo);

    let indicesAtmoLegends = infos.legendes.indice_atmo[todayIQA];
    let pollutionLegends = infos.legendes.polluants;

    // calculate pourcentage of iqa, because API return a value between 0 and 7
    let iqaPourcentage = (todayIQA / 5) * 100;
    iqaGauge.style.height = `${iqaPourcentage}%`; // apply the pourcentage to the gauge width
    iqaGauge.style.backgroundColor = indicesAtmoLegends.couleur;

    iqaValue.innerHTML = `${indicesAtmoLegends.qualificatif} : ${todayIQA}`;

    recommendations.innerHTML = data.commentaires[actualDate];

    // informations of pollution particles
    let pollutionParticles = todayIndicesAtmos.sous_indices;

    for (const [key, value] of Object.entries(pollutionParticles)) {
      //find index of actual pollution particle
      let index = pollutionLegends
        .map((e) => e.code_polluant_eu)
        .indexOf(value.code_polluant_eu);

      // append it to the DOM
      let pollutionParticle = document.querySelector(`#p${key}`);
      pollutionParticle.innerHTML = `${pollutionLegends[index].acronyme} : ${value.indice_atmo}`;
      pollutionParticle.style.color =
        infos.legendes.indice_atmo[value.indice_atmo].couleur;
    }

    let coord = {
      // get coordinate of searched city
      x: infos.commune.centroid.x,
      y: infos.commune.centroid.y,
    };
    const embedMap = document.querySelector(".embed_map");
    embedMap.innerHTML += `
    <iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyD_ih0KhLOgejFwZ85rzYf6W9VdRo6OtCk&q=${coord.y},${coord.x}&zoom=12&maptype=satellite&language=fr" frameborder="0" style="border:0" allowfullscreen width="100%" height="100%"></iframe>
    `;
    //fetch from meteomatics
    async function weatherInformations(x, y) {
      let username = "iut_lambert";
      let password = "zv6g5ZwFK7";

      let actualDate = new Date();

      const response = await fetch(
        `https://api.meteomatics.com/${actualDate.toISOString()}/t_2m:C,weather_symbol_1h:idx/${y},${x}/json`,
        {
          headers: new Headers({
            Authorization: "Basic " + btoa(`${username}:${password}`),
          }),
        }
      );
      const data = await response.json();
      call_webGL(data);
    }

    weatherInformations(coord.x, coord.y);

    function call_webGL(data) {
      let weatherIconIndex = data.data[1].coordinates[0].dates[0].value;
      weather_id = weatherIconIndex;

      // import index.min.js file to enable it
      fetch("./assets/app/weather/rainDay.js")
        .then((response) => response.text())
        .then((data) => {
          eval(data);
        })
        .catch((error) => {
          console.log("erreur de chargement du fichier webGL", error);
        });

      console.log(data);
      const temp = document.querySelector("#temp");
      const weatherContainer = document.querySelector(".weather_container");
      let temperature = Math.floor(data.data[0].coordinates[0].dates[0].value);

      temp.innerHTML = `${temperature}°C`;
      weatherContainer.innerHTML += `<img src="assets/icons/${weatherIconIndex}.png" alt="weather icon" id="weatherIcon" />`;
    }
  });
} else {
  // if there is no city in the url, redirect to index.html
  window.location.href = "/";
}

async function fetch_historical() {
  const response = await fetch(
    `https://api.atmosud.org/iqa2021/commune/bulletin/journalier?format_indice=valeur&indice=iqa&format=json&insee=${insee}&srid=2154&echeances=0&date_diff_min=${lastyear_to_date}`
  );
  const data = await response.json();
  iqa_month_average(data);
}

fetch_historical();

const iqa_month_average = (data) => {
  console.log(data[0].bulletins);

  const yAxis = [];

  let temp = [];

  for (let i = 1; i <= 12; i++) {
    temp = [];
    let month_match = new RegExp(`^[0-9]{4}-${i < 10 ? "0" + i : i}-[0-9]{2}$`);
    let month_average = 0;

    for (let j = 0; j < data[0].bulletins.length; j++) {
      if (month_match.test(data[0].bulletins[j].date_diffusion)) {
        month_average += data[0].bulletins[j].valeurs[0].indice.valeur;
        temp.push("i");
      }
    }
    yAxis.push(Math.round((month_average / temp.length) * 100) / 100);
  }
  iqa_month_graph(yAxis);
};

function iqa_month_graph(yAxis) {
  const trace1 = {
    x: months,
    y: yAxis,
    name: "pollution",
    histnorm: "Degrés",
    text: yAxis.map(String),
    textposition: "auto",
    font: {
      color: "#fff",
    },

    marker: {
      color: "rgba(255, 255, 255, 1)",
      width: 1,
    },
    opacity: 0.9,
    type: "bar",
  };

  const graph_array = [trace1];

  const layout = {
    title: "Moyenne de la qualité de l'air sur l'année",
    xaxis: { title: "Mois" },
    yaxis: {
      title: "Indice",
      range: [0, 7],
    },
    height: 275,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: {
      color: "white",
    },
    dragmode: true,
  };

  Plotly.newPlot("graph", graph_array, layout, { responsive: true });
}
