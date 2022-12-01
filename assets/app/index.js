/* modal system */
const modals = document.querySelectorAll(".modal"),
  blurBg = document.querySelector(".blur-bg-modal"),
  opener = document.querySelectorAll("[data-target]");

function openModal(e) {
  const target = document.querySelector(e.target.dataset.target);
  if (target) {
    target.classList.add("modal-open");
    blurBg.classList.add("modal-open");
    blurBg.addEventListener("click", closeModal);
    target.querySelector(".close").addEventListener("click", closeModal);
  }
}

function closeModal() {
  modals.forEach((modal) => {
    modal.classList.remove("modal-open");
  });
  blurBg.classList.remove("modal-open");
}

opener.forEach((open) => {
  open.addEventListener(
    "click",
    (e) => {
      openModal(e);
    },
    false
  );
});

const favCitiesList = document.getElementById("favCitiesList"),
  cookie_star = document.getElementById("star_cookie");

// fonction globale pour ajouter un cookie
const addCookie = (name, content) => {
  document.cookie = name + "=" + content + ";" + "path=/";
};

// fonction globale pour checker si un cookie existe (renvoie true ou false)
const checkCookie = (name) => document.cookie.indexOf(name) !== -1;

// fonction globale pour obtenir la valeur d'un cookie
const getCookie = (name) =>
  document.cookie
    .split(";")
    .find((c) => c.includes(name))
    .split("=")[1];

// fonction pour retourner un tableau avec la ville choisie en moins
const removeCity = (arr, e) => arr.filter((el) => el !== e);

// tester si ville existe dans le cookie
const checkCity = (arr, e) => arr.includes(e);

//mettre a jour le menu
const updateMenu = () => {
  //update side menu with cities
  if (favCitiesList) {
    favCitiesList.innerHTML = "";
    const list_of_favorite = JSON.parse(getCookie("favoris"));
    list_of_favorite.forEach((city) => {
      favCitiesList.innerHTML += `<li><a href="./view.html?insee=${
        city.split("-")[0]
      }&ville=${city.split("-")[1]}"><span>${
        city.split("-")[1]
      }</span></a></li>`;
    });
  }
};
updateMenu();

if (!checkCookie("favoris")) {
  addCookie("favoris", "[]");
}

// add or remove city from favorites
if (cookie_star) {
  let cityInformationsGet = new URLSearchParams(window.location.search);
  let cityInformations =
    cityInformationsGet.get("insee") + "-" + cityInformationsGet.get("ville");

  if (checkCity(JSON.parse(getCookie("favoris")), cityInformations)) {
    cookie_star.classList.add("active");
  } else {
    cookie_star.classList.remove("active");
  }

  cookie_star.addEventListener("click", () => {
    console.log("click");
    alert("click");
    let list_of_favorite = JSON.parse(getCookie("favoris"));
    if (!checkCity(list_of_favorite, cityInformations)) {
      list_of_favorite.push(cityInformations);
      document.cookie = "favoris =; expires = Thu, 01 Jan 1970 00:00:00 GMT";
      addCookie("favoris", JSON.stringify(list_of_favorite));
      cookie_star.classList.add("active");
      updateMenu();
    } else {
      document.cookie = "favoris =; expires = Thu, 01 Jan 1970 00:00:00 GMT";
      addCookie(
        "favoris",
        JSON.stringify(removeCity(list_of_favorite, cityInformations))
      );
      cookie_star.classList.remove("active");
      updateMenu();
    }
    console.log(document.cookie);
  });
}
