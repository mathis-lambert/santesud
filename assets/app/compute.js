/*
 ** This file is part of SANTESUD Projet
 **
 ** @authors : Mathis Lambert
 ** @authors : Matthieu Cohen
 **
 ** @link https://santesud.mathislambert.fr/
 */

/* Development variables */
const FETCH_APIs = true;
const FETCH_ATMOSUD = true;
const FETCH_METEO = true;

const c = console.log.bind(console);
c("SANTESUD - Développé par Mathis Lambert et Matthieu Cohen");

// get page parameters with let
let params = new URLSearchParams(window.location.search);
let insee = params.get("insee");
let city = params.get("ville");

document.title = "Infos pour " + city + " | SANTESUD";

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

// sort months
const months = sortMonths(object_months);

// initialize city coordinates
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
  let c = document.querySelectorAll(parent);
  c.forEach((b) => {
    b.querySelectorAll(".loading-div .ball").forEach((e) => {
      e.style.backgroundColor = "red";
      e.style.animation = "none";
    });
    b.classList.remove("skeleton");
  });
}

if (city && insee) {
  document.querySelector("#active_city").innerHTML = city;

  // load gmaps iframe in an self-invoked function
  (async () => {
    await fetch("googleToken.php")
      .then((r) => r.text())
      .then((token) => {
        let googleToken = token;
        hide_loader(".embed_map");
        document.querySelector(".embed_map").innerHTML += `
    <iframe src="https://www.google.com/maps/embed/v1/place?key=${googleToken}&q=${city}&zoom=10&maptype=roadmap&language=fr" frameborder="0" style="border:0" allowfullscreen width="100%" height="100%"></iframe>
    `;
      })
      .catch((e) => console.log(e));
  })();

  if (FETCH_APIs) {
    Chart.defaults.color = "#fff";

    if (FETCH_ATMOSUD) {
      async function getInfos(insee) {
        try {
          const response = await fetch(
            `https://api.atmosud.org/siam/v1/communes/${insee}`
          );
          const data = await response.json();
          display_infos(data.data);
        } catch (error) {
          load_error(".atmosud");
        }
      }
      //call atmosud api with insee code
      getInfos(insee);

      function display_infos(data) {
        hide_loaders(".atmosud");

        let todayIndicesAtmos = data.indices_atmo[actualDate];

        let todayIQA = Math.floor(todayIndicesAtmos.indice_atmo);

        let indicesAtmoLegends = data.legendes.indice_atmo[todayIQA];
        let pollutionLegends = data.legendes.polluants;

        // calculate pourcentage of iqa, because API return a value between 0 and 7
        let iqaPourcentage = (todayIQA / 5) * 100;
        iqaGauge.style.height = `${iqaPourcentage}%`; // apply the pourcentage to the gauge width
        iqaGauge.style.backgroundColor = indicesAtmoLegends.couleur;

        iqaValue.innerHTML = `${indicesAtmoLegends.qualificatif} : ${todayIQA}`;

        let recommendationsArray = todayIndicesAtmos.recommandations;
        // display recommendations
        const fullRecommendations = document.querySelector(".reco_container");
        fullRecommendations.innerHTML = "";
        recommendationsArray.forEach((e) => {
          fullRecommendations.innerHTML += `<li>
          <img src="${e.picto_url}" alt="${e.titre}">
          <h2>${e.titre}</h2>
          <p>${e.description}</p>
                                            </li>`;
        });

        recommendations.innerHTML = data.commentaires[actualDate];

        //display infos to iqa modal
        const iqaModalValue = document.querySelector("#iqa_modal_value"),
          iqaMoreInfos = document.querySelector("#more_about_iqa");

        iqaModalValue.innerHTML = `${indicesAtmoLegends.qualificatif} : ${todayIQA}`;
        iqaMoreInfos.innerHTML = todayIndicesAtmos.indice_stat;

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
            e.style.color =
              data.legendes.indice_atmo[value.indice_atmo].couleur;
          });
        }
      }
      // call historical datas of IQA through the past year and display it in a chart
      const fetchIQA_average = async () => {
        try {
          const response = await fetch(
            `https://api.atmosud.org/iqa2021/commune/bulletin/journalier?format_indice=valeur&indice=iqa&format=json&insee=${insee}&srid=2154&echeances=0&date_diff_min=${
              new Date().getFullYear() - 1
            }-${
              new Date().getMonth() + 1 > 9
                ? new Date().getMonth() + 1
                : "0" + (new Date().getMonth() + 1)
            }-01&date_diff_max=${new Date().getFullYear()}-${
              new Date().getMonth() + 1 > 9
                ? new Date().getMonth() + 1
                : "0" + (new Date().getMonth() + 1)
            }-01`
          );
          const marseille = await fetch(
            `https://api.atmosud.org/iqa2021/commune/bulletin/journalier?format_indice=valeur&indice=iqa&format=json&insee=13055&srid=2154&echeances=0&date_diff_min=${
              new Date().getFullYear() - 1
            }-${
              new Date().getMonth() + 1 > 9
                ? new Date().getMonth() + 1
                : "0" + (new Date().getMonth() + 1)
            }-01&date_diff_max=${new Date().getFullYear()}-${
              new Date().getMonth() + 1 > 9
                ? new Date().getMonth() + 1
                : "0" + (new Date().getMonth() + 1)
            }-01`
          );
          const toulon = await fetch(
            `https://api.atmosud.org/iqa2021/commune/bulletin/journalier?format_indice=valeur&indice=iqa&format=json&insee=83137&srid=2154&echeances=0&date_diff_min=${
              new Date().getFullYear() - 1
            }-${
              new Date().getMonth() + 1 > 9
                ? new Date().getMonth() + 1
                : "0" + (new Date().getMonth() + 1)
            }-01&date_diff_max=${new Date().getFullYear()}-${
              new Date().getMonth() + 1 > 9
                ? new Date().getMonth() + 1
                : "0" + (new Date().getMonth() + 1)
            }-01`
          );

          const data = await response.json();
          const marseilleData = await marseille.json();
          const toulonData = await toulon.json();

          return [data, marseilleData, toulonData];
        } catch (error) {
          load_error(".graph_load");
        }
      };

      fetchIQA_average()
        .then((data) => {
          hide_loader(".graph_load");

          let iqaData = data[0][0].bulletins;
          let marseilleData = data[1][0].bulletins;
          let toulonData = data[2][0].bulletins;

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
          load_error(".graph_load");
        });

      function iqa_month_graph(yAxis, MarseilleAxis, ToulonAxis) {
        const cfg = {
          type: "line",
          data: {
            labels: months,
            datasets: [
              {
                label: "Marseille",
                data: MarseilleAxis,
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderColor: "rgba(255, 99, 132, 1)",
                tension: 0.3,
              },
              {
                label: "Toulon",
                data: ToulonAxis,
                backgroundColor: "rgba(235, 235, 54, 0.2)",
                borderColor: "rgba(235, 235, 54, 1)",
                tension: 0.3,
              },
              {
                label: city,
                data: yAxis,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                tension: 0.3,
              },
            ],
          },

          options: {
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: "Moyennes de la qualité de l'air les 12 derniers mois",
                font: {
                  size: 15,
                },
              },
            },
          },
        };

        new Chart(document.getElementById("iqa_graph"), cfg);
      }

      (async () => {
        try {
          const response = await fetch(
            "https://api.atmosud.org/episodes/pref/liste"
          );
          const data = await response.json();
          processAlerts(data);
        } catch (error) {
          load_error(".alert_container");
        }
      })();

      function processAlerts(data) {
        const YEAR_DEBUT = 2014;
        const PAST_YEARS = new Date().getFullYear() - YEAR_DEBUT;

        console.log(data, new Date().getFullYear(), insee.slice(0, 2));

        // Get the alerts of the past years
        let todayAlerts =
          data.filter((alert) => {
            return (
              alert.date_diffusion.match(
                new RegExp(
                  `${new Date().getFullYear()}-${
                    new Date().getMonth() + 1 < 10
                      ? "0" + (new Date().getMonth() + 1)
                      : new Date().getMonth() + 1
                  }-${
                    new Date().getDate() < 10
                      ? "0" + new Date().getDate()
                      : new Date().getDate()
                  }$`
                )
              ) && alert.zone == insee.slice(0, 2)
            );
          }) || [];

        const alerts_today = document.querySelector(".alerts-today");

        // If there are alerts today, display them
        if (todayAlerts.length > 0) {
          alerts_today.classList.remove("hidden");
          alerts_today.innerHTML = `
          <h3>Alertes aujourd'hui</h3>
          <ul>
            ${todayAlerts
              .map((alert) => {
                return `<li>
                          <h2>${alert.titre}</h2>
                          <p>${alert.zone_libelle}</p>
                          <p>${alert.niveau_libelle}</p>
                          <p>${alert.commentaire} 
                          <br>
                          Nom du polluant : ${alert.polluant_libelle}
                          </p>
                          <p>${alert.date_diffusion}</p>

                        </li>`;
              })
              .join("")}
          </ul>

            
          `;
        }

        // Calcul de la probabilité d'avoir une alerte aujourd'hui
        const pastAlertsPerDays = data.filter((alert) => {
          return alert.date_diffusion.match(
            new RegExp(
              `^[0-9]{4}-${
                new Date().getMonth() + 1 < 10
                  ? "0" + (new Date().getMonth() + 1)
                  : new Date().getMonth() + 1
              }-${
                new Date().getDate() < 10
                  ? "0" + new Date().getDate()
                  : new Date().getDate()
              }$`
            )
          );
        });

        const numberOfAlerts = pastAlertsPerDays.length;

        let probability = Math.round((numberOfAlerts / PAST_YEARS) * 100);

        const alerts_probability = document.querySelector(
          ".alerts_probability"
        );

        hide_loader(".alerts_container");
        alerts_probability.innerHTML = probability + "%";
      }
    } else {
      load_error(".graph_load");
    }

    /* #### METEO MATICS #### */
    if (FETCH_METEO == true) {
      // fetching location coordinates to call meteomatics API
      (async () => {
        try {
          const response = await fetch(
            `https://api-adresse.data.gouv.fr/search/?q=${city}&limit=1`
          );
          if (response.status == 200) {
            const data = await response.json();
            city_coord.x = data.features[0].geometry.coordinates[0];
            city_coord.y = data.features[0].geometry.coordinates[1];
            weatherInformations(city_coord.x, city_coord.y);
          } else {
            load_error(".forecast_container");
            load_error(".square_info");
          }
        } catch (error) {
          load_error(".forecast_container");
          load_error(".square_info");
        }
      })();
      //fetch from meteomatics
      async function weatherInformations(x, y) {
        // login meteomatics, merci de ne pas les utiliser
        let username = "iut_lambert";
        let password = "zv6g5ZwFK7";

        let actualDate = new Date();

        let tenDaysForecast = new Date().setDate(actualDate.getDate() + 9);
        let tenDays = new Date(tenDaysForecast).toISOString();

        try {
          const response = await fetch(
            `https://api.meteomatics.com/${actualDate.toISOString()}/t_2m:C,weather_symbol_1h:idx,wind_speed_10m:ms,wind_dir_10m:d,sunrise:sql,sunset:sql/${y},${x}/json`,
            {
              headers: new Headers({
                Authorization: "Basic " + btoa(`${username}:${password}`),
              }),
            }
          );

          const response2 = await fetch(
            `https://api.meteomatics.com/${actualDate.toISOString()}--${tenDays}:PT24H/t_2m:C/${y},${x}/json`,
            {
              headers: new Headers({
                Authorization: "Basic " + btoa(`${username}:${password}`),
              }),
            }
          );

          const data = await response.json();
          const data2 = await response2.json();
          call_weather(data);
          call_forecast(data2);
        } catch (error) {
          load_error(".forecast_container");
        }
      }

      //display weather informations
      function call_weather(data) {
        console.log("call_weather", data);

        hide_loaders(".square_info");
        let weatherIconIndex = data.data[1].coordinates[0].dates[0].value;
        weather_id = weatherIconIndex;
        let temperature = Math.floor(
          data.data[0].coordinates[0].dates[0].value
        );

        document.querySelector("#temp_value").innerHTML = `${temperature}`;
        document.querySelector(
          ".weather_icon"
        ).innerHTML += `<object data="./assets/icons/${weatherIconIndex}.svg" type="image/svg+xml">svg link</object>`;

        let sunrise = data.data[4].coordinates[0].dates[0].value;
        let sunset = data.data[5].coordinates[0].dates[0].value;

        // formatage des heures de lever et coucher de soleil
        let sunriseHour = new Date(sunrise).getHours();
        let sunriseMinutes = new Date(sunrise).getMinutes();

        let sunsetHour = new Date(sunset).getHours();
        let sunsetMinutes = new Date(sunset).getMinutes();

        sunrise = `${sunriseHour > 9 ? sunriseHour : "0" + sunriseHour}.${
          sunriseMinutes > 9 ? sunriseMinutes : "0" + sunriseMinutes
        }`;
        sunset = `${sunsetHour > 9 ? sunsetHour : "0" + sunsetHour}.${
          sunsetMinutes > 9 ? sunsetMinutes : "0" + sunsetMinutes
        }`;

        console.log("sunrise", sunrise, "sunset", sunset);

        const suntimeVid = document.querySelector("#suntime_video");
        const currentTime = document.querySelector(".currentTime");

        // Gestion des boutons sunrise et sunset
        const sunriseBtn = document.querySelector("#sunrise");
        const sunsetBtn = document.querySelector("#sunset");

        sunriseBtn.addEventListener("click", () => {
          suntimeVid.currentTime = sunrise;
          currentTime.innerHTML = sunrise.replace(".", "h");
        });

        sunsetBtn.addEventListener("click", () => {
          suntimeVid.currentTime = sunset;
          currentTime.innerHTML = sunset.replace(".", "h");
        });
      }

      //display forecast
      function call_forecast(data) {
        let forecast = [];

        let options = {
          day: "numeric",
          month: "short",
        };

        data.data[0].coordinates[0].dates.forEach((e) => {
          let forecastObject = {
            date: new Date(e.date).toLocaleDateString("fr-FR", options),
            temperature: Math.floor(e.value),
          };
          forecast.push(forecastObject);
        });

        temperature_graph(forecast);
      }

      function temperature_graph(forecast) {
        hide_loaders(".meteomatics");
        const cfg = {
          type: "line",
          data: {
            labels: forecast.map((e) => e.date),
            datasets: [
              {
                label: "Température",
                data: forecast.map((e) => e.temperature),
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderColor: "rgba(255, 99, 132, 1)",
                tension: 0.3,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: `Prévisions des températures à ${new Date().getHours()}h sur 10 jours`,
                font: {
                  size: 15,
                },
              },
            },
          },
        };

        new Chart(document.getElementById("temp_graph"), cfg);
      }
    }
  }
} else {
  // if there is no city in the url, redirect to index.html
  window.location.href = "/";
}
