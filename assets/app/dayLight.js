// get hour of the day
let date = new Date();
let hour = date.getHours();
console.log(hour);

let bgGradients = {
  earlyMorning: "linear-gradient(0deg, rgb(182 81 49), rgb(35 101 184))",
  morning: "linear-gradient(0deg, rgb(202 228 255), rgb(2 83 158))",
  afternoon: "linear-gradient(0deg, rgb(202 228 255), rgb(2 83 158))",
  evening: "linear-gradient(0deg, rgb(182 81 49), rgb(35 101 184))",
  night: "linear-gradient(0deg, rgb(58 84 136), rgb(1 21 40))",
};

let bgGradient = document.querySelector(".gradient-bg");

if (hour >= 5 && hour < 9) {
  bgGradient.style.backgroundImage = bgGradients.earlyMorning;
} else if (hour >= 9 && hour < 12) {
  bgGradient.style.backgroundImage = bgGradients.morning;
} else if (hour >= 12 && hour < 16) {
  bgGradient.style.backgroundImage = bgGradients.afternoon;
} else if (hour >= 16 && hour < 18) {
  bgGradient.style.backgroundImage = bgGradients.evening;
} else if (hour >= 18 || hour < 5) {
  bgGradient.style.backgroundImage = bgGradients.night;
}
