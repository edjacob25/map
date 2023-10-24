import json from "./colors.json";
// Colors taken from https://github.com/fchristant/colar/tree/master

let color_names = [
  "Red",
  "Orange",
  "Lime",
  "Purple",
  "Violet",
  "Indigo",
  "Brown",
  "Blue",
  "Cyan",
  "Teal",
  "Green",
  "Pink",
  "Yellow",
  "Choco",
  "Camo",
  "Sand",
  "Jungle",
];

export function getColor(day: number): string {
  let chosen = color_names[day % 15];
  return json.filter((color) => color.name == `${chosen}-6`)[0].color;
}

let initial = 8 * 60;
let max = 720;
let space = 1 / 11;

export function getColorWithTime(day: number, time: number): string {
  let chosen = color_names[day % 15];
  let opacity = (time - initial) / max;
  if (opacity < 0) opacity = 0;
  if (opacity > 1) opacity = 1;
  let num = Math.floor(opacity / space) + 1;
  console.log(num);
  return json.filter((color) => color.name == `${chosen}-${num}`)[0].color;
}