import { chromium, firefox } from "playwright";

const browserTimeout = 30_000;
const browsers = [
  {
    name: "Chrome",
    launch: () =>
      chromium.launch({
        channel: "chrome",
        headless: true,
        ignoreDefaultArgs: ["--hide-scrollbars"],
      }),
  },
  { name: "Firefox", launch: () => firefox.launch({ headless: true }) },
];

export { browsers, browserTimeout };
