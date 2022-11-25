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
