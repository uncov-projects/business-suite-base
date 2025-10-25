import React from "react";
import ReactDOMServer from "react-dom/server";
import Memo from "../components/Memo";
import fs from "fs";
import path from "path";

const cssPath = path.join(__dirname, "../styles/Memo.css");
const cssContent = fs.readFileSync(cssPath, "utf8");

export function renderMemoToHtml(memoData, items) {
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <Memo memo_number={memoData.memo_number} />
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Memo</title>
      <style>${cssContent}</style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
}
