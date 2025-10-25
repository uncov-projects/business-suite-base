import React, { useEffect, useState } from "react";
import "../styles/invoicebill.css";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import html2pdf from "html2pdf.js";
const { electron } = window;
import { ToWords } from "to-words";
import { renderEmptyRows } from "../utils/renderEmptyRows";
import { showSuccessDialog, showErrorDialog } from "../utils/dialogUtils";

const InvoiceBill = ({ invoice_number: propInvoiceNumber }) => {
  const params = useParams();
  const invoice_number = propInvoiceNumber || params.invoice_number;
  const [notes, setNotes] = useState([]);
  const [items, setInvoiceItems] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);

  const handleDownload = () => {
    const content = document.querySelector(".invoice-container");
    if (!content) return;

    const opt = {
      margin: 10,
      filename: `${invoice_number || "invoice"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().from(content).set(opt).save();
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, items] = await Promise.all([
          window.electron.fetchInvoiceData(invoice_number),
          window.electron.fetchInvoiceItems(invoice_number),
        ]);
        setInvoiceData(data[0]);
        setInvoiceItems(items);

        if (data[0]?.notes_added) {
          const notes = await window.electron.getNotesByIds(
            data[0].notes_added
          );
          setNotes(notes);
        }
      } catch (err) {
        console.error("Failed to fetch memo data or items:", err);
      }
    };

    if (invoice_number) {
      fetchData();
    }
  }, [invoice_number]);

  if (!invoiceData) return null;
  if (!items) return null;

  const toWords = new ToWords({
    localeCode: "en-IN",
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      currencyOptions: {
        name: "Rupee",
        plural: "Rupees",
        symbol: "INR",
        fractionalUnit: {
          name: "Paisa",
          plural: "Paisa",
          symbol: "",
        },
      },
    },
  });

  const totalAmount = Number(invoiceData.total.toFixed(2));
  const subtotalAmount = Number(invoiceData.subtotal.toFixed(2));
  const wholePart = Math.floor(totalAmount);
  const decimalPart = Number((totalAmount - wholePart).toFixed(2));
  console.log(subtotalAmount);
  const totalAmountWhole = wholePart;
  const totalCostWords = toWords.convert(Number(totalAmountWhole));

  const collectCss = () => {
    console.log("[PRINT] Collecting CSS from all stylesheets...");
    let css = "";
    const styleSheets = Array.from(document.styleSheets);
    styleSheets.forEach((sheet, i) => {
      console.log(
        `[PRINT] Processing stylesheet ${i + 1}/${styleSheets.length}`
      );
      try {
        const rules = sheet.cssRules ? Array.from(sheet.cssRules) : [];
        rules.forEach((r) => {
          css += r.cssText + "\n";
        });
      } catch (e) {
        console.warn(
          "[PRINT] Skipping inaccessible stylesheet:",
          sheet.href || "inline style",
          e
        );
      }
    });
    console.log("[PRINT] CSS collection complete. Length:", css.length);
    return css;
  };

  const buildFullHtml = (innerHtml) => {
    console.log("[PRINT] Building full HTML document...");
    const css = collectCss();
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Memo</title>
    <style>${css}</style>
  </head>
  <body>
    ${innerHtml}
  </body>
</html>`;
    console.log("[PRINT] Full HTML built. Size:", html.length);
    return html;
  };

  const handlePrint = async () => {
    console.log("[PRINT] Print process started...");
    try {
      const memoEl = document.querySelector(".invoice-container");
      if (!memoEl) {
        console.error("[PRINT] Invoice element not found.");
        throw new Error("Invoice element not found");
      }
      console.log("[PRINT] Invoice element found.");

      const memoHtml = memoEl.outerHTML;
      console.log("[PRINT] Invoice HTML extracted. Length:", memoHtml.length);

      const fullHtml = buildFullHtml(memoHtml);
      const fileName = `invoice_${invoice_number || "preview"}`;
      console.log(`[PRINT] File name for printing: ${fileName}`);

      console.log("[PRINT] Sending HTML to Electron print helper...");
      const result = await window.electron.printMemo(fullHtml, fileName);

      console.log("[PRINT] Print helper returned:", result);
      if (result.success) {
        console.log("[PRINT] Print completed successfully.");
        await showSuccessDialog({
          title: "Print Complete",
          message: "Print completed successfully!",
        });
      } else {
        console.error(
          "[PRINT] Print helper reported failure. Code:",
          result.code
        );
        await showErrorDialog({
          title: "Print Failed",
          message: "Print failed. Error code: " + result.code,
        });
      }
    } catch (err) {
      console.error("[PRINT] Print process failed:", err);
      await showErrorDialog({
        title: "Print Failed",
        message: "Print failed: " + (err.message || err),
      });
    }
  };

  const qrData =
    `Invoice Number: ${invoice_number}\n` +
    `Current Balance: ₹${invoiceData.balance}\n` +
    `This Invoice is generated by uNCov Business Suite\n` +
    `Call Us +91-8275741506 for FREE DEMO`;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="action-bar">
        <button onClick={handlePrint} className="print">
          <i className="bx bx-printer"></i> Print
        </button>
        <button onClick={handleDownload}>
          <i className="bx bx-download"></i> Download
        </button>
      </div>
      <div className="invoice-container">
        {/* Header Section */}
        <div className="invoice-header">
          <div className="header-left">
            <div className="gstin-box">GSTIN : 27AFHPM1467K1Z4</div>
          </div>
          <div className="header-center">
            <h3>BILL OF SUPPLY</h3>
            <h2>Rambhorose Iron Stores</h2>
            <p>GANESH NAGAR, GONDIA, 441601 (M.H.)</p>
            <p>
              <b>Tel. : 9226716321, 7499600749, 8459102641</b>
            </p>
          </div>
          <div className="header-right">
            <div className="original-copy">Original Copy</div>
            <div className="qr-code-invoice">
              <QRCodeSVG
                value={qrData}
                size={80}
                style={{ width: "20mm", height: "20mm" }}
              />
            </div>
          </div>
        </div>

        {/* Invoice info table */}
        <table className="info-table">
          <tbody>
            <tr>
              <td>Invoice No.</td>
              <td>{invoiceData.invoice_number}</td>
              <td>Place of Supply</td>
              <td>Maharashtra (35)</td>
            </tr>
            <tr>
              <td>Dated</td>
              <td>{invoiceData.issueDate}</td>
              <td>Due Date</td>
              <td>{invoiceData.dueDate}</td>
            </tr>
          </tbody>
        </table>

        {/* Billing and shipping address */}
        <div className="customer-section">
          <div className="billed-to">
            <div className="section-title">
              Billed to: {invoiceData.customer_name}
            </div>
            <div className="customer-name"></div>
            <div className="customer-address">
              {invoiceData.customer_address}
              <br />
              GSTIN: {invoiceData.gst_number}
            </div>
          </div>
          <div className="shipped-to">
            <div className="section-title">
              Shipped to: {invoiceData.customer_name}
            </div>
            <div className="customer-address">
              {invoiceData.customer_address}
              <br />
              GSTIN: {invoiceData.gst_number}
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="items-table">
          <thead>
            <tr>
              <th className="col-sl">
                Sl
                <br />
                No.
              </th>
              <th className="col-description">Description of Goods</th>

              <th className="col-gst-rate">
                GST
                <br />
                Rate
              </th>
              <th className="col-quantity">Quantity</th>
              <th className="col-rate-incl">
                Rate
                <br />
                (Incl. of Tax)
              </th>
              <th className="col-rate">Rate</th>

              <th className="col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="col-sl">{idx + 1}</td>
                <td className="col-description">
                  <strong>{item.description}</strong>
                </td>
                <td className="col-gst-rate">18 %</td>
                <td className="col-quantity">
                  {item.quantity} {item.unit}
                </td>
                <td className="col-rate-incl">
                  {Number(item.cost).toFixed(2)}
                </td>
                <td className="col-rate">
                  {(Number(item.cost) - Number(item.cost) * 0.18).toFixed(2)}
                </td>
                <td className="col-amount">
                  {(
                    (Number(item.cost) - Number(item.cost) * 0.18) *
                    item.quantity
                  ).toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Add empty rows */}
            {renderEmptyRows(items.length + notes.length, 9, 7)}

            {notes.length > 0 && (
              <>
                <tr className="notes-header-row">
                  <td className="col-sl">
                    <strong>*</strong>
                  </td>
                  <td className="col-description">
                    <strong>Notes / Terms</strong>
                  </td>
                  <td className="col-gst-rate"></td>
                  <td className="col-quantity"></td>
                  <td className="col-rate-incl"></td>
                  <td className="col-rate"></td>
                  <td className="col-amount"></td>
                </tr>

                {notes.map((note, idx) => (
                  <tr key={`note-${idx}`} className="note-row">
                    <td className="col-sl"></td>
                    <td className="col-description">{note.notes_title}: {note.notes_content}</td>
                    <td className="col-gst-rate"></td>
                    <td className="col-quantity"></td>
                    <td className="col-rate-incl"></td>
                    <td className="col-rate"></td>
                    <td className="col-amount"></td>
                  </tr>
                ))}
              </>
            )}

            <tr style={{ height: "90px" }}>
              <td className="col-sl"></td>
              <td className="col-description" style={{ textAlign: "right" }}>
                CGST on Sales (9%):
                <br />
                SGST on Sales (9%):
                <br />
                Less : (-){decimalPart}
              </td>

              <td className="col-gst-rate"></td>
              <td className="col-quantity"></td>
              <td className="col-rate-incl"></td>
              <td className="col-rate"></td>

              <td className="col-amount">
                + {((totalAmount - subtotalAmount) / 2).toFixed(2)}
                <br />+ {((totalAmount - subtotalAmount) / 2).toFixed(2)}
                <br />- {decimalPart}
              </td>
            </tr>
            <tr className="total-row">
              <td className="col-sl"></td>
              <td className="col-description">
                <strong>Total</strong>
              </td>

              <td className="col-gst-rate"></td>
              <td className="col-quantity"></td>
              <td className="col-rate-incl"></td>
              <td className="col-rate"></td>

              <td className="col-amount">
                <strong>₹ {wholePart.toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words */}
        <div className="amount-words">
          <span className="label">Amount Chargeable (in words)</span>
          <span className="amount-text">{totalCostWords}</span>
          <span className="eo">E. & O.E</span>
        </div>

        {/* Declaration */}
        <div className="declaration-section">
          <b>Declaration</b>
          <p>
            I/We hereby certify that our registration certificate under the
            Maharashtra Value Added Tax Act, 2002 is in force on the date on
            which the sales of the goods specified in this 'Tax Invoice' is made
            by me/us and that the transaction of sale covered by this 'Tax
            Invoice' has been effected by me/us and that it shall be accounted
            for in the turnover of sales while filing of return and the due tax,
            if any, payable on the sale has been paid or shall be paid.
          </p>
        </div>

        {/* Footer Section */}
        <div className="footer-section">
          <div className="footer-top">
            <div className="footer-left">
              <p className="underline decl-title">Terms and Conditions</p>

              <p>1. Goods once sold will not be taken back.</p>
              <p>
                2. Our Responsibility ceases as soon as the vehicle leaves our
                premises.
              </p>
              <p>
                3. We are not responsible for material damage or shortage in
                transit.
              </p>
              <p>
                4. Interest @ 24% P.A. will be charged if the&nbsp;payment is
                not made in time.
              </p>
            </div>

            <div className="footer-right">
              <p className="underline bank-title">Company’s Bank Details</p>
              <table className="bank-table">
                <tbody>
                  <tr>
                    <td>A/c Holder's Name</td>
                    <td>:</td>
                    <td className="bold">RAMBHAROSE IRON STORES</td>
                  </tr>
                  <tr>
                    <td>Bank Name</td>
                    <td>:</td>
                    <td className="bold">ICICI BANK</td>
                  </tr>
                  <tr>
                    <td>A/c No.</td>
                    <td>:</td>
                    <td className="bold">345405500206</td>
                  </tr>
                  <tr>
                    <td>Branch &amp;IFSCode</td>
                    <td>:</td>
                    <td className="bold">
                      Near Gaytri Mandir Pal Chowk, Gondia (ICIC0003454)
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="signatures">
                <div className="receiver-sign">Receiver's Signature&nbsp;:</div>
                <div className="for-sign">
                  <div>For&nbsp;Seller</div>
                  <div className="auth-sign">Authorised Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="summary-note">
          <em>This Invoice is generated by uNCov Business Suite</em>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBill;
