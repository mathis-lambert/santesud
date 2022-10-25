// get hour of the day
let date = new Date();
let hour = date.getHours();
console.log(hour);

let bgGradients = {
  earlyMorning: "linear-gradient(0deg, rgb(199 108 46), rgb(35 101 184))",
  morning: "linear-gradient(0deg, rgb(135 153 203), rgb(0 92 177))",
  afternoon: "linear-gradient(0deg, rgb(135 153 203), rgb(0 92 177))",
  evening: "linear-gradient(0deg, rgb(199 108 46), rgb(35 101 184))",
  night: "linear-gradient(0deg, rgb(58 84 136), rgb(1 21 40))",
};

let bgGradient = document.querySelector("body");

if (hour >= 5 && hour < 9) {
  bgGradient.style.background = bgGradients.earlyMorning;
} else if (hour >= 9 && hour < 12) {
  bgGradient.style.background = bgGradients.morning;
} else if (hour >= 12 && hour < 18) {
  bgGradient.style.background = bgGradients.afternoon;
} else if (hour >= 18 && hour < 20) {
  bgGradient.style.background = bgGradients.evening;
} else if (hour >= 20 || hour < 5) {
  bgGradient.style.background = bgGradients.night;
}
