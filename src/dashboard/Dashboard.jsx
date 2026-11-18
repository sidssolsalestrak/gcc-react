import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Slider from "react-slick";
import TopWidget from "../widgets/TopWidget";
import api from "../services/api";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Layout from "../layout";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Stack,
  Typography,
  Grid,
  IconButton,
  Table,
  TableContainer,
  Collapse,
  TableBody,
  TableRow,
  TableCell,
  Button,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TableHead,
} from "@mui/material";
import { FaBackward, FaFileExcel, FaTruck } from "react-icons/fa";
import { FaCartShopping, FaMoneyBill, FaChartBar } from "react-icons/fa6";
import { styled } from "@mui/material/styles";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CumulativeDashboard from "./CumulativeDashboard";
import DayWiseDashboard from "./Daywisedashboard";
import FieldDetailTable from "./Fielddetailtable";
import CumCusDetailTable from "./Cumcusdetailtable";
import CallSummaryTable from "./Callsummarytable";
import ProfileWidgetGraphs from "./Profilewidgetgraphs";
import JointWorkModal from "./Jointworkmodal";
import MarketInputModal from "./Marketinputmodal";
import DeleteCallModal from "./Deletecallmodal";
import DisplayBreakupTable from "./Displaybreakuptable";
import PhotoRatingBreakup from "./Photoratingbreakup";

import dayjs from "dayjs";
import { Card, CardContent, Divider } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TfiMenuAlt } from "react-icons/tfi";
import { exportActivityExcel } from "./exportActivityExcel";
import { exportDayWiseExcel } from "./Exportdaywiseexcel";
import { jwtDecode } from "jwt-decode";
import { IoChevronBackCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getMasterPanel } from "../services/masterPanelService";
import { GoogleMap, Marker, InfoWindow, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES } from "../utils/googleMapsConfig";
import DataTable from "../utils/dataTable";
import useToast from "../utils/useToast";
import usePageTitle from "../services/usePageTitle";

// Equivalent of PHP's `s3_path3` constant — the S3/CDN bucket root only.
// PhotoRatingBreakup.jsx appends the 'doctor_reporting/' subfolder itself,
// matching PHP's `s3_path3 . 'doctor_reporting/' . $photoName` exactly.
const DOCTOR_REPORTING_IMAGE_BASE_URL = `${process.env.REACT_APP_IMAGE_S3}`;

const DAY_WISE_ENDPOINTS = {
  routeMap: "/dashboard/activityMAP",
  jointWork: "/dashboard/getSrJointWork",
  sample: "/dashboard/activity_summary_sampDetails",
  order: "/dashboard/activity_summary_prodDetails",
};

const headContainer = {
  background: "#fff", display: "flex", flexDirection: 'column', gap: 2,
  m: 1.5, borderRadius: '6px', boxShadow:
    "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
  padding: "16px 18px",
  width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}

const menuStyle = {
  PaperProps: {
    style: {
      maxHeight: 200
    }
  }
}

const SampleNextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        marginRight: "6px",
        filter: "brightness(0.8)",
      }}
      onClick={onClick}
    />
  );
};

const SamplePrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{
        ...style,
        display: "block",
        marginLeft: "6px",
        zIndex: "10",
        opacity: 10,
        filter: "brightness(0.8)",
      }}
      onClick={onClick}
    />
  );
};

const getSlidesToShow = (width) => {
  if (width < 440) return 1;
  if (width < 730) return 2;
  if (width < 984) return 3;
  return 4;
};

