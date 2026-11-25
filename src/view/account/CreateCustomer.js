import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Layout from "../../layout";
import CommonAppSelect from "../../utils/CommonAppSelect";
import { downloadFile } from "../../utils/downloadFile";
import CompetitorMappping from "./CompetitorMappping";
import AddCompetitor from "./AddCompetitor";
import { LocationTaggingMap } from "./LocationTaggingMap";
import {
  Box, Grid, Typography, TextField, Button, Divider,
  RadioGroup, FormControlLabel, FormControl, Radio,
  Dialog, DialogTitle, DialogContent, IconButton,
  DialogActions, CircularProgress, Checkbox, FormGroup, FormHelperText,
  InputLabel, MenuItem, Select, Autocomplete, Tooltip,
  Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { useParams, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import useToast from "../../utils/useToast";
import { getMasterPanel } from "../../services/masterPanelService";
import ConfirmationDialog from "../../utils/confirmDialog";
import usePageTitle from "../../services/usePageTitle";

const headContainer = {
  background: "#fff", display: "flex", flexDirection: "column", gap: 2,
  m: 1.5, borderRadius: "10px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
  padding: "16px 18px",
  width: { lg: "98%", md: "98%", sm: "90%", xs: "90%" },
};
const accContainer = {
  display: "flex", flexDirection: "column", gap: 2, m: 1.5,
  width: { lg: "98%", md: "98%", sm: "90%", xs: "90%" },
};
const subHeaderStyle = { textDecoration: "underline", textUnderlineOffset: "5px", textDecorationColor: "#ccc" };
const greyBg = { "& .MuiInputBase-root": { backgroundColor: "#EEEEEE" } };
const disabledBgSx = {
  "& .MuiInputBase-root.Mui-disabled, & .MuiPickersInputBase-root.Mui-disabled, & .MuiPickersOutlinedInput-root.Mui-disabled": {
    backgroundColor: "#EEEEEE",
  },
};

const FIELD_MD = 3;
const ALL_REGION_OPTION = { id: "0", reg_name: "All" };
const MAX_CLINICS = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const FILE_FOLDER = process.env.REACT_APP_AWS_FOLDER_NAME;
const ALLOWED_USER_TYPES = [1, 2, 3, 6, 8, 10, 12, 13, 14, 15, 16];

const PLAIN_HEADERS = [1, 2];

const ALT_LABELS = { "Billing Address": "Address", "Billing Pincode": "Zip Code" };

const MEETING_DAYS = [
  { label: "Mon", value: "2" }, { label: "Tue", value: "3" }, { label: "Wed", value: "4" },
  { label: "Thu", value: "5" }, { label: "Fri", value: "6" }, { label: "Sat", value: "7" },
  { label: "Sun", value: "1" },
];
const ADV_OPTIONS = [{ id: "0", name: "No" }, { id: "1", name: "Yes" }];

const DEFAULT_CLINIC = {
  repIncharge: "0", repInchargePOS: "0", beat: "", beatOptions: [],
  clinicName: "", contactName: "", contactNo: "", contactNo2: "",
  hospitalAttached: "0", pharmacyAttached: "0", pharmacistName: "",
  meetingDays: [], meetingTime: "",
  address: "", city: "", cityId: "0", zipCode: "",
  shipStat: false, shipAddress: "", shipCity: "", shipCityId: "0", shipPincode: "",
  stkId: "0", phChain: "",
  clinicPhoto: "", clinicPhotoName: "", letterHead: "", letterHeadName: "", gstBoard: "", gstBoardName: "",
};

const DEFAULT_BILLING = {
  cusCode: "", amtCode: "", pisplCode: "", instagram: "", crLimit: "",
  payTerms: "61", payMode: "0", currency: "0", advStat: "1",
  gstStat: false, gstNo: "", panNo: "", msmeNo: "", drRegNo: "",
  dlNA: true, dl1: "", dl1From: "", dl1To: "", dl2: "", dl2From: "", dl2To: "",
  retNA: true, retLic1: "", retLic1From: "", retLic1To: "", retLic2: "", retLic2From: "", retLic2To: "",
};

const INITIAL_FORM = {
  cusType: "2", gender: "1", retailerType: "1", practiseType: "", pharmaType: "1",
  marketingTools: [], agegroup: "1", potentiality: "1", region: "0", adoption: "",
  loyaltyType: "", loyalty: "", dobNA: true, anniversaryNA: true, competitorPref: "",
  socialType: "0", commondisease: [], campaign: "0", keyOpinionLeader: "0",
  ...DEFAULT_BILLING,
};

const REGISTRY = {
  "Customer Type": { key: "cusType", type: "select", opts: "cusType", vk: "id", lk: "cus_type_name", def: "Type", sp: "cusType" },
  "Code": { key: "cusCode", type: "text", def: "Customer Code", readOnly: true },
  "AMT Code": { key: "amtCode", type: "text", def: "AMT Code" },
  "PISPL Code": { key: "pisplCode", type: "text", def: "PISPL Code" },
  "Type": { key: "retailerType", type: "select", opts: "retailType", vk: "id", lk: "retail_type", def: "Type" },
  "Retailer Type": { key: "pharmaType", type: "select", opts: "pharma", lk: "pharmacy_type", def: "Retailer Type" },
  "Practice Type/Speciality": { key: "practiseType", type: "select", opts: "practise", lk: "practice_type", def: "Practice Type/Speciality" },
  "First Name": { key: "firstName", type: "text", def: "First Name" },
  "Last Name": { key: "lastName", type: "text", def: "Last Name", only: "hcp" },
  "Title/Qualification": { key: "titleQualification", type: "text", def: "Title / Qualification", only: "hcp" },
  "Gender": { key: "gender", type: "select", opts: "gender", vk: "id", lk: "gender_name", def: "Gender" },
  "Mobile": { key: "mobile", type: "mobile", def: "Mobile" },
  "Email": {  key: "email", type: "email", def: "Email" },
  "Region": { key: "region", type: "select", opts: "region", vk: "id", lk: "reg_name", def: "Region", sp: "region", zeroEmpty: true, dv: "0" },
  "Loyalty Type": { key: "loyaltyType", type: "select", opts: "loyaltyType", vk: "id", lk: "loyalty_type", def: "Loyalty Type" },
  "Instagram Handle": { key: "instagram", type: "text", def: "Instagram Handle", placeholder: "Enter Instagram Id" },
  "Remarks": { key: "remarks", type: "text", def: "Remarks", multiline: true },
  "Key Opinion Leader": { key: "keyOpinionLeader", type: "select", opts: "kol", vk: "id", lk: "name", def: "Key Opinion Leader", dv: "0" },
  "Adoption/Current Zone": { key: "adoption", type: "select", opts: "adoption", vk: "id", lk: "current_zone", def: "Adoption / Current Zone", only: "hcp" },
  "Social Type": { key: "socialType", type: "select", opts: "socialType", vk: "id", lk: "social_type", def: "Social Type", zeroEmpty: true },
  "Common Diseases Encountered": { key: "commondisease", type: "multi", opts: "disease", lk: "disease_name", def: "Common Diseases Encountered" },
  "Competitor Preference": { key: "competitorPref", type: "text", def: "Competitor Preference" },
  "Campaign": { key: "campaign", type: "select", opts: "campaign", vk: "id", lk: "campaign_name", def: "Campaign", zeroEmpty: true },
  "Marketing Tools": { key: "marketingTools", type: "multi", opts: "marketing", lk: "marketing_tool_type", def: "Marketing Tools" },
  "Age Group": { key: "agegroup", type: "select", opts: "age", vk: "id", lk: "age_grp_name", def: "Age Group" },
  "Hobbies & Interests": { key: "hobbies", type: "text", def: "Hobbies & Interests" },
  "Birthday": { key: "dob", type: "date", def: "Birth Date", na: "dobNA" },
  "Anniversary": { key: "anniversary", type: "date", def: "Anniversary", na: "anniversaryNA" },
  "Competitor Mapping": { type: "component", def: "Competitor Mapping" },

  "Credit Limit for Customer": { key: "crLimit", type: "text", digits: true, def: "Credit Limit for Customer" },
  "Customer Payment Terms": { key: "payTerms", type: "text", digits: true, def: "Customer Payment Terms" },
  "Customer-Payment Method": { key: "payMode", type: "select", opts: "payMode", pre: { id: "0", pay_name: "Select Payment Method" }, vk: "id", lk: "pay_name", def: "Customer Payment method", zeroEmpty: true, dv: "0" },
  "Currency": { key: "currency", type: "select", opts: "currency", pre: { id: "0", currency_code: "Select Currency" }, vk: "id", lk: "currency_code", def: "Currency", zeroEmpty: true, dv: "0" },
  "Advanced Received": { key: "advStat", type: "select", opts: "adv", vk: "id", lk: "name", def: "Adv", dv: "0" },
  "Is GST Register": { key: "gstStat", type: "checkbox", def: "Is GST Register" },
  "Customer-GST No": { key: "gstNo", type: "text", def: "Customer GST No", reqWhen: (fm) => !!fm.gstStat, disabledWhen: (fm) => !fm.gstStat },
  "PAN No": { key: "panNo", type: "text", def: "PAN No." },
  "MSME Reg No.": { key: "msmeNo", type: "text", def: "MSME Reg No." },
  "Medical Reg. No": { key: "drRegNo", type: "text", def: "Dr Reg No." },

  "DL.1": { key: "dl1", type: "text", def: "DL 1", naKey: "dlNA", groupNA: { key: "dlNA", label: "DL NA", clear: ["dl1", "dl1From", "dl1To", "dl2", "dl2From", "dl2To"] } },
  "DL.1 Valid From": { key: "dl1From", type: "date", def: "DL 1 Valid From", naKey: "dlNA" },
  "DL.1 Valid upto": { key: "dl1To", type: "date", def: "DL 1 Valid to", naKey: "dlNA" },
  "DL.2": { key: "dl2", type: "text", def: "DL 2", naKey: "dlNA" },
  "DL.2 Valid From": { key: "dl2From", type: "date", def: "DL 2 Valid From", naKey: "dlNA" },
  "DL.2 Valid upto": { key: "dl2To", type: "date", def: "DL 2 Valid to", naKey: "dlNA" },
  "Retail Lic.1": { key: "retLic1", type: "text", def: "Retail Lic.1", naKey: "retNA", groupNA: { key: "retNA", label: "Retail Lic NA", clear: ["retLic1", "retLic1From", "retLic1To", "retLic2", "retLic2From", "retLic2To"] } },
  "Retail Lic.1 Valid From": { key: "retLic1From", type: "date", def: "Retail Lic.1 Valid From", naKey: "retNA" },
  "Retail Lic.1 Valid upto": { key: "retLic1To", type: "date", def: "Retail Lic.1 Valid to", naKey: "retNA" },
  "Retail Lic.2": { key: "retLic2", type: "text", def: "Retail Lic.2", naKey: "retNA" },
  "Retail Lic.2 Valid From": { key: "retLic2From", type: "date", def: "Retail Lic.2 Valid From", naKey: "retNA" },
  "Retail Lic.2 Valid upto": { key: "retLic2To", type: "date", def: "Retail Lic.2 Valid to", naKey: "retNA" },

  "Beat": { scope: "clinic", key: "beat", type: "select", optsFromClinic: "beatOptions", vk: "id", lk: "beat_name", def: "Beat", zeroEmpty: true },
  "Chain Name": { scope: "clinic", key: "phChain", type: "select", opts: "phChain", vk: "id", lk: "chain_name", def: "Pharmacy Chain Name", only: "retailer", hideWhen: (fm) => String(fm.retailerType) === "2" },
  "Clinic Name": { scope: "clinic", key: "clinicName", type: "text", def: "Clinic Name" },
  "Hospital Attached": { scope: "clinic", key: "hospitalAttached", type: "select", opts: "hospital", pre: { id: "0", hosp_name: "Select Hospital" }, vk: "id", lk: "hosp_name", def: "Hospital Attached To", only: "hcp", zeroEmpty: true },
  "Distributor": { scope: "clinic", key: "stkId", type: "distributor", def: "Distributor", firstOnly: true, zeroEmpty: true },
  "Pharmacy Attached": { scope: "clinic", key: "pharmacyAttached", type: "select", opts: "pharmacy", pre: { id: "0", name: "Select Pharmacy" }, vk: "id", lk: "name", def: "Pharmacy Attached", zeroEmpty: true },
  "Potentiality Class": { scope: "clinic", idx0form: true, key: "potentiality", type: "select", opts: "potentiality", vk: "id", lk: "cat_type", def: "Potentiality Class" },
  "Loyalty Class": { scope: "clinic", idx0form: true, key: "loyalty", type: "select", opts: "potentiality", vk: "id", lk: "cat_type", def: "Loyalty Class" },
  "Visit Frequency/Year": { scope: "clinic", idx0form: true, key: "frequency", type: "select", opts: "frequency", vk: "no_freq_visit", lk: "freq_name", def: "Visit Frequency / Year" },
  "Address": { scope: "clinic", key: "address", type: "text", multiline: true, billing: true, firstOnly: true, def: "Billing Address" },
  "City": { scope: "clinic", key: "city", idKey: "cityId", chk: "cityId", type: "city", billing: true, firstOnly: true, zeroEmpty: true, def: "Billing City" },
  "Zip Code": { scope: "clinic", key: "zipCode", type: "text", digits: true, billing: true, firstOnly: true, def: "Billing PIN Code" },
  "Shipping Address": { scope: "clinic", key: "shipAddress", type: "text", multiline: true, firstOnly: true, sameAsBilling: true, disabledWhen: (fm, cl) => !!cl?.shipStat, def: "Shipping Address" },
  "Shipping City": { scope: "clinic", key: "shipCity", idKey: "shipCityId", chk: "shipCity", type: "city", firstOnly: true, disabledWhen: (fm, cl) => !!cl?.shipStat, def: "Shipping City" },
  "Shipping Pincode": { scope: "clinic", key: "shipPincode", type: "text", digits: true, firstOnly: true, disabledWhen: (fm, cl) => !!cl?.shipStat, def: "Shipping Pincode" },
  "Contact Person": { scope: "clinic", key: "contactName", type: "text", def: "Contact Person", placeholder: "Enter Contact Person" },
  "Contact No": { scope: "clinic", key: "contactNo", type: "text", digits: true, max: 10, phone: true, def: "Contact No", placeholder: "Enter Contact No" },
  "Contact No 2": { scope: "clinic", key: "contactNo2", type: "text", digits: true, max: 10, def: "Contact No 2", placeholder: "Enter Contact No 2" },
  "Contact No 1": { scope: "clinic", key: "contactNo2", type: "text", digits: true, max: 10, def: "Contact No 2", placeholder: "Enter Contact No 2", dupOf: "Contact No 2" },
  "Meeting Time": { scope: "clinic", key: "meetingTime", type: "text", def: "Meeting Timings" },
  "Meeting Days": { scope: "clinic", key: "meetingDays", type: "days", def: "Meeting Days" },
  "Clinic Photo": { scope: "clinic", key: "clinicPhoto", type: "file", accept: ".jpg,.jpeg,.png", def: "Clinic Photo" },
  "Letter Head": { scope: "clinic", key: "letterHead", type: "file", accept: ".jpg,.jpeg,.png,.pdf", def: "Letter Head" },
  "GST board": { scope: "clinic", key: "gstBoard", type: "file", accept: ".jpg,.jpeg,.png", def: "GST board" },
};

const errKey = (f, idx) => (f.scope === "clinic" && !(f.idx0form && idx === 0) ? `${f.key}_${idx}` : f.key);
const isFile = (v) => typeof File !== "undefined" && v instanceof File;
const FILE_UPLOADS = [
  { key: "clinicPhoto", field: "clinic_photo" },
  { key: "letterHead", field: "letter_head_photo" },
  { key: "gstBoard", field: "gst_board" },
];
const validateEmail = (email) =>
  /^([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/.test(email);
const validateMobile = (mobile) => mobile && mobile.length === 10;
const isEmptyVal = (f, v) => {
  if (Array.isArray(v)) return v.length === 0;
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return s === "" || (f.zeroEmpty && s === "0");
};

const fileSig = (v) => (typeof v === "string" ? v : v ? "new:" + v.name : "");
const clinicSig = (c) => JSON.stringify({
  repIncharge: c.repIncharge || "0", repInchargePOS: c.repInchargePOS || "0",
  beat: c.beat || "0", clinicName: c.clinicName || "",
  contactName: c.contactName || "", contactNo: c.contactNo || "", contactNo2: c.contactNo2 || "",
  hospitalAttached: c.hospitalAttached || "0", pharmacyAttached: c.pharmacyAttached || "0",
  meetingDays: [...(c.meetingDays || [])].sort(), meetingTime: c.meetingTime || "",
  address: c.address || "", city: c.city || "", cityId: String(c.cityId || "0"), zipCode: String(c.zipCode || ""),
  shipStat: !!c.shipStat, shipAddress: c.shipAddress || "", shipCity: c.shipCity || "",
  shipCityId: String(c.shipCityId || "0"), shipPincode: String(c.shipPincode || ""),
  stkId: c.stkId || "0", phChain: c.phChain || "0",
  potentiality: String(c.potentiality || ""), loyalty: String(c.loyalty || ""), frequency: String(c.frequency || ""),
  clinicPhoto: fileSig(c.clinicPhoto), letterHead: fileSig(c.letterHead), gstBoard: fileSig(c.gstBoard),
});

function CreateCustomer() {
  const { id, reqType = "0", req = "0" } = useParams();
  const location = useLocation();
  const showAlert = useToast();

  const safeAtob = (str) => { try { return atob(str); } catch (e) { return str; } };
  const decodedID = id ? safeAtob(id) : null;
  const decodedReqType = reqType ? safeAtob(reqType) : "0";
  const decodedReq = req ? safeAtob(req) : "0";
  const isTemp = decodedReq !== "0";
  const isCreateMode = !decodedID || decodedID === "0";
  const maxClinics = isCreateMode ? 1 : MAX_CLINICS;

  const [accStat, setAccStat] = useState(null);
  const [editDataLoading, setEditDataLoading] = useState(!!decodedID && decodedID !== "0");
  const [masterPanel, setMasterPanel] = useState({});
  usePageTitle(`${masterPanel["ACCM"] || "Account"} Master`);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post("/getAccStat", { menu_url: "Customers/CreateDoctor" });
        const stat = res.data?.data?.acc_stat;
        if (stat !== null && stat !== undefined) {
          localStorage.setItem("acc_stat", stat);
          setAccStat(String(stat));
        }
      } catch (err) { console.log(err); }
    })();
  }, []);

  useEffect(() => {
    (async () => { setMasterPanel(await getMasterPanel()); })();
  }, []);

  const [fieldConfig, setFieldConfig] = useState({});
  const [dropdowns, setDropdowns] = useState({ cusTypeMas: [] });
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [pharmaOptions, setPharmaOptions] = useState([]);
  const [practiseType, setpractiseType] = useState([]);
  const [marketingOptions, setMarketingOptions] = useState([]);
  const [genderOptions, setGenderOptions] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [ageOptions, setAgeOptions] = useState([]);
  const [socialtypeOption, setSocialtypeOption] = useState([]);
  const [commonDiseaseOption, setCommonDiseaseOption] = useState([]);
  const [campaignoption, setCampaignOption] = useState([]);
  const [potentialityOptions, setPotentialityOptions] = useState([]);
  const [frequencyOptions, setFrequencyOptions] = useState([]);
  const [loyaltyTypeOptions, setLoyaltyTypeOptions] = useState([]);
  const [adoptionOptions, setAdoptionOptions] = useState([]);
  const [payModeOptions, setPayModeOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [retailTypeOptions, setRetailTypeOptions] = useState([]);
  const [phChainDataOption, setPhChainDataOption] = useState([]);
  const [repInchargeOptions, setRepInchargeOptions] = useState([]);
  const [repPOSOptions, setRepPOSOptions] = useState([]);
  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [pharmacyOptions, setPharmacyOptions] = useState([]);
  const [distributorOptions, setDistributorOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [locationTagged, setLocationTagged] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ latitude: "0", longitude: "0" });
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [competitorRows, setCompetitorRows] = useState([]);
  const [clinics, setClinics] = useState([{ ...DEFAULT_CLINIC }]);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [brandData, setBrandData] = useState([]);
  const [brandsPrescribed, setBrandsPrescribed] = useState([]);
  const [userType, setUserType] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [delFlag, setDelFlag] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [openSections, setOpenSections] = useState({});
  const [originalSnapshot, setOriginalSnapshot] = useState(null);
  const [originalClinics, setOriginalClinics] = useState(null);
  const [confirm, setConfirm] = useState({
    open: false, title: "", message: "", onConfirm: null,
    confirmText: "OK", cancelText: "Cancel", confirmColor: "primary",
  });
  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false, onConfirm: null }));

  const isHcpField = form.cusType === "1";
  const isRetailerField = form.cusType === "2";
  const competitorBrands = brandsPrescribed.filter((b) => b.prescribed === 1).map((b) => b.subCatId);

  const optionSets = {
    cusType: dropdowns.cusTypeMas, retailType: retailTypeOptions, pharma: pharmaOptions, practise: practiseType,
    gender: genderOptions, region: regionOptions, loyaltyType: loyaltyTypeOptions, adoption: adoptionOptions,
    socialType: socialtypeOption, disease: commonDiseaseOption, campaign: campaignoption,
    marketing: marketingOptions, age: ageOptions, payMode: payModeOptions, currency: currencyOptions,
    frequency: frequencyOptions, potentiality: potentialityOptions, phChain: phChainDataOption,
    hospital: hospitalOptions, pharmacy: pharmacyOptions,
    kol: [{ id: "0", name: "Yes" }, { id: "1", name: "No" }], adv: ADV_OPTIONS,
  };

  const isVisible = (label) => {
    const f = REGISTRY[label];
    const c = fieldConfig[label];
    if (!f || !c?.show) return false;
    if (f.dupOf && fieldConfig[f.dupOf]?.show) return false;
    if (f.only === "hcp" && !isHcpField) return false;
    if (f.only === "retailer" && !isRetailerField) return false;
    if (f.hideWhen?.(form)) return false;
    return true;
  };
  const labelOf = (label) => fieldConfig[label]?.label || REGISTRY[label]?.def || label;
  const byOrder = (a, b) =>
    (fieldConfig[a].headerId - fieldConfig[b].headerId) || (fieldConfig[a].ord - fieldConfig[b].ord);

  const clearErr = (k) => setFieldErrors((prev) => (prev[k] ? { ...prev, [k]: "" } : prev));

  const rowHasData = (r) =>
    Number(r.prod_qty) > 0 || Number(r.comp_id_1) > 0 || Number(r.comp_id_2) > 0 ||
    Number(r.comp_id_3) > 0 || Number(r.oth_qty) > 0 || (r.other_name && r.other_name.trim() !== "");

  const buildComparableSnapshot = (formVal, clinicsVal, brandDataVal, competitorRowsVal, prescribedVal) => {
    const f = {
      cusType: formVal.cusType || "", retailerType: formVal.retailerType || "",
      pharmaType: formVal.pharmaType || "", practiseType: formVal.practiseType || "",
      gender: formVal.gender || "",
      firstName: (formVal.firstName || "").trim(), lastName: (formVal.lastName || "").trim(),
      titleQualification: formVal.titleQualification || "",
      mobile: formVal.mobile || "", sendSms: formVal.sendSms || "0",
      email: formVal.email || "", sendEmail: formVal.sendEmail || "0",
      potentiality: formVal.potentiality || "", loyalty: formVal.loyalty || "",
      loyaltyType: formVal.loyaltyType || "", frequency: formVal.frequency || "",
      keyOpinionLeader: formVal.keyOpinionLeader !== null && formVal.keyOpinionLeader !== undefined ? String(formVal.keyOpinionLeader) : "0",
      adoption: formVal.adoption || "",
      marketingTools: [...(formVal.marketingTools || [])].sort(),
      socialType: formVal.socialType || "0", campaign: formVal.campaign || "0",
      commondisease: [...(formVal.commondisease || [])].map(String).sort(),
      region: formVal.region || "", competitorPref: formVal.competitorPref || "",
      hobbies: formVal.hobbies || "", remarks: formVal.remarks || "", agegroup: formVal.agegroup || "",
      dob: formVal.dobNA ? "" : (formVal.dob || ""), dobNA: !!formVal.dobNA,
      anniversary: formVal.anniversaryNA ? "" : (formVal.anniversary || ""), anniversaryNA: !!formVal.anniversaryNA,
      customerLatitude: String(formVal.customerLatitude || "0"),
      customerLongitude: String(formVal.customerLongitude || "0"),
      cusCode: formVal.cusCode || "", amtCode: formVal.amtCode || "", pisplCode: formVal.pisplCode || "",
      instagram: formVal.instagram || "", crLimit: formVal.crLimit || "", payTerms: formVal.payTerms || "",
      payMode: formVal.payMode || "0", currency: formVal.currency || "0", advStat: formVal.advStat || "0",
      gstStat: !!formVal.gstStat, gstNo: formVal.gstStat ? (formVal.gstNo || "") : "",
      panNo: formVal.panNo || "", msmeNo: formVal.msmeNo || "", drRegNo: formVal.drRegNo || "",
      dlNA: !!formVal.dlNA,
      dl1: formVal.dlNA ? "" : (formVal.dl1 || ""), dl1From: formVal.dlNA ? "" : (formVal.dl1From || ""), dl1To: formVal.dlNA ? "" : (formVal.dl1To || ""),
      dl2: formVal.dlNA ? "" : (formVal.dl2 || ""), dl2From: formVal.dlNA ? "" : (formVal.dl2From || ""), dl2To: formVal.dlNA ? "" : (formVal.dl2To || ""),
      retNA: !!formVal.retNA,
      retLic1: formVal.retNA ? "" : (formVal.retLic1 || ""), retLic1From: formVal.retNA ? "" : (formVal.retLic1From || ""), retLic1To: formVal.retNA ? "" : (formVal.retLic1To || ""),
      retLic2: formVal.retNA ? "" : (formVal.retLic2 || ""), retLic2From: formVal.retNA ? "" : (formVal.retLic2From || ""), retLic2To: formVal.retNA ? "" : (formVal.retLic2To || ""),
    };

    const fileSnap = (v) => (typeof v === "string" ? v : (v ? "new:" + v.name : ""));
    const c = (clinicsVal || []).map((cl) => ({
      repIncharge: cl.repIncharge || "0", repInchargePOS: cl.repInchargePOS || "0",
      beat: cl.beat || "", clinicName: cl.clinicName || "", contactName: cl.contactName || "",
      contactNo: cl.contactNo || "", contactNo2: cl.contactNo2 || "",
      hospitalAttached: cl.hospitalAttached || "0", pharmacyAttached: cl.pharmacyAttached || "0",
      meetingDays: [...(cl.meetingDays || [])].sort(), meetingTime: cl.meetingTime || "",
      address: cl.address || "", city: cl.city || "", cityId: String(cl.cityId || "0"), zipCode: String(cl.zipCode || ""),
      shipStat: !!cl.shipStat, shipAddress: cl.shipAddress || "", shipCity: cl.shipCity || "",
      shipCityId: String(cl.shipCityId || "0"), shipPincode: String(cl.shipPincode || ""),
      stkId: cl.stkId || "0", phChain: cl.phChain || "",
      clinicPhoto: fileSnap(cl.clinicPhoto), letterHead: fileSnap(cl.letterHead), gstBoard: fileSnap(cl.gstBoard),
    }));

    const b = (brandDataVal || [])
      .map((br) => ({ subCatId: br.subCatId, focus: br.focus || 0, reminder: br.reminder || 0 }))
      .sort((x, y) => String(x.subCatId).localeCompare(String(y.subCatId)));

    const comp = (competitorRowsVal || [])
      .filter(rowHasData)
      .map((r) => ({
        subcat_id: r.subcat_id, pid: r.pid, prod_qty: r.prod_qty || 0,
        comp_id_1: r.comp_id_1 || "0", comp_id_1_qty: r.comp_id_1_qty || 0,
        comp_id_2: r.comp_id_2 || "0", comp_id_2_qty: r.comp_id_2_qty || 0,
        comp_id_3: r.comp_id_3 || "0", comp_id_3_qty: r.comp_id_3_qty || 0,
        other_name: r.other_name || "", oth_qty: r.oth_qty || 0,
      }))
      .sort((x, y) => String(x.pid).localeCompare(String(y.pid)) || String(x.subcat_id).localeCompare(String(y.subcat_id)));

    const presc = (prescribedVal || []).filter((p) => p.prescribed === 1).map((p) => String(p.subCatId)).sort();
    return JSON.stringify({ f, c, b, comp, presc });
  };

  const isUpdateDisabled = () => {
    if (originalSnapshot === null) return false;
    return buildComparableSnapshot(form, clinics, brandData, competitorRows, brandsPrescribed) === originalSnapshot;
  };

  const validateForm = () => {
    const errs = {};
    const toasts = [];

    const lat = Number(form.customerLatitude);
    const lng = Number(form.customerLongitude);
    if (!form.customerLatitude || !form.customerLongitude || !lat || !lng) {
      errs.location = "Please Add Location By Clicking Location Icon!!";
    }

    Object.keys(REGISTRY).forEach((label) => {
      if (!isVisible(label)) return;
      const f = REGISTRY[label];
      const c = fieldConfig[label];
      if (!c.required || f.type === "component") return;
      if (f.reqWhen && !f.reqWhen(form)) return;
      if ((f.naKey && form[f.naKey]) || (f.na && form[f.na])) return;

      const repeats = f.scope === "clinic" && (
        f.type === "file" ||
        c.headerId === CONTACT_HEADER_ID ||
        PLAIN_HEADERS.includes(c.headerId)
      );
      const rows = repeats ? clinics.map((_, i) => i) : [0];
      rows.forEach((i) => {
        const chk = f.chk || f.key;
        const v = f.scope === "clinic" && !(f.idx0form && i === 0) ? clinics[i]?.[chk] : form[chk];
        if (isEmptyVal(f, v)) errs[errKey(f, i)] = `The ${labelOf(label)}  is required`;
      });
    });

    if (isVisible("Mobile")) {
      if (form.sendSms === "1" && !(form.mobile || "").trim()) errs.mobile = "Mobile No is required";
      else if ((form.mobile || "").trim() && !validateMobile(form.mobile)) errs.mobile = "Please enter valid Mobile No";
    }
    if (isVisible("Email")) {
      if (form.sendEmail === "1" && !(form.email || "").trim()) errs.email = "Email is required";
      else if ((form.email || "").trim() && !validateEmail(form.email)) errs.email = "Please enter valid Email address";
    }
    if (isVisible("Contact No")) {
      clinics.forEach((cl, i) => {
        const no = cl.contactNo || "";
        if (no && no.length !== 10) errs[`contactNo_${i}`] = "Please enter valid 10-digit Contact No";
      });
    }

    const ownerField = form.cusType === "2" ? "repInchargePOS" : "repIncharge";
    clinics.forEach((cl, i) => {
      if (!cl[ownerField] || cl[ownerField] === "0") {
        errs[`owner_${i}`] = form.cusType === "2" ? "Account Owner is Required" : "Rep Incharge is Required";
      }
    });
    const ids = clinics.map((cl) => cl[ownerField]).filter((v) => v && v !== "0");
    if (ids.length !== new Set(ids).size) {
      toasts.push(
        form.cusType === "2"
          ? "Account Owner (KAM) in multiple Contact Info can't be same.. Please compare Contact Info details!"
          : "Rep Incharge in multiple Contact Info can't be same.. Please compare Contact Info details!"
      );
    }

    const errHeaders = {};
    Object.keys(REGISTRY).forEach((label) => {
      if (!isVisible(label)) return;
      const f = REGISTRY[label];
      if (f.type === "component") return;
      const idxs = f.scope === "clinic" ? clinics.map((_, i) => i) : [0];
      if (idxs.some((i) => errs[errKey(f, i)])) errHeaders[fieldConfig[label].headerId] = true;
    });
    setOpenSections((prev) => ({ ...prev, ...errHeaders }));

    setFieldErrors(errs);
    if (errs.mobile) setForm((f) => ({ ...f, sendSms: "0" }));
    if (errs.email) setForm((f) => ({ ...f, sendEmail: "0" }));

    const hasError = Object.values(errs).some(Boolean) || toasts.length > 0;
    console.log("has Error in Account creation",hasError,errs)
    if (hasError) showAlert.error(toasts[0] || "Please fix all mandatory fields");
    return !hasError;
  };

  const buildDoctorDetails = (onlyChanged = false) => {
    const filteredClinics = clinics.filter((c) =>
      form.cusType === "1"
        ? c.repIncharge && c.repIncharge !== "0"
        : c.repInchargePOS && c.repInchargePOS !== "0"
    );

    const origMap = new Map((originalClinics || []).map((o) => [String(o.clinicId), o]));
    const withForm = (c) =>
      clinics[0] === c
        ? { ...c, potentiality: form.potentiality, loyalty: form.loyalty, frequency: form.frequency }
        : c;
    const sentClinics =
      onlyChanged && originalClinics?.length
        ? filteredClinics.filter((c) => {
            const o = origMap.get(String(c.clinicId));
            if (!c.clinicId || !o) return true;
            return clinicSig(withForm(c)) !== clinicSig(o);
          })
        : filteredClinics;

    const brandSubCatID = brandData.map((b) => b.subCatId);
    const brandFocus = brandData.map((b) => Number(b.focus) || 0);
    const brandRemainder = brandData.map((b) => Number(b.reminder) || 0);
    const prescribedBrands = brandsPrescribed.filter((b) => b.prescribed === 1).map((b) => b.subCatId);

    const norm = (v) => String(v ?? "").trim().toLowerCase();

    const customerClinic = sentClinics.map((c) => {
      const i = clinics.indexOf(c);
      const sameAsBilling =
        !!c.shipStat ||
        (norm(c.shipAddress) !== "" &&
          norm(c.shipAddress) === norm(c.address) &&
          norm(c.shipCityId) === norm(c.cityId) &&
          norm(c.shipPincode) === norm(c.zipCode));

      return {
        customeClinicId: c.clinicId || 0,
        customeClinicName: c.clinicName || "",
        customeClinicAddress: c.address || "",
        customeClinicCity: c.city || "",
        customeClinicCityId: c.cityId || 0,
        customeClinicZipCode: c.zipCode || 0,
        customeClinicContactName: c.contactName || "",
        customeClinicContactNo: c.contactNo || "",
        customeClinicHospitalAttched: c.hospitalAttached || "0",
        customeClinicPharmacyAttached: c.pharmacyAttached || "0",
        customerClinicMeetingDays: c.meetingDays || [],
        customeClinicTime: c.meetingTime || "",
        customerClinicRepIncharge: form.cusType === "1" ? (c.repIncharge || "0") : (c.repInchargePOS || "0"),
        customerClinicBeat: c.beat || "0",
        customeStkId: c.stkId || "0",
        phChain: c.phChain || "0",
        contact_no1: c.contactNo2 || "",
        ship_stat: sameAsBilling ? 1 : 0,
        ship_address: sameAsBilling ? (c.address || "") : (c.shipAddress || ""),
        ship_city: sameAsBilling ? (c.city || "") : (c.shipCity || ""),
        ship_city_id: sameAsBilling ? (c.cityId || 0) : (c.shipCityId || 0),
        ship_pincode: sameAsBilling ? (c.zipCode || "") : (c.shipPincode || ""),
        customerPotentiality: (i === 0 ? form.potentiality : c.potentiality) || "0",
        customeLoyalty: (i === 0 ? form.loyalty : c.loyalty) || "4",
        customerFrequency: (i === 0 ? form.frequency : c.frequency) || "0",
        clinic_photo: typeof c.clinicPhoto === "string" ? c.clinicPhoto : "",
        clinic_photo_removed: c.clinicPhoto === null ? 1 : 0,
        letter_head_photo: typeof c.letterHead === "string" ? c.letterHead : "",
        letter_head_photo_removed: c.letterHead === null ? 1 : 0,
        gst_board: typeof c.gstBoard === "string" ? c.gstBoard : "",
        gst_board_removed: c.gstBoard === null ? 1 : 0,
      };
    });

    const full_name = form.lastName && form.lastName.trim()
      ? `${(form.firstName || "").trim()} ${form.lastName.trim()}`
      : (form.firstName || "").trim();

    return {
      cusType: form.cusType || "2",
      customerRetType: form.retailerType || "1",
      customerPractiseType: form.practiseType || "0",
      pharmaType: form.pharmaType || "0",
      reg_id: form.region || "0",
      customeFirstName: form.firstName || "",
      customeLastName: form.lastName || "",
      full_name,
      customeTitleQualification: form.titleQualification || "",
      customerGender: form.gender || "1",
      customerAgeGroup: form.agegroup || "1",
      customerMobile: form.mobile || "",
      customerSendSms: form.sendSms || "0",
      customerEmail: form.email || "",
      customerSendEmail: form.sendEmail || "0",
      customerPotentiality: form.potentiality || "0",
      customerFrequency: form.frequency || "0",
      customeLoyalty: form.loyalty || "4",
      customeLoyaltyType: form.loyaltyType || "1",
      customerKOL: form.keyOpinionLeader || "0",
      adoption: form.adoption || "1",
      customeCompetitorPref: form.competitorPref || "",
      customeMarketingTools: Array.isArray(form.marketingTools) ? form.marketingTools : [],
      customeSocialType: form.socialType || "0",
      customeCommonDisease: Array.isArray(form.commondisease) ? form.commondisease : [],
      customeCampaign: form.campaign || "0",
      hobbies: form.hobbies || "",
      customeRemarks: form.remarks || "",
      customerDOB: form.dob || "",
      dob_stat: form.dobNA ? 1 : 0,
      customerAniversaryDate: form.anniversary || "",
      wedding_stat: form.anniversaryNA ? 1 : 0,
      phChain: clinics[0]?.phChain || "0",
      cus_code: form.cusCode || "",
      amt_cus_code: form.amtCode || "",
      pispl_cus_code: form.pisplCode || "",
      instagram_id: form.instagram || "",
      cr_limit: form.crLimit || "",
      pay_terms: form.payTerms || "",
      pay_mode_id: form.payMode || "0",
      currency_id: form.currency || "0",
      adv_stat: form.advStat || "0",
      gst_stat: form.gstStat ? 1 : 0,
      gst_no: form.gstStat ? (form.gstNo || "") : "",
      pan_no: form.panNo || "",
      msme_reg_no: form.msmeNo || "",
      dr_reg_no: form.drRegNo || "",
      dl_stat: form.dlNA ? 1 : 0,
      dl_no_1: form.dlNA ? "" : (form.dl1 || ""),
      dl_no_1_valid_from: form.dlNA ? "" : (form.dl1From || ""),
      dl_no_1_valid_to: form.dlNA ? "" : (form.dl1To || ""),
      dl_no_2: form.dlNA ? "" : (form.dl2 || ""),
      dl_no_2_valid_from: form.dlNA ? "" : (form.dl2From || ""),
      dl_no_2_valid_to: form.dlNA ? "" : (form.dl2To || ""),
      ret_lic_stat: form.retNA ? 1 : 0,
      ret_lic_1_no: form.retNA ? "" : (form.retLic1 || ""),
      ret_lic_1_valid_from: form.retNA ? "" : (form.retLic1From || ""),
      ret_lic_1_valid_to: form.retNA ? "" : (form.retLic1To || ""),
      ret_lic_2_no: form.retNA ? "" : (form.retLic2 || ""),
      ret_lic_2_valid_from: form.retNA ? "" : (form.retLic2From || ""),
      ret_lic_2_valid_to: form.retNA ? "" : (form.retLic2To || ""),
      customerLatitude: form.customerLatitude || 0,
      customerLongitude: form.customerLongitude || 0,
      brandSubCatID, brandFocus, brandRemainder, competitorBrands, prescribedBrands,
      competitor_subcat_id: competitorRows.map((r) => r.subcat_id || 0),
      competitor_prod_id: competitorRows.map((r) => r.pid || 0),
      competitor_prod_qty: competitorRows.map((r) => r.prod_qty || 0),
      competitor_comp_id1: competitorRows.map((r) => r.comp_id_1 || 0),
      competitor_comp_qty1: competitorRows.map((r) => r.comp_id_1_qty || 0),
      competitor_comp_id2: competitorRows.map((r) => r.comp_id_2 || 0),
      competitor_comp_qty2: competitorRows.map((r) => r.comp_id_2_qty || 0),
      competitor_comp_id3: competitorRows.map((r) => r.comp_id_3 || 0),
      competitor_comp_qty3: competitorRows.map((r) => r.comp_id_3_qty || 0),
      competitor_oth: competitorRows.map((r) => r.other_name || ""),
      competitor_othqty: competitorRows.map((r) => r.oth_qty || 0),
      customerClinic,
      _filteredClinics: sentClinics,
    };
  };

  const buildRequest = (details) => {
    const { _filteredClinics, ...doctorDetails } = details;
    const hasNewFile = _filteredClinics.some((c) => FILE_UPLOADS.some(({ key }) => isFile(c[key])));
    if (!hasNewFile) return { body: { doctorDetails }, config: undefined };

    const fd = new FormData();
    fd.append("doctorDetails", JSON.stringify(doctorDetails));
    _filteredClinics.forEach((c, i) => {
      FILE_UPLOADS.forEach(({ key, field }) => {
        if (isFile(c[key])) fd.append(`${field}_${i}`, c[key], c[key].name);
      });
    });
    return { body: fd, config: { headers: { "Content-Type": "multipart/form-data" } } };
  };

  const handleSubmit = async () => {
    try {
      const details = buildDoctorDetails();
      details.type_flag = 1;
      const { body, config } = buildRequest(details);
      const res = await api.post("/doctorSubmit", body, config);
      if (res.data.status === 200) {
        showAlert.success("Request to Add new, Generated successfully!!");
        setTimeout(() => window.location.reload(), 500);
      } else {
        showAlert.error(res.data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      showAlert.error("An error occurred during submission.");
    }
  };

  const handleUpdate = async (cusId, tempId = 0) => {
    try {
      const details = buildDoctorDetails(true);
      details.type_flag = 2;
      details.cus_id = cusId || 0;
      details.temp_id = tempId || 0;
      const { body, config } = buildRequest(details);
      const res = await api.post("/doctorUpdate", body, config);
      if (res.data.status === 200) {
        showAlert.success("Update Request Generated successfully!!");
        setTimeout(() => window.location.reload(), 500);
      } else {
        showAlert.error(res.data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error("Update error:", err);
      showAlert.error(err?.response?.data?.message || err.message || "An error occurred during update.");
    }
  };

  const onAddClick = () => {
    if (!validateForm()) return;
    setConfirm({
      open: true, title: "Confirmation", message: "Are you sure you want to submit this request?",
      confirmText: "OK", cancelText: "Cancel", confirmColor: "primary",
      onConfirm: async () => {
        closeConfirm();
        if (submitting) return;
        setSubmitting(true);
        try { await handleSubmit(); } finally { setSubmitting(false); }
      },
    });
  };

  const onUpdateClick = () => {
    if (!validateForm()) return;
    setConfirm({
      open: true, title: "Confirmation", message: "Are you sure you want to update this request?",
      confirmText: "OK", cancelText: "Cancel", confirmColor: "primary",
      onConfirm: async () => {
        closeConfirm();
        if (submitting) return;
        setSubmitting(true);
        try { await handleUpdate(decodedID); } finally { setSubmitting(false); }
      },
    });
  };

  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setForm((f) => ({ ...f, mobile: val, sendSms: "0" }));
    clearErr("mobile");
  };
  const handleSendSmsChange = (e) => {
    const val = e.target.value;
    if (val === "1" && !form.mobile) {
      showAlert.error("Mobile No is required to enable this feature..!");
      setForm((f) => ({ ...f, sendSms: "0" }));
      return;
    }
    setForm((f) => ({ ...f, sendSms: val }));
  };
  const handleEmailChange = (e) => {
    const onlyText = e.target.value.replace(/^\s+/, "");
    setForm((f) => ({ ...f, email: onlyText, sendEmail: "0" }));
    clearErr("email");
  };
  const handleSendEmailChange = (e) => {
    const val = e.target.value;
    if (val === "1" && !form.email) {
      showAlert.error("Email address is required to enable this feature..!");
      setForm((f) => ({ ...f, sendEmail: "0" }));
      return;
    }
    setForm((f) => ({ ...f, sendEmail: val }));
  };

  const loadIfNeeded = async ({ key, state, setter, apiCall, valueKey = "id" }) => {
    try {
      if (!fieldConfig[key]?.show) return;
      if (state.length > 0) return;
      const res = await api.post(apiCall);
      setter((res.data.data || []).map((i) => ({ ...i, [valueKey]: String(i[valueKey]) })));
    } catch (err) { console.error(key, err); }
  };

  useEffect(() => { loadDropdowns(); }, []);

  useEffect(() => {
    const token = localStorage.getItem("session-token");
    if (token) {
      try { setUserType(jwtDecode(token).user_type || null); } catch (err) { console.log(err); }
    }
  }, []);

  useEffect(() => {
    if (frequencyOptions.length > 0 && (!form.frequency || form.frequency === "") && isCreateMode) {
      setForm((prev) => ({ ...prev, frequency: String(frequencyOptions[0].no_freq_visit) }));
    }
  }, [frequencyOptions, form.cusType]);

  useEffect(() => {
    if (potentialityOptions.length > 0 && (!form.loyalty || form.loyalty === "") && isCreateMode) {
      const defaultLoyalty = form.cusType === "2" ? "4" : String(potentialityOptions[0].id);
      setForm((prev) => ({ ...prev, loyalty: defaultLoyalty }));
    }
  }, [potentialityOptions, form.cusType]);

  useEffect(() => {
    if (potentialityOptions.length > 0 && (!form.potentiality || form.potentiality === "") && isCreateMode) {
      setForm((prev) => ({ ...prev, potentiality: String(potentialityOptions[0].id) }));
    }
  }, [potentialityOptions, form.cusType]);

  useEffect(() => {
    if (currencyOptions.length === 1 && (!form.currency || form.currency === "0") && isCreateMode) {
      setForm((prev) => ({ ...prev, currency: String(currencyOptions[0].id) }));
    }
  }, [currencyOptions]);

  useEffect(() => {
    if (retailTypeOptions.length > 0 && isCreateMode) {
      setForm((prev) => ({ ...prev, retailerType: String(retailTypeOptions[0].id) }));
      clearErr("retailerType");
    }
  }, [retailTypeOptions, form.cusType]);

  const loadDropdowns = async () => {
    try {
      const res = await api.post("/cusTypeMas");
      setDropdowns({ cusTypeMas: (res.data.data || []).map((i) => ({ ...i, id: String(i.id) })) });
      loadDynamicForm("2");
      loadStaticDropdowns();
    } catch (err) { console.error(err); }
  };

  const loadStaticDropdowns = async () => {
    try {
      const [hospRes, pharRes] = await Promise.all([api.post("/getCusData"), api.post("/getPharmaData")]);
      setHospitalOptions((hospRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
      setPharmacyOptions((pharRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
    } catch (err) { console.error(err); }
  };

  const loadDynamicForm = async (customerAccType) => {
    try {
      const res = await api.post("/getCusFormMas", { customerAccType });
      const config = {};
      (res.data.data || []).forEach((item) => {
        const name = String(item.label_name).trim();
        const entry = {
          label: String(item.alias_label_name || "").trim(),
          show: Number(item.label_stat) === 0,
          required: Number(item.mandatory_stat) === 1,
          headerId: Number(item.header_id) || 0,
          headerName: String(item.header_name || "").trim(),
          ord: Number(item.ord_id) || 0,
        };
        config[name] = entry;
        if (ALT_LABELS[name] && !config[ALT_LABELS[name]]) config[ALT_LABELS[name]] = entry;
      });
      console.log("config which is passes",config)
      setFieldConfig(config);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadDynamicForm(form.cusType);
    fetchAccountOwner();
    fetchRepIncharge();
  }, []);

  const handleAccTypeChange = (val) => {
    setForm((f) => ({
      ...f, cusType: val,
      gender: "1", agegroup: "1", pharmaType: 1, practiceType: "",
      potentiality: "1", loyalty: "", loyaltyType: "", frequency: "",
      retailerType: "1", dobNA: true, anniversaryNA: true,
    }));
    clearErr("cusType");
    setGenderOptions([]); setAgeOptions([]);
    setPharmaOptions([]);
    setPotentialityOptions([]);
    setRepInchargeOptions([]); setRepPOSOptions([]);
    setClinics([{ ...DEFAULT_CLINIC }]);
    loadDynamicForm(val);
    fetchAccountOwner();
    fetchRepIncharge();
  };

  useEffect(() => {
    (async () => {
      try {
        const endpoint = isTemp ? "/getBrandsTemp" : "/getBrands";
        const param = isTemp ? { tempId: decodedID } : { doctorId: decodedID > 0 ? decodedID : 0 };
        const brandsRes = await api.post(endpoint, param);
        setBrandData((brandsRes.data.data || []).map((b) => ({
          subCatId: String(b.id), name: b.sub_name,
          focus: b.foc ? 1 : 0, reminder: b.rem ? 1 : 0, competition: 0, compCount: 0,
        })));
      } catch (err) { console.error("fetchBrandData error", err); }
    })();
  }, [decodedID, isTemp]);

  useEffect(() => {
    (async () => {
      try {
        const result = await api.post("/getCompmodal1", {
          doctorId: !isTemp && decodedID > 0 ? decodedID : 0,
          tempId: isTemp ? decodedID : 0,
        });
        setBrandsPrescribed((result.data.compmas || []).map((c) => ({
          subCatId: String(c.id), name: c.comp_name, prescribed: c.doc_comp_id ? 1 : 0,
        })));
      } catch (err) { console.error("compBrandData error", err); }
    })();
  }, [decodedID, isTemp]);

  const handleRegionChange = async (val) => {
    setForm((f) => ({ ...f, region: val }));
    clearErr("region");

    setClinics((prev) => prev.map((c) => ({
      ...c, repIncharge: "0", repInchargePOS: "0", beat: "", beatOptions: [], stkId: "0",
    })));
    setRepInchargeOptions([]); setRepPOSOptions([]); setDistributorOptions([]);

    try {
      const [repRes, , distRes] = await Promise.all([
        api.post("/getRepUser", { regId: val, requestType: form.cusType }),
        api.post("/getRepUser", { regId: val }),
        api.post("/getDistributor", { regId: val }),
      ]);
      setRepInchargeOptions((repRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
      setRepPOSOptions((repRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
      setDistributorOptions((distRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
    } catch (err) { console.error(err); }
  };

  // Re-runs when the field config OR the account type changes, so options
  // (e.g. Chain Name) are loaded even if the first config hid the field.
  useEffect(() => {
    loadIfNeeded({ key: "Type", state: retailTypeOptions, setter: setRetailTypeOptions, apiCall: "/getRetailtype" });
    loadIfNeeded({ key: "Retailer Type", state: pharmaOptions, setter: setPharmaOptions, apiCall: "/getPharmaType" });
    loadIfNeeded({ key: "Practice Type/Speciality", state: practiseType, setter: setpractiseType, apiCall: "/practiceType" });
    loadIfNeeded({ key: "Marketing Tools", state: marketingOptions, setter: setMarketingOptions, apiCall: "/getMarketingTool" });
    loadIfNeeded({ key: "Gender", state: genderOptions, setter: setGenderOptions, apiCall: "/genderMas" });
    loadIfNeeded({
      key: "Region", state: regionOptions,
      setter: (data) => setRegionOptions([{ ...ALL_REGION_OPTION }, ...data]), apiCall: "/getRegionMas",
    });
    loadIfNeeded({ key: "Chain Name", state: phChainDataOption, setter: setPhChainDataOption, apiCall: "/chainData" });
    loadIfNeeded({ key: "Age Group", state: ageOptions, setter: setAgeOptions, apiCall: "/agegroupmas" });
    loadIfNeeded({ key: "Potentiality Class", state: potentialityOptions, setter: setPotentialityOptions, apiCall: "/getPotentiality" });
    loadIfNeeded({ key: "Loyalty Type", state: loyaltyTypeOptions, setter: setLoyaltyTypeOptions, apiCall: "/getLoyaltyType" });
    loadIfNeeded({ key: "Adoption/Current Zone", state: adoptionOptions, setter: setAdoptionOptions, apiCall: "/getAdoption" });
    loadIfNeeded({ key: "Visit Frequency/Year", state: frequencyOptions, setter: setFrequencyOptions, apiCall: "/getCustomerFreq" });
    loadIfNeeded({ key: "Social Type", state: socialtypeOption, setter: setSocialtypeOption, apiCall: "/getSocialType" });
    loadIfNeeded({ key: "Common Diseases Encountered", state: commonDiseaseOption, setter: setCommonDiseaseOption, apiCall: "/getDiseaseType" });
    loadIfNeeded({ key: "Campaign", state: campaignoption, setter: setCampaignOption, apiCall: "/getCampaign" });
    loadIfNeeded({ key: "Customer-Payment Method", state: payModeOptions, setter: setPayModeOptions, apiCall: "/getPayMode" });
    loadIfNeeded({ key: "Currency", state: currencyOptions, setter: setCurrencyOptions, apiCall: "/getCurrency" });
    loadIfNeeded({
      key: fieldConfig["City"]?.show ? "City" : "Shipping City",
      state: cityOptions, setter: setCityOptions, apiCall: "/cityData",
    });
  }, [fieldConfig, form.cusType]);

  useEffect(() => {
    if (!editDataLoading && !decodedID && practiseType.length > 0 && !form.practiseType) {
      setForm((prev) => ({ ...prev, practiseType: String(practiseType[0].id) }));
    }
  }, [practiseType, editDataLoading, decodedID, form.practiseType]);

  useEffect(() => {
    if (adoptionOptions.length > 0 && (!form.adoption || form.adoption === "") && isCreateMode) {
      setForm((prev) => ({ ...prev, adoption: String(adoptionOptions[0].id) }));
    }
  }, [adoptionOptions]);

  useEffect(() => {
    if (loyaltyTypeOptions.length > 0 && (!form.loyaltyType || form.loyaltyType === "") && isCreateMode) {
      setForm((prev) => ({ ...prev, loyaltyType: String(loyaltyTypeOptions[0].id) }));
    }
  }, [loyaltyTypeOptions, form.cusType]);

  const handleRepChange = async (idx, repId, isPos = false) => {
    const repField = isPos ? "repInchargePOS" : "repIncharge";

    if (repId && repId !== "0") {
      const dupIdx = clinics.findIndex((c, i) => i !== idx && String(c[repField]) === String(repId));
      if (dupIdx !== -1) {
        showAlert.error(
          `${isPos ? "Account Owner (KAM)" : "Rep Incharge"} is already selected in Contact Info ${dupIdx + 1}. Please select a different one!`
        );
        return;
      }
    }

    setFieldErrors((prev) => ({ ...prev, [`owner_${idx}`]: "", [`stkId_${idx}`]: "", [`beat_${idx}`]: "" }));
    setClinics((prev) => prev.map((c, i) => (i !== idx ? c : {
      ...c, [repField]: repId, stkId: "0", beat: "", beatOptions: [],
    })));
    setPharmacyOptions([]);

    if (!repId || repId === "0") return;

    try {
      const beatRes = await api.post("/getClinicBeat", { repInchargeId: repId });
      const d = beatRes.data.data || {};
      const mapIds = (arr) => (Array.isArray(arr) ? arr : []).map((i) => ({ ...i, id: String(i.id) }));
      setPharmacyOptions(mapIds(d.pharmacies));
      setClinics((prev) => prev.map((c, i) => (i === idx ? { ...c, beatOptions: mapIds(d.beats), beat: "" } : c)));
    } catch (err) { console.error(err); }
  };

  const fetchAccountOwner = async () => {
    try {
      const response = await api.post("/getRepUser", { regId: 0 });
      setRepPOSOptions(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) { console.log("fetch account owner error", err); }
  };

  const fetchRepIncharge = async () => {
    try {
      const response = await api.post("/getRepUser", { regId: 0, requestType: form.cusType });
      setRepInchargeOptions(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) { console.log("fetch rep incharge error", err); }
  };

  const updateClinic = (idx, field, value) =>
    setClinics((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));

  const BILLING_TO_SHIP = { address: "shipAddress", city: "shipCity", cityId: "shipCityId", zipCode: "shipPincode" };
  const updateBilling = (idx, key, val) => {
    updateClinic(idx, key, val);
    if (clinics[idx]?.shipStat) updateClinic(idx, BILLING_TO_SHIP[key], val);
  };

  const handleSameAsBilling = (idx, checked) => {
    const c = clinics[idx] || {};
    updateClinic(idx, "shipStat", checked);
    if (checked) {
      updateClinic(idx, "shipAddress", c.address || "");
      updateClinic(idx, "shipCity", c.city || "");
      updateClinic(idx, "shipCityId", String(c.cityId || "0"));
      updateClinic(idx, "shipPincode", String(c.zipCode || ""));
      ["shipAddress", "shipCity", "shipPincode"].forEach((k) => clearErr(`${k}`));
    }
  };

  const addClinic = () => {
    setClinics((prev) => {
      if (prev.length >= maxClinics) return prev;
      return [...prev, { ...DEFAULT_CLINIC, _key: `${Date.now()}-${prev.length}` }];
    });
  };

  const toggleMeetingDay = (idx, dayValue) =>
    setClinics((prev) => prev.map((c, i) => {
      if (i !== idx) return c;
      const days = c.meetingDays.includes(dayValue)
        ? c.meetingDays.filter((d) => d !== dayValue)
        : [...c.meetingDays, dayValue];
      return { ...c, meetingDays: days };
    }));

  const handleOpenMap = () => {
    setSelectedLocation({ latitude: form.customerLatitude || "0", longitude: form.customerLongitude || "0" });
    setMapDialogOpen(true);
  };

  const handleConfirmTagging = () => {
    const lat = parseFloat(selectedLocation.latitude);
    const lng = parseFloat(selectedLocation.longitude);
    if (!lat || !lng) {
      showAlert.error("Please select a location on the map to continue!");
      return;
    }
    setLocationTagged(true);
    setMapDialogOpen(false);
    setForm((f) => ({ ...f, customerLatitude: String(lat), customerLongitude: String(lng) }));
    clearErr("location");
  };

  const checkPendingRequest = async () => {
    try {
      const pendingRes = await api.post("/getPendingRequest", {
        cus_id: decodedID, req_type: decodedReqType, req_user: decodedReq,
      });
      const pendingData = pendingRes.data.data;
      setPendingRequest(pendingData && pendingData.length > 0 ? pendingData[0] : null);
    } catch (err) {
      console.error("pending request check failed", err);
      setPendingRequest(null);
    }
  };

  const getPendingRequestName = (requestType) => {
    if (requestType === 2) return "Update";
    if (requestType === 3) return "Delete";
    return "";
  };


  useEffect(() => {
    setForm({ ...INITIAL_FORM });
    setClinics([{ ...DEFAULT_CLINIC }]);
    setBrandData([]);
    setCompetitorRows([]);
    setOriginalSnapshot(null);
    setOriginalClinics(null);
    setLocationTagged(false);
    setSelectedLocation({ latitude: "0", longitude: "0" });
    setDelFlag(0);
    setPendingRequest(null);
    setFieldErrors({});
    setRepInchargeOptions([]); setRepPOSOptions([]); setDistributorOptions([]);

    if (!decodedID || decodedID === "0") {
      setEditDataLoading(false);
      loadDynamicForm("2");
      fetchAccountOwner();
      fetchRepIncharge();
      api.post("/generatefirstcode")
        .then((r) => setForm((prev) => ({ ...prev, cusCode: r.data?.data?.cus_code || "" })))
        .catch((err) => console.error("generatefirstcode error", err));
      return;
    }

    setEditDataLoading(true);
    const getEditData = async () => {
      try {
        const primaryEndpoint = isTemp ? "/getDoctorsDatatemp" : "/getDoctorsData";
        const res = await api.post(primaryEndpoint, { id: decodedID });
        const d = res.data.data[0];
        if (!d) return;

        await loadDynamicForm(String(d.cus_type_id));

        if (regionOptions.length === 0) {
          const regRes = await api.post("/getRegionMas");
          setRegionOptions([{ ...ALL_REGION_OPTION }, ...(regRes.data.data || []).map((i) => ({ ...i, id: String(i.id) }))]);
        }

        const loadedForm = {
          cusType: String(d.cus_type_id || "2"),
          retailerType: String(d.retail_type || "1"),
          pharmaType: String(d.pharmacy_type_id || 1),
          practiseType: String(d.practice_id || "0"),
          gender: String(d.gender || "1"),
          firstName: d.first_name || "",
          lastName: d.last_name || "",
          titleQualification: d.qualification || "",
          mobile: d.mobile || "",
          sendSms: String(d.mobile_stat || "0"),
          email: d.email || "",
          sendEmail: String(d.email_stat || "0"),
          potentiality: String(d.p_class_id || "1"),
          loyalty: String(d.l_class_id || ""),
          loyaltyType: String(d.loyality_id || ""),
          frequency: String(d.cus_visit_freq || ""),
          keyOpinionLeader: d.kol_stat !== null && d.kol_stat !== undefined ? String(d.kol_stat) : "0",
          adoption: String(d.current_zone_id || "0"),
          marketingTools: d.tool_id ? String(d.tool_id).split(",").filter((x) => x && x !== "0") : [],
          region: String(d.reg_id || "0"),
          competitorPref: d.comp_pref || "",
          socialType: String(d.social_id || "0"),
          campaign: String(d.campaign_id || "0"),
          commondisease: d.disease_id ? String(d.disease_id).split(",").filter((x) => x && x !== "0") : [],
          hobbies: d.hob_intersest || "",
          remarks: d.remark || "",
          agegroup: String(d.age_grp_id || "1"),
          dob: d.dob_stat === 1 ? "" : (d.dob?.split("T")[0] || ""),
          dobNA: d.dob_stat === 1,
          anniversary: d.wedding_stat === 1 ? "" : (d.wedding_dt?.split("T")[0] || ""),
          anniversaryNA: d.wedding_stat === 1,
          customerLatitude: "0",
          customerLongitude: "0",
          cusCode: d.cus_code || "",
          amtCode: d.amt_cus_code || "",
          pisplCode: d.pispl_cus_code || "",
          instagram: d.instagram_id || "",
          crLimit: d.cr_limit !== null && d.cr_limit !== undefined && d.cr_limit !== "" ? Number(d.cr_limit).toFixed(2) : "",
          payTerms: d.pay_terms !== null && d.pay_terms !== undefined ? String(d.pay_terms) : "",
          payMode: String(d.pay_mode_id || "0"),
          currency: String(d.currency_id || "0"),
          advStat: String(d.adv_stat || "0"),
          gstStat: Number(d.gst_stat) === 1,
          gstNo: d.gst_no || "",
          panNo: d.pan_no || "",
          msmeNo: d.msme_reg_no || "",
          drRegNo: d.dr_reg_no || "",
          dlNA: d.dl_stat === 1,
          dl1: d.dl_no_1 || "",
          dl1From: d.dl_no_1_valid_from?.split("T")[0] || "",
          dl1To: d.dl_no_1_valid_to?.split("T")[0] || "",
          dl2: d.dl_no_2 || "",
          dl2From: d.dl_no_2_valid_from?.split("T")[0] || "",
          dl2To: d.dl_no_2_valid_to?.split("T")[0] || "",
          retNA: d.ret_lic_stat === 1,
          retLic1: d.ret_lic_1_no || "",
          retLic1From: d.ret_lic_1_valid_from?.split("T")[0] || "",
          retLic1To: d.ret_lic_1_valid_to?.split("T")[0] || "",
          retLic2: d.ret_lic_2_no || "",
          retLic2From: d.ret_lic_2_valid_from?.split("T")[0] || "",
          retLic2To: d.ret_lic_2_valid_to?.split("T")[0] || "",
        };
        setForm(loadedForm);
        setDelFlag(d.del_flag ?? 0);
        await checkPendingRequest();

        let loadedPrescribed = [];
        try {
          const prescRes = await api.post("/getCompmodal1", {
            doctorId: !isTemp && decodedID > 0 ? decodedID : 0,
            tempId: isTemp ? decodedID : 0,
          });
          loadedPrescribed = (prescRes.data.compmas || []).map((c) => ({
            subCatId: String(c.id), name: c.comp_name, prescribed: c.doc_comp_id ? 1 : 0,
          }));
          setBrandsPrescribed(loadedPrescribed);
        } catch (err) { console.error("prescribed load error", err); }

        let loadedBrandData = [];
        if (d.reg_id) {
          const brandsEndpoint = isTemp ? "/getBrandsTemp" : "/getBrands";
          const brandsPayload = isTemp ? { tempId: decodedID } : { doctorId: decodedID > 0 ? decodedID : 0 };
          const [repRes, repPosRes, distRes, brandsRes, freqRes] = await Promise.all([
            api.post("/getRepUser", { regId: String(d.reg_id), requestType: String(d.cus_type_id) }),
            api.post("/getRepUser", { regId: String(d.reg_id) }),
            api.post("/getDistributor", { regId: String(d.reg_id) }),
            api.post(brandsEndpoint, brandsPayload),
            api.post("/getCustomerFreq"),
          ]);

          setRepInchargeOptions((repRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
          setRepPOSOptions((repPosRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
          setDistributorOptions((distRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
          setFrequencyOptions((freqRes.data.data || []).map((i) => ({
            ...i, id: String(i.id), no_freq_visit: String(i.no_freq_visit),
          })));
          let com_count = 0;
          loadedBrandData = (brandsRes.data.data || []).map((b) => ({
            subCatId: String(b.id), name: b.sub_name,
            focus: b.foc ? 1 : 0, reminder: b.rem ? 1 : 0, competition: 0,
            compCount: b.subcat_id > 0 ? com_count + 1 : com_count,
          }));
          setBrandData(loadedBrandData);
        }

        let loadedCompetitorRows = [];
        if (loadedBrandData.length > 0) {
          try {
            const compResponses = await Promise.all(
              loadedBrandData.map((brand) =>
                api.post("/getCompModal", {
                  subcat_id: brand.subCatId, cus_id: decodedID || 0, temp_id: isTemp ? decodedID : 0,
                })
              )
            );
            compResponses.forEach((cRes, index) => {
              const brand = loadedBrandData[index];
              const backendProducts = cRes.data.data?.products || [];
              const rowsForThisBrand = backendProducts
                .filter((p) =>
                  Number(p.prod_qty) > 0 || Number(p.comp_id_1) > 0 || Number(p.comp_id_2) > 0 ||
                  Number(p.comp_id_3) > 0 || Number(p.oth_qty) > 0 || (p.other_name && p.other_name.trim() !== "")
                )
                .map((p) => ({
                  pid: p.pid, subcat_id: brand.subCatId, prod_qty: p.prod_qty || 0,
                  comp_id_1: p.comp_id_1 ? String(p.comp_id_1) : "0", comp_id_1_qty: p.comp_id_1_qty || 0,
                  comp_id_2: p.comp_id_2 ? String(p.comp_id_2) : "0", comp_id_2_qty: p.comp_id_2_qty || 0,
                  comp_id_3: p.comp_id_3 ? String(p.comp_id_3) : "0", comp_id_3_qty: p.comp_id_3_qty || 0,
                  other_name: p.other_name || "", oth_qty: p.oth_qty || 0,
                }));
              loadedCompetitorRows = [...loadedCompetitorRows, ...rowsForThisBrand];
            });
            loadedBrandData = loadedBrandData.map((b) => ({
              ...b, compCount: loadedCompetitorRows.filter((r) => r.subcat_id === b.subCatId).length,
            }));
            setBrandData(loadedBrandData);
          } catch (err) { console.error("competitor rows load error", err); }
        }
        setCompetitorRows(loadedCompetitorRows);

        const clinicEndpoint = isTemp ? "/getTempCusClinic" : "/getcusdetData";
        const clinicPayload = isTemp ? { Id: decodedID } : { id: decodedID };
        const clinicRes = await api.post(clinicEndpoint, clinicPayload);
        const clinicRows = clinicRes.data.data || [];

        if (clinicRows.length > 0) {
          const firstClinic = clinicRows[0];
          const lat = firstClinic.gps_lat || "0";
          const long = firstClinic.gps_long || "0";

          loadedForm.customerLatitude = String(lat);
          loadedForm.customerLongitude = String(long);
          loadedForm.potentiality = String(firstClinic.p_class_id || "1");
          loadedForm.loyalty = String(firstClinic.l_class_id || "");
          loadedForm.frequency = String(firstClinic.cus_visit_freq || "");

          setForm((prev) => ({
            ...prev,
            customerLatitude: loadedForm.customerLatitude,
            customerLongitude: loadedForm.customerLongitude,
            potentiality: loadedForm.potentiality,
            loyalty: loadedForm.loyalty,
            frequency: loadedForm.frequency,
          }));

          if (lat && long && String(lat) !== "0" && String(long) !== "0") {
            setLocationTagged(true);
            setSelectedLocation({ latitude: String(lat), longitude: String(long) });
          }

          const clinicsWithBeats = await Promise.all(
            clinicRows.map(async (c, idx) => {
              let beatOptions = [];
              if (c.user_id) {
                try {
                  const beatRes = await api.post("/getClinicBeat", { repInchargeId: c.user_id });
                  const bd = beatRes.data.data || {};
                  beatOptions = (Array.isArray(bd.beats) ? bd.beats : []).map((i) => ({ ...i, id: String(i.id) }));
                  if (idx === 0) {
                    setPharmacyOptions((Array.isArray(bd.pharmacies) ? bd.pharmacies : []).map((i) => ({ ...i, id: String(i.id) })));
                  }
                } catch (e) { console.error("beat load error", e); }
              }

              return {
                ...DEFAULT_CLINIC,
                _key: `saved-${c.id || idx}`,
                clinicId: c.id || 0,
                repIncharge: String(c.user_id || "0"),
                repInchargePOS: String(c.user_id || "0"),
                beat: String(c.beat_id || "0"),
                beatOptions,
                clinicName: c.clinic_name || "",
                contactName: c.cont_person || "",
                contactNo: c.contact_no || c.clinic_phone || "",
                contactNo2: c.contact_no1 || "",
                potentiality: String(c.p_class_id || "1"),
                loyalty: String(c.l_class_id || ""),
                frequency: String(c.cus_visit_freq || ""),
                address: c.bill_address || "",
                city: c.bill_city || "",
                cityId: String(c.bill_city_id || "0"),
                zipCode: String(c.bill_pincode || ""),
                shipStat: Number(c.ship_stat) === 1,
                shipAddress: c.ship_address || "",
                shipCity: c.ship_city || "",
                shipCityId: String(c.ship_city_id || "0"),
                shipPincode: String(c.ship_pincode || ""),
                stkId: String(c.stk_id || "0"),
                // chain_id may live on the clinic row (c) or on the customer/temp row (d)
                phChain: String(c.chain_id || c.ph_chain || (idx === 0 ? d.chain_id : 0) || "0"),
                hospitalAttached: String(c.hospital_id || "0"),
                pharmacyAttached: String(c.pharmacy_id || "0"),
                pharmacistName: c.pharmacy_cont_person || "",
                meetingTime: c.visit_time || "",
                meetingDays: c.visit_day ? c.visit_day.split(",").filter(Boolean) : [],
                clinicPhoto: c.clinic_photo || "",
                clinicPhotoName: c.clinic_photo_name || "",
                letterHead: c.letter_head_photo || "",
                letterHeadName: c.letter_head_photo_name || "",
                gstBoard: c.gst_board || "",
                gstBoardName: c.gst_board_name || "",
              };
            })
          );

          setClinics(clinicsWithBeats);
          setOriginalClinics(clinicsWithBeats.map((c, i) =>
            i === 0
              ? { ...c, potentiality: loadedForm.potentiality, loyalty: loadedForm.loyalty, frequency: loadedForm.frequency }
              : c
          ));
          setOriginalSnapshot(buildComparableSnapshot(loadedForm, clinicsWithBeats, loadedBrandData, loadedCompetitorRows, loadedPrescribed));
        } else {
          setClinics([{ ...DEFAULT_CLINIC }]);
          setOriginalSnapshot(buildComparableSnapshot(loadedForm, [{ ...DEFAULT_CLINIC }], loadedBrandData, loadedCompetitorRows, loadedPrescribed));
        }
      } catch (error) {
        console.error("getEditData error:", error);
      } finally {
        setEditDataLoading(false);
      }
    };

    getEditData();
  }, [decodedID, location.pathname]);

  const getV = (f, idx) => {
    if (f.scope === "clinic" && !(f.idx0form && idx === 0)) return clinics[idx]?.[f.key] ?? "";
    return form[f.key] ?? "";
  };

  const change = (f, idx, val) => {
    if (f.scope === "clinic" && !(f.idx0form && idx === 0)) {
      if (f.billing) updateBilling(idx, f.key, val);
      else updateClinic(idx, f.key, val);
    } else {
      setForm((fm) => ({ ...fm, [f.key]: val }));
    }
    clearErr(errKey(f, idx));
  };

  console.log("Registry label Which passes", REGISTRY);

  const renderField = (label, idx = 0) => {
    const f = REGISTRY[label];
    const c = fieldConfig[label];
    const lbl = c.label || f.def || label;
    const eKey = errKey(f, idx);
    const err = fieldErrors[eKey] || "";
    const clinic = clinics[idx] || {};
    const naOn = f.naKey ? !!form[f.naKey] : false;
    const required = !!c.required && !naOn && (f.reqWhen ? f.reqWhen(form) : true);
    const value = getV(f, idx);
    const cell = (node, w = FIELD_MD, k = `${label}-${idx}`) => <Grid key={k} size={{ xs: 12, sm: w === FIELD_MD ? 6 : 12, md: w }}>{node}</Grid>;
    const out = [];

    if (f.groupNA) {
      out.push(cell(
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={!!form[f.groupNA.key]}
              onChange={(e) => {
                const ck = e.target.checked;
                setForm((fm) => ({ ...fm, [f.groupNA.key]: ck }));
                if (ck) setFieldErrors((p) => { const n = { ...p }; f.groupNA.clear.forEach((k) => delete n[k]); return n; });
              }}
            />
          }
          label={f.groupNA.label}
        />, FIELD_MD, `${label}-na`
      ));
    }

    if (f.sameAsBilling) {
      out.push(cell(
        <FormControlLabel
          control={<Checkbox size="small" checked={!!clinic.shipStat} onChange={(e) => handleSameAsBilling(idx, e.target.checked)} sx={{ py: 0, pl: 2 }} />}
          label="Same as Billing Address"
        />, 12, `${label}-same`
      ));
    }

    switch (f.type) {
      case "text":
        out.push(cell(
          <TextField
            label={lbl} fullWidth size="small" required={required}
            placeholder={f.placeholder}
            multiline={!!f.multiline} rows={f.multiline ? 2 : undefined}
            disabled={naOn || !!f.disabledWhen?.(form, clinic)}
            inputProps={{ maxLength: f.max, readOnly: !!f.readOnly }}
            sx={f.readOnly ? greyBg : disabledBgSx}
            value={value}
            onChange={(e) => {
              let v = f.digits ? e.target.value.replace(/\D/g, "") : e.target.value.replace(/^\s+/, "");
              if (f.max) v = v.slice(0, f.max);
              change(f, idx, v);
            }}
            onBlur={f.phone ? (e) => {
              if (e.target.value && e.target.value.length !== 10) {
                setFieldErrors((p) => ({ ...p, [eKey]: "Please enter valid 10-digit Contact No" }));
              }
            } : undefined}
            error={!!err} helperText={err}
          />
        ));
        break;

      case "select": {
        const options = f.optsFromClinic
          ? (clinic[f.optsFromClinic] || [])
          : [...(f.pre ? [f.pre] : []), ...(optionSets[f.opts] || [])];
        const lockedOnEdit = f.sp === "cusType" && !isCreateMode;

        // Type-safe value: compare as strings so 186 and "186" both match.
        // If the options aren't loaded yet (or nothing matches), fall back to
        // the default so the Select never gets an out-of-range value.
        const optionValueKey = f.vk || "id";
        const rawVal = String(value ?? "");
        const hasMatch = options.some((o) => String(o?.[optionValueKey]) === rawVal);
        const selectValue = hasMatch ? rawVal : (f.dv || "");

        out.push(cell(
          <>
          <CommonAppSelect
            label={lbl}
            value={selectValue}
            onChange={(e) => {
              const v = String(e.target.value);
              if (f.sp === "cusType") return handleAccTypeChange(v);
              if (f.sp === "region") return handleRegionChange(v);
              change(f, idx, v);
            }}
            options={options}
            valueKey={optionValueKey}
            labelKey={f.lk}
            required={required}
            disabled={lockedOnEdit}
            sx={lockedOnEdit ? { backgroundColor: "#EEEEEE" } : undefined}
            error={!!err}
          />
          {err && <FormHelperText error sx={{ mx: 1.75 }}>{err}</FormHelperText>}
          </>
        ));
        break;
      }

      case "multi": {
        const opts = optionSets[f.opts] || [];
        const sel = Array.isArray(value) ? value : [];
        out.push(cell(
          <Autocomplete
            multiple size="small" fullWidth disableCloseOnSelect
            options={opts}
            getOptionLabel={(o) => o?.[f.lk] || ""}
            isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
            value={opts.filter((o) => sel.some((x) => String(x) === String(o.id)))}
            onChange={(e, nv) => change(f, idx, nv.map((o) => o.id))}
            renderInput={(params) => <TextField {...params} label={lbl} required={required} error={!!err} helperText={err} />}
          />
        ));
        break;
      }

      case "date": {
        const naAny = f.na ? !!form[f.na] : naOn;
        out.push(cell(
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label={lbl}
                value={value ? dayjs(value) : null}
                onChange={(nv) => change(f, idx, nv && nv.isValid() ? nv.format("YYYY-MM-DD") : "")}
                format="DD MMM YYYY"
                disabled={naAny}
                slotProps={{
                  textField: {
                    size: "small", fullWidth: true, required: required && !naAny,
                    error: !!err, helperText: err, sx: disabledBgSx,
                  },
                }}
              />
            </LocalizationProvider>
            {f.na && (
              <FormControlLabel
                control={
                  <Checkbox
                    size="small" checked={!!form[f.na]}
                    onChange={(e) => {
                      const ck = e.target.checked;
                      setForm((fm) => ({ ...fm, [f.na]: ck, [f.key]: ck ? "" : fm[f.key] }));
                      if (ck) clearErr(f.key);
                    }}
                  />
                }
                label="NA"
              />
            )}
          </Box>
        ));
        break;
      }

      case "mobile":
        out.push(cell(
          <TextField
            label={lbl} fullWidth size="small" required={required}
            value={form.mobile || ""} onChange={handleMobileChange}
            inputProps={{ maxLength: 10 }} error={!!err} helperText={err}
          />, 3, `${label}-main`
        ));
        out.push(cell(
          <FormControl component="fieldset">
            <Typography variant="body2" sx={{ fontWeight: 400 }}>Send SMS</Typography>
            <RadioGroup row value={form.sendSms?.toString() || "0"} onChange={handleSendSmsChange}>
              <FormControlLabel value="1" control={<Radio size="small" />} label="Yes" />
              <FormControlLabel value="0" control={<Radio size="small" />} label="No" />
            </RadioGroup>
          </FormControl>, 3, `${label}-sms`
        ));
        break;

      case "email":
        out.push(cell(
          <TextField
            label={lbl} fullWidth size="small" required={required}
            value={form.email || ""} onChange={handleEmailChange} error={!!err} helperText={err}
          />, 3, `${label}-main`
        ));
        out.push(cell(
          <FormControl component="fieldset">
            <Typography variant="body2" sx={{ fontWeight: 400 }}>Send Email</Typography>
            <RadioGroup row value={form.sendEmail?.toString() || "0"} onChange={handleSendEmailChange}>
              <FormControlLabel value="1" control={<Radio size="small" />} label="Yes" />
              <FormControlLabel value="0" control={<Radio size="small" />} label="No" />
            </RadioGroup>
          </FormControl>, 3, `${label}-send`
        ));
        break;

      case "checkbox":
        out.push(cell(
          <FormControlLabel
            control={
              <Checkbox
                size="small" checked={!!form[f.key]}
                onChange={(e) => {
                  setForm((fm) => ({ ...fm, [f.key]: e.target.checked }));
                  clearErr("gstNo");
                }}
              />
            }
            label={lbl}
          />, FIELD_MD
        ));
        break;

      case "city": {
        const disabled = !!f.disabledWhen?.(form, clinic);
        const upd = f.billing ? updateBilling : updateClinic;
        const setCity = (text, cid) => { upd(idx, f.key, text); upd(idx, f.idKey, cid); clearErr(eKey); };
        out.push(cell(
          <Autocomplete
            freeSolo fullWidth size="small" disabled={disabled}
            options={cityOptions}
            getOptionLabel={(o) => (typeof o === "string" ? o : o.city_name || "")}
            isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
            value={cityOptions.find((x) => String(x.id) === String(clinic[f.idKey])) || null}
            inputValue={clinic[f.key] || ""}
            onInputChange={(e, val, reason) => {
              if (reason === "input") setCity((val || "").replace(/^\s+/, ""), "0");
              else if (reason === "clear") { upd(idx, f.key, ""); upd(idx, f.idKey, "0"); }
            }}
            onChange={(e, val) => {
              if (val && typeof val === "object") setCity(val.city_name || "", String(val.id));
            }}
            renderInput={(params) => (
              <TextField {...params} label={lbl} placeholder="Enter City Name" required={required} error={!!err} helperText={err} />
            )}
          />
        ));
        break;
      }

      case "distributor":
        out.push(cell(
          <FormControl fullWidth size="small" required={required} error={!!err}>
            <InputLabel id={`Distributor-${idx}`}>{masterPanel["DIST"] || c.label || "Distributor"}</InputLabel>
            <Select
              value={clinic.stkId} id={`Distributor-${idx}`} label={masterPanel["DIST"] || c.label || "Distributor"}
              labelId={`Distributor-${idx}`} variant="outlined"
              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
              onChange={(e) => change(f, idx, String(e.target.value))}
            >
              <MenuItem value="0" style={{ fontSize: "11px" }}>Select {masterPanel["DIST"] || "Distributor"}</MenuItem>
              {distributorOptions?.map((item, index) => (
                <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>
                  {item?.stk_code} - {item?.stk_name}
                </MenuItem>
              ))}
            </Select>
            {err && <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>{err}</Typography>}
          </FormControl>
        ));
        break;

      case "days":
        out.push(cell(
          <>
            <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>{lbl}</Typography>
            <FormGroup row>
              {MEETING_DAYS.map((day) => (
                <FormControlLabel
                  key={day.value}
                  control={
                    <Checkbox
                      size="small" checked={(clinic.meetingDays || []).includes(day.value)}
                      onChange={() => toggleMeetingDay(idx, day.value)} sx={{ px: 0.5, py: 0, ml: 0.5 }}
                    />
                  }
                  label={day.label}
                />
              ))}
            </FormGroup>
            {err && <FormHelperText error>{err}</FormHelperText>}
          </>, 5
        ));
        break;

      case "file": {
        const v = clinic[f.key];
        const isStored = typeof v === "string" && v !== "";
        const fileName = v ? (isStored ? (clinic[`${f.key}Name`] || v.split("/").pop()) : v.name) : "";
        out.push(
          <Grid size={{ xs: 12, sm: 6, md: FIELD_MD }} key={`${label}-${idx}`}>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography sx={{ fontWeight: 600, color: "#333333" }}>
                {lbl}{required && <span style={{ color: "#d32f2f" }}> *</span>}
              </Typography>
              <Button
                component="label" role={undefined} variant="outlined" tabIndex={-1}
                color={err ? "error" : "primary"} startIcon={<CloudUploadIcon />}
                sx={{ width: "100%", justifyContent: "flex-start", textTransform: "none", position: "relative", pr: v ? 4 : 2 }}
              >
                <Box
                  component="span"
                  onClick={isStored ? (e) => { e.preventDefault(); e.stopPropagation(); downloadFile(FILE_FOLDER, v.split("/").pop()); } : undefined}
                  sx={{
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "100%",
                    textDecoration: isStored ? "underline" : "none", cursor: isStored ? "pointer" : "inherit",
                  }}
                >
                  {fileName || "Choose File"}
                </Box>
                <input
                  type="file" accept={f.accept}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const ext = "." + file.name.split(".").pop().toLowerCase();
                    const allowed = f.accept.split(",");
                    if (!allowed.includes(ext)) {
                      setFieldErrors((p) => ({ ...p, [eKey]: `Only ${allowed.map((a) => a.slice(1).toUpperCase()).join(", ")} files are allowed` }));
                      return;
                    }
                    if (file.size > MAX_FILE_SIZE) {
                      setFieldErrors((p) => ({ ...p, [eKey]: "File size must be 5 MB or less" }));
                      return;
                    }
                    updateClinic(idx, f.key, file);
                    clearErr(eKey);
                  }}
                  style={{ clip: "rect(0 0 0 0)", clipPath: "inset(50%)", height: 1, overflow: "hidden", position: "absolute", bottom: 0, left: 0, whiteSpace: "nowrap", width: 1 }}
                />
                {v && (
                  <IconButton
                    size="small"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateClinic(idx, f.key, null); clearErr(eKey); }}
                    sx={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", p: "2px", color: "grey" }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Button>
              {err && <FormHelperText error sx={{ mx: 0.5 }}>{err}</FormHelperText>}
            </Box>
          </Grid>
        );
        break;
      }

      default:
        break;
    }
    return out;
  };

  const OWNER = "__OWNER__";

  const renderOwner = (idx) => {
  const ownerIsPOS = isRetailerField;
  const clinic = clinics[idx] || {};
  const ownerOptions = ownerIsPOS ? repPOSOptions : repInchargeOptions;
  const selectedId = String((ownerIsPOS ? clinic.repInchargePOS : clinic.repIncharge) ?? "0");
  const err = fieldErrors[`owner_${idx}`];
  const lbl = isHcpField ? "Rep Incharge" : (idx === 0 ? "Account Owner (SO)" : "Account Owner (KAM)");
  return (
    <Grid key={`owner-${idx}`} size={{ xs: 12, sm: 6, md: FIELD_MD }}>
      <Autocomplete
        fullWidth size="small"
        options={ownerOptions}
        getOptionLabel={(o) => o?.user_name || ""}
        isOptionEqualToValue={(o, v) => String(o.user_id) === String(v.user_id)}
        value={selectedId !== "0" ? ownerOptions.find((o) => String(o.user_id) === selectedId) || null : null}
        onChange={(e, val) => handleRepChange(idx, val ? String(val.user_id) : "0", ownerIsPOS)}
        noOptionsText={ownerIsPOS ? "No Account Owner found" : "No Rep Incharge found"}
        ListboxProps={{ style: { maxHeight: 200, fontSize: "11px" } }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={lbl}
            placeholder={ownerIsPOS ? "Select Account Owner" : "Select Rep Incharge"}
            required
            error={!!err}
            helperText={err}
          />
        )}
      />
    </Grid>
  );
};

  const renderLabels = (labels, idx = 0) => {
    const out = [];
    const done = new Set();
    labels.forEach((l) => {
      if (l === OWNER) { out.push(renderOwner(idx)); return; }
      const r = REGISTRY[l].row;
      if (!r) { out.push(...renderField(l, idx)); return; }
      if (done.has(r)) return;
      done.add(r);
      const group = labels.filter((x) => x !== OWNER && REGISTRY[x].row === r);
      out.push(
        <Grid key={`row-${r}-${idx}`} size={12}>
          <Grid container spacing={2} alignItems="flex-start">{group.map((x) => renderField(x, idx))}</Grid>
        </Grid>
      );
    });
    return out;
  };

  const CONTACT_HEADER_ID = 6;
  const isFileLabel = (l) => REGISTRY[l].type === "file";
  const isClinicLabel = (l) => REGISTRY[l].scope === "clinic";
  const visibleLabels = Object.keys(REGISTRY).filter(isVisible).filter((l) => REGISTRY[l].type !== "component");
  const fileLabels = visibleLabels.filter(isFileLabel).sort(byOrder);
  const clinicLabelsAll = visibleLabels.filter((l) => isClinicLabel(l) && !isFileLabel(l));

  const nonPlainClinicHeaders = [...new Set(
    clinicLabelsAll.map((l) => fieldConfig[l].headerId).filter((h) => !PLAIN_HEADERS.includes(h))
  )].sort((a, b) => a - b);
  const ownerHeaderId = (isHcpField || isRetailerField)
    ? (fieldConfig["SR"]?.headerId ?? fieldConfig["Beat"]?.headerId ?? nonPlainClinicHeaders[0] ?? null)
    : null;
  const ownerOrd = fieldConfig["SR"]?.ord ?? 0;

  const sectionMap = {};
  const ensureSection = (hid, name) => {
    if (!sectionMap[hid]) sectionMap[hid] = { id: hid, name: name || "", labels: [] };
  };
  visibleLabels.filter((l) => !isFileLabel(l)).forEach((l) => {
    const c = fieldConfig[l];
    ensureSection(c.headerId, c.headerName);
    sectionMap[c.headerId].labels.push(l);
  });
  if (ownerHeaderId !== null) {
    const anchor = fieldConfig["SR"] || fieldConfig["Beat"] || fieldConfig[clinicLabelsAll[0]];
    ensureSection(ownerHeaderId, anchor?.headerName);
  }
  const competitorHeaderId = isVisible("Competitor Mapping") ? fieldConfig["Competitor Mapping"].headerId : null;
  if (competitorHeaderId !== null && !PLAIN_HEADERS.includes(competitorHeaderId)) {
    ensureSection(competitorHeaderId, fieldConfig["Competitor Mapping"].headerName);
  }
  const sections = Object.values(sectionMap).sort((a, b) => a.id - b.id);

  const ordOf = (l) => (l === OWNER ? ownerOrd : fieldConfig[l].ord);

  const sectionTokens = (s, wantForm, wantClinic) => {
    const t = s.labels.filter((l) => (isClinicLabel(l) ? wantClinic : wantForm));
    if (wantClinic && s.id === ownerHeaderId) t.push(OWNER);
    return t.sort((a, b) => ordOf(a) - ordOf(b));
  };

  const plainSections = sections.filter((s) => PLAIN_HEADERS.includes(s.id));
  const otherSections = sections.filter((s) => !PLAIN_HEADERS.includes(s.id));
  const lastSectionId = otherSections.length ? otherSections[otherSections.length - 1].id : null;

  const blockIds = new Set([
    CONTACT_HEADER_ID,
    ...nonPlainClinicHeaders,
    ...(ownerHeaderId !== null && !PLAIN_HEADERS.includes(ownerHeaderId) ? [ownerHeaderId] : []),
  ]);
  const contactBlockId = CONTACT_HEADER_ID;

  const NO_CARRY = ["Chain Name"];
  const carryTokens = plainSections
    .flatMap((s) => sectionTokens(s, false, true))
    .filter((l) => !NO_CARRY.includes(l));

  const showCompetitor = isVisible("Competitor Mapping");
  const competitorInSection = showCompetitor && otherSections.some((s) => s.id === competitorHeaderId && !blockIds.has(s.id));

  const renderCompetitor = (embedded) => (
    <CompetitorMappping
      key="competitor"
      embedded={embedded}
      brandData={brandData}
      setBrandData={setBrandData}
      cusId={decodedID || 0}
      tempId={0}
      competitorRows={competitorRows}
      brandsPrescribed={brandsPrescribed}
      setBrandsPrescribed={setBrandsPrescribed}
      onOpenCompModal={(brand) => { setSelectedBrand(brand); setCompModalOpen(true); }}
    />
  );

  const renderClinicBlock = (s) => {
    const isContact = s.id === contactBlockId;
    const title = s.name || "Contact Information";
    const ownTokens = sectionTokens(s, false, true);
    const formTokens = sectionTokens(s, true, false);
    const limitReached = clinics.length >= maxClinics;
    const list = isContact ? clinics : clinics.slice(0, 1);

    return (
      <div key={s.id} style={{ marginBottom: s.id === lastSectionId ? "10%" : "3%" }}>
        <Box sx={accContainer}>
          {list.map((clinic, idx) => {
            const tokens = idx === 0
              ? [...ownTokens, ...formTokens].sort((a, b) => ordOf(a) - ordOf(b))
              : [...(isContact ? carryTokens : []), ...ownTokens];

            return (
              <Box key={clinic._key ?? idx} sx={{ p: 0, overflow: "hidden" }}>
                <Accordion defaultExpanded sx={{ boxShadow: "none" }}>
                  <AccordionSummary
                    expandIcon={
                      idx === 0 ? (
                        isContact ? (
                          <Tooltip title={limitReached ? `Maximum ${maxClinics} ${title}` : `Add ${title}`}>
                            <span>
                              <IconButton
                                component="span" role="button" color="primary" disabled={limitReached}
                                onClick={(e) => { e.stopPropagation(); addClinic(); }}
                              >
                                <AddCircleOutlineIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : <ExpandMoreIcon />
                      ) : (
                        <Tooltip title={`Remove this ${title}`}>
                          <IconButton component="span" role="button" color="error" onClick={(e) => { e.stopPropagation(); }}>
                            <RemoveCircleOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                    sx={{ borderTop: "4px solid #2196f3", "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": { transform: "none" } }}
                  >
                    <Typography variant="h6" color="initial" sx={{ ...subHeaderStyle, mt: 2 }}>
                      {isContact ? `${title} (${idx + 1})` : title}
                    </Typography>
                  </AccordionSummary>
                  <Divider />
                  <AccordionDetails sx={{ pt: 2 }}>
                    <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                      {renderLabels(tokens, idx)}
                    </Grid>
                    {isContact && fileLabels.length > 0 && (
                      <>
                        <Typography variant="h6" color="initial" sx={{ ...subHeaderStyle, mt: 2 }}>Photos</Typography>
                        <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
                          {fileLabels.map((l) => renderField(l, idx))}
                        </Grid>
                      </>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            );
          })}
        </Box>
      </div>
    );
  };

  const renderOtherSection = (s) => {
    if (blockIds.has(s.id)) return renderClinicBlock(s);

    const formTokens = sectionTokens(s, true, false);
    const hasCompetitor = competitorInSection && s.id === competitorHeaderId;
    if (formTokens.length === 0 && !hasCompetitor) return null;

    return (
      <div key={s.id} style={{ marginBottom: "3%" }}>
        <Box sx={accContainer}>
          <Box sx={{ p: 0, overflow: "hidden" }}>
            <Accordion
              expanded={!!openSections[s.id]}
              onChange={(e, ex) => setOpenSections((p) => ({ ...p, [s.id]: ex }))}
              sx={{ boxShadow: "none" }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderTop: "4px solid #2196f3" }}>
                <Typography variant="h6" color="initial" sx={subHeaderStyle}>{s.name}</Typography>
              </AccordionSummary>
              <Divider />
              <AccordionDetails sx={{ pt: 2 }}>
                {formTokens.length > 0 && (
                  <Grid container spacing={2} alignItems="flex-start">{renderLabels(formTokens)}</Grid>
                )}
                {hasCompetitor && <Box sx={{ mt: formTokens.length > 0 ? 3 : 0 }}>{renderCompetitor(true)}</Box>}
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
      </div>
    );
  };

  return (
    <Layout
      breadcrumb={[
        { label: "Home", path: "/" },
        { label: `${masterPanel["ACCM"] || "Account"} Master`, path: location.pathname },
        { label: "Add New Request", path: location.pathname },
      ]}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Box sx={{ ml: 1.5, mt: 1.5 }}>
          <h2>{masterPanel["ACCM"] || "Account"} Master</h2>
        </Box>
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, mr: 1.5 }}>
          {decodedID && ALLOWED_USER_TYPES.includes(Number(userType)) && (
            <>
              {pendingRequest ? (
                <Box sx={{ background: "#ffd36f", padding: "2px 8px", display: "flex", alignItems: "center", borderRadius: "4px", fontSize: "14px" }}>
                  {getPendingRequestName(pendingRequest.request_type)} Request is pending for this account ! Waiting for Approval..
                </Box>
              ) : (
                delFlag === 0 && [0, 2, 1].includes(Number(accStat)) && (
                  <Button
                    variant="contained"
                    disabled={isUpdateDisabled() || submitting || editDataLoading}
                    onClick={onUpdateClick}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {submitting ? "Submitting..." : "Generate Update Request"}
                  </Button>
                )
              )}
            </>
          )}

          {!decodedID && [0, 1, 2].includes(Number(accStat)) && (
            <Button
              variant="contained" onClick={onAddClick} disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {submitting ? "Submitting..." : "Generate Add Request"}
            </Button>
          )}

          <Button variant="contained" sx={{ bgcolor: "#2196f3", color: "white" }} href="/customers/AllDoctors/NA==/MA==/MA==/MA==/MQ==">
            HCP / Retailer List
          </Button>
        </Box>
      </Box>

      <Box sx={headContainer}>
        {(plainSections.length ? plainSections : [{ id: 1, name: "Primary Details", labels: [] }]).map((s, i) => (
          <React.Fragment key={s.id}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" color="initial" sx={subHeaderStyle}>{s.name || "Primary Details"}</Typography>
              {i === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "end" }}>
                  <LocationOnIcon
                    sx={{ color: locationTagged ? "green" : "red", height: "30px", width: "30px", cursor: "pointer", transition: "color 0.3s ease" }}
                    onClick={handleOpenMap}
                  />
                  {fieldErrors.location && <Typography sx={{ color: "#D32F2F", fontSize: "9px" }}>{fieldErrors.location}</Typography>}
                </Box>
              )}
            </Box>
            <Divider sx={{ mt: i === 0 ? -1.5 : 0 }} />
            <Grid container spacing={2} alignItems="flex-start">
              {renderLabels(sectionTokens(s, true, true))}
            </Grid>
          </React.Fragment>
        ))}
      </Box>

      {showCompetitor && !competitorInSection && renderCompetitor(false)}

      {otherSections.map(renderOtherSection)}

      <Dialog open={mapDialogOpen} onClose={() => setMapDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Location Tagging
          <IconButton onClick={() => setMapDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <LocationTaggingMap
            initialLat={selectedLocation.latitude}
            initialLng={selectedLocation.longitude}
            onLocationSelect={(lat, lng) => setSelectedLocation({ latitude: lat, longitude: lng })}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="success" onClick={handleConfirmTagging}>Confirm Tagging</Button>
          <Button variant="contained" color="error" onClick={() => setMapDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={confirm.open}
        onClose={closeConfirm}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        loading={submitting}
        confirmColor={confirm.confirmColor}
      />

      <AddCompetitor
        selectedBrand={selectedBrand}
        compModalOpen={compModalOpen}
        setCompModalOpen={setCompModalOpen}
        cusId={decodedID || 0}
        tempId={isTemp ? decodedID : 0}
        existingRows={competitorRows.filter((r) => r.subcat_id === selectedBrand?.subCatId)}
        onSave={(saveData) => {
          const rowsWithSubcat = saveData.rows.map((r) => ({ ...r, subcat_id: selectedBrand?.subCatId || 0 }));
          setCompetitorRows((prev) => [...prev.filter((r) => r.subcat_id !== selectedBrand?.subCatId), ...rowsWithSubcat]);
          setBrandData((prev) => prev.map((b) =>
            b.subCatId === selectedBrand?.subCatId ? { ...b, compCount: rowsWithSubcat.filter(rowHasData).length } : b
          ));
        }}
      />
    </Layout>
  );
}

export default CreateCustomer;