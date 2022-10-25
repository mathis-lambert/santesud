// get page parameters with let
let params = new URLSearchParams(window.location.search);
let insee = params.get("insee");
let city = params.get("ville");

const cityTitle = document.querySelector("#active_city");
cityTitle.innerHTML = city + "&nbsp;";

const recommendations = document.querySelector("#todayReco");

const loaders = document.querySelectorAll(".loading-div");
const iqaValue = document.querySelector(".iqa_value");
const iqaGauge = document.querySelector(".fill-gauge");
const skeletons = document.querySelectorAll(".skeleton");

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

cityInfos
  .then((data) => {
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

    //TODO: add weather informations
    let coord = {
      // get coordinate of searched city
      x: infos.commune.centroid.x,
      y: infos.commune.centroid.y,
    };

    let weatherInfo = weatherInformations(coord.x, coord.y);
    console.log(
      "je suis la",
      weatherInfo.then((data) => console.log(data))
    );
    weatherInfo.then((data) => {
      const temp = document.querySelector("#temp");
      temp.innerHTML = `${data.data[0].coordinates[0].dates[0].value}°C`;
    });
  })
  .then((error) => {
    loaders.forEach((loader) => {
      loader.querySelector(".loader").style.borderTop = "4px solid red";
    });
  });

let username = "iut_lambert";
let password = "zv6g5ZwFK7";

//fetch from meteomatics
async function weatherInformations(x, y) {
  let actualDate = new Date();
  const token =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJ2IjoxLCJ1c2VyIjoiaXV0X2xhbWJlcnQiLCJpc3MiOiJsb2dpbi5tZXRlb21hdGljcy5jb20iLCJleHAiOjE2NjY2MzE2NjcsInN1YiI6ImFjY2VzcyJ9.fwAQX2GHXLbhjvzPmVfoVLCzhF-JT-bmeATRepAP3UlS4F-yLSioUViM7luDSyQg0NiYPr0f0AQv5txm2urWeQ";

  const response = await fetch(
    `https://api.meteomatics.com/${actualDate.toISOString()}/t_2m:C,weather_symbol_1h:idx/${x},${y}/json?access_token=${token}`
  );
  const data = await response.json();
  return data;
}

// FIXME: add a function to get the token

fetch(
  "https://" + username + ":" + password + "@login.meteomatics.com/api/v1/token"
)
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