function RouteMapDetail({ data }) {
  const points = data?.summaryMap || [];
  const [activeIdx, setActiveIdx] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [center, setCenter] = useState({ lat: 19.076090, lng: 72.877426 });
  const closeTimerRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setActiveIdx(null), 150);
  };

  const openMarker = (i) => {
    clearCloseTimer();
    setActiveIdx(i);
  };

  useEffect(() => clearCloseTimer, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (points.length > 0) {
      const built = points.map((p) => ({
        lat: parseFloat(p.lat),
        lng: parseFloat(p.long),
        det: p.det,
        mark: p.mark,
        icon: {
          url: p.mark === "green"
            ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
            : "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      }));
      setMarkers(built);
      setCenter({ lat: built[0].lat, lng: built[0].lng });
    } else {
      setMarkers([]);
    }
  }, [isLoaded, data]);

  if (loadError) {
    return (
      <Box sx={{ p: 2, color: "red", fontSize: "12px" }}>
        Failed to load Google Maps: {loadError.message}
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3} gap={1}>
        <CircularProgress size={20} />
        <Typography sx={{ fontSize: "12px" }}>Loading map…</Typography>
      </Box>
    );
  }

  if (!points.length) {
    return <Typography align="center" sx={{ py: 4 }}>No location data for this day</Typography>;
  }

  // Path for the connecting polyline, in marker order
  const routePath = markers.map((m) => ({ lat: m.lat, lng: m.lng }));

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "500px" }}
      center={center}
      zoom={13}
      options={{
        mapTypeId: "roadmap",
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      }}
    >
      {/* Single red line connecting all points in order */}
      {routePath.length > 1 && (
        <Polyline
          path={routePath}
          options={{
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 3,
            geodesic: true,
            clickable: false,
          }}
        />
      )}

      {markers.map((m, i) => (
        <Marker
          key={i}
          position={{ lat: m.lat, lng: m.lng }}
          icon={m.icon}
          onMouseOver={() => openMarker(i)}
          onMouseOut={scheduleClose}
        />
      ))}

      {activeIdx !== null && markers[activeIdx] && (
        <InfoWindow
          position={{ lat: markers[activeIdx].lat, lng: markers[activeIdx].lng }}
          onCloseClick={() => setActiveIdx(null)}
          options={{ disableAutoPan: true }}
        >
          <div
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
            dangerouslySetInnerHTML={{ __html: markers[activeIdx].det }}
          />
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

function JointWorkDetail({ data }) {
  const rows = data?.jointWork || [];

  const columns = [
    { field: "sl", headerName: "#", width: 60 },
    { field: "jnt_user", headerName: "Name", width: 200 },
    { field: "cus_name", headerName: "Customer", width: 200 },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      searchable={false}
      pagination={false}
      showHeader={false}
      noDataMessage="No joint work found"
    />
  );
}

function SampleDetailTable({ data }) {
  const items = data?.items || [];
  const totQty = data?.totQty ?? 0;

  const zeroTonull = (v) => {
    const n = Number(v);
    return v === null || v === undefined || v === "" || Number.isNaN(n) || n === 0 ? "-" : v;
  };

  const columns = [
    { field: "name", headerName: "SKU", width: 200 },
    {
      field: "samp_qty",
      headerName: "Sample Qty",
      type: "alignCenter",
      width: 140,
      valueFormatter: zeroTonull,
      showTotal: true,
      footerValue: () => zeroTonull(totQty), // use backend-provided total instead of recalculating
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchable={false}
      pagination={false}
      showHeader={false}
      noDataMessage="No sample data"
    />
  );
}

function OrderDetailTable({ data, prodLabel }) {
  const items = data?.items || [];
  const totals = data?.totals || {};

  const zeroTonull = (v) => {
    const n = Number(v);
    return v === null || v === undefined || v === "" || Number.isNaN(n) || n === 0 ? "-" : v;
  };

  const columns = [
    { field: "prod_name", headerName: "SKU", width: 200 },
    {
      field: "ord_qty",
      headerName: `${prodLabel} Qty`,
      type: "alignright",
      width: 140,
      valueFormatter: zeroTonull,
      showTotal: true,
      footerValue: () => zeroTonull(totals.ord_qty),
    },
    {
      field: "free_qty",
      headerName: `${prodLabel} Free`,
      type: "alignright",
      width: 140,
      valueFormatter: zeroTonull,
      showTotal: true,
      footerValue: () => zeroTonull(totals.free_qty),
    },
    {
      field: "prod_val",
      headerName: `${prodLabel} Value`,
      type: "alignright",
      width: 140,
      valueFormatter: zeroTonull,
      showTotal: true,
      footerValue: () => zeroTonull(totals.prod_val),
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      searchable={false}
      pagination={false}
      showHeader={false}
      noDataMessage="No order data"
    />
  );
}

const MAX_DISPLAY_RANGE_MONTHS = 1;

const isDisplayRangeValid = (from, to) => {
  if (!from || !to || !from.isValid() || !to.isValid()) return false;
  if (dayjs(to).isBefore(from, "day")) return false;
  const maxAllowedTo = dayjs(from).add(MAX_DISPLAY_RANGE_MONTHS, "month").subtract(1, "day");
  return !dayjs(to).isAfter(maxAllowedTo, "day");
};

export default function Dashboard() {
  const [widgets, setWidgets] = useState([]);
  const [tabIndex, setTabIndex] = useState(1);
  const [showLogs, setShowLogs] = useState(false);
  const [soBooking, setSoBooking] = useState({
    mtd: "",
    ytd: "",
    regions: [],
    loading: false,
  });

  const [primarySales, setPrimarySales] = useState({
    mtd: "",
    ytd: "",
    loading: false,
  });

  const [bookingYear, setBookingYear] = useState(dayjs().year());
  const [isFlipped, setIsFlipped] = useState(false);
  const showAlert = useToast();
  // ResizeObserver to track actual container width
  const sliderContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const [filterType, setFilterType] = useState("0");
  const [fromDateValue, setFromDateValue] = useState(dayjs().startOf("month"));
  const [toDateValue, setToDateValue] = useState(dayjs());
  const [activityData, setActivityData] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // ───────────────────── Day Wise state ─────────────────────
  const [dayWiseDate, setDayWiseDate] = useState(dayjs());
  const [dayWiseData, setDayWiseData] = useState([]);
  const [dayWiseLoading, setDayWiseLoading] = useState(false);
  const [refetchTick, setRefetchTick] = useState(0);
  const [userTypeOptions, setUserTypeOptions] = useState([]); // from backend, mirrors $user_type_mas
  const [empTypeOptions, setEmpTypeOptions] = useState([]);   // from backend, mirrors $bumas
  const [activityBreakUp, setActivityBreakUp] = useState("2"); // default '2' per PHP ng-init
  const [cusType, setCusType] = useState("0");                  // '' = All, '2' = Retailer
  const [empType, setEmpType] = useState("0");                 // '0' = All
  const [showAllReported, setShowAllReported] = useState(true); // toggleCheckbox4 default checked

  const [secondaryOrders, setSecondaryOrders] = useState({ pcs: 0, cum: 0, loading: true });
  const [primaryOrders, setPrimaryOrders] = useState({ pcs: 0, cum: 0, loading: true });
  const [primarySalesWidget, setPrimarySalesWidget] = useState({ pcs: 0, cum: 0, loading: true });
  const [display, setDisplay] = useState({ totalreport: 0, totalimages: 0, avgrating: 0, unrateimages: 0, loading: true });
  const [exporting, setExporting] = useState(false);
  const [summaryCusType, setSummaryCusType] = useState("0");
  /* ───────────────────── Logged-in user context (from JWT) ───────────────────── */
  const [sessionUser, setSessionUser] = useState({ userType: null, userId: null });
  const [masterPanel, setMasterPanel] = useState({});
  const [dayWiseDetailModal, setDayWiseDetailModal] = useState({
    open: false,
    loading: false,
    kind: null,       // "routeMap" | "jointWork" | "sample" | "order"
    title: "",
    data: null,
  });
  const closeDayWiseDetailModal = () => setDayWiseDetailModal((p) => ({ ...p, open: false }));

  // labels derived from masterPanel with fallbacks
  const zoneLabel = masterPanel["ZONE"] || "Zone";
  const areaLabel = masterPanel["AREA"] || "Area";
  const regionLabel = masterPanel["REGN"] || "Region";
  const userLabel = masterPanel["USER"] || "Users";
  const beatLabel = masterPanel["BEAT"] || "Beat";
  const distributorLabel = masterPanel["STKS"] || "Distributor";
  const prodLabel = masterPanel["PROD"] || "Product";
  const psmLabel = masterPanel["PSM"] || "PSM";
  const kamLabel = masterPanel["KAM"] || "KAM";
  usePageTitle("Dashboard")

  useEffect(() => {
    const loadMasterPanel = async () => {
      const data = await getMasterPanel();
      setMasterPanel(data);
    };
    loadMasterPanel();
  }, []);

  const handleDayWiseDetailClick = useCallback(
    async (kind, row) => {
      setDayWiseDetailModal({ open: true, loading: true, kind, title: row.u_name || "", data: null });
      try {
        const payload = {
          srId: row.user_id,
          dt: dayWiseDate ? dayWiseDate.format("YYYY-MM-DD") : "",   // ← renamed from callDate to dt
          distype: row.distype || 1,
          masId: row.call_id,
          ...(row.extraParams || {}),   // ← merges { type, reportingType } for routeMap
        };
        const res = await api.post(DAY_WISE_ENDPOINTS[kind], payload);
        setDayWiseDetailModal((prev) => ({ ...prev, loading: false, data: res.data }));
      } catch (err) {
        console.error(err);
        setDayWiseDetailModal((prev) => ({ ...prev, loading: false, data: null }));
      }
    },
    [dayWiseDate]
  );

  useEffect(() => {
    const token = localStorage.getItem("session-token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setSessionUser({
          userType: decoded.user_type,
          userId: decoded.user_id,
        });
      } catch (err) {
        console.log(err);
      }
    }
  }, []);

  const canDeleteCall =
    Number(sessionUser.userType) === 12 ||
    Number(sessionUser.userType) === 13 ||
    (sessionUser.userId !== null && Number(sessionUser.userId) < 3);

  /* ───────────────────── Detail modal (FieldDetail / cumCusDetail) ───────────────────── */
  const [detailModal, setDetailModal] = useState({
    open: false,
    loading: false,
    title: "",
    kind: "html",
    html: "",
    fieldData: null,
  });

  /* ───────────────────── Call summary panel (.callSummaryDetails) ───────────────────── */
  const [summaryModal, setSummaryModal] = useState({
    open: false,
    loading: false,
    title: "",
    srId: null,
    activityType: "2",
    profile: null,
    activitySummary: [],
    userJoint: [],
    getMarketInput: [],
    getSamples: [],
  });
  const navigate = useNavigate();

  /* ───────────────────── Joint Work modal (+ icon per call row) ───────────────────── */
  const [jointWorkModal, setJointWorkModal] = useState({
    open: false,
    callId: null,
    cusId: null,
    mainId: null,
  });
  const openJointWorkModal = useCallback((callId, cusId, mainId) => {
    setJointWorkModal({ open: true, callId, cusId, mainId });
  }, []);
  const closeJointWorkModal = () => setJointWorkModal((p) => ({ ...p, open: false }));

  const handleJointWorkSaved = useCallback(async () => {
    console.log("joint work save is running", summaryModal)
    if (summaryModal.srId) {
      setSummaryModal((prev) => ({ ...prev, loading: true }));
      const dt = summaryModal.dt || toDateValue;   // ← use the date the summary was opened with
      const res = await api.post("/dashboard/callSummaryDetails_new", {
        srID: summaryModal.srId,
        dt: dt ? dt.format("YYYY-MM-DD") : "",
        type: summaryModal.activityType,
        frDt: fromDateValue ? fromDateValue.format("YYYY-MM-DD") : "",
        userType: activityBreakUp,
        cusType: cusType,
      }).catch((err) => {
        console.error(err);
        return null;
      });
      if (res) {
        setSummaryModal((prev) => ({
          ...prev,
          profile: res.data?.profile || prev.profile,
          activitySummary: res.data?.activitySummary || prev.activitySummary,
          userJoint: res.data?.userJoint || prev.userJoint,
        }));
      }
      setSummaryModal((prev) => ({ ...prev, loading: false }));
    }
  }, [summaryModal.srId, activityBreakUp, cusType, fromDateValue, toDateValue]);

  console.log("handle joint work todt changes", toDateValue.format("DD-MM-YYYY"))

  /* ───────────────────── Market Input modal (+ icon per call row) ───────────────────── */
  const [marketInputModal, setMarketInputModal] = useState({
    open: false,
    callId: null,
  });
  const openMarketInputModal = useCallback((callId) => {
    setMarketInputModal({ open: true, callId });
  }, []);
  const closeMarketInputModal = () => setMarketInputModal((p) => ({ ...p, open: false }));

  /* ───────────────────── Delete Call modal (trash icon per call row) ───────────────────── */
  const [deleteCallModal, setDeleteCallModal] = useState({
    open: false,
    callId: null,
  });
  const openDeleteCallModal = useCallback((callId) => {
    setDeleteCallModal({ open: true, callId });
  }, []);
  const closeDeleteCallModal = () => setDeleteCallModal((p) => ({ ...p, open: false }));

  /* ───────────────────── Display / image breakup ─────────────────────
   * Two entry points share this same modal + table, mirroring PHP:
   *  1. Top "Display" infographic widget click -> PHP's #report_img ->
   *     getSummary_img_breakUp with { callId: 0, value: 0 } (all calls, no filter).
   *  2. "Display" column click inside the Call Summary table -> PHP's
   *     .viewimagesBreakUp -> getSummary_img_breakUp with { callId: <call_id>, value: 0 }.
   */
  const [displayBreakupModal, setDisplayBreakupModal] = useState({
    open: false,
    loading: false,
    displayData: [],
  });
  const closeDisplayBreakupModal = () => setDisplayBreakupModal((p) => ({ ...p, open: false }));

  // PHP: #img_frm_dt / #img_to_dt (default current month) + #toggleCheckbox3 ("With Display")
  const [displayFromDate, setDisplayFromDate] = useState(dayjs().startOf("month"));
  const [displayToDate, setDisplayToDate] = useState(dayjs().endOf("month"));
  const [displayWithOnly, setDisplayWithOnly] = useState(false); // toggleCheckbox3: unchecked = show all

  const lastDisplayFetchArgs = useRef({ callId: 0, opts: {} });

  const fetchDisplayBreakup = useCallback(
    async (callId, { frmDt, toDt, withOnly } = {}) => {
      lastDisplayFetchArgs.current = { callId, opts: { frmDt, toDt, withOnly } }; // ← remember
      setDetailModal((prev) => ({ ...prev, open: false }));
      setSummaryModal((prev) => ({ ...prev, open: false }));
      setDisplayBreakupModal((prev) => ({ ...prev, open: true, loading: true }));
      try {
        const res = await api.post("/dashboard/getSummary_img_breakUp", {
          callId,
          value: withOnly ? 1 : 0,
          frmDt: frmDt ? frmDt.format("YYYY-MM-DD") : undefined,
          toDt: toDt ? toDt.format("YYYY-MM-DD") : undefined,
        });
        setDisplayBreakupModal({
          open: true,
          loading: false,
          displayData: res.data?.DisplayData || [],
        });
      } catch (err) {
        console.error(err);
        setDisplayBreakupModal({ open: true, loading: false, displayData: [] });
      }
    },
    []
  );

  // Entry point #1: top Display widget click — resets filters to current month, matches PHP defaults
  const handleDisplayWidgetClick = useCallback(() => {
    const frmDt = dayjs().startOf("month");
    const toDt = dayjs().endOf("month");
    setDisplayFromDate(frmDt);
    setDisplayToDate(toDt);
    setDisplayWithOnly(false);
    fetchDisplayBreakup(0, { frmDt, toDt, withOnly: false });
  }, [fetchDisplayBreakup]);

  // "Load" button / toggle change — re-fetches with whatever filters are currently set
  const handleDisplayFilterReload = useCallback(
    (withOnlyOverride) => {
      if (!isDisplayRangeValid(displayFromDate, displayToDate)) {
        showAlert.error("Date range cannot exceed 1 month");
        return;
      }
      fetchDisplayBreakup(0, {
        frmDt: displayFromDate,
        toDt: displayToDate,
        withOnly: withOnlyOverride !== undefined ? withOnlyOverride : displayWithOnly,
      });
    },
    [fetchDisplayBreakup, displayFromDate, displayToDate, displayWithOnly]
  );

  const handleDisplayWithOnlyToggle = useCallback(
    (checked) => {
      setDisplayWithOnly(checked);
      handleDisplayFilterReload(checked);
    },
    [handleDisplayFilterReload]
  );

  // Entry point #2: Display column click inside Call Summary table — looks up one specific
  // call, no date-range filtering needed (mirrors PHP's .viewimagesBreakUp, callId only).
  const handleViewDisplayBreakup = useCallback(
    (callId) => fetchDisplayBreakup(callId),
    [fetchDisplayBreakup]
  );

  /* ───────────────────── Photo Rating detail (row click inside Display Breakup) ───────────────────── */
  // PHP: $(document).on('click','.sumMer_rate', ...) -> POST dashboard/getSummary_mer_breakUpRate
  const [photoRatingModal, setPhotoRatingModal] = useState({
    open: false,
    loading: false,
    title: "",
    title1: "",
    title2: "",
    ratedata: null,
  });
  const closePhotoRatingModal = () => setPhotoRatingModal((p) => ({ ...p, open: false }));

  const handleViewPhotoRating = useCallback(async (row) => {
    const hasHeaderInfo = row && (row.cus_name || row.user_name || row.call_date);

    setPhotoRatingModal((prev) => ({
      ...prev,
      open: true,
      loading: true,
      title: hasHeaderInfo
        ? `${row.cus_name || ""}${row.class_name ? ` (${row.class_name})` : ""}`
        : prev.title,
      title1: hasHeaderInfo ? (row.user_name || "") : prev.title1,
      title2: hasHeaderInfo
        ? (row.call_date ? dayjs(row.call_date).format("DD MMM YYYY, ddd") : "")
        : prev.title2,
      ratedata: null,
    }));
    try {
      const res = await api.post("/dashboard/getSummary_mer_breakUpRate", {
        id: row.id,
      });
      setPhotoRatingModal((prev) => ({
        ...prev,
        loading: false,
        ratedata: res.data?.ratedata || null,
      }));
    } catch (err) {
      console.error(err);
      setPhotoRatingModal((prev) => ({ ...prev, loading: false, ratedata: null }));
    }
  }, []);

  const handleMarketInputSaved = useCallback(async () => {
    if (summaryModal.srId) {
      setSummaryModal((prev) => ({ ...prev, loading: true })); 
      const dt = summaryModal.dt || toDateValue;
      const res = await api.post("/dashboard/callSummaryDetails_new", {
        srID: summaryModal.srId,
        dt: dt ? dt.format("YYYY-MM-DD") : "",
        type: summaryModal.activityType,
        frDt: fromDateValue ? fromDateValue.format("YYYY-MM-DD") : "",
        userType: activityBreakUp,
        cusType: cusType,
      }).catch((err) => {
        console.error(err);
        return null;
      });
      if (res) {
        setSummaryModal((prev) => ({
          ...prev,
          profile: res.data?.profile || prev.profile,
          activitySummary: res.data?.activitySummary || prev.activitySummary,
          getMarketInput: res.data?.getMarketInput || prev.getMarketInput,
          getSamples: res.data?.getSamples || prev.getSamples,
        }));
      }
      setSummaryModal((prev) => ({ ...prev, loading: false })); 
    }
  }, [summaryModal.srId, activityBreakUp, cusType, fromDateValue, toDateValue]);

  const handleCallDeleted = useCallback((deletedCallId) => {
    setSummaryModal((prev) => ({
      ...prev,
      activitySummary: prev.activitySummary.filter((row) => row.call_id !== deletedCallId),
    }));
  }, []);

  /* ───────────────────── Profile widget graphs (region/grand-total icon) ───────────────────── */
  const [profileModal, setProfileModal] = useState({
    open: false,
    loading: false,
    title: "",
    repProfileData: null,
    coveragePatternData: [],
  });
  const isDayWiseFetchingRef = useRef(false);
  const dayWiseRequestIdRef = useRef(0);   // NEW — tags each request, discards stale/out-of-order responses
  const pendingRefetchRef = useRef(false);

  const closeDetailModal = () => setDetailModal((p) => ({ ...p, open: false }));
  const closeSummaryModal = () => {
    setSummaryModal((p) => ({ ...p, open: false }));
    if (filterType === "0") {
      fetchDayWiseData();
    }
  };
  const closeProfileModal = () => setProfileModal((p) => ({ ...p, open: false }));

  const fetchUserTypeOptions = async () => {
    try {
      const res = await api.post("/dashboard/getUserTypeMas");
      setUserTypeOptions(res.data.options || []);
    } catch (err) {
      console.error(err);
      setUserTypeOptions([]);
    }
  };

  const fetchEmpTypeOptions = async () => {
    try {
      const res = await api.post("/dashboard/getBuMas");
      setEmpTypeOptions(res.data.bumas || []);
    } catch (err) {
      console.error(err);
      setEmpTypeOptions([]);
    }
  };

  const fetchSecondaryOrders = async () => {
    try {
      const res = await api.post("/dashboard/getOrders");
      setSecondaryOrders({ pcs: res.data.pcs, cum: res.data.cum, loading: false });
    } catch (err) {
      console.error(err);
      setSecondaryOrders((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchPrimaryOrders = async () => {
    try {
      const res = await api.post("/dashboard/getPrimaryOrders");
      setPrimaryOrders({ pcs: res.data.pcs, cum: res.data.cum, loading: false });
    } catch (err) {
      console.error(err);
      setPrimaryOrders((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchPrimarySalesWidget = async () => {
    try {
      const res = await api.post("/dashboard/getPrimarySalesWidget");
      setPrimarySalesWidget({ pcs: res.data.pcs, cum: res.data.cum, loading: false });
    } catch (err) {
      console.error(err);
      setPrimarySalesWidget((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchDisplay = async () => {
    try {
      const res = await api.post("/dashboard/getDisplay");
      setDisplay({
        totalreport: res.data.totalreport,
        totalimages: res.data.totalimages,
        avgrating: res.data.avgrating,
        unrateimages: res.data.unrateimages,
        loading: false,
      });
    } catch (err) {
      console.error(err);
      setDisplay((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchSecondaryOrders();
    fetchPrimaryOrders();
    fetchPrimarySalesWidget();
    fetchDisplay();
    fetchUserTypeOptions();
    fetchEmpTypeOptions();
  }, []);

  const fetchActivityData = async () => {
    if (!fromDateValue || !toDateValue) return;
    setActivityLoading(true);
    try {
      const res = await api.post("/activity_dashboard", {
        from_date: fromDateValue.format("YYYY-MM-DD"),
        to_date: toDateValue.format("YYYY-MM-DD"),
        activity_type: 2,
        activity_break_up: activityBreakUp,
        cus_type: cusType,
        emp_type: empType,
      });
      setActivityData(res.data?.tbldta || []);
    } catch (err) {
      console.error(err);
      setActivityData([]);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (filterType === "1") fetchActivityData();
  }, [filterType, fromDateValue, toDateValue, activityBreakUp, cusType, empType]);

  // ───────────────────── Day Wise fetch ─────────────────────
  // PHP: getActivityCallData() -> POST dashboard/activityDashboard with
  // {crDate, activityType:1, activityBreakUp, frmDate, empType, cusType, value}
  const fetchDayWiseData = useCallback(async ({ silent = false } = {}) => {
    if (!dayWiseDate) return;

    if (isDayWiseFetchingRef.current) {
      // A fetch (poll or manual) is already in flight.
      // If this call came from a manual/filter change, remember to refetch
      // immediately once the current one finishes — don't just drop it.
      if (!silent) pendingRefetchRef.current = true;
      return;
    }

    isDayWiseFetchingRef.current = true;
    const requestId = ++dayWiseRequestIdRef.current; // stamp this call uniquely

    if (!silent) setDayWiseLoading(true);
    try {
      const res = await api.post("/dashboard/activityDashboard", {
        crDate: dayWiseDate.format("YYYY-MM-DD"),
        frmDate: dayWiseDate.format("YYYY-MM-DD"),
        activityType: 1,
        activityBreakUp,
        empType,
        cusType,
        value: showAllReported ? 1 : 0,
      });

      // Only apply this response if no newer request has superseded it —
      // prevents an old (e.g. previous-date) response from overwriting
      // the table after the user has already moved on to a new date.
      if (requestId === dayWiseRequestIdRef.current) {
        setDayWiseData(res.data?.activityData || []);
      }
    } catch (err) {
      console.error(err);
      if (!silent && requestId === dayWiseRequestIdRef.current) {
        setDayWiseData([]);
      }
    } finally {
      if (!silent) setDayWiseLoading(false);
      isDayWiseFetchingRef.current = false;

      // Don't recurse into this closure — it's stale. Bump state so a
      // fresh effect (with the CURRENT dayWiseDate/filters) does the retry.
      if (pendingRefetchRef.current) {
        pendingRefetchRef.current = false;
        setRefetchTick((t) => t + 1);
      }
    }
  }, [dayWiseDate, activityBreakUp, empType, cusType, showAllReported]);

  useEffect(() => {
    if (filterType === "0") fetchDayWiseData();
  }, [filterType, fetchDayWiseData]);

  useEffect(() => {
    if (refetchTick === 0) return;
    if (filterType === "0") fetchDayWiseData();
  }, [refetchTick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    if (sliderContainerRef.current) {
      observer.observe(sliderContainerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setWidgets([
      {
        widget_id: 2,
        title: "Primary Orders",
        unit: "Pcs",
        color: "#1976D2",
        type: "stat",
      },
      {
        widget_id: 3,
        title: "Primary Sales",
        unit: "Pcs",
        color: "#2E7D32",
        type: "stat",
      },
      {
        widget_id: 4,
        title: "Display",
        color: "#9E9D24",
        type: "display",
      },
      {
        widget_id: 5,
        title: "Campaigns",
        color: "#1B5E20",
        type: "campaign",
      },
    ]);
  }, []);


  const toggleLogs = useCallback(() => {
    setShowLogs((prev) => !prev);
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setTabIndex(newValue);
  }, []);

  /* ============================================================================================
   * CLICK HANDLERS — mirror the PHP AJAX calls exactly (same params, same backend routes)
   * ============================================================================================ */

  const handleFieldDetailClick = useCallback(
    async (cusCat, row) => {
      setSummaryModal((prev) => ({ ...prev, open: false }));        // ← add
      setDisplayBreakupModal((prev) => ({ ...prev, open: false }));  // ← add
      setDetailModal({
        open: true,
        loading: true,
        title: row.sr_name || "",
        kind: "fieldDetail",
        html: "",
        fieldData: null,
      });
      try {
        const res = await api.post("/dashboard/FieldDetail", {
          srId: row.sr_id,
          type: cusCat,
          dt: toDateValue ? toDateValue.format("YYYY-MM-DD") : "",
          activityBreakUp,
          cusType,
          selectFromDate: fromDateValue ? fromDateValue.format("YYYY-MM-DD") : "",
        });
        setDetailModal((prev) => ({
          ...prev,
          loading: false,
          fieldData: { type: res.data?.type ?? cusCat, cusDetail: res.data?.cusDetail || [] },
        }));
      } catch (err) {
        console.error(err);
        setDetailModal((prev) => ({
          ...prev,
          loading: false,
          kind: "html",
          html: "Failed to load details.",
        }));
      }
    },
    [activityBreakUp, cusType, fromDateValue, toDateValue]
  );

  const handleCumCusDetailClick = useCallback(
    async (cusCat, row) => {
      setSummaryModal((prev) => ({ ...prev, open: false }));        // ← add
      setDisplayBreakupModal((prev) => ({ ...prev, open: false }));  // ← add
      setDetailModal({
        open: true,
        loading: true,
        title: row.sr_name || "",
        kind: "cumCusDetail",
        html: "",
        fieldData: null,
      });
      try {
        const res = await api.post("/dashboard/cumCusDetail", {
          srId: row.sr_id,
          type: cusCat,
          dt: toDateValue ? toDateValue.format("YYYY-MM-DD") : "",
          activityBreakUp,
          cusType,
          selectFromDate: fromDateValue ? fromDateValue.format("YYYY-MM-DD") : "",
        });
        setDetailModal((prev) => ({
          ...prev,
          loading: false,
          fieldData: { type: res.data?.type ?? cusCat, cusDetail: res.data?.cusDetail || [] },
        }));
      } catch (err) {
        console.error(err);
        setDetailModal((prev) => ({
          ...prev,
          loading: false,
          kind: "html",
          html: "Failed to load details.",
        }));
      }
    },
    [activityBreakUp, cusType, fromDateValue, toDateValue]
  );

  // Now supports Day Wise too: pass activityTypeOverride="1" + dtOverride (the selected day)
  // to hit callSummaryDetails_new the same way PHP's .callSummaryDetails click does when
  // activityType==1 (single-day call summary rather than a from/to range).
  const handleSalePersonClick = useCallback(
    async (srId, regId, name, activityTypeOverride, dtOverride) => {
      setDetailModal((prev) => ({ ...prev, open: false }));
      setDisplayBreakupModal((prev) => ({ ...prev, open: false }));
      const effectiveType = activityTypeOverride || "2";
      const effectiveDt = dtOverride || toDateValue;
      setSummaryModal({
        open: true,
        loading: true,
        title: name || "",
        srId,
        activityType: effectiveType,
        dt: effectiveDt,
        profile: null,
        activitySummary: [],
        userJoint: [],
        getMarketInput: [],
        getSamples: [],
      });
      setSummaryCusType("0");
      try {
        const res = await api.post("/dashboard/callSummaryDetails_new", {
          srID: srId,
          dt: effectiveDt ? effectiveDt.format("YYYY-MM-DD") : "",
          type: effectiveType,
          frDt: fromDateValue ? fromDateValue.format("YYYY-MM-DD") : "",
          userType: activityBreakUp,
          cusType: cusType,
        });
        setSummaryModal((prev) => ({
          ...prev,
          loading: false,
          activityType: String(res.data?.type ?? effectiveType),
          profile: res.data?.profile || null,
          activitySummary: res.data?.activitySummary || [],
          userJoint: res.data?.userJoint || [],
          getMarketInput: res.data?.getMarketInput || [],
          getSamples: res.data?.getSamples || [],
        }));
      } catch (err) {
        console.error(err);
        setSummaryModal((prev) => ({ ...prev, loading: false, activitySummary: [] }));
      }
    },
    [activityBreakUp, cusType, fromDateValue, toDateValue]
  );

  // Day Wise PSM name click — same handler, just fixes activityType="1" and uses the
  // single selected day instead of the cumulative to-date.
  const handleDayWiseSalePersonClick = useCallback(
    (userId, regId, name) => handleSalePersonClick(userId, regId, name, "1", dayWiseDate),
    [handleSalePersonClick, dayWiseDate]
  );

  const handleSummaryTypeFilterChange = useCallback(
    async (custype) => {
      if (!summaryModal.srId) return;
      setSummaryCusType(custype);
      setSummaryModal((prev) => ({ ...prev, loading: true }));
      try {
        const dt = summaryModal.dt || toDateValue;
        const res = await api.post("/dashboard/callSummaryDetails_new_filters", {
          srID: summaryModal.srId,
          type: summaryModal.activityType,
          custype,
          dt: dt ? dt.format("YYYY-MM-DD") : '',
          frDt: fromDateValue ? fromDateValue.format("YYYY-MM-DD") : "",
        });
        setSummaryModal((prev) => ({
          ...prev,
          loading: false,
          profile: res.data?.profile ?? prev.profile,
          activitySummary: res.data?.activitySummary || [],
        }));
      } catch (err) {
        console.error(err);
        setSummaryModal((prev) => ({ ...prev, loading: false, activitySummary: [] }));
      }
    },
    [summaryModal.srId, summaryModal.activityType, fromDateValue, toDateValue]
  );

  const handleProfileWidgetClick = useCallback(
    async ({ srId, regId, name }) => {
      setProfileModal({
        open: true,
        loading: true,
        title: name || "",
        repProfileData: null,
        coveragePatternData: [],
      });
      try {
        const res = await api.post("/dashboard/profileWidgetGraphs", {
          srId: srId || "",
          regId: regId || "",
          brkup: activityBreakUp,
          crDate: toDateValue ? toDateValue.format("YYYY-MM-DD") : "",
          frmDate: fromDateValue ? fromDateValue.format("YYYY-MM-DD") : "",
          activityType: "2",
        });
        setProfileModal((prev) => ({
          ...prev,
          loading: false,
          repProfileData: res.data?.repProfileData || null,
          coveragePatternData: res.data?.coveragePatternData || [],
        }));
      } catch (err) {
        console.error(err);
        setProfileModal((prev) => ({ ...prev, loading: false }));
      }
    },
    [activityBreakUp, fromDateValue, toDateValue]
  );

  const settings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: getSlidesToShow(containerWidth),
    slidesToScroll: 1,
    draggable: false,
    swipe: false,
    touchMove: false,
    arrows: true,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    autoplay: false,
  };

  // URL-safe encode - replaces + / = with cleaner characters
  const encode = (val) => btoa(String(val || ""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");   // ← removes = entirely, no more %3D

  const handleOrderNavigate = () => {
    navigate(`/orderApproval/orders`)
  }

  const handlePrimaryOrderNavigate = () => {
    let month = dayjs().startOf("month");
    let formData = {
      zone: "0",
      region: "0",
      area: "0",
      distributor: "0",
    }
    let params = new URLSearchParams();
    if (month) params.append('mtd', encode(dayjs(month).format("YYYY-MM-DD")));
    if (formData.zone) params.append('zone', encode(formData.zone));
    if (formData.region) params.append('reg', encode(formData.region));
    if (formData.area) params.append('area', encode(formData.area));
    if (formData.distributor) params.append('distributor', encode(formData.distributor));
    navigate(`/mobile/Orders?${params}`)
  }

  const fetchDayWiseDataForExport = useCallback(async () => {
    if (!dayWiseDate) return [];
    try {
      const res = await api.post("/dashboard/activityDashboard", {
        crDate: dayWiseDate.format("YYYY-MM-DD"),
        frmDate: dayWiseDate.format("YYYY-MM-DD"),
        activityType: 1,
        activityBreakUp,
        empType,
        cusType,
        value: 0, // ← always "show all" for export, ignore showAllReported toggle
      });
      return res.data?.activityData || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [dayWiseDate, activityBreakUp, empType, cusType]);

  const handlePrimarySalesNavigate = () => {
    let selMonth = dayjs();
    let selType = 4
    const encMonth = btoa(selMonth ? selMonth.format("YYYY-MM") : dayjs().format("YYYY-MM"));
    const enType = btoa(selType)
    navigate(`/dashboard/primarysalesview/${encMonth}/${enType}`)
  }

  const handleFilterTypeChange = useCallback((newType) => {
    setFilterType(newType);
    setActivityBreakUp("2");
    setCusType("0");
    setEmpType("0");

    if (newType === "0") {
      // Day Wise defaults
      setDayWiseDate(dayjs());
      setShowAllReported(true);
    } else {
      // Cumulative defaults
      setFromDateValue(dayjs().startOf("month"));
      setToDateValue(dayjs());
    }
  }, []);

  return (
    <Layout>
      <Box sx={{ padding: "20px 20px 0px 20px" }}>
        <Box ref={sliderContainerRef}>
          <Slider {...settings}>
            <div style={{ padding: "10px" }} onClick={handleOrderNavigate}>
              <TopWidget
                widget={{ widget_id: 1, title: "Secondary Orders", unit: "Pcs", color: "#F57C00" }}
                salesBooking={{ mtd: secondaryOrders.cum, ytd: secondaryOrders.pcs, loading: secondaryOrders.loading }}
              />
            </div>

            <div style={{ padding: "10px" }} onClick={handlePrimaryOrderNavigate}>
              <TopWidget
                widget={{ widget_id: 2, title: "Primary Orders", unit: "Pcs", color: "#1976D2" }}
                salesBooking={{ mtd: primaryOrders.cum, ytd: primaryOrders.pcs, loading: primaryOrders.loading }}
              />
            </div>

            <div style={{ padding: "10px" }} onClick={handlePrimarySalesNavigate}>
              <TopWidget
                widget={{ widget_id: 3, title: "Primary Sales", unit: "Pcs", color: "#2E7D32" }}
                salesBooking={{ mtd: primarySalesWidget.cum, ytd: primarySalesWidget.pcs, loading: primarySalesWidget.loading }}
                asOfLabel={`on ${dayjs().subtract(1, "day").format("DD MMM YYYY")}`}
              />
            </div>

            {/* PHP: #report_img click -> getSummary_img_breakUp with {callId:0, value:0} */}
            <div style={{ padding: "10px" }} onClick={handleDisplayWidgetClick}>
              <TopWidget
                widget={{ widget_id: 4, title: "Display", color: "#9E9D24", type: "display" }}
                salesBooking={{
                  reports: display.totalreport,
                  images: display.totalimages,
                  avgRating: display.avgrating,
                  unrated: display.unrateimages,
                  loading: display.loading,
                }}
              />
            </div>

            <div style={{ padding: "10px" }}>
              <TopWidget
                widget={{ widget_id: 5, title: "Campaigns", color: "#1B5E20", type: "campaign" }}
                salesBooking={{ status: "active", loading: false }}
              />
            </div>
          </Slider>
        </Box>
      </Box>
      {/* Call Summary Details — now inline instead of Dialog */}
      {summaryModal.open ? (
        <Box sx={headContainer}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography sx={{ fontSize: "1.2rem", fontWeight: 500, color: "#000" }}>
              Activity Reporting Details
            </Typography>
            <Button onClick={closeSummaryModal} variant="outlined">Close</Button>
          </Box>
          <Divider />

          {summaryModal.loading  ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <CallSummaryTable
              srId={summaryModal.srId}
              type={summaryModal.activityType}
              onRouteMapClick={(userId) =>
                handleDayWiseDetailClick("routeMap", {
                  user_id: userId,
                  extraParams: { type: 1, reportingType: "" },
                })
              }
              profile={summaryModal.profile}
              custype={summaryCusType}
              activitySummary={summaryModal.activitySummary}
              onTypeFilterChange={handleSummaryTypeFilterChange}
              onAddJointWork={openJointWorkModal}
              onAddMarketInput={openMarketInputModal}
              onDeleteCall={canDeleteCall ? openDeleteCallModal : undefined}
              onViewDisplayBreakup={handleViewDisplayBreakup}
              onOrderDetailsClick={(callId, userId) =>
                handleDayWiseDetailClick("order", { user_id: userId, call_id: callId, distype: 2 })
              }
              onSampleDetailsClick={(callId, userId) => {
                handleDayWiseDetailClick("sample", { user_id: userId, call_id: callId, distype: 2 })
              }
              }
            />
          )}
        </Box>
      ) : displayBreakupModal.open ? (
        <Box sx={headContainer}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography sx={{ fontSize: "1.2rem", fontWeight: 500, color: "#000" }}>
              Display
            </Typography>
            <Button onClick={closeDisplayBreakupModal} color="error" sx={{ textTransform: "none", fontSize: "12px" }} endIcon={<IoChevronBackCircleOutline />}>Back to Return</Button>
          </Box>

          {/* PHP: #img_frm_dt / #img_to_dt + #toggleCheckbox3 ("With Display") + #load_display */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From"
                format="DD MMM YYYY"
                value={displayFromDate}
                onChange={(v) => setDisplayFromDate(v)}
                slotProps={{ textField: { size: "small" } }}
                maxDate={displayToDate ? displayToDate : null}
              />
              <DatePicker
                label="To"
                format="DD MMM YYYY"
                value={displayToDate}
                onChange={(v) => setDisplayToDate(v)}
                slotProps={{ textField: { size: "small" } }}
                minDate={displayFromDate ? displayFromDate : null}
              />
            </LocalizationProvider>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2">Show All</Typography>
              <Switch
                checked={displayWithOnly}
                onChange={(e) => handleDisplayWithOnlyToggle(e.target.checked)}
              />
              <Typography variant="body2">With Display</Typography>
            </Box>
            <Button variant="contained" onClick={() => handleDisplayFilterReload()}>
              Load
            </Button>
          </Box>

          {displayBreakupModal.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DisplayBreakupTable
              displayData={displayBreakupModal.displayData}
              onRowClick={handleViewPhotoRating}
              masterPanel={masterPanel}
            />
          )}
        </Box>
      ) : detailModal.open ? (
        <Box sx={headContainer}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography sx={{ fontSize: "1.2rem", fontWeight: 500, color: "#000" }}>
              Name : {detailModal.title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Typography variant="body2">
                <i className="fa fa-circle" aria-hidden="true" style={{ color: "red", fontSize: 10 }} /> Retailer
              </Typography>
              <Button onClick={closeDetailModal} color="error" sx={{ textTransform: "none", fontSize: "12px" }} endIcon={<IoChevronBackCircleOutline />}>
                Back to Return
              </Button>
            </Box>
          </Box>
          <Divider />

          {detailModal.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detailModal.kind === "fieldDetail" && detailModal.fieldData ? (
            <FieldDetailTable
              type={detailModal.fieldData.type}
              cusDetail={detailModal.fieldData.cusDetail}
            />
          ) : detailModal.kind === "cumCusDetail" && detailModal.fieldData ? (
            <CumCusDetailTable
              type={detailModal.fieldData.type}
              cusDetail={detailModal.fieldData.cusDetail}
              masterPanel={masterPanel}
            />
          ) : (
            <Box dangerouslySetInnerHTML={{ __html: detailModal.html }} />
          )}
        </Box>
      ) : (
        <Box sx={headContainer}>
          <Box>
            <Button
              onClick={() => {/* handle click */ }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1,
                textTransform: "none",
                padding: 0,
                color: "#000",
                "&:hover": { background: "none", opacity: 0.75 },
              }}
            >
              <TfiMenuAlt size={16} />
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 500, color: "#000" }}>
                Activity Dashboard
              </Typography>
            </Button>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Grid container spacing={1} alignItems="center">
                {filterType === "0" ? (
                  <Grid size={{ xs: 12, sm: 12, md: 2, lg: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Date"
                        format="DD MMM YYYY"
                        value={dayWiseDate}
                        onChange={(v) => setDayWiseDate(v)}
                        slotProps={{ textField: { size: "small", sx: { maxWidth: 140 } } }}
                        maxDate={dayjs()}
                      />
                    </LocalizationProvider>
                  </Grid>
                ) : (
                  <>
                    <Grid size={{ xs: 12, sm: 12, md: 2, lg: 2 }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="From"
                          format="DD MMM YYYY"
                          value={fromDateValue}
                          onChange={(newVal) => setFromDateValue(newVal)}
                          slotProps={{ textField: { size: "small", sx: { maxWidth: 140 } } }}
                          maxDate={toDateValue ? toDateValue : null}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12, md: 2, lg: 2 }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="To"
                          format="DD MMM YYYY"
                          value={toDateValue}
                          onChange={(newVal) => setToDateValue(newVal)}
                          slotProps={{ textField: { size: "small", sx: { maxWidth: 140 } } }}
                          minDate={fromDateValue ? fromDateValue : null}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </>
                )}

                <Grid size={{ xs: 12, sm: 12, md: 2, lg: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="type">Type</InputLabel>
                    <Select
                      id="type"
                      label="Type"
                      MenuProps={menuStyle}
                      labelId="type"
                      variant="outlined"
                      value={filterType}
                      onChange={(e) => handleFilterTypeChange(e.target.value)}
                    >
                      <MenuItem style={{ fontSize: "11px" }} value="0">Day Wise</MenuItem>
                      <MenuItem style={{ fontSize: "11px" }} value="1">Cumulative</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 12, md: 2, lg: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="Usertype">{userLabel} Type</InputLabel>
                    <Select
                      id="Usertype"
                      label={`${userLabel} Type`}
                      MenuProps={menuStyle}
                      labelId="Usertype"
                      variant="outlined"
                      value={activityBreakUp}
                      onChange={(e) => setActivityBreakUp(e.target.value)}
                    >
                      {userTypeOptions.map((opt) => (
                        <MenuItem key={opt.value} style={{ fontSize: "11px" }} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {filterType === "0" ? (
                  <Grid size={{ xs: 12, sm: 12, md: 2, lg: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Show All</Typography>
                      <Switch
                        color="primary"
                        checked={showAllReported}
                        onChange={(e) => setShowAllReported(e.target.checked)}
                      />
                      <Typography variant="body2" color="text.secondary">Reported</Typography>
                    </Box>
                  </Grid>
                ) : (
                  <>
                    <Grid size={{ xs: 12, sm: 12, md: 2, lg: 2 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="custype">Cus.Type</InputLabel>
                        <Select
                          id="custype" label="Cus.Type" MenuProps={menuStyle} labelId="custype" variant="outlined"
                          value={cusType}
                          onChange={(e) => setCusType(e.target.value)}
                        >
                          <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                          <MenuItem style={{ fontSize: "11px" }} value="2">Retailer</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12, md: 2, lg: 2 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="emptype">Emp Type</InputLabel>
                        <Select
                          id="emptype" label="Emp Type" MenuProps={menuStyle} labelId="emptype" variant="outlined"
                          value={empType}
                          onChange={(e) => setEmpType(e.target.value)}
                        >
                          <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                          {empTypeOptions.map((bu) => (
                            <MenuItem key={bu.id} style={{ fontSize: "11px" }} value={String(bu.id)}>
                              {bu.bu_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
            <Box>
              <Button
                variant="contained"
                color="warning"
                disabled={exporting}
                startIcon={<FaFileExcel />}
                onClick={async () => {
                  setExporting(true);
                  try {
                    if (filterType === "0") {
                      const exportData = await fetchDayWiseDataForExport();
                      exportDayWiseExcel(
                        exportData,
                        dayWiseDate ? dayWiseDate.format("DD MMM YYYY") : "",
                        dayWiseDate ? dayWiseDate.isSame(dayjs(), "day") : false,
                      );
                    } else {
                      // Cumulative export — unchanged
                      await exportActivityExcel(
                        activityData,
                        fromDateValue.format("DD MMM YYYY"),
                        toDateValue.format("DD MMM YYYY"),
                        psmLabel,
                      );
                    }
                  } catch (err) {
                    console.error("Export failed:", err);
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                {exporting ? "Exporting..." : "Export"}
              </Button>
            </Box>
          </Box>
          {filterType === "1" && (
            <CumulativeDashboard
              activityData={activityData}
              fromDate={fromDateValue}
              toDate={toDateValue}
              onSalePersonClick={handleSalePersonClick}
              onFieldDetailClick={handleFieldDetailClick}
              onCumCusDetailClick={handleCumCusDetailClick}
              onProfileWidgetClick={handleProfileWidgetClick}
              activityLoading={activityLoading}
              srLabel={psmLabel}
            />
          )}
          {filterType === "0" && (
            <DayWiseDashboard
              activityData={dayWiseData}
              activityLoading={dayWiseLoading}
              selectedDate={dayWiseDate}
              onSalePersonClick={handleDayWiseSalePersonClick}
              onRouteMapClick={(userId) =>
                handleDayWiseDetailClick("routeMap", {
                  user_id: userId,
                  extraParams: { type: 1, reportingType: "" },
                })
              }
              onJointWorkClick={(userId) => handleDayWiseDetailClick("jointWork", { user_id: userId })}
              onSampleDetailClick={(row) =>
                handleDayWiseDetailClick("sample", {
                  user_id: row.user_id,
                  call_id: row.call_id,
                  distype: 1,          // ← matches PHP's hardcoded hidden input for day-wise
                })
              }
              onOrderDetailClick={(row) => handleDayWiseDetailClick("order", row)}
            />
          )}
        </Box>
      )}

      {/* Profile Widget Graphs — mirrors PHP .profileWidget click / #profileWidgetDiv */}
      <Dialog open={profileModal.open} onClose={closeProfileModal} maxWidth="lg" fullWidth>
        <DialogTitle>{profileModal.title}</DialogTitle>
        <DialogContent dividers>
          {profileModal.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : profileModal.repProfileData ? (
            <ProfileWidgetGraphs
              repProfileData={profileModal.repProfileData}
              coveragePatternData={profileModal.coveragePatternData}
            />
          ) : (
            <Typography align="center" sx={{ py: 4 }}>
              No Data
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeProfileModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Joint Work — mirrors PHP #putJointWorkModal */}
      <JointWorkModal
        open={jointWorkModal.open}
        onClose={closeJointWorkModal}
        callId={jointWorkModal.callId}
        cusId={jointWorkModal.cusId}
        mainId={jointWorkModal.mainId}
        userJoint={summaryModal.userJoint}
        api={api}
        onSaved={handleJointWorkSaved}
      />

      {/* Market Input — mirrors PHP #putMarketInputModal */}
      <MarketInputModal
        open={marketInputModal.open}
        onClose={closeMarketInputModal}
        callId={marketInputModal.callId}
        marketInputOptions={summaryModal.getMarketInput}
        sampleOptions={summaryModal.getSamples}
        userType={activityBreakUp}
        api={api}
        onSaved={handleMarketInputSaved}
      />

      {/* Delete Call — mirrors PHP #deleteCallModal */}
      <DeleteCallModal
        open={deleteCallModal.open}
        onClose={closeDeleteCallModal}
        callId={deleteCallModal.callId}
        api={api}
        onDeleted={handleCallDeleted}
      />

      {/* Photo Rating Breakup — mirrors PHP .sumMer_rate click / #summaryMer-Modal */}
      <Dialog open={photoRatingModal.open} onClose={closePhotoRatingModal} maxWidth="md" fullWidth>
        <DialogTitle>
          Outlet Name: <b>{photoRatingModal.title}</b>&nbsp;&nbsp;
          Submitted By: <b>{photoRatingModal.title1}</b>&nbsp;&nbsp;
          Call Dated: <b>{photoRatingModal.title2}</b>
        </DialogTitle>
        <DialogContent dividers>
          {photoRatingModal.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <PhotoRatingBreakup
              ratedata={photoRatingModal.ratedata}
              imageBaseUrl={DOCTOR_REPORTING_IMAGE_BASE_URL}
              api={api}
              onRatingSaved={() => {
                handleViewPhotoRating({ id: photoRatingModal.ratedata?.id }); // refresh modal state
                const { callId, opts } = lastDisplayFetchArgs.current;
                fetchDisplayBreakup(callId, opts); // refresh table underneath
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePhotoRatingModal}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Day Wise generic detail — route map / joint work / sample / order */}
      <Dialog open={dayWiseDetailModal.open} onClose={closeDayWiseDetailModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {{
            routeMap: "Route Map",
            jointWork: "Joint Work With",
            sample: "Sample Details",
            order: `${prodLabel} Details`,
          }[dayWiseDetailModal.kind] || "Details"}
          {dayWiseDetailModal.title ? ` — ${dayWiseDetailModal.title}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          {dayWiseDetailModal.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : dayWiseDetailModal.kind === "routeMap" ? (
            <RouteMapDetail data={dayWiseDetailModal.data} />
          ) : dayWiseDetailModal.kind === "jointWork" ? (
            <JointWorkDetail data={dayWiseDetailModal.data} />
          ) : dayWiseDetailModal.kind === "sample" ? (
            <SampleDetailTable data={dayWiseDetailModal.data} />
          ) : dayWiseDetailModal.kind === "order" ? (
            <OrderDetailTable data={dayWiseDetailModal.data} prodLabel={prodLabel} />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDayWiseDetailModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}