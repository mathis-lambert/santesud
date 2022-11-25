const c = console.log.bind(console);
// get page parameters with let
let params = new URLSearchParams(window.location.search);
let insee = params.get("insee");
let city = params.get("ville");

// get current date and convert it to the format : yyyy-mm-dd
let actualDate = new Date().toISOString().split("T")[0];

const object_months = {
  Janvier: 01,
  Février: 02,
  Mars: 03,
  Avril: 04,
  Mai: 05,
  Juin: 06,
  Juillet: 07,
  Août: 08,
  Septembre: 09,
  Octobre: 10,
  Novembre: 11,
  Décembre: 12,
};
// sort months by the actual month and every month after go firtst
const sortMonths = (months) => [
  ...Object.keys(months).slice(new Date().getMonth(), 12),
  ...Object.keys(months).slice(0, new Date().getMonth()),
];

const months = sortMonths(object_months);

const city_coord = {
  x: 0,
  y: 0,
};

const recommendations = document.querySelector("#todayReco");

const iqaValue = document.querySelector(".iqa_value"),
  iqaGauge = document.querySelector(".fill-gauge"),
  skeletons = document.querySelectorAll(".skeleton");

function hide_loader(parent) {
  let c = document.querySelector(parent);
  c.querySelector(".loading-div").style.display = "none";
  c.classList.remove("skeleton");
}

function hide_loaders(parent) {
  let c = document.querySelectorAll(parent);
  c.forEach((e) => {
    e.querySelector(".loading-div").style.display = "none";
    e.classList.remove("skeleton");
  });
}

function load_error(parent) {
  let c = document.querySelector(parent);
  c.querySelector(".loading-div").style.borderTop = "4px solid #FF0000";
  c.classList.remove("skeleton");
  c.innerHTML += "Erreur de chargement";
}

if (city && insee) {
  document.querySelector("#active_city").innerHTML = city + "&nbsp;";

  //call atmosud api with insee code
  getInfos(insee);

  // load gmaps iframe in an self-invoked function
  (async () => {
    hide_loader(".embed_map");

    document.querySelector(".embed_map").innerHTML += `
    <iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyD_ih0KhLOgejFwZ85rzYf6W9VdRo6OtCk&q=${city}&zoom=10&maptype=satellite&language=fr" frameborder="0" style="border:0" allowfullscreen width="100%" height="100%"></iframe>
    `;
  })();

  // fetching location coordinates to call meteomatics API
  (async () => {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${city}&limit=1`
    );
    const data = await response.json();
    city_coord.x = data.features[0].geometry.coordinates[0];
    city_coord.y = data.features[0].geometry.coordinates[1];
    weatherInformations(city_coord.x, city_coord.y);
  })();
} else {
  // if there is no city in the url, redirect to index.html
  window.location.href = "/";
}

async function getInfos(insee) {
  const response = await fetch(
    `https://api.atmosud.org/siam/v1/communes/${insee}`
  );
  const data = await response.json();
  display_infos(data.data);
}

function display_infos(data) {
  hide_loaders(".atmosud");

  let todayIndicesAtmos = data.indices_atmo[actualDate];

  let todayIQA = Math.round(todayIndicesAtmos.indice_atmo);

  let indicesAtmoLegends = data.legendes.indice_atmo[todayIQA];
  let pollutionLegends = data.legendes.polluants;

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
    let pollutionParticle = document.querySelectorAll(`#p${key}`);
    pollutionParticle.forEach((e) => {
      e.innerHTML = `${pollutionLegends[index].acronyme} : ${value.indice_atmo}`;
      e.style.color = data.legendes.indice_atmo[value.indice_atmo].couleur;
    });
  }
}

/* #### METEO MATICS #### */
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
        // handle cors no 'Access-Control-Allow-Origin' header is present on the requested resource
        "Access-Control-Allow-Origin": "*",
      }),
    }
  );
  const data = await response.json();
  call_weather(data);
}

//display weather informations
function call_weather(data) {
  let weatherIconIndex = data.data[1].coordinates[0].dates[0].value;
  weather_id = weatherIconIndex;
  // import index.min.js file to enable it
  /*       fetch("./assets/app/weather/rainDay.js")
    .then((response) => response.text())
    .then((data) => {
      eval(data);
    })
    .catch((error) => {
      console.log("erreur de chargement du fichier webGL", error);
    }); */
  let temperature = Math.floor(data.data[0].coordinates[0].dates[0].value);

  document.querySelector("#temp").innerHTML = `${temperature}°C`;
  document.querySelector(
    ".weather_container"
  ).innerHTML += `<img src="assets/icons/${weatherIconIndex}.png" alt="weather icon" id="weatherIcon" />`;
}

// call historical datas of IQA through the past year and display it in a chart
const fetchIQA_average = async () => {
  const response = await fetch(
    `https://api.atmosud.org/iqa2021/commune/bulletin/journalier?format_indice=valeur&indice=iqa&format=json&insee=${insee}&srid=2154&echeances=0&date_diff_min=${
      new Date().getFullYear() - 1
    }-${
      new Date().getMonth() + 1
    }-01&date_diff_max=${new Date().getFullYear()}-${
      new Date().getMonth() + 1
    }-01`
  );
  const marseille = await fetch(
    `https://api.atmosud.org/iqa2021/commune/bulletin/journalier?format_indice=valeur&indice=iqa&format=json&insee=13055&srid=2154&echeances=0&date_diff_min=${
      new Date().getFullYear() - 1
    }-${
      new Date().getMonth() + 1
    }-01&date_diff_max=${new Date().getFullYear()}-${
      new Date().getMonth() + 1
    }-01`
  );
  const toulon = await fetch(
    `https://api.atmosud.org/iqa2021/commune/bulletin/journalier?format_indice=valeur&indice=iqa&format=json&insee=83137&srid=2154&echeances=0&date_diff_min=${
      new Date().getFullYear() - 1
    }-${
      new Date().getMonth() + 1
    }-01&date_diff_max=${new Date().getFullYear()}-${
      new Date().getMonth() + 1
    }-01`
  );

  const data = await response.json();
  const marseilleData = await marseille.json();
  const toulonData = await toulon.json();
  c(data, marseilleData, toulonData);
  return [data, marseilleData, toulonData];
};

fetchIQA_average()
  .then((data) => {
    let iqaData = data[0][0].bulletins;
    let marseilleData = data[1][0].bulletins;
    let toulonData = data[2][0].bulletins;

    hide_loader(".graph_load");

    const [yAxis, MarseilleAxis, ToulonAxis] = [[], [], []];

    for (let i = 0; i < 12; i++) {
      let index_month = object_months[months[i]];
      let month_match = new RegExp(
        `^[0-9]{4}-${
          index_month < 10 ? "0" + index_month : index_month
        }-[0-9]{2}$`
      );

      let [month_average, marseille_avg, toulon_avg] = [0, 0, 0];

      count = 0;

      for (let j = 0; j < iqaData.length; j++) {
        if (month_match.test(iqaData[j].date_diffusion)) {
          marseille_avg += marseilleData[j].valeurs[0].indice.valeur;
          toulon_avg += toulonData[j].valeurs[0].indice.valeur;
          month_average += iqaData[j].valeurs[0].indice.valeur;
          count++;
        }
      }
      yAxis.push(Math.round((month_average / count) * 100) / 100);
      MarseilleAxis.push(Math.round((marseille_avg / count) * 100) / 100);
      ToulonAxis.push(Math.round((toulon_avg / count) * 100) / 100);
    }
    iqa_month_graph(yAxis, MarseilleAxis, ToulonAxis);
  })
  .catch((error) => {
    console.log("erreur de chargement des données", error);
    load_error(".graph_load");
  });

function iqa_month_graph(yAxis, MarseilleAxis, ToulonAxis) {
  const trace1 = {
    x: months,
    y: yAxis,
    name: city,
    histnorm: "Degrés",
    text: yAxis.map(String),
    textposition: "auto",
    font: {
      color: "#fff",
    },
    marker: {
      color: "rgba(255, 44, 122, 1)",
      width: 1,
    },
    type: "line",
  };

  const marseille_path = {
    x: months,
    y: MarseilleAxis,
    name: "Marseille",
    histnorm: "Degrés",
    text: MarseilleAxis.map(String),
    textposition: "auto",
    font: {
      color: "#fff",
    },
    marker: {
      color: "rgba(44, 122, 255, 1)",
      width: 1,
    },
    type: "line",
  };

  const toulon_path = {
    x: months,
    y: ToulonAxis,
    name: "Toulon",
    histnorm: "Degrés",
    text: ToulonAxis.map(String),
    textposition: "auto",
    font: {
      color: "#fff",
    },
    marker: {
      color: "rgba(200, 255, 122, 1)",
      width: 1,
    },
    type: "line",
  };

  const graph_array = [trace1, marseille_path, toulon_path];

  const layout = {
    title: "Moyenne de la qualité de l'air <br> sur l'année passée",
    xaxis: { title: "Mois" },
    yaxis: {
      title: "Indice",
      /* range: [0, 7], */
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
