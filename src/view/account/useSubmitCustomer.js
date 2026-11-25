import { useCallback } from "react";
import api from "../../services/api";
import useToast from "../../utils/useToast";

const validateEmail = (email) => {
  const filter =
    /^([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
  return filter.test(email);
};

const validateMobile = (mobile) => {
  return mobile && mobile.length === 10;
};

const FILE_UPLOADS = [
  { key: "clinicPhoto", field: "clinic_photo" },
  { key: "letterHead", field: "letter_head_photo" },
  { key: "gstBoard", field: "gst_board" },
];

const isFile = (v) => typeof File !== "undefined" && v instanceof File;

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

export function useSubmitCustomer({ form, clinics, originalClinics = null, brandData = [], competitorBrands = [], competitorRows = [], brandsPrescribed = [], setFieldErrors, setForm, fieldConfig = {} }) {
  const toast = useToast();
  console.log("form which is Passes to submit",form)
  console.log("clinics which is pass to submit",clinics)
  console.log("potentiality which is pass to submit",brandData)
  console.log("competitor brands passing",competitorBrands)

  const validateAndBuild = (onlyChanged = false) => {
    const newErrors = {};
    const toastMessages = [];
    let hasError = false;

    if(!form.cusType){
      newErrors.cusType = "Account Type is Required";
      hasError=true
    }
    if(!form.retailerType){
     newErrors.retailerType = "Type is Required";
     hasError=true
    }
    if(!form.potentiality){
      newErrors.potentiality ="Potentiality Class is Required";
      hasError=true
    }

    if (!form.firstName || !form.firstName.trim()) {
      newErrors.firstName = "Store Name is required";
      hasError = true;
    }

    if (!form.region || form.region === "0" || form.region === "") {
      newErrors.region = "Region is required";
      hasError = true;
    }

    if (!clinics[0]?.stkId || clinics[0].stkId === "0") {
      newErrors.stkId = "Distributor is required";
      hasError = true;
    }

    if (form.sendSms === "1" && (!form.mobile || !form.mobile.trim())) {
      newErrors.mobile = "Mobile No is required";
      hasError = true;
    } else if (form.mobile && form.mobile.trim() && !validateMobile(form.mobile)) {
      newErrors.mobile = "Please enter valid Mobile No";
      hasError = true;
    } else {
      newErrors.mobile = "";
    }

    if (form.sendEmail === "1" && (!form.email || !form.email.trim())) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (form.email && form.email.trim() && !validateEmail(form.email)) {
      newErrors.email = "Please enter valid Email address";
      hasError = true;
    } else {
      newErrors.email = "";
    }

    const lat = Number(form.customerLatitude);
    const lng = Number(form.customerLongitude);
    if (!form.customerLatitude || !form.customerLongitude || !lat || !lng) {
      newErrors.location="Please Add Location By Clicking Location Icon!!"
      hasError = true;
    }

    if (fieldConfig["Currency"]?.show && (!form.currency || form.currency === "0")) {
      newErrors.currency = "Currency is required";
      hasError = true;
    }
    if (fieldConfig["Customer-GST No"]?.show && form.gstStat && !(form.gstNo || "").trim()) {
      newErrors.gstNo = "Customer GST No is required";
      hasError = true;
    }
    if (fieldConfig["Medical Reg. No"]?.show && !(form.drRegNo || "").trim()) {
      newErrors.drRegNo = "Medical Reg. No is required";
      hasError = true;
    }
    if (fieldConfig["Billing Address"]?.show && !(clinics[0]?.address || "").trim()) {
      newErrors.address = "Billing Address is required";
      hasError = true;
    }
    if (fieldConfig["City"]?.show && (!clinics[0]?.cityId || clinics[0].cityId === "0")) {
      newErrors.city = "Billing City is required";
      hasError = true;
    }
    if (fieldConfig["Billing Pincode"]?.show && !String(clinics[0]?.zipCode || "").trim()) {
      newErrors.zipCode = "Billing PIN Code is required";
      hasError = true;
    }
    if (fieldConfig["Shipping Address"]?.show && !(clinics[0]?.shipAddress || "").trim()) {
      newErrors.shipAddress = "Shipping Address is required";
      hasError = true;
    }
    if (fieldConfig["Shipping City"]?.show && !(clinics[0]?.shipCity || "").trim()) {
      newErrors.shipCity = "Shipping City is required";
      hasError = true;
    }
    if (fieldConfig["Shipping Pincode"]?.show && !(clinics[0]?.shipPincode || "").trim()) {
      newErrors.shipPincode = "Shipping Pincode is required";
      hasError = true;
    }
    if (fieldConfig["DL.1"]?.show && !form.dlNA) {
      if (!(form.dl1 || "").trim()) { newErrors.dl1 = "DL 1 is required"; hasError = true; }
      if (!form.dl1From) { newErrors.dl1From = "DL 1 Valid From is required"; hasError = true; }
      if (!form.dl1To) { newErrors.dl1To = "DL 1 Valid to is required"; hasError = true; }
    }
    if (fieldConfig["Retail Lic.1"]?.show && !form.retNA) {
      if (!(form.retLic1 || "").trim()) { newErrors.retLic1 = "Retail Lic.1 is required"; hasError = true; }
      if (!form.retLic1From) { newErrors.retLic1From = "Retail Lic.1 Valid From is required"; hasError = true; }
      if (!form.retLic1To) { newErrors.retLic1To = "Retail Lic.1 Valid to is required"; hasError = true; }
    }
    if (fieldConfig["Birthday"]?.show && !form.dobNA && !form.dob) {
      newErrors.dob = "Birth Date is required";
      hasError = true;
    } else {
      newErrors.dob = "";
    }

    if (fieldConfig["Anniversary"]?.show && !form.anniversaryNA && !form.anniversary) {
      newErrors.anniversary = "Anniversary is required";
      hasError = true;
    } else {
      newErrors.anniversary = "";
    }

    if ((fieldConfig["Address"]?.show || fieldConfig["Billing Address"]?.show) && !(clinics[0]?.address || "").trim()) {
      newErrors.address = "Billing Address is required";
      hasError = true;
    }
    if (fieldConfig["City"]?.show && (!clinics[0]?.cityId || clinics[0].cityId === "0")) {
      newErrors.city = "Billing City is required";
      hasError = true;
    }
    if ((fieldConfig["Zip Code"]?.show || fieldConfig["Billing Pincode"]?.show) && !String(clinics[0]?.zipCode || "").trim()) {
      newErrors.zipCode = "Billing PIN Code is required";
      hasError = true;
    }

    if (form.cusType === "1") {
      const repIds = clinics.map(c => c.repIncharge).filter(id => id && id !== "0");
      if (repIds.length !== new Set(repIds).size) {
        toastMessages.push("Rep Incharge in multiple Contact Info can't be same.. Please compare Contact Info details!");
        hasError = true;
      }
    }

    if (form.cusType === "2") {
      const posIds = clinics.map(c => c.repInchargePOS).filter(id => id && id !== "0");
      if (posIds.length !== new Set(posIds).size) {
        toastMessages.push("Account Owner (KAM) in multiple Contact Info can't be same.. Please compare Contact Info details!");
        hasError = true;
      }
    }

    const filteredClinics = clinics.filter(c =>
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

    const noAccountOwner = clinics.some(c =>
  form.cusType === "2"
    ? (!c.repInchargePOS || c.repInchargePOS === "0")
    : (!c.repIncharge || c.repIncharge === "0")
);
if (noAccountOwner) {
  newErrors.repIncharge = form.cusType === "2"
    ? "Account Owner is Required"
    : "Rep Incharge is Required";
  hasError = true;
}

    const noBeat = filteredClinics.some(c => !c.beat || c.beat === "0");
    if (noBeat) {
      newErrors.beat="Beat is Required";
      hasError = true;
    }
    const noBranch= filteredClinics.some(c=> !c.clinicName || c.clinicName.trim()==="");
    if(noBranch){
      newErrors.clinicName="Branch Name is Required";
      hasError = true;
    }
    console.log("only changed doctors",onlyChanged)
    const contactNumErrors = {};
    let hasContactNumError = false;
    clinics.forEach((c, i) => {
      const no = c.contactNo || "";
      if (!no) {
        contactNumErrors[i] = "Contact No is required";
        hasContactNumError = true;
      } else if (no.length !== 10) {
        contactNumErrors[i] = "Please enter valid 10-digit Contact No";
        hasContactNumError = true;
      }
    });
    if (hasContactNumError) {
      hasError = true;
    }
    newErrors.contactNum = contactNumErrors;

    setFieldErrors((prev) => ({ ...prev, ...newErrors }));

    if (newErrors.mobile) setForm((f) => ({ ...f, sendSms: "0" }));
    if (newErrors.email) setForm((f) => ({ ...f, sendEmail: "0" }));

    if (hasError) {
      toastMessages.forEach((msg) => toast.error(msg));
      toast.error("Please fix all mandatory fields");
      return null;
    }

    const brandSubCatID = brandData.map(b => b.subCatId);
    const brandFocus = brandData.map(b => Number(b.focus) || 0);
    const brandRemainder = brandData.map(b => Number(b.reminder) || 0);
    const prescribedBrands = brandsPrescribed.filter(b => b.prescribed === 1).map(b => b.subCatId);

    const competitor_subcat_id = competitorRows.map(r => r.subcat_id || 0);
    const competitor_prod_id = competitorRows.map(r => r.pid || 0);
    const competitor_prod_qty = competitorRows.map(r => r.prod_qty || 0);
    const competitor_comp_id1 = competitorRows.map(r => r.comp_id_1 || 0);
    const competitor_comp_qty1 = competitorRows.map(r => r.comp_id_1_qty || 0);
    const competitor_comp_id2 = competitorRows.map(r => r.comp_id_2 || 0);
    const competitor_comp_qty2 = competitorRows.map(r => r.comp_id_2_qty || 0);
    const competitor_comp_id3 = competitorRows.map(r => r.comp_id_3 || 0);
    const competitor_comp_qty3 = competitorRows.map(r => r.comp_id_3_qty || 0);
    const competitor_oth = competitorRows.map(r => r.other_name || "");
    const competitor_othqty = competitorRows.map(r => r.oth_qty || 0);

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
        customerClinicRepIncharge: form.cusType === "1"
          ? (c.repIncharge || "0")
          : (c.repInchargePOS || "0"),
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

    const doctorDetails = {
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

      brandSubCatID,
      brandFocus,
      brandRemainder,
      competitorBrands,
      prescribedBrands,

      competitor_subcat_id,
      competitor_prod_id,
      competitor_prod_qty,
      competitor_comp_id1,
      competitor_comp_qty1,
      competitor_comp_id2,
      competitor_comp_qty2,
      competitor_comp_id3,
      competitor_comp_qty3,
      competitor_oth,
      competitor_othqty,

      customerClinic,
    };

    doctorDetails._sentClinics = sentClinics;

    return doctorDetails;
};


  const buildRequest = (details) => {
    const { _sentClinics, ...doctorDetails } = details;
    const hasNewFile = _sentClinics.some(c => FILE_UPLOADS.some(({ key }) => isFile(c[key])));
    if (!hasNewFile) return { body: { doctorDetails }, config: undefined };

    const fd = new FormData();
    fd.append("doctorDetails", JSON.stringify(doctorDetails));
    _sentClinics.forEach((c, i) => {
      FILE_UPLOADS.forEach(({ key, field }) => {
        if (isFile(c[key])) fd.append(`${field}_${i}`, c[key], c[key].name);
      });
    });
    return { body: fd, config: { headers: { "Content-Type": "multipart/form-data" } } };
  };

  const handleSubmit = useCallback(async () => {
    try {
      const doctorDetails = validateAndBuild();
      if (!doctorDetails) return;

      doctorDetails.type_flag = 1;

      console.log("doctorDetails (add):", doctorDetails);

      const { body, config } = buildRequest(doctorDetails);
      const res = await api.post("/doctorSubmit", body, config);

      if (res.data.status === 200) {
        toast.success("Request to Add new, Generated successfully!!");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else if (res.data.status === 300) {
        toast.error(res.data.message || "Submission failed.");
      } else {
        toast.error(res.data.message || "Something went wrong.");
      }

    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred during submission.");
    }
  }, [form, clinics, originalClinics, brandData, competitorBrands, competitorRows, brandsPrescribed, fieldConfig]);

  const handleUpdate = useCallback(async (cusId, tempId = 0) => {
    try {
      const doctorDetails = validateAndBuild(true);
      if (!doctorDetails) return;

      doctorDetails.type_flag = 2;
      doctorDetails.cus_id = cusId || 0;
      doctorDetails.temp_id = tempId || 0;

      console.log("doctorDetails (update):", doctorDetails);

      const { body, config } = buildRequest(doctorDetails);
      const res = await api.post("/doctorUpdate", body, config);

      if (res.data.status === 200) {
        toast.success("Update Request Generated successfully!!");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else if (res.data.status === 300) {
        toast.error(res.data.message || "Update failed.");
      } else {
        toast.error(res.data.message || "Something went wrong.");
      }

    } catch (err) {
      console.error("Update error:", err);
      toast.error(err?.response?.data?.message || err.message || "An error occurred during update.");
    }
  }, [form, clinics, originalClinics, brandData, competitorBrands, competitorRows, brandsPrescribed, fieldConfig]);

  return { handleSubmit, handleUpdate };
}