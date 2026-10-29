import "./App.css";
import { useEffect, useRef } from "react";
import { useLoader } from "./utils/LoaderContext";
import { setLoader } from "./services/api";
import Dashboard from "./dashboard/Dashboard";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import TokenHandler from "./services/TokenHandler";
import { SnackbarProvider, useSnackbar } from "notistack";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import theme from "./theme";
import Zone from "./Masters/geographical/Zone";
import Territory from "./Masters/geographical/Territory";
import Region from "./Masters/geographical/Region";
import Beat from "./Masters/geographical/Beat";
import Area from "./Masters/geographical/Area";
import AccountMas from "./view/account/AccountMas";
import ProductCategory from "./Masters/main/productCategory/ProductCategory";
import ProductSubCategory from "./Masters/main/productSubCategory/ProductSubCategory";
import Department from "./Masters/main/department/Department";
import Designation from "./Masters/main/designation/Designation";
import City from "./Masters/main/city/City";
import ReportingTabs from "./Masters/AdminPanel/ReportingTabs";
import MenuMaster from "./Masters/AdminPanel/MenuMaster";
import AppWidgetMaster from "./Masters/AdminPanel/AppWidgetMaster";
import AppVersion from "./Masters/AdminPanel/AppVersion";
import WebMenuMaster from "./Masters/AdminPanel/WebMenuMaster";
import Stockist from "./Masters/main/stockist/Stockist";
import AwsLogs from "./Masters/AdminPanel/AwsLogs";
import ApiProcessing from "./Masters/AdminPanel/ApiProcessing";
import EDetailingMaster from "./Masters/AdminPanel/EDetailingMaster";
import AccountExtract from "./view/account/AccountExtract";
import Login from "./view/Login";
import ForgotPassword from "./view/ForgotPassword";
import AccountTransfer from "./view/account/AccountTransfer";
import UserList from "./view/UserList";
import AddUser from "./view/AddUser";
import RegionWiseSales from "./ExtractReport/RegionWiseSales";
import SalesHierachy from "./ExtractReport/salesHierachy";
import DailyActivityReport from "./ExtractReport/DailyActivityReport";
import DataSubmissionLog from "./ExtractReport/DataSubmissionLog";
import KPIReport from "./ExtractReport/KPIReport";
import StockAndSalesDetails from "./ExtractReport/StockAndSalesDetails";
import StockAndSalesSummary from "./ExtractReport/StockAndSalesSummary";
import PrimaryOrder from "./ExtractReport/primaryOrder/PrimaryOrder";
import OrderReport from "./ExtractReport/orderReport/OrderReport";
import UserLog from "./view/UserLog";
import CreateCustomer from "./view/account/CreateCustomer";
import StockAndSalesReport from "./ExtractReport/StockAndSalesReport";
import OutletCount from "./ExtractReport/OutletCount";
import OrderFrequencyReport from "./ExtractReport/OrderFrequencyReport";
import SalesAnalysis from "./dashboard/salesAnalysis/SalesAnalysis";
import PrimarySales from "./DashBoardReports/TrendAnalysis/PrimarySales";
import PrimarySalesAnalze from "./DashBoardReports/PrimaryAnalysis/primarySalesAnalyse";
import SalesAnalysisReport from "./DashBoardReports/PrimaryAnalysis/SalesAnalysisReport";
import AreaWiseSalesAnalysis from "./dashboard/AreaWiseSalesAnalysis";
import StockAndSalesUpload from "./view/trans/StockAndSalesUpload";
import DataSubmissionStatus from "./view/Transactions/DataSubmissionStatus";
import PreviewStkSales from "./view/Transactions/PreviewStkSales";
import EmailProcessData from "./view/Transactions/EMailProcessData";
import StockAndSalesUploadNew from "./view/trans/StockAndSalesUploadNew";
import PrimarySalesTransact from "./view/Transactions/PrimarySales";
import UploadClosing from "./view/Transactions/uploadClosingMain";
import BeatCoverage from "./ExtractReport/BeatCoverage";
import ChangePassword from "./dashboard/changePassword";
import OrderApproval from "./dashboard/OrderApproval";
import MobileOrders from "./dashboard/MobileOrders";
import LoginProjCode from "./view/LoginProjCode";
import OtpTwoStepValidate from "./view/OtpTwoStepValidate";
import { useLocation } from "react-router-dom";
import PassExpReset from "./view/PassExpReset";
import UploadBilling from "./view/trans/uploadBilling";
import Hospital from "./Masters/classifymaster/HospitalInstitution";
import Objective from "./Masters/classifymaster/objective";
import SampleType from "./Masters/classifymaster/sampleType";
import Event from "./Masters/classifymaster/event";
import Potentialityclass from "./Masters/AccountProfile/potentialityclass";
import LoyaltyType from "./Masters/AccountProfile/loyaltyType";
import PracticeType from "./Masters/AccountProfile/practiceType";
import AdoptionStyle from "./Masters/AccountProfile/adoptionStyle";
import DiseaseMas from "./Masters/AccountProfile/Diseasemas";
import SocialType from "./Masters/AccountProfile/Socialtype";
import MarketingInput from "./Masters/main/city/MarketingInput";
import PharmacyType from "./Masters/main/city/PharmacyType.jsx";
import Product from "./Masters/main/product/Product.jsx";
import Marketingtool from "./Masters/main/city/MarketingTool.jsx"

