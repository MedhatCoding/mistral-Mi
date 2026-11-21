/* ثوابت المشروع — كل البيانات الحية من ريليه GitHub Actions نفسه زي ما هو */
export const OWNER = "MedhatCoding";
export const REPO = "mistral-Mi";

export const RAW = (branch: string, file: string) =>
  `https://raw.githubusercontent.com/${OWNER}/${REPO}/${branch}/${file}`;

export const BRANCHES = {
  live: "live",   // live.json — أسعار لحظية كل 20 دقيقة أثناء الجلسة
  picks: "picks", // picks.json + intraday.json — توصيات السيرفر ومضاربة الجلسة
  paper: "paper", // paper.json — المتداول الوهمي
  gold: "gold",   // أسعار الذهب
  hist: "hist",   // hist.json — تاريخ الأسهم الكامل
};