import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import SliderAuth from "./components/SliderAuth";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Sale from "./components/Sale";
import Invoice from "./components/Invoice";
import CreateInvoice from "./components/CreateInvoice";
import CreateMemo from "./components/CreateMemo";
import Customer from "./components/Customer";
import Purchase from "./components/Purchase";
import Debtors from "./components/Debtor";
import Memo from "./components/Memo";
import ShowBillPage from "./components/ShowBillPage";
import Invoicebill from "./components/Invoicebill";
import Settings from "./components/Settings";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import DetailedLogSeller from "./components/DetailedLogSeller";
import Quotation from "./components/Quotation";
import Purchase2 from "./components/Purchase2";
import Commission from "./components/Commission";

const Router =
  import.meta.env.MODE === "development" ? BrowserRouter : HashRouter;

function RouteListener() {
  const location = useLocation();
  useEffect(() => {
    console.log("Route changed to", location.pathname);
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <RouteListener />
      <Routes>
        <Route path="/" element={<SliderAuth />} />

        {/* Print route OUTSIDE Layout */}
        <Route
          path="/invoice/print-memo/memo/:memo_number"
          element={<Memo />}
        />

        {/* All main app routes under Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sale />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/invoice/create-invoice" element={<CreateInvoice />} />
          <Route path="/invoice/create-memo" element={<CreateMemo />} />
          <Route
            path="/invoice/create-memo/memo/:memo_number"
            element={<Memo />}
          />
          <Route
            path="/invoice/create-invoice/Invoicebill/:invoice_number"
            element={<Invoicebill />}
          />
          <Route path="/customer" element={<Customer />} />
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/purchase2" element={<Purchase2 />} />
          <Route path="/detailedlogseller/:id" element={<DetailedLogSeller />} />
          <Route path="/quotation" element={<Quotation />} />
          <Route path="/debtor" element={<Debtors />} />
          <Route path="/show-bill" element={<ShowBillPage />} />
          <Route path="/commission" element={<Commission />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