function App() {
  const relatedRoutes = {
    "reports/sec_sales_data": [
      "reports/preview_stk_sales",
      "reports/primary_sale_report",
      "/reports/email_process_data",
    ],
    "masters/prod_mas": ["masters/prodview"],
    "Users/users_list": ["users/adminUserNew"],
    "customers/AllDoctors": ["customers/editDoctor"],
    upload_closing: ["upload_closing/index"],
  };

  const getBasePath = (url) => {
    // keep segments until we hit one that looks like base64/CI-encoded junk
    const segments = url.split("/").filter(Boolean);
    const baseSegments = [];
    for (const seg of segments) {
      // stop at first segment that looks like an encoded param (all caps/digits/= or pure "#")
      if (/^[A-Za-z0-9+/]+=*$/.test(seg) && /[=]/.test(seg)) break;
      baseSegments.push(seg);
    }
    return baseSegments.join("/");
  };

  const ProtectedRoute = () => {
    const token = localStorage.getItem("session-token");
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const lastWarnedPath = useRef(null);

    const rawMenuUrls = localStorage.getItem("menu_urls");
    const menuUrls = rawMenuUrls ? JSON.parse(rawMenuUrls) : [];

    const allowList = [
      "/dashboard",
      "/change_password",
      "/orderApproval/orders",
      "/mobile/Orders",
      "/dashboard/primarysalesview",
    ];
    const currentPath = location.pathname;

    const isAllowed = !token
      ? false
      : currentPath.startsWith("/Auth/forgot_paswd/") ||
        allowList.includes(currentPath) ||
        menuUrls.some((url) => {
          if (!url || url === "#") return false;

          const basePath = getBasePath(url);
          if (!basePath) return false;
          const normalizedUrl = "/" + basePath;
          const segmentCount = basePath.split("/").filter(Boolean).length;

          // exact match always allowed
          if (currentPath === normalizedUrl) return true;

          // prefix match only for multi-segment base paths (real param-based sub-routes),
          // NOT for single top-level segments like "dashboard" which would otherwise
          // whitelist every /dashboard/* page
          if (segmentCount > 1 && currentPath.startsWith(normalizedUrl + "/")) {
            return true;
          }

          const children = relatedRoutes[url] || relatedRoutes[basePath] || [];
          return children.some((childUrl) => {
            const normalizedChild = "/" + childUrl.replace(/^\/+/, "");
            return (
              currentPath === normalizedChild ||
              currentPath.startsWith(normalizedChild + "/")
            );
          });
        });

    useEffect(() => {
      if (token && !isAllowed && lastWarnedPath.current !== currentPath) {
        lastWarnedPath.current = currentPath;
        enqueueSnackbar("You don't have access to this page", {
          variant: "warning",
          preventDuplicate: true,
          key: `access-denied-${currentPath}`,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPath]);

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
  };

  const PublicRoute = () => {
    const token = localStorage.getItem("session-token");
    console.log("public token", token);

    return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* <SnackbarProvider maxSnack={3}> */}
      <BrowserRouter>
        <Routes>
           <Route
              path="/Auth/forgot_paswd/:resetToken"
              element={<ForgotPassword />}
           />
          <Route path="/masters/disease/:editDiseaseId?"  element={<DiseaseMas />}        />
          <Route path="/masters/social/:editSocialId?"  element={<SocialType />}  />
          <Route element={<ProtectedRoute />}>
            <Route path="/:token" element={<TokenHandler />} />
            {/* <Route path="/" element={<Dashboard />} /> */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/masters/zone_mas/:editZoneid?" element={<Zone />} />
            <Route path="/masters/region/:editRegionId?" element={<Region />} />
            <Route
              path="/masters/ter_mas/:editTeritoryId?"
              element={<Territory />}
            />
            <Route path="/masters/beat_mas/:editBeatId?" element={<Beat />} />
            <Route path="/masters/area_mas/:editAreaId?" element={<Area />} />
            {/* main master routes */}
            <Route path="/masters/cat/:id?" element={<ProductCategory />} />
            <Route
              path="/masters/catSub/:id?"
              element={<ProductSubCategory />}
            />
            <Route path="/masters/dept/:id?" element={<Department />} />
            <Route path="/masters/designation/:id?" element={<Designation />} />
            <Route path="/masters/city_mas/:id?" element={<City />} />
            <Route path="/masters/prodview/:id?" element={<Product />} />
            <Route path="/masters/stockist/:id?" element={<Stockist />} />
            <Route
              path="/masters/marketingInput/:id?"
              element={<MarketingInput />}
            />
            <Route
              path="/masters/pharmacyType/:id?"
              element={<PharmacyType />}
            />
            <Route
              path="/masters/marketing/:id?"
              element={<Marketingtool />}
            />
            <Route path="/masters/prodview/:id?" element={<Product />} />
            {/* Admin Panel master routes */}
            <Route
              path="/masters/repTabs/:userId?/:cusId?"
              element={<ReportingTabs />}
            />

            <Route
              path="/customers/AllDoctors/:reqType?/:country?/:user?/:userType?/:cusReq?/:beatId?/:login_id?"
              element={<AccountMas />}
            />
            <Route
              path="/masters/menuMaster/:menuId?"
              element={<MenuMaster />}
            />
            <Route
              path="/masters/dashboardmaster/:editwidgetId?"
              element={<AppWidgetMaster />}
            />
            <Route
              path="/masters/appversion/:editappvid?"
              element={<AppVersion />}
            />
            <Route
              path="/masters/webMenuMaster/:editwebmenuId?"
              element={<WebMenuMaster />}
            />
            <Route
              path="/Processlist/planprocess/:frmDate?/:processType?/:userli?/:processSts?"
              element={<AwsLogs />}
            />
            <Route
              path="/AdminPanel/ApiProcessing"
              element={<ApiProcessing />}
            />
            <Route
              path="/masters/edetailing/:editEdetailing?"
              element={<EDetailingMaster />}
            />
            <Route
              path="/customers/AllDoctors/:reqType?/:country?/:user?/:userType?/:cusReq?/:beatId?/:login_id?"
              element={<AccountMas />}
            />
            <Route
              path="/masters/menuMaster/:menuId?"
              element={<MenuMaster />}
            />
            <Route
              path="/masters/dashboardmaster/:editwidgetId?"
              element={<AppWidgetMaster />}
            />
            <Route
              path="/masters/appversion/:editappvid?"
              element={<AppVersion />}
            />
            <Route
              path="/masters/webMenuMaster/:editwebmenuId?"
              element={<WebMenuMaster />}
            />
            <Route
              path="/reports/extract/:country?/:accType?/:userType?/:user?/:type?"
              element={<AccountExtract />}
            />
            <Route
              path="/customers/account_transfer/"
              element={<AccountTransfer />}
            />
            <Route
              path="/Users/users_list/:userType?/:dept?/:zone?/:reg?/:area?/:ter?/:channel?"
              element={<UserList />}
            />

            <Route
              path="/users/adminUserNew/:userMainId?"
              element={<AddUser />}
            />

            <Route
              path="/reports/active_sales_new"
              element={<SalesHierachy />}
            />
            <Route
              path="/reports/active_sales/:zoneid?/:regionid?/:usertypeId?/:userid?/:distributorid?"
              element={<SalesHierachy />}
            />
            <Route
              path="/reports/data_submission_log/:encodeyear?/:encodezone?/:encoderegion?"
              element={<DataSubmissionLog />}
            />
            <Route path="/reports/extract_new" element={<AccountExtract />} />
            <Route path="/reports/capability_report" element={<KPIReport />} />
            <Route
              path="/Users/userLog/:module?/:fromDt?/:toDt?/:userType?/:user?"
              element={<UserLog />}
            />

            <Route
              path="/customers/editDoctor/:id?/:reqType?/:req?"
              element={<CreateCustomer />}
            />
            <Route
              path="/customers/editDoctor/:id?/:reqType?"
              element={<CreateCustomer />}
            />
            <Route
              path="/customers/editDoctor/:id?"
              element={<CreateCustomer />}
            />
            <Route
              path="/customers/CreateDoctor"
              element={<CreateCustomer />}
            />

            <Route
              path="/reports/active_sales/:zoneid?/:regionid?/:usertypeId?/:userid?/:distributorid?"
              element={<SalesHierachy />}
            />
            <Route
              path="/reports/getfieldActivity_new"
              element={<DailyActivityReport />}
            />
            <Route
              path="/reports/getfieldActivity/:frmdt?/:toDt?/:status?/:type?"
              element={<DailyActivityReport />}
            />
            <Route
              path="/reports/outlet_count/:enzone?/:enRegion?/:enArea?/:enSo?"
              element={<OutletCount />}
            />
            <Route
              path="/reports/day_wise_report/:type?/:enmonth?/:zoneId?/:regId?/:userId?"
              element={<OrderFrequencyReport />}
            />
            <Route
              path="/reports/trendanalysis/MQ==/:enyear?/:engroupBy?/:enreportType?/:enZone?/:enRegion?/:enArea?/:enterritory?/:enDistributor?/:encategory?/:ensubcategory?/:enproduct?"
              element={<PrimarySales enType="MQ==" />}
            />
            <Route
              path="/reports/trendanalysis/Mg==/:enyear?/:engroupBy?/:enreportType?/:enZone?/:enRegion?/:enArea?/:enterritory?/:enDistributor?/:encategory?/:ensubcategory?/:enproduct?"
              element={<PrimarySales enType="Mg==" />}
            />
            <Route
              path="/reports/trendanalysis/Mw==/:enyear?/:engroupBy?/:enreportType?/:enZone?/:enRegion?/:enArea?/:enterritory?/:enDistributor?/:encategory?/:ensubcategory?/:enproduct?"
              element={<PrimarySales enType="Mw==" />}
            />
            <Route
              path="/dashboard/primarysalesview/:enMonth?/:enCatType?"
              element={<PrimarySalesAnalze />}
            />
            <Route
              path="/dashboard/salesanalysis/:encYear?/:enType?/:enSubCat?"
              element={<SalesAnalysisReport />}
            />
            <Route
              path="/reports/sec_sales_data"
              element={<DataSubmissionStatus />}
            />
            <Route
              path="/reports/preview_stk_sales/:closeDate?/:stkid?/:stkLabel?"
              element={<PreviewStkSales />}
            />
            <Route
              path="/reports/email_process_data"
              element={<EmailProcessData />}
            />
             <Route path="/change_password"  element={<ChangePassword />}  />
             <Route path="/masters/hospital/:editHospId?" element={<Hospital />} />
             <Route path="/masters/objective/:editObjId?" element={<Objective />} />
             <Route path="/masters/sampleType/:editSampleId?" element={<SampleType />} />
             <Route path="/masters/event/:editEventId?" element={<Event />} />
             <Route path="/masters/potential/:editPotId?"  element={<Potentialityclass />}   />
             <Route path="/masters/loyalty/:editloyaltyId?" element={<LoyaltyType />}      />
             <Route path="/masters/practiceType/:editpracticeId?" element={<PracticeType />} />
             <Route path="/masters/adoptionStyle/:editAdoptionId?" element={<AdoptionStyle />}          />
            <Route
              path="/reports/primary_sale_report/:decMonth?/:decStkId?/:decValue?"
              element={<PrimarySalesTransact />}
            />
            <Route
              path="/upload_closing/index/:defEncode?/:enMonth?/:endistributor?/:enProcessStat?/:enProcessDataStat?"
              element={<UploadClosing />}
            />
            <Route path="/upload_closing" element={<UploadClosing />} />
            <Route path="/input/uploadBilling" element={<UploadBilling />} />
            <Route path="/change_password" element={<ChangePassword />} />
            <Route
              path="/masters/hospital/:editHospId?"
              element={<Hospital />}
            />
            <Route
              path="/masters/objective/:editObjId?"
              element={<Objective />}
            />
            <Route
              path="/masters/sampleType/:editSampleId?"
              element={<SampleType />}
            />
            <Route path="/masters/event/:editEventId?" element={<Event />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* <Route path="/login" element={<Login />} /> */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<LoginProjCode />} />
            <Route path="/passexpReset" element={<PassExpReset />} />
            <Route path="/otp_validate" element={<OtpTwoStepValidate />} />
          </Route>

          {/* extract and report */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/reports/reg_sec_sales"
              element={<RegionWiseSales />}
            />
            <Route
              path="/reports/stk_sales_details"
              element={<StockAndSalesDetails />}
            />
            <Route
              path="/reports/stk_sales_summary"
              element={<StockAndSalesSummary />}
            />
            <Route path="/reports/primary_order" element={<PrimaryOrder />} />
            <Route
              path="/reports/primary_order_new"
              element={<PrimaryOrder />}
            />
            <Route path="/reports/pcm_kam" element={<OrderReport />} />
            <Route path="/reports/pcm_kam_new" element={<OrderReport />} />
            <Route
              path="/reports/stock_salesReport"
              element={<StockAndSalesReport />}
            />

            <Route path="/reports/beat_coverage" element={<BeatCoverage />} />

            {/* sales analysis */}
            <Route
              path="/reports/performance_report"
              element={<SalesAnalysis />}
            />
            <Route
              path="/dashboard/districtsales"
              element={<AreaWiseSalesAnalysis />}
            />

            <Route path="/orderApproval/orders" element={<OrderApproval />} />
            <Route path="/mobile/Orders" element={<MobileOrders />} />

            {/* TRANSACTIONS */}
            <Route
              path="/input/stock_sales/:closeDate?/:stkid?/:stkLabel?"
              element={<StockAndSalesUploadNew />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
      {/* </SnackbarProvider> */}
    </ThemeProvider>
  );
}

export default App;
