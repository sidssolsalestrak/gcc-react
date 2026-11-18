import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Checkbox, Divider, FormControl, FormControlLabel, FormGroup, FormHelperText, Grid, IconButton, InputLabel, MenuItem, Select, TextField, Autocomplete, Tooltip } from '@mui/material';
import CommonAppSelect from '../../utils/CommonAppSelect';
import { downloadFile } from '../../utils/downloadFile';

const headContainer = {
    display: "flex", flexDirection: 'column', gap: 2, m: 1.5,
    width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}

const subHeaderStyle = { textDecoration: "underline", textUnderlineOffset: "5px", textDecorationColor: "#ccc",mt:2 }

const MEETING_DAYS = [
    { label: "Mon", value: "2" },
    { label: "Tue", value: "3" },
    { label: "Wed", value: "4" },
    { label: "Thu", value: "5" },
    { label: "Fri", value: "6" },
    { label: "Sat", value: "7" },
    { label: "Sun", value: "1" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const FILE_FOLDER = process.env.REACT_APP_AWS_FOLDER_NAME

const FILE_FIELDS = [
    { k: "clinicPhoto", cfg: "Clinic Photo", label: "Clinic Photo", accept: ".jpg,.jpeg,.png", req: false },
    { k: "letterHead", cfg: "Letter Head", label: "Letter Head", accept: ".jpg,.jpeg,.png,.pdf", req: false },
    { k: "gstBoard", cfg: "GST board", label: "GST board", accept: ".jpg,.jpeg,.png", req: false },
];

// billing field -> matching shipping field
const BILLING_TO_SHIP = {
    address: "shipAddress",
    city: "shipCity",
    cityId: "shipCityId",
    zipCode: "shipPincode",
};

const ContactInfo = ({ 
    fieldConfig, 
    isHcp, 
    isRetailer, 
    clinics, 
    onAddClinic,
    onRemoveClinic,
    maxClinics = 3,
    handleRepChange, 
    updateClinic, 
    toggleMeetingDay,
    repInchargeOptions, 
    repPOSOptions, 
    hospitalOptions, 
    distributorOptions, 
    pharmacyOptions,
    phChainOptions,
    cityOptions,
    masterPanel = {},
    fieldErrors = {},
    setFieldErrors,
    form = {},
    setForm,
    potentialityOptions = [],
    frequencyOptions = [],
    handleClinicContactNoChange,
    handleClinicContactNoBlur,
}) => {
    const id = React.useId();

    const clearErr = (key) => setFieldErrors && setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    console.log("clinic whole Data",clinics)

    const limitReached = clinics.length >= maxClinics;

    const getCv = (idx, key) => (idx === 0 ? form[key] : clinics[idx]?.[key]) || "";
    const setCv = (idx, key, val) =>
        idx === 0 ? setForm((f) => ({ ...f, [key]: val })) : updateClinic(idx, key, val);

    // Update a billing field; if "Same as Billing Address" is ticked, mirror it to shipping
    const updateBilling = (idx, key, val) => {
        updateClinic(idx, key, val);
        if (clinics[idx]?.shipStat) {
            updateClinic(idx, BILLING_TO_SHIP[key], val);
        }
    };

    const handleSameAsBilling = (idx, checked) => {
        const c = clinics[idx] || {};
        updateClinic(idx, "shipStat", checked);
        if (checked) {
            updateClinic(idx, "shipAddress", c.address || "");
            updateClinic(idx, "shipCity", c.city || "");
            updateClinic(idx, "shipCityId", String(c.cityId || "0"));
            updateClinic(idx, "shipPincode", String(c.zipCode || ""));
            if (idx === 0) {
                clearErr("shipAddress");
                clearErr("shipCity");
                clearErr("shipPincode");
            }
        }
    };

    return (
        <div style={{ marginBottom: "10%" }}>
            <Box sx={headContainer}>
                {clinics.map((clinic, idx) => (
                    <Box key={clinic._key ?? idx} sx={{ p: 0, overflow: "hidden" }}>
                        <Accordion defaultExpanded sx={{ boxShadow: "none" }}>
                            <AccordionSummary
                                expandIcon={
                                    idx === 0 ? (
                                        <Tooltip title={limitReached ? `Maximum ${maxClinics} Contact Info` : "Add Contact Info"}>
                                            <span>
                                                <IconButton
                                                    component="span"
                                                    role="button"
                                                    color="primary"
                                                    disabled={limitReached}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddClinic();
                                                    }}
                                                >
                                                    <AddCircleOutlineIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title="Remove this Contact Info">
                                            <IconButton
                                                component="span"
                                                role="button"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // onRemoveClinic(idx);
                                                }}
                                            >
                                                <RemoveCircleOutlineIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )
                                }
                                sx={{
                                    borderTop: "4px solid #2196f3",
                                    "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": { transform: "none" },
                                }}
                            >
                                <Typography variant="h6" color="initial" sx={subHeaderStyle}>
                                    Contact Info {idx + 1}
                                </Typography>
                            </AccordionSummary>
                            <Divider />
                            <AccordionDetails sx={{ pt: 2 }}>
                                <Grid container spacing={2}  sx={{ mb: 2 }}>

                                 {isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label="Rep Incharge"
                                                value={clinic.repIncharge}
                                                onChange={(e) => handleRepChange(idx, String(e.target.value), false)}
                                                options={[{ id: "0", full_name: "Select Rep Incharge" },...repInchargeOptions]}
                                                valueKey="id"
                                                labelKey="full_name"
                                                required={true}
                                                error={!!fieldErrors.repIncharge}
                                                helperText={fieldErrors.repIncharge}
                                            />
                                            {fieldErrors.repIncharge && (
                                                <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>
                                                    {fieldErrors.repIncharge}
                                                </Typography>
                                            )}
                                        </Grid>
                                    )}

                                    {isRetailer && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={idx === 0 ? "Account Owner (SO)" : "Account Owner (KAM)"}
                                                value={clinic.repInchargePOS}
                                                onChange={(e) => handleRepChange(idx, String(e.target.value), true)}
                                                options={[
                                                    { id: "0", full_name: "Select Account Owner" },
                                                    ...repPOSOptions
                                                ]}
                                                valueKey="id"
                                                labelKey="full_name"
                                                required={true}
                                                error={!!fieldErrors.repIncharge}
                                                helperText={fieldErrors.repIncharge}
                                            />
                                            {fieldErrors.repIncharge && (
                                                <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>
                                                    {fieldErrors.repIncharge}
                                                </Typography>
                                            )}
                                        </Grid>
                                    )}
                                    {fieldConfig["Beat"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={fieldConfig["Beat"]?.label || "Beat"}
                                                value={clinic.beat}
                                                onChange={(e) => updateClinic(idx, "beat", String(e.target.value))}
                                                options={clinic.beatOptions}
                                                valueKey="id"
                                                labelKey="beat_name"
                                                required={true}
                                                error={!!fieldErrors.beat}
                                                helperText={fieldErrors.beat}
                                            />
                                            {fieldErrors.beat && <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>{fieldErrors.beat}</Typography>}
                                        </Grid>
                                    )}

                                    {fieldConfig["Chain Name"]?.show && isRetailer && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={fieldConfig["Chain Name"]?.label || "Pharmacy Chain Name"}
                                                value={clinic.phChain}
                                                onChange={(e) => updateClinic(idx, "phChain", String(e.target.value))}
                                                options={phChainOptions}
                                                valueKey="id"
                                                labelKey="chain_name"
                                            />
                                        </Grid>
                                    )}

                                    {fieldConfig["Clinic Name"]?.show && isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={isRetailer ? fieldConfig["Clinic Name"]?.label : "Clinic Name"}
                                                fullWidth size="small" placeholder='Enter Clinic Name'
                                                value={clinic.clinicName}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "clinicName", onlyText)
                                                }}
                                                required={true}
                                                error={!!fieldErrors.clinicName}
                                                helperText={fieldErrors.clinicName}
                                            />
                                        </Grid>
                                    )}

                                  </Grid>
                                     <Grid container spacing={2}  sx={{ mb: 2 }}>
                                        {fieldConfig["Clinic Name"]?.show && !isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={isRetailer ? fieldConfig["Clinic Name"]?.label : "Clinic Name"}
                                                fullWidth size="small" placeholder='Enter Clinic Name'
                                                value={clinic.clinicName}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "clinicName", onlyText)
                                                }}
                                                required={true}
                                                error={!!fieldErrors.clinicName}
                                                helperText={fieldErrors.clinicName}
                                            />
                                        </Grid>
                                    )}

                                    {fieldConfig["Hospital Attached"]?.show && isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={fieldConfig["Hospital Attached"]?.label || "Hospital Attached To"}
                                                value={clinic.hospitalAttached}
                                                onChange={(e) => updateClinic(idx, "hospitalAttached", String(e.target.value))}
                                                options={[{ id: "0", hosp_name: "Select Hospital" }, ...hospitalOptions]}
                                                valueKey="id"
                                                labelKey="hosp_name"
                                            />
                                        </Grid>
                                    )}

                                    {fieldConfig["Distributor"]?.show  && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormControl fullWidth size="small" required error={!!fieldErrors.stkId}>
                                                <InputLabel id="Distributor">{masterPanel["DIST"] || "Distributor"}</InputLabel>
                                                <Select 
                                                    value={clinic.stkId} 
                                                    id='Distributor' 
                                                    label={masterPanel["DIST"] || "Distributor"}
                                                    labelId="Distributor" 
                                                    variant="outlined"
                                                    MenuProps={{
                                                        PaperProps: {
                                                            style: {
                                                                maxHeight: 200
                                                            }
                                                        }
                                                    }}
                                                    onChange={(e) => updateClinic(idx, "stkId", String(e.target.value))}
                                                >
                                                    <MenuItem value="0" style={{ fontSize: "11px" }}>
                                                        Select {masterPanel["DIST"] || "Distributor"}
                                                    </MenuItem>
                                                    {distributorOptions?.map((item, index) => (
                                                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>
                                                            {item?.stk_code} - {item?.stk_name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {fieldErrors.stkId && <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>{fieldErrors.stkId}</Typography>}
                                            </FormControl>
                                        </Grid>
                                    )}

                                    {fieldConfig["Visit Frequency/Year"]?.show && !isHcp && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <CommonAppSelect
                                                        label={fieldConfig["Visit Frequency/Year"]?.label || "Visit Frequency / Year"}
                                                        value={getCv(idx, "frequency")}
                                                        onChange={(e) => setCv(idx, "frequency", String(e.target.value))}
                                                        options={frequencyOptions}
                                                        valueKey="no_freq_visit"
                                                        labelKey="freq_name"
                                                        required={true}
                                                    />
                                                </Grid>
                                    )}
                                    {fieldConfig["Pharmacy Attached"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={fieldConfig["Pharmacy Attached"]?.label || "Pharmacy Attached"}
                                                value={clinic.pharmacyAttached}
                                                onChange={(e) => updateClinic(idx, "pharmacyAttached", String(e.target.value))}
                                                options={[{ id: "0", name: "Select Pharmacy" }, ...pharmacyOptions]}
                                                valueKey="id"
                                                labelKey="name"
                                            />
                                        </Grid>
                                    )}
                                    </Grid>

                                    {(fieldConfig["Potentiality Class"]?.show ||
                                      fieldConfig["Loyalty Class"]?.show ||
                                      fieldConfig["Visit Frequency/Year"]?.show) && (
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            {fieldConfig["Potentiality Class"]?.show && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <CommonAppSelect
                                                        label={fieldConfig["Potentiality Class"]?.label || "Potentiality Class"}
                                                        value={getCv(idx, "potentiality")}
                                                        onChange={(e) => {
                                                            setCv(idx, "potentiality", String(e.target.value));
                                                            if (idx === 0) clearErr("potentiality");
                                                        }}
                                                        options={potentialityOptions}
                                                        valueKey="id"
                                                        labelKey="cat_type"
                                                        required={true}
                                                        error={!!fieldErrors.potentiality}
                                                        helperText={fieldErrors.potentiality}
                                                    />
                                                </Grid>
                                            )}

                                            {fieldConfig["Loyalty Class"]?.show && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <CommonAppSelect
                                                        label={fieldConfig["Loyalty Class"]?.label || "Loyalty Class"}
                                                        value={getCv(idx, "loyalty")}
                                                        onChange={(e) => setCv(idx, "loyalty", String(e.target.value))}
                                                        options={potentialityOptions}
                                                        valueKey="id"
                                                        labelKey="cat_type"
                                                        required={true}
                                                    />
                                                </Grid>
                                            )}

                                            {fieldConfig["Visit Frequency/Year"]?.show && isHcp && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <CommonAppSelect
                                                        label={fieldConfig["Visit Frequency/Year"]?.label || "Visit Frequency / Year"}
                                                        value={getCv(idx, "frequency")}
                                                        onChange={(e) => setCv(idx, "frequency", String(e.target.value))}
                                                        options={frequencyOptions}
                                                        valueKey="no_freq_visit"
                                                        labelKey="freq_name"
                                                        required={true}
                                                    />
                                                </Grid>
                                            )}
                                        </Grid>
                                    )}

                                    {(fieldConfig["Address"]?.show ||
                                      fieldConfig["City"]?.show ||
                                      fieldConfig["Zip Code"]?.show) && (
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            {fieldConfig["Address"]?.show && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        label={fieldConfig["Address"]?.label || "Billing Address"}
                                                        fullWidth size="small" multiline rows={2}
                                                        required={true}
                                                        value={clinic.address}
                                                        onChange={(e) => {
                                                            const onlyText = e.target.value.replace(/^\s+/, "")
                                                            updateBilling(idx, "address", onlyText)
                                                            if (idx === 0) clearErr("address");
                                                        }}
                                                        error={idx === 0 && !!fieldErrors.address}
                                                        helperText={idx === 0 ? fieldErrors.address : ""}
                                                    />
                                                </Grid>
                                            )}

                                            {fieldConfig["City"]?.show && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Autocomplete
                                                        freeSolo
                                                        fullWidth
                                                        size="small"
                                                        options={cityOptions}
                                                        getOptionLabel={(o) => (typeof o === "string" ? o : o.city_name || "")}
                                                        isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
                                                        value={cityOptions.find((c) => String(c.id) === String(clinic.cityId)) || null}
                                                        inputValue={clinic.city || ""}
                                                        onInputChange={(e, val, reason) => {
                                                            if (reason === "input") {
                                                                updateBilling(idx, "city", (val || "").replace(/^\s+/, ""));
                                                                updateBilling(idx, "cityId", "0");
                                                                if (idx === 0) clearErr("city");
                                                            } else if (reason === "clear") {
                                                                updateBilling(idx, "city", "");
                                                                updateBilling(idx, "cityId", "0");
                                                            }
                                                        }}
                                                        onChange={(e, val) => {
                                                            if (val && typeof val === "object") {
                                                                updateBilling(idx, "city", val.city_name || "");
                                                                updateBilling(idx, "cityId", String(val.id));
                                                                if (idx === 0) clearErr("city");
                                                            }
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label={fieldConfig["City"]?.label || "Billing City"}
                                                                placeholder="Enter City Name"
                                                                required={true}
                                                                error={idx === 0 && !!fieldErrors.city}
                                                                helperText={idx === 0 ? fieldErrors.city : ""}
                                                            />
                                                        )}
                                                    />
                                                </Grid>
                                            )}

                                            {fieldConfig["Zip Code"]?.show && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        label={fieldConfig["Zip Code"]?.label || "Billing PIN Code"}
                                                        fullWidth size="small" placeholder='Enter Zip Code'
                                                        required={true}
                                                        value={clinic.zipCode}
                                                        onChange={(e) => {
                                                            const onlyDigits = e.target.value.replace(/\D/g, "")
                                                            updateBilling(idx, "zipCode", onlyDigits)
                                                            if (idx === 0) clearErr("zipCode");
                                                        }}
                                                        error={idx === 0 && !!fieldErrors.zipCode}
                                                        helperText={idx === 0 ? fieldErrors.zipCode : ""}
                                                    />
                                                </Grid>
                                            )}
                                        </Grid>
                                    )}

                                    {(fieldConfig["Shipping Address"]?.show ||
                                      fieldConfig["Shipping City"]?.show ||
                                      fieldConfig["Shipping Pincode"]?.show) && (
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid size={{ xs: 12 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={!!clinic.shipStat}
                                                            onChange={(e) => handleSameAsBilling(idx, e.target.checked)}
                                                            sx={{py:0,pl:2}}
                                                        />
                                                    }
                                                    label="Same as Billing Address"
                                                />
                                            </Grid>

                                            {fieldConfig["Shipping Address"]?.show && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        label={fieldConfig["Shipping Address"]?.label || "Shipping Address"}
                                                        fullWidth size="small" multiline rows={2}
                                                        required={true}
                                                        disabled={!!clinic.shipStat}
                                                        value={clinic.shipAddress || ""}
                                                        onChange={(e) => {
                                                            updateClinic(idx, "shipAddress", e.target.value.replace(/^\s+/, ""));
                                                            if (idx === 0) clearErr("shipAddress");
                                                        }}
                                                        error={idx === 0 && !!fieldErrors.shipAddress}
                                                        helperText={idx === 0 ? fieldErrors.shipAddress : ""}
                                                    />
                                                </Grid>
                                            )}

                                            {fieldConfig["Shipping City"]?.show && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <Autocomplete
                                                        freeSolo
                                                        fullWidth
                                                        size="small"
                                                        disabled={!!clinic.shipStat}
                                                        options={cityOptions}
                                                        getOptionLabel={(o) => (typeof o === "string" ? o : o.city_name || "")}
                                                        isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
                                                        value={cityOptions.find((c) => String(c.id) === String(clinic.shipCityId)) || null}
                                                        inputValue={clinic.shipCity || ""}
                                                        onInputChange={(e, val, reason) => {
                                                            if (reason === "input") {
                                                                updateClinic(idx, "shipCity", (val || "").replace(/^\s+/, ""));
                                                                updateClinic(idx, "shipCityId", "0");
                                                                if (idx === 0) clearErr("shipCity");
                                                            } else if (reason === "clear") {
                                                                updateClinic(idx, "shipCity", "");
                                                                updateClinic(idx, "shipCityId", "0");
                                                            }
                                                        }}
                                                        onChange={(e, val) => {
                                                            if (val && typeof val === "object") {
                                                                updateClinic(idx, "shipCity", val.city_name || "");
                                                                updateClinic(idx, "shipCityId", String(val.id));
                                                                if (idx === 0) clearErr("shipCity");
                                                            }
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label={fieldConfig["Shipping City"]?.label || "Shipping City"}
                                                                placeholder="Enter City Name"
                                                                required={true}
                                                                error={idx === 0 && !!fieldErrors.shipCity}
                                                                helperText={idx === 0 ? fieldErrors.shipCity : ""}
                                                            />
                                                        )}
                                                    />
                                                </Grid>
                                            )}

                                            {fieldConfig["Shipping Pincode"]?.show && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        label={fieldConfig["Shipping Pincode"]?.label || "Shipping Pincode"}
                                                        fullWidth size="small" placeholder="Enter Zip Code"
                                                        required={true}
                                                        disabled={!!clinic.shipStat}
                                                        value={clinic.shipPincode || ""}
                                                        onChange={(e) => {
                                                            updateClinic(idx, "shipPincode", e.target.value.replace(/\D/g, ""));
                                                            if (idx === 0) clearErr("shipPincode");
                                                        }}
                                                        error={idx === 0 && !!fieldErrors.shipPincode}
                                                        helperText={idx === 0 ? fieldErrors.shipPincode : ""}
                                                    />
                                                </Grid>
                                            )}
                                        </Grid>
                                    )}

                                    {(fieldConfig["Contact Person"]?.show ||
                                      fieldConfig["Contact No"]?.show ||
                                      fieldConfig["Contact No 1"]?.show ||
                                      fieldConfig["Contact No 2"]?.show) && (
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            {fieldConfig["Contact Person"]?.show && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        label={fieldConfig["Contact Person"]?.label || "Contact Person"}
                                                        fullWidth size="small" placeholder="Enter Contact Person"
                                                        value={clinic.contactName || ""}
                                                        onChange={(e) => updateClinic(idx, "contactName", e.target.value.replace(/^\s+/, ""))}
                                                    />
                                                </Grid>
                                            )}

                                            {fieldConfig["Contact No"]?.show  && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        label={
                                                            fieldConfig["Contact No"]?.show
                                                                ? (fieldConfig["Contact No"]?.label || "Contact No")
                                                                : (fieldConfig["Contact No 1"]?.label || "Contact No 1")
                                                        }
                                                        fullWidth size="small" placeholder="Enter Contact No"
                                                        required
                                                        inputProps={{ maxLength: 10 }}
                                                        value={clinic.contactNo || ""}
                                                        onChange={(e) => handleClinicContactNoChange(idx, e.target.value)}
                                                        onBlur={(e) => handleClinicContactNoBlur(idx, e.target.value)}
                                                        error={!!fieldErrors.contactNum?.[idx]}
                                                        helperText={fieldErrors.contactNum?.[idx]}
                                                    />
                                                </Grid>
                                            )}

                                            {(fieldConfig["Contact No 1"]?.show || fieldConfig["Contact No 2"]?.show) && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <TextField
                                                        label={fieldConfig["Contact No 2"]?.label || "Contact No 2"}
                                                        fullWidth size="small" placeholder="Enter Contact No 2"
                                                        inputProps={{ maxLength: 10 }}
                                                        value={clinic.contactNo2 || ""}
                                                        onChange={(e) => updateClinic(idx, "contactNo2", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                    />
                                                </Grid>
                                            )}
                                              {fieldConfig["Meeting Time"]?.show && !isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={fieldConfig["Meeting Time"]?.label || "Meeting Timings"}
                                                fullWidth size="small"
                                                value={clinic.meetingTime}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "meetingTime", onlyText)
                                                }}
                                            />
                                        </Grid>
                                    )}
                                     {fieldConfig["Meeting Days"]?.show && !isHcp && (
                                        <Grid size={{ xs: 12, md: 8 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
                                                {fieldConfig["Meeting Days"]?.label || "Meeting Days"}
                                            </Typography>
                                            <FormGroup row>
                                                {MEETING_DAYS.map((day) => (
                                                    <FormControlLabel
                                                        key={day.value}
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={clinic.meetingDays.includes(day.value)}
                                                                onChange={() => toggleMeetingDay(idx, day.value)}
                                                                sx={{px:0.5,py:0,ml:0.5}}
                                                            />
                                                        }
                                                        label={day.label}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </Grid>
                                    )}
                                        </Grid>
                                    )}

                                    <Grid container spacing={2}  sx={{ mb: 2 }}>

                                    {fieldConfig["Meeting Time"]?.show && isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={fieldConfig["Meeting Time"]?.label || "Meeting Timings"}
                                                fullWidth size="small"
                                                value={clinic.meetingTime}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "meetingTime", onlyText)
                                                }}
                                            />
                                        </Grid>
                                    )}

                                      {fieldConfig["Meeting Days"]?.show && isHcp && (
                                        <Grid size={{ xs: 12, md: 8 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
                                                {fieldConfig["Meeting Days"]?.label || "Meeting Days"}
                                            </Typography>
                                            <FormGroup row>
                                                {MEETING_DAYS.map((day) => (
                                                    <FormControlLabel
                                                        key={day.value}
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={clinic.meetingDays.includes(day.value)}
                                                                onChange={() => toggleMeetingDay(idx, day.value)}
                                                                sx={{px:0.5,py:0,ml:0.5}}
                                                            />
                                                        }
                                                        label={day.label}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </Grid>
                                    )}

                                    </Grid>

                                    {FILE_FIELDS.some((f) => fieldConfig[f.cfg]?.show) && (
                                      <>
                                        <Typography variant="h6" color="initial" sx={subHeaderStyle}>Photos</Typography>
                                        <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
                                            {FILE_FIELDS.map((fld) => {
                                                const value = clinic[fld.k];
                                                const errKey = `${fld.k}${idx}`;
                                                const isStored = typeof value === "string" && value !== "";
                                                const fileName = value
                                                    ? (isStored ? (clinic[`${fld.k}Name`] || value.split("/").pop()) : value.name)
                                                    : "";

                                                return fieldConfig[fld.cfg]?.show && (
                                                    <Grid size={{ xs: 12, sm: "auto" }} key={fld.k}>
                                                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                            <Typography sx={{ fontWeight: 600, color: '#333333' }}>
                                                                {fieldConfig[fld.cfg]?.label || fld.label}
                                                                {fld.req && <span style={{ color: "#d32f2f" }}> *</span>}
                                                            </Typography>

                                                            <Button
                                                                component="label"
                                                                role={undefined}
                                                                variant="outlined"
                                                                tabIndex={-1}
                                                                color={fieldErrors[errKey] ? "error" : "primary"}
                                                                startIcon={<CloudUploadIcon />}
                                                                sx={{
                                                                    width: 220,
                                                                    justifyContent: "flex-start",
                                                                    textTransform: "none",
                                                                    position: "relative",
                                                                    pr: value ? 4 : 2,
                                                                }}
                                                            >
                                                                <Box
                                                                    component="span"
                                                                    onClick={isStored ? (e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        downloadFile(FILE_FOLDER, value.split("/").pop());
                                                                    } : undefined}
                                                                    sx={{
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        whiteSpace: "nowrap",
                                                                        display: "block",
                                                                        maxWidth: "100%",
                                                                        textDecoration: isStored ? "underline" : "none",
                                                                        cursor: isStored ? "pointer" : "inherit",
                                                                    }}
                                                                >
                                                                    {fileName || "Choose File"}
                                                                </Box>
                                                                <input
                                                                    type="file"
                                                                    accept={fld.accept}
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        e.target.value = "";
                                                                        if (!file) return;
                                                                        const ext = "." + file.name.split(".").pop().toLowerCase();
                                                                        const allowed = fld.accept.split(",");
                                                                        if (!allowed.includes(ext)) {
                                                                            setFieldErrors((prev) => ({
                                                                                ...prev,
                                                                                [errKey]: `Only ${allowed.map((a) => a.slice(1).toUpperCase()).join(", ")} files are allowed`,
                                                                            }));
                                                                            return;
                                                                        }
                                                                        if (file.size > MAX_FILE_SIZE) {
                                                                            setFieldErrors((prev) => ({ ...prev, [errKey]: "File size must be 5 MB or less" }));
                                                                            return;
                                                                        }
                                                                        updateClinic(idx, fld.k, file);
                                                                        setFieldErrors((prev) => ({ ...prev, [errKey]: "" }));
                                                                    }}
                                                                    style={{
                                                                        clip: "rect(0 0 0 0)",
                                                                        clipPath: "inset(50%)",
                                                                        height: 1,
                                                                        overflow: "hidden",
                                                                        position: "absolute",
                                                                        bottom: 0,
                                                                        left: 0,
                                                                        whiteSpace: "nowrap",
                                                                        width: 1,
                                                                    }}
                                                                />
                                                                {value && (
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            updateClinic(idx, fld.k, null);
                                                                            setFieldErrors((prev) => ({ ...prev, [errKey]: "" }));
                                                                        }}
                                                                        sx={{
                                                                            position: "absolute",
                                                                            right: 4,
                                                                            top: "50%",
                                                                            transform: "translateY(-50%)",
                                                                            p: "2px",
                                                                            color: "grey",
                                                                        }}
                                                                    >
                                                                        <CloseIcon sx={{ fontSize: 14 }} />
                                                                    </IconButton>
                                                                )}
                                                            </Button>

                                                            {fieldErrors[errKey] && (
                                                                <FormHelperText error sx={{ mx: 0.5 }}>
                                                                    {fieldErrors[errKey]}
                                                                </FormHelperText>
                                                            )}
                                                        </Box>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                      </>
                                    )}

                            </AccordionDetails>
                        </Accordion>
                    </Box>
                ))}
            </Box>
        </div>
    )
}

export default ContactInfo;