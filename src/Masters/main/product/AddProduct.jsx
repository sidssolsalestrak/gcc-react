import React, { useEffect, useState } from 'react'
import Layout from '../../../layout'
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ImDownload3 } from "react-icons/im";
import fetchSubCat from "./fetchSubCat";
import ConfirmationDialog from "../../../utils/confirmDialog";
import useToast from "../../../utils/useToast";
import axios from "../../../services/api";
import { getMasterPanel } from "../../../services/masterPanelService";
import usePageTitle from '../../../services/usePageTitle'

const headContainer = {
    backgroundColor: 'white', display: "flex", flexDirection: 'column', gap: 2,
    m: 2, p: 2, borderRadius: '6px',
    minHeight: '30vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' }
}

const menuStyle = {
    PaperProps: {
        style: {
            maxHeight: 200
        }
    }
}

// master_label_mas.master_id for "Product"
const PRODUCT_MASTER_ID = 5;

const formFields = {
    productType: "0",
    productName: "",
    subCatName: "",
    shortName: "",
    code: "",
    sortingOrder: "",
    asp: "",
    cfa: "",
    pts: "",
    ptr: "",
    mrp: "",
    pcsPerPack: "",
    pcsPerCarton: "",
    uom: "",
    unitConvertion: "",
    businessUnit: "",
    packSize: "",
    principleSupplier: "0",
    parentName: "0",
    gstPercent: "",
}

const validationFields = {
    productType: "",
    productName: "",
    subCatName: "",
    shortName: "",
    code: "",
    sortingOrder: "",
    asp: "",
    cfa: "",
    pts: "",
    ptr: "",
    mrp: "",
    pcsPerPack: "",
    pcsPerCarton: "",
    uom: "",
    unitConvertion: "",
    businessUnit: "",
    packSize: "",
    principleSupplier: "",
    parentName: "",
    gstPercent: "",
}

const AddProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [subCat, setSubCat] = useState([]);
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);

    // ── dynamic field config from master_label_mas (same shape as the customer form) ──
    //    fieldConfig["Product Name"] = { label, show, required }
    const [fieldConfig, setFieldConfig] = useState({});

    // labels derived from masterPanel with fallbacks
    const prodLabel = masterPanel["PROD"] || "Product";
    const subCatLabel = masterPanel["PSUB"] || "Sub Category";
    const stkLabel = masterPanel["STKS"] || "Stockist";
    const [princsupoption,setPrincsupoption]=useState([])
    const [parentprodOption,setParentProdoption]=useState([])
    const [buOptions,setBuOption]=useState([])

    usePageTitle(prodLabel)

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        const resolveAccStat = async () => {
            try {
                const res = await axios.post("/getAccStat", {
                    menu_url: "masters/prod_mas",
                });

                const stat = res.data?.data?.acc_stat;
                if (stat !== null && stat !== undefined) {
                    localStorage.setItem("acc_stat", stat);
                    setAccStat(String(stat));
                }
            } catch (err) {
                console.log(err);
            }
        };

        resolveAccStat();
    }, []);

    // ---------------- DYNAMIC FORM ----------------
    useEffect(() => {
        const loadDynamicForm = async () => {
            try {
                const res = await axios.post("/getmasterLabelMas", { moduletype: PRODUCT_MASTER_ID });
                let config = {};
                (res.data?.data || []).forEach((item) => {
                    config[String(item.label_name).trim()] = {
                        label: String(item.alias_label_name || item.label_name).trim(),
                        show: Number(item.label_stat) === 0,
                        required: Number(item.mandatory_stat) === 1,
                    };
                });
                setFieldConfig(config);
            } catch (err) {
                console.error(err);
            }
        };
        loadDynamicForm();
    }, []);

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;
    /*----------form fields ---------*/
    const [formData, setFormData] = useState(formFields)
    /*---------- original values for edit---------*/
    const [original, setoriginal] = useState(formFields)
    /*----------form validations ---------*/
    const [validation, setValidations] = useState(validationFields)

    /*---------- re usable toast ---------*/
    const showAlert = useToast();
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        loading: false,
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "primary"
    });

    const showConfirmationDialog = (config) => {
        setConfirmationDialog({
            ...confirmationDialog,
            ...config,
            open: true,
        });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({
            ...confirmationDialog,
            open: false,
            loading: false
        });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} ${prodLabel}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this ${prodLabel}?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    /*----------form validations: only for fields that are shown AND mandatory in master_label_mas ---------*/
    const validations = () => {
        let isValid = true;
        let newValidations = { ...validationFields }

        // true when the label is visible and flagged mandatory
        const isReq = (key) => fieldConfig[key]?.show && fieldConfig[key]?.required;
        const isEmpty = (v) => v === "" || v === null || v === undefined || (typeof v === "string" && v.trim() === "");

        if (isReq("Product Type") && isEmpty(formData.productType)) {
            newValidations.productType = `The ${fieldConfig["Product Type"]?.label || `${prodLabel} Type`} field is required`;
            isValid = false;
        }
        if (isReq("Product Name") && isEmpty(formData.productName)) {
            newValidations.productName = `The ${fieldConfig["Product Name"]?.label || `${prodLabel} Name`} field is required`;
            isValid = false;
        }
        if (isReq("Sub Category Name") && isEmpty(formData.subCatName)) {
            newValidations.subCatName = `The ${fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`} field is required`;
            isValid = false;
        }
        if (isReq("Short Name") && isEmpty(formData.shortName)) {
            newValidations.shortName = `The ${fieldConfig["Short Name"]?.label || "Short Name"} field is required`;
            isValid = false;
        }
        if (isReq("Code") && isEmpty(formData.code)) {
            newValidations.code = `The ${fieldConfig["Code"]?.label || "Code"} field is required`;
            isValid = false;
        }
        if (isReq("Sorting Order") && isEmpty(formData.sortingOrder)) {
            newValidations.sortingOrder = `The ${fieldConfig["Sorting Order"]?.label || "Sorting Order"} field is required`;
            isValid = false;
        }
        if (isReq("Ex Factory (ASP)") && isEmpty(formData.asp)) {
            newValidations.asp = `The ${fieldConfig["Ex Factory (ASP)"]?.label || "Ex Factory Price"} field is required`;
            isValid = false;
        }
        if (isReq("CFA/ Superstockist") && isEmpty(formData.cfa)) {
            newValidations.cfa = `The ${fieldConfig["CFA/ Superstockist"]?.label || "CFA/ Superstockist"} field is required`;
            isValid = false;
        }
        if (isReq("Stockist Price (PTS)") && isEmpty(formData.pts)) {
            newValidations.pts = `The ${fieldConfig["Stockist Price (PTS)"]?.label || `${stkLabel} Price`} field is required`;
            isValid = false;
        }
        if (isReq("Retail Price (PTR)") && isEmpty(formData.ptr)) {
            newValidations.ptr = `The ${fieldConfig["Retail Price (PTR)"]?.label || "Retail Price"} field is required`;
            isValid = false;
        }
        if (isReq("MRP") && isEmpty(formData.mrp)) {
            newValidations.mrp = `The ${fieldConfig["MRP"]?.label || "MRP Price"} field is required`;
            isValid = false;
        }
        if (isReq("Pcs Per Pack") && isEmpty(formData.pcsPerPack)) {
            newValidations.pcsPerPack = `The ${fieldConfig["Pcs Per Pack"]?.label || "Pcs Per Pack"} field is required`;
            isValid = false;
        }
        if (isReq("Pcs Per Carton") && isEmpty(formData.pcsPerCarton)) {
            newValidations.pcsPerCarton = `The ${fieldConfig["Pcs Per Carton"]?.label || "Pcs Per Carton"} field is required`;
            isValid = false;
        }
        if (isReq("UOM") && isEmpty(formData.uom)) {
            newValidations.uom = `The ${fieldConfig["UOM"]?.label || "UOM"} field is required`;
            isValid = false;
        }
        if (isReq("Unit Convertion") && isEmpty(formData.unitConvertion)) {
            newValidations.unitConvertion = `The ${fieldConfig["Unit Convertion"]?.label || "Unit Convertion"} field is required`;
            isValid = false;
        }
        if (isReq("Business Unit") && isEmpty(formData.businessUnit)) {
            newValidations.businessUnit = `The ${fieldConfig["Business Unit"]?.label || "Business Unit"} field is required`;
            isValid = false;
        }
        if (isReq("Pack Size") && isEmpty(formData.packSize)) {
            newValidations.packSize = `The ${fieldConfig["Pack Size"]?.label || "Pack Size"} field is required`;
            isValid = false;
        }
        if (isReq("Principle Supplier") && (isEmpty(formData.principleSupplier) || String(formData.principleSupplier) === "0")) {
            newValidations.principleSupplier = `The ${fieldConfig["Principle Supplier"]?.label || "Principle Supplier"} field is required`;
            isValid = false;
        }
        if (isReq("Parent Name") && (isEmpty(formData.parentName) || String(formData.parentName) === "0")) {
            newValidations.parentName = `The ${fieldConfig["Parent Name"]?.label || "Parent Name"} field is required`;
            isValid = false;
        }
        if (isReq("GST %") && isEmpty(formData.gstPercent)) {
            newValidations.gstPercent = `The ${fieldConfig["GST %"]?.label || "GST %"} field is required`;
            isValid = false;
        }

        setValidations(newValidations);
        return isValid;
    }

    /*----------handle change for form fields ---------*/
    const handleChange = (name, val) => {
        setFormData((prev) => ({
            ...prev, [name]: val
        }))
    }

    /*---------- reset form ---------*/
    const resetForm = () => {
        setFormData(formFields);
        setValidations(validationFields);
    }

    /*---------- payload from submit or edit ---------*/
   const selectedParent = parentprodOption.find(
    (p) => String(p.id) === String(formData.parentName)
   );

    let payload = {
        prod_type: formData.productType,
        prod_name: formData.productName.trim(),
        subcat_id: formData.subCatName,
        prod_code: formData.shortName.trim(),
        code: formData.code.trim(),
        ord_id: Number(formData.sortingOrder) || 0,
        fac_price: Number(formData.asp) || 0,
        wd_price: Number(formData.cfa) || 0,
        stk_price: Number(formData.pts) || 0,
        retail_price: Number(formData.ptr) || 0,
        mrp_price: Number(formData.mrp) || 0,
        pack_pcs: Number(formData.pcsPerPack) || 0,
        cart_pcs: Number(formData.pcsPerCarton) || 0,
        prod_uom: formData.uom.trim(),
        unit_conv: Number(formData.unitConvertion) || 0,
        bu_id: Number(formData.businessUnit) || 0,
        pack_size: String(formData.packSize ?? "").trim(),
        prod_main_id: Number(formData.principleSupplier) || 0,
        parent_id: Number(formData.parentName) || 0,
        tax_per: Number(formData.gstPercent) || 0,
        parent_name: selectedParent?.parent_name ||  "",
        parent_stat: Number(selectedParent?.parent_stat) || 0,
        parentCode: selectedParent?.parent_code || ""
    }
    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post("/prodmas_create", payload)
            if (res?.data?.success) {
                showAlert.success(`Successfully Added ${prodLabel}`)
                resetForm();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to ADD ${prodLabel}`)
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    // treats 0/undefined/null as empty string, keeps other numbers as-is
    const zeroToEmpty = (val) => (val === 0 || val === null || val === undefined ? "" : val);

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editProductData", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                const editData = {
                    productType: data[0]?.prod_type ?? "0",
                    productName: data[0]?.prod_name || "",
                    subCatName: data[0]?.subcat_id ?? "",
                    shortName: data[0]?.prod_code || "",
                    code: data[0]?.code || "",
                    sortingOrder: zeroToEmpty(data[0]?.ord_id),
                    asp: zeroToEmpty(data[0]?.fac_price),
                    cfa: zeroToEmpty(data[0]?.wd_price),
                    pts: zeroToEmpty(data[0]?.stk_price),
                    ptr: zeroToEmpty(data[0]?.retail_price),
                    mrp: zeroToEmpty(data[0]?.mrp_price),
                    pcsPerPack: zeroToEmpty(data[0]?.pack_pcs),
                    pcsPerCarton: zeroToEmpty(data[0]?.cart_pcs),
                    uom: data[0]?.prod_uom || "",
                    unitConvertion: zeroToEmpty(data[0]?.unit_conv),
                    businessUnit: data[0]?.bu_id ?? "",
                    packSize: data[0]?.pack_size || "",
                    principleSupplier: data[0]?.prod_main_id ?? "0",
                    parentName: data[0]?.parent_id ?? "0",
                    parentCode: data[0]?.parent_code ?? null,
                    gstPercent: zeroToEmpty(data[0]?.tax_per),
                };
                setFormData(editData);
                setoriginal(editData);
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            if (decodedId) {
                payload.id = decodedId
                payload.prodNameNew = original.productName.trim()
                payload.codeOld = original.code
            }
            const res = await axios.post("/prodmas_update", payload)
            if (res?.data?.success) {
                showAlert.success(`Successfully updated ${prodLabel}`)
                resetForm();
                navigate(`/masters/prodview`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${prodLabel}`)
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /* ---------- view product ---------- */
    const viewClick = () => {
        navigate('/masters/prodview')
    }

    /* ---------- initial render ---------- */
    useEffect(() => {
        fetchSubCat(setSubCat);
        fetchPrinciplesup();
        fetchParentProduct();
        fetchBuData()
    }, [])

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            resetForm();
            return;
        }
        getEditData(decodedId);
    }, [decodedId]);

    const blockInvalidNumberChars = (e) => {
        if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
        }
    };

    const isEdited = Object.keys(formFields).some((key) => {
        const currentVal = formData[key];
        const originalVal = original[key];
        if (typeof currentVal === "string" && typeof originalVal === "string") {
            return currentVal.trim() !== originalVal.trim();
        }
        return String(currentVal ?? "") !== String(originalVal ?? "");
    });

   const fetchPrinciplesup=async()=>{
    try{
        let response=await axios.post('/getprodmain',{id:0})
        let data= Array.isArray(response.data.data)?response.data.data:[]
        console.log("principle supplier option",data)
        setPrincsupoption(data)

    }
    catch(err){
      console.log("principle supply fetch err",err)
    }

   }

   const fetchParentProduct=async()=>{
    try{
        let response=await axios.post("/getParentProduct")
        let data=Array.isArray(response.data.data)?response.data.data:[]
        console.log("parent log data",data)
        setParentProdoption(data)

    }
    catch(err){
        console.log("parent prod err",err)
    }
   }

   const fetchBuData=async()=>{
    try{
        let response=await axios.post('/getBuisnessUnitData')
        let data=Array.isArray(response.data.data)?response.data.data:[]
        setBuOption(data)

    }
    catch(err){
        console.log("business fetch Err",err)
    }
   }

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: `Add ${prodLabel}` },
        ]}>
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <Box>
                        <h1 className="mainTitle">{prodLabel} Details</h1>
                    </Box>
                    <Button onClick={viewClick} sx={{ height: "30px" }} variant="contained" color="primary">View {prodLabel}</Button>
                </Box>

                {/* Every field is its own Grid item, so a hidden label never leaves a gap */}
                <Grid container spacing={2} alignItems="flex-start">
                    {/* buisness unit */}
                    {fieldConfig["Business Unit"]?.show &&(
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <FormControl fullWidth size="small" required={fieldConfig["Business Unit"]?.required}>
                    <InputLabel id="bulabel">{fieldConfig["Business Unit"]?.label}</InputLabel>
                    <Select labelId='bulabel' label={fieldConfig["Business Unit"]?.label}  MenuProps={menuStyle}
                        value={formData.businessUnit || ""} onChange={(e) => handleChange("businessUnit", e.target.value)} error={!!validation.businessUnit}>
                    <MenuItem value="">Select Buisness Unit</MenuItem>
                    {buOptions.map((val)=>(
                        <MenuItem value={val.id} key={val.id}>{val.bu_name}</MenuItem>
                    ))}

                    </Select>
                    {validation.businessUnit && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.businessUnit}</span>}
                    </FormControl>
                     </Grid> 
                    )}
                    {fieldConfig["Pack Size"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                         <TextField 
                          label={fieldConfig["Pack Size"]?.label}
                          type='number'
                          size='small'
                          fullWidth
                          required={fieldConfig["Pack Size"]?.required}
                          value={formData.packSize || ""}
                          onChange={(e) => handleChange("packSize", e.target.value)}
                          error={!!validation.packSize}
                          helperText={validation.packSize ? validation.packSize : null}
                          onKeyDown={blockInvalidNumberChars}
                          autoComplete="off"
                         />

                        </Grid>
                    )}


                    {/* Product Type */}
                    {fieldConfig["Product Type"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <FormControl fullWidth size="small" required={fieldConfig["Product Type"]?.required}>
                                <InputLabel id="ProductType">{fieldConfig["Product Type"]?.label || `${prodLabel} Type`}</InputLabel>
                                <Select id='ProductType' label={fieldConfig["Product Type"]?.label || `${prodLabel} Type`} error={!!validation.productType}
                                    labelId="ProductType" variant="outlined"
                                    value={formData.productType} onChange={(e) => handleChange("productType", e.target.value)}>
                                    <MenuItem style={{ fontSize: "11px" }} value="0">Existing</MenuItem>
                                    <MenuItem style={{ fontSize: "11px" }} value="1">New Launch</MenuItem>
                                </Select>
                                {validation.productType && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.productType}</span>}
                            </FormControl>
                        </Grid>
                    )}

                    {/* MRP */}
                    {fieldConfig["MRP"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField value={formData.mrp} onChange={(e) => handleChange("mrp", e.target.value)} error={!!validation.mrp} helperText={validation.mrp ? validation.mrp : null}
                                type='number' required={fieldConfig["MRP"]?.required} fullWidth size='small' variant='outlined'
                                label={fieldConfig["MRP"]?.label || "MRP"}
                                placeholder={`Enter ${fieldConfig["MRP"]?.label || "MRP Price"}`}
                                onKeyDown={blockInvalidNumberChars}
                                autoComplete="off" />
                        </Grid>
                    )}

                    {/* Sorting Order */}
                    {fieldConfig["Sorting Order"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField fullWidth type='number' size='small' value={formData.sortingOrder}
                                required={fieldConfig["Sorting Order"]?.required}
                                error={!!validation.sortingOrder} helperText={validation.sortingOrder ? validation.sortingOrder : null}
                                onChange={(e) => handleChange("sortingOrder", e.target.value)}
                                variant='outlined'
                                label={fieldConfig["Sorting Order"]?.label || "Sorting Order"}
                                placeholder={`Enter ${fieldConfig["Sorting Order"]?.label || "Sorting Order"}`}
                                onKeyDown={blockInvalidNumberChars}
                                autoComplete="off" />
                        </Grid>
                    )}

                    {/* Sub Category Name */}
                    {fieldConfig["Sub Category Name"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <FormControl fullWidth size="small" required={fieldConfig["Sub Category Name"]?.required}>
                                <InputLabel id="SubCategoryName">{fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`}</InputLabel>
                                <Select id='SubCategoryName' label={fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`} value={formData.subCatName} MenuProps={menuStyle}
                                    onChange={(e) => handleChange("subCatName", e.target.value)} error={!!validation.subCatName}
                                    labelId="SubCategoryName" variant="outlined">
                                    <MenuItem style={{ fontSize: "11px" }} value="">Select {fieldConfig["Sub Category Name"]?.label || subCatLabel}</MenuItem>
                                    {subCat?.map((item, index) => (
                                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.sub_name}</MenuItem>
                                    ))}
                                </Select>
                                {validation.subCatName && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.subCatName}</span>}
                            </FormControl>
                        </Grid>
                    )}

                    {/* Ex Factory (ASP) */}
                    {fieldConfig["Ex Factory (ASP)"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField type='number' required={fieldConfig["Ex Factory (ASP)"]?.required} fullWidth size='small' value={formData.asp} error={!!validation.asp} helperText={validation.asp ? validation.asp : null}
                                onChange={(e) => handleChange("asp", e.target.value)} variant='outlined'
                                label={fieldConfig["Ex Factory (ASP)"]?.label || "Ex Factory (ASP)"}
                                placeholder={`Enter ${fieldConfig["Ex Factory (ASP)"]?.label || "Factory Price"}`}
                                onKeyDown={blockInvalidNumberChars}
                                autoComplete="off" />
                        </Grid>
                    )}

                    {/* Pcs Per Pack */}
                    {fieldConfig["Pcs Per Pack"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField type='number' required={fieldConfig["Pcs Per Pack"]?.required} fullWidth size='small' variant='outlined' value={formData.pcsPerPack}
                                error={!!validation.pcsPerPack} helperText={validation.pcsPerPack ? validation.pcsPerPack : null}
                                onChange={(e) => handleChange("pcsPerPack", e.target.value)}
                                label={fieldConfig["Pcs Per Pack"]?.label || "Pcs Per Pack"}
                                placeholder={`Enter ${fieldConfig["Pcs Per Pack"]?.label || "Pack Value"}`}
                                onKeyDown={blockInvalidNumberChars}
                                autoComplete="off" />
                        </Grid>
                    )}

                    {/* Code */}
                    {fieldConfig["Code"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField required={fieldConfig["Code"]?.required} fullWidth size='small' variant='outlined'
                                label={fieldConfig["Code"]?.label || "Code"}
                                error={!!validation.code} helperText={validation.code ? validation.code : null}
                                value={formData.code}
                                onChange={(e) => {
                                    const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                    handleChange("code", onlyText)
                                }}
                                placeholder={`Enter ${fieldConfig["Code"]?.label || "Code"}`} />
                        </Grid>
                    )}

                    {/* CFA / Superstockist */}
                    {fieldConfig["CFA/ Superstockist"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField type='number' required={fieldConfig["CFA/ Superstockist"]?.required} fullWidth size='small' variant='outlined' value={formData.cfa}
                                error={!!validation.cfa} helperText={validation.cfa ? validation.cfa : null}
                                onChange={(e) => handleChange("cfa", e.target.value)}
                                label={fieldConfig["CFA/ Superstockist"]?.label || "CFA/ Superstockist"}
                                placeholder={`Enter ${fieldConfig["CFA/ Superstockist"]?.label || "Super Stock-list"}`}
                                onKeyDown={blockInvalidNumberChars}
                                autoComplete="off" />
                        </Grid>
                    )}

                    {/* Pcs Per Carton */}
                    {fieldConfig["Pcs Per Carton"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField type='number' required={fieldConfig["Pcs Per Carton"]?.required} fullWidth size='small' variant='outlined' value={formData.pcsPerCarton}
                                error={!!validation.pcsPerCarton} helperText={validation.pcsPerCarton ? validation.pcsPerCarton : null}
                                onChange={(e) => handleChange("pcsPerCarton", e.target.value)}
                                label={fieldConfig["Pcs Per Carton"]?.label || "Pcs Per Carton"}
                                placeholder={`Enter ${fieldConfig["Pcs Per Carton"]?.label || "Carton Value"}`}
                                onKeyDown={blockInvalidNumberChars}
                                autoComplete="off" />
                        </Grid>
                    )}

                    {/* Product Name */}
                    {fieldConfig["Product Name"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField required={fieldConfig["Product Name"]?.required} fullWidth size='small' value={formData.productName} error={!!validation.productName} helperText={validation.productName ? validation.productName : null}
                                onChange={(e) => {
                                    const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                    handleChange("productName", onlyText)
                                }} variant='outlined'
                                label={fieldConfig["Product Name"]?.label || `${prodLabel} Name`}
                                placeholder={`Enter ${fieldConfig["Product Name"]?.label || `${prodLabel} Name`}`} />
                        </Grid>
                    )}

                    {/* Stockist Price (PTS) */}
                    {fieldConfig["Stockist Price (PTS)"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField type='number' required={fieldConfig["Stockist Price (PTS)"]?.required} fullWidth size='small' variant='outlined' value={formData.pts} error={!!validation.pts} helperText={validation.pts ? validation.pts : null}
                                onChange={(e) => handleChange("pts", e.target.value)}
                                label={fieldConfig["Stockist Price (PTS)"]?.label || `${stkLabel} Price (PTS)`}
                                placeholder={`Enter ${fieldConfig["Stockist Price (PTS)"]?.label || "Stock Price"}`}
                                onKeyDown={blockInvalidNumberChars}
                                autoComplete="off" />
                        </Grid>
                    )}

                    {/* UOM */}
                    {fieldConfig["UOM"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField required={fieldConfig["UOM"]?.required} fullWidth size='small' variant='outlined'
                                label={fieldConfig["UOM"]?.label || "UOM"} value={formData.uom}
                                error={!!validation.uom} helperText={validation.uom ? validation.uom : null}
                                onChange={(e) => {
                                    const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                    handleChange("uom", onlyText)
                                }} placeholder={`Enter ${fieldConfig["UOM"]?.label || "UOM"}`} />
                        </Grid>
                    )}

                    {/* Short Name */}
                    {fieldConfig["Short Name"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField required={fieldConfig["Short Name"]?.required} fullWidth size='small' variant='outlined' value={formData.shortName} error={!!validation.shortName} helperText={validation.shortName ? validation.shortName : null}
                                onChange={(e) => {
                                    const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                    handleChange("shortName", onlyText)
                                }}
                                label={fieldConfig["Short Name"]?.label || "Short Name"}
                                placeholder={`Enter ${fieldConfig["Short Name"]?.label || "Short Name"}`} />
                        </Grid>
                    )}

                    {/* Retail Price (PTR) */}
                    {fieldConfig["Retail Price (PTR)"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField type='number' required={fieldConfig["Retail Price (PTR)"]?.required} fullWidth size='small' variant='outlined' value={formData.ptr} error={!!validation.ptr} helperText={validation.ptr ? validation.ptr : null}
                                onChange={(e) => handleChange("ptr", e.target.value)}
                                label={fieldConfig["Retail Price (PTR)"]?.label || "Retail Price (PTR)"}
                                placeholder={`Enter ${fieldConfig["Retail Price (PTR)"]?.label || "Retail Price"}`}
                                onKeyDown={blockInvalidNumberChars}
                                autoComplete="off" />
                        </Grid>
                    )}

                    {/* Unit Convertion */}
                    {fieldConfig["Unit Convertion"]?.show && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField type='number' required={fieldConfig["Unit Convertion"]?.required} fullWidth size='small' variant='outlined' value={formData.unitConvertion}
                                error={!!validation.unitConvertion} helperText={validation.unitConvertion ? validation.unitConvertion : null}
                                onChange={(e) => handleChange("unitConvertion", e.target.value)}
                                label={fieldConfig["Unit Convertion"]?.label || "Unit Convertion"}
                                placeholder={`Enter ${fieldConfig["Unit Convertion"]?.label || "Unit"}`}
                                onKeyDown={blockInvalidNumberChars}
                                autoComplete="off" />
                        </Grid>
                    )}
                    {/* priciple supplier */}
                    {fieldConfig["Principle Supplier"]?.show && (
                         <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                         <FormControl fullWidth size="small" required={fieldConfig["Principle Supplier"]?.required}>
                         <InputLabel id="princsupp">{fieldConfig["Principle Supplier"]?.label}</InputLabel>
                         <Select labelId='princsupp' label={fieldConfig["Principle Supplier"]?.label} MenuProps={menuStyle}
                             value={formData.principleSupplier ?? "0"} onChange={(e) => handleChange("principleSupplier", e.target.value)} error={!!validation.principleSupplier}>
                         <MenuItem value="0">Select Principle Supplier</MenuItem>
                         {princsupoption.map((val)=>(
                            <MenuItem value={val.id} key={val.id}>{val.prod_main_name}</MenuItem>
                         ))}

                         </Select>
                         {validation.principleSupplier && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.principleSupplier}</span>}
                         </FormControl>

                         </Grid>
                    )}
                    {/* parent product */}
                    {fieldConfig['Parent Name']?.show &&(
                      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                     <FormControl fullWidth size="small" required={fieldConfig['Parent Name']?.required}>
                     <InputLabel id="parentname">{fieldConfig['Parent Name']?.label}</InputLabel>
                     <Select labelId='parentname' label={fieldConfig['Parent Name']?.label} MenuProps={menuStyle}
                         value={formData.parentName ?? "0"} onChange={(e) => handleChange("parentName", e.target.value)} error={!!validation.parentName}>
                     <MenuItem value="0">Select Product Name</MenuItem>
                     {parentprodOption.map((val)=>(
                        <MenuItem value={val.id} key={val.id}>{val.prod_name}</MenuItem>
                     ))}
                     </Select>
                     {validation.parentName && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.parentName}</span>}

                     </FormControl>

                      
                      
                      </Grid>
                    )}
                    {/* gst% */}
                    {fieldConfig['GST %']?.show && (
                      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}> 
                      <TextField  
                       label={fieldConfig['GST %']?.label}
                       size='small'
                       fullWidth
                       required={fieldConfig['GST %']?.required}
                       value={formData.gstPercent || ""}
                       onChange={(e) => handleChange("gstPercent", e.target.value)}
                       error={!!validation.gstPercent}
                       helperText={validation.gstPercent ? validation.gstPercent : null}
                      />
                      
                      </Grid>  
                    )}
                </Grid>
                <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-start", md: "flex-end" } }}>
                    {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                        <Button onClick={() => showSubmitConfirmation()}
                            startIcon={<ImDownload3 style={{ height: "15px" }} />}
                            variant='contained' color="primary">
                            Create
                        </Button>
                    )}
                    {(decodedId && [0, 2].includes(Number(accStat))) && (
                        <Button onClick={() => showSubmitConfirmation()}
                            startIcon={<ImDownload3 style={{ height: "15px" }} />}
                            variant='contained' color="primary" disabled={!isEdited}>
                            Update
                        </Button>
                    )}
                </Box>
            </Box>
            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={confirmationDialog.loading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout>
    )
}

export default AddProduct