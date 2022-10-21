// get page parameters with let
let params = new URLSearchParams(window.location.search);
let insee = params.get("insee");
let city = params.get("ville");

const cityTitle = document.querySelector("#active_city");
cityTitle.innerHTML = city;

const recommendations = document.querySelector("#todayReco");

const loader = document.querySelector(".loading-div");
const content = document.querySelector(".content");
const iqaGauge = document.querySelector(".fill-gauge");

/* async function getIQA(insee) {
  const response = await fetch(
    `https://api.atmosud.org/iqa2021/commune/bulletin/journalier/${insee}`
  );
  const data = await response.json();
  return data;
} 
let IQA = getIQA(insee); */
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
  loader.style.display = "none";

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
  iqaGauge.style.width = `${iqaPourcentage}%`; // apply the pourcentage to the gauge width
  iqaGauge.style.backgroundColor = indicesAtmoLegends.couleur;

  content.innerHTML = `${indicesAtmoLegends.qualificatif} : ${todayIQA}`;
  content.style.color = indicesAtmoLegends.couleur;

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

  //TODO: add weather informations
  let coord = {
    // get coordinate of searched city
    x: infos.commune.centroid.x,
    y: infos.commune.centroid.y,
  };
  /*     console.log(weatherInformations(coord.x, coord.y)); */
});

// FIXME: add a function to get the token
function weatherInformations(x, y) {
  const token = getToken();
  console.log(token);
  let url = `https://api.meteomatics.com/2022-10-12T00:00:00Z/t_2m:C,weather_symbol_1h:idx/${x},${y}/json?access_token=${token}`;
  fetchWeatherData(url).then(
    (data) => {
      console.log(data);
    },
    (error) => {
      console.log(error);
    }
  );
}

async function fetchWeatherData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function getToken() {
  username = "iut_lambert";
  password = "zv6g5ZwFK7";

  let headers = new Headers();
  headers.set("Authorization", "Basic " + btoa(username + ":" + password));

  fetch("https://login.meteomatics.com/api/v1/token", {
    method: "GET",
    headers: headers,
  })
    .then(function (resp) {
      return resp.json();
    })
    .then(function (data) {
      var token = data.access_token;
      console.log("token", token);
    })
    .catch(function (err) {
      console.log("something went wrong", err);
    });
}
