/* 
Système de Search-Bar grandement inspiré de ce tuto : https://dev.to/am20dipi/how-to-build-a-simple-search-bar-in-javascript-4onf
modifié pour correspondre à mes besoins
utilisation de l'API Atmosud pour récupérer les données

*/

// declare selected elements
const input = document.getElementById("chooseCity");
const list = document.querySelector(".resultList");

const MAX_RESULTS = 4;

//fetch cities.json
async function getCities(e) {
  const response = await fetch(
    `https://geo.api.gouv.fr/communes?nom=${e}&codeRegion=93&fields=departement&limit=${MAX_RESULTS}`
  );
  const data = await response.json();
  return data;
}

// compute city list if the promise is resolved
input.addEventListener("input", (e) => {
  let value = e.target.value;
  if (Boolean(value) && value.trim().length > 0) {
    getCities(value).then(
      (cities) => {
        logData(cities);
      },
      (error) => {
        clearList();
        noResults();
        console.log(error);
      }
    );
  } else {
    clearList();
  }
});

// loguer les données et les afficher dans la liste (3 max)
function logData(data) {
  clearList();

  for (let i = 0; i < data.length; i++) {
    let city = data[i].nom;

    let content = `<li class="result">
                    <h2 class="result-title">${city}</h2>
                    <button onClick="openLink('${data[i].code}',(\'${city}\'))"><svg xmlns="http://www.w3.org/2000/svg" class="bi bi-arrow-right-short" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z"/>
</svg></button>
                  </li>`;
    list.innerHTML += content;
  }

  data.length === 0 ? noResults() : "";
}

// fonction pour afficher un message si aucune ville ne correspond à la recherche
function noResults() {
  let content = `<li class="result">
                    <h2 class="result-title">Aucun résultat n'a été trouvé</h2>
                  </li>`;
  list.innerHTML += content;
}

// nettoyer la liste
function clearList() {
  document.querySelector(".resultList").innerHTML = "";
}

// fonction pour ouvrir le lien associé à la ville sélectionnée (code insee)
function openLink(insee, city) {
  window.location.href = `view.html?insee=${insee}&ville=${city}`;
}
