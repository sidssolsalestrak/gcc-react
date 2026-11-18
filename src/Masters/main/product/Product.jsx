import React, { useEffect, useState, useCallback } from 'react'
import Layout from '../../../layout'
import { Box, Button, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { MdOutlineEdit } from 'react-icons/md';
import DeleteIcon from "@mui/icons-material/Delete";
import { ImDownload3 } from "react-icons/im";
import DataTable from '../../../utils/dataTable';
import fetchSubCat from "./fetchSubCat";
import ConfirmationDialog from "../../../utils/confirmDialog";
import useToast from "../../../utils/useToast";
import axios from "../../../services/api";
import { getMasterPanel } from "../../../services/masterPanelService";
import FormatCurrency from "../../../utils/formatCurrency";
import usePageTitle from '../../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }
const renderCellStyle = { width: "100%", display: "flex", justifyContent: "center" }
const menuStyle = { PaperProps: { style: { maxHeight: 200 } } }
const priceFields = ["fac_price", "stk_price", "retail_price", "mrp_price"];
const errorTextStyle = { color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" };

// master_label_mas.master_id for "Product"
const PRODUCT_MASTER_ID = 5;

const formFields = {
    productType: "0",
    productName: "",
    subCatName: "",
    shortName: "",
    code: "",
    variant: "",
    sortingOrder: "",
    asp: "",
    cfa: "",
    pts: "",
    ptr: "",
    mrp: "",
    gst: "",
    pcsPerPack: "",
    pcsPerCarton: "",
    uom: "",
    unitConvertion: "",
}

const validationFields = {
    productType: "",
    productName: "",
    subCatName: "",
    shortName: "",
    code: "",
    variant: "",
    asp: "",
    cfa: "",
    pts: "",
    ptr: "",
    mrp: "",
    gst: "",
}

const Product = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [value, setValue] = useState('1');
    const [tableData, settableData] = useState([]);
    const [loading, setLoading] = useState(true);
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
                const res = await axios.post("/getAccStat", { menu_url: "masters/prod_mas" });
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

    const [formData, setFormData] = useState(formFields)
    const [original, setoriginal] = useState(formFields)
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
        setConfirmationDialog({ ...confirmationDialog, ...config, open: true });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({ ...confirmationDialog, open: false, loading: false });
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

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete ${prodLabel}`,
            message: `Are you sure you want to delete this ${prodLabel}?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteProduct(row),
        });
    };

    /*----------form validations: only for fields that are shown AND mandatory in master_label_mas ---------*/
    const validations = () => {
        let isValid = true;
        const nv = { ...validationFields }

        if (fieldConfig["Product Name"]?.show && fieldConfig["Product Name"]?.required && !formData.productName.trim()) {
            nv.productName = `The ${fieldConfig["Product Name"]?.label || `${prodLabel} Name`} field is required`;
            isValid = false;
        }
        if (fieldConfig["Code"]?.show && fieldConfig["Code"]?.required && !formData.code.trim()) {
            nv.code = `The ${fieldConfig["Code"]?.label || `${prodLabel} Code`} field is required`;
            isValid = false;
        }
        if (fieldConfig["Product Type"]?.show && fieldConfig["Product Type"]?.required && formData.productType === "") {
            nv.productType = `The ${fieldConfig["Product Type"]?.label || `${prodLabel} Type`} field is required`;
            isValid = false;
        }
        if (fieldConfig["Sub Category Name"]?.show && fieldConfig["Sub Category Name"]?.required && (formData.subCatName === "" || formData.subCatName == null)) {
            nv.subCatName = `The ${fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`} field is required`;
            isValid = false;
        }
        if (fieldConfig["Short Name"]?.show && fieldConfig["Short Name"]?.required && !formData.shortName.trim()) {
            nv.shortName = `The ${fieldConfig["Short Name"]?.label || "Short Code"} field is required`;
            isValid = false;
        }
        if (fieldConfig["Pack Size"]?.show && fieldConfig["Pack Size"]?.required && !formData.variant.trim()) {
            nv.variant = `The ${fieldConfig["Pack Size"]?.label || "Size"} field is required`;
            isValid = false;
        }
        if (fieldConfig["Ex Factory (ASP)"]?.show && fieldConfig["Ex Factory (ASP)"]?.required && (formData.asp === "" || formData.asp == null)) {
            nv.asp = `The ${fieldConfig["Ex Factory (ASP)"]?.label || "Ex Factory (ASP)"} field is required`;
            isValid = false;
        }
        if (fieldConfig["CFA/ Superstockist"]?.show && fieldConfig["CFA/ Superstockist"]?.required && (formData.cfa === "" || formData.cfa == null)) {
            nv.cfa = `The ${fieldConfig["CFA/ Superstockist"]?.label || "CFA/ Superstockist"} field is required`;
            isValid = false;
        }
        if (fieldConfig["Stockist Price (PTS)"]?.show && fieldConfig["Stockist Price (PTS)"]?.required && (formData.pts === "" || formData.pts == null)) {
            nv.pts = `The ${fieldConfig["Stockist Price (PTS)"]?.label || `${stkLabel} Price (PTS)`} field is required`;
            isValid = false;
        }
        if (fieldConfig["Retail Price (PTR)"]?.show && fieldConfig["Retail Price (PTR)"]?.required && (formData.ptr === "" || formData.ptr == null)) {
            nv.ptr = `The ${fieldConfig["Retail Price (PTR)"]?.label || "Retail Price (PTR)"} field is required`;
            isValid = false;
        }
        if (fieldConfig["MRP"]?.show && fieldConfig["MRP"]?.required && (formData.mrp === "" || formData.mrp == null)) {
            nv.mrp = `The ${fieldConfig["MRP"]?.label || "MRP"} field is required`;
            isValid = false;
        }
        if (fieldConfig["GST %"]?.show && fieldConfig["GST %"]?.required && (formData.gst === "" || formData.gst == null)) {
            nv.gst = `The ${fieldConfig["GST %"]?.label || "GST %"} field is required`;
            isValid = false;
        }

        setValidations(nv);
        return isValid;
    }

    const handleChange = (name, val) => {
        setFormData((prev) => ({ ...prev, [name]: val }))
    }

    const resetForm = () => {
        setFormData(formFields);
        setoriginal(formFields);
        setValidations(validationFields);
    }

    /*---------- tab change ---------*/
    const handleTabChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    /*---------- payload ---------*/
    const buildPayload = () => ({
        prod_type: formData.productType,
        prod_name: formData.productName.trim(),
        subcat_id: formData.subCatName,
        sku_code: formData.code.trim(),
        prod_variant: formData.variant.trim(),
        prod_code: formData.shortName.trim(),
        ord_id: Number(formData.sortingOrder) || 0,
        fac_price: Number(formData.asp) || 0,
        wd_price: Number(formData.cfa) || 0,
        stk_price: Number(formData.pts) || 0,
        retail_price: Number(formData.ptr) || 0,
        mrp_price: Number(formData.mrp) || 0,
        tax_per: Number(formData.gst) || 0,
        pack_pcs: Number(formData.pcsPerPack) || 0,
        cart_pcs: Number(formData.pcsPerCarton) || 0,
        prod_uom: formData.uom.trim(),
        unit_conv: Number(formData.unitConvertion) || 0,
    })

    /*---------- table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/prodview");
            const data = Array.isArray(res?.data?.data) ? res.data.data.map((row, index) => ({
                ...row,
                index: index + 1,
            })) : [];
            settableData(data);
        } catch (error) {
            if (error?.response?.status !== 400) console.error(error);
            settableData([]);
        } finally {
            setLoading(false)
        }
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post("/prodmas_create", buildPayload())
            if (res?.data?.success) {
                showAlert.success(`Successfully Added ${prodLabel}`)
                resetForm();
                fetchTableData();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) setValidations(prev => ({ ...prev, productName: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to ADD ${prodLabel}`)
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- edit ---------*/
    const editdata = (row) => {
        const pid = row?.row?.id;            // or whichever key the log shows
        if (pid === undefined || pid === null) {
            showAlert.error("Invalid product id");
            return;
        }
        setValidations(validationFields);
        navigate(`/masters/prodview/${btoa(String(pid))}`);
    }

    // treats 0/undefined/null as empty string
    const zeroToEmpty = (val) => (val === 0 || val === null || val === undefined ? "" : val);

    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editProductData", { id: decodedId })
            const data = res?.data?.data || [];
            if (data.length > 0) {
                const d = data[0];
                const editData = {
                    productType: String(d?.prod_type ?? "0"),
                    productName: d?.prod_name || "",
                    subCatName: d?.subcat_id ?? "",
                    shortName: d?.prod_code || "",
                    code: d?.sku_code || "",
                    variant: d?.prod_variant || "",
                    sortingOrder: zeroToEmpty(d?.ord_id),
                    asp: zeroToEmpty(d?.fac_price),
                    cfa: zeroToEmpty(d?.wd_price),
                    pts: zeroToEmpty(d?.stk_price),
                    ptr: zeroToEmpty(d?.retail_price),
                    mrp: zeroToEmpty(d?.mrp_price),
                    gst: zeroToEmpty(d?.tax_per),
                    pcsPerPack: zeroToEmpty(d?.pack_pcs),
                    pcsPerCarton: zeroToEmpty(d?.cart_pcs),
                    uom: d?.prod_uom || "",
                    unitConvertion: zeroToEmpty(d?.unit_conv),
                };
                setFormData(editData);
                setoriginal(editData);
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    const onEdit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const payload = buildPayload();
            payload.id = decodedId
            payload.prodNameNew = original.productName.trim()
            payload.codeOld = original.code.trim()
            const res = await axios.post("/prodmas_update", payload)
            if (res?.data?.success) {
                showAlert.success(`Successfully updated ${prodLabel}`)
                resetForm();
                setValue('2')
                navigate(`/masters/prodview`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) setValidations(prev => ({ ...prev, productName: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${prodLabel}`)
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- delete ---------*/
    const deleteProduct = async (row) => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/prod_delete/${row?.row?.prodid}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${prodLabel}`)
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error(error?.response?.data?.message || "failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- initial load ---------*/
    useEffect(() => {
        fetchSubCat(setSubCat);
        fetchTableData();
    }, [])

    /*---------- handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            resetForm();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    const blockInvalidNumberChars = (e) => {
        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    };

    const isEdited = Object.keys(formFields).some((key) => {
        const c = formData[key];
        const o = original[key];
        if (typeof c === "string" && typeof o === "string") return c.trim() !== o.trim();
        return String(c ?? "") !== String(o ?? "");
    });

    console.log("gst requiration check",fieldConfig["GST %"])

    /*---------- table columns: a column shows only if its label is visible in master_label_mas ---------*/
    const columns = [
        { field: "index", headerName: "#" },
        { field: "prod_name", label: "Product Name", headerName: `${prodLabel} Name` },
        { field: "prod_code", label: "Short Name", headerName: `${prodLabel} Code` },
        { field: "sub_name", label: "Sub Category Name", headerName: `${subCatLabel} Name` },
        { field: "fac_price", label: "Ex Factory (ASP)", headerName: "Factory Price" },
        { field: "stk_price", label: "Stockist Price (PTS)", headerName: `${stkLabel} Price` },
        { field: "retail_price", label: "Retail Price (PTR)", headerName: "Retail Price" },
        { field: "mrp_price", label: "MRP", headerName: "MRP" },
        { field: "pack_pcs", label: "Pcs Per Pack", headerName: "Pcs Per Pack" },
        { field: "cart_pcs", label: "Pcs Per Carton", headerName: "Pcs Per Carton" },
        { field: "prod_uom", label: "UOM", headerName: "UOM" },
        { field: "unit_conv", label: "Unit Convertion", headerName: "Unit Conversion" },
    ]
        .filter((col) => !col.label || fieldConfig[col.label]?.show)
        .map(({ label, ...col }) => ({
            ...col,
            headerName: (label && fieldConfig[label]?.label) || col.headerName,
            filterable: true,
            sortable: true,
            ...(priceFields.includes(col.field) && {
                renderCell: (params) => (
                    <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
                )
            })
        }))

    columns.push({
        field: "",
        headerName: "Action",
        filterable: true,
        sortable: true,
        width: 100,
        renderCell: (row) => (
            <>
                {[0, 2].includes(Number(accStat)) && (
                    <IconButton className='updateBtn' size="small" onClick={() => editdata(row)}>
                        <MdOutlineEdit size={15} />
                    </IconButton>
                )}
                {[0, 2].includes(Number(accStat)) && (
                    <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row)}>
                        <DeleteIcon size={15} />
                    </IconButton>
                )}
            </>
        )
    })

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: prodLabel },
        ]}>
            <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                <Box>
                    <h1 className="mainTitle">{prodLabel}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleTabChange} aria-label="product tabs">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {prodLabel} Details</Typography>
                        }

                        {/*---------------- Add / Edit section--------------- */}
                        <TabPanel value="1">
                            {/* One container; every field is its own Grid item, so hidden fields never leave a gap */}
                            <Grid container spacing={2} alignItems="flex-start">

                                {/* Product Name */}
                                {fieldConfig["Product Name"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Product Name"]?.label || `${prodLabel} Name`}
                                            placeholder={`Enter ${fieldConfig["Product Name"]?.label || `${prodLabel} Name`}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Product Name"]?.required}
                                            value={formData.productName}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                                handleChange("productName", v);
                                            }}
                                            error={!!validation.productName}
                                            helperText={validation.productName || null}
                                        />
                                    </Grid>
                                )}

                                {/* Code */}
                                {fieldConfig["Code"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Code"]?.label || `${prodLabel} Code`}
                                            placeholder={`Enter ${fieldConfig["Code"]?.label || `${prodLabel} Code`}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Code"]?.required}
                                            value={formData.code}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                                handleChange("code", v);
                                            }}
                                            error={!!validation.code}
                                            helperText={validation.code || null}
                                        />
                                    </Grid>
                                )}

                                {/* Product Type */}
                                {fieldConfig["Product Type"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <FormControl fullWidth size="small" required={fieldConfig["Product Type"]?.required}>
                                            <InputLabel id="ProductType">{fieldConfig["Product Type"]?.label || `${prodLabel} Type`}</InputLabel>
                                            <Select id='ProductType' labelId="ProductType" variant="outlined"
                                                label={fieldConfig["Product Type"]?.label || `${prodLabel} Type`}
                                                error={!!validation.productType}
                                                value={formData.productType}
                                                onChange={(e) => handleChange("productType", e.target.value)}>
                                                <MenuItem style={{ fontSize: "11px" }} value="0">Existing</MenuItem>
                                                <MenuItem style={{ fontSize: "11px" }} value="1">New Launch</MenuItem>
                                            </Select>
                                            {validation.productType && <span style={errorTextStyle}>{validation.productType}</span>}
                                        </FormControl>
                                    </Grid>
                                )}

                                {/* Sub Category Name */}
                                {fieldConfig["Sub Category Name"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <FormControl fullWidth size="small" required={fieldConfig["Sub Category Name"]?.required}>
                                            <InputLabel id="SubCategoryName">{fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`}</InputLabel>
                                            <Select id='SubCategoryName' labelId="SubCategoryName" variant="outlined"
                                                label={fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`}
                                                value={formData.subCatName} MenuProps={menuStyle}
                                                onChange={(e) => handleChange("subCatName", e.target.value)}
                                                error={!!validation.subCatName}>
                                                <MenuItem style={{ fontSize: "11px" }} value="">Select {fieldConfig["Sub Category Name"]?.label || subCatLabel}</MenuItem>
                                                {subCat?.map((item, index) => (
                                                    <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.sub_name}</MenuItem>
                                                ))}
                                            </Select>
                                            {validation.subCatName && <span style={errorTextStyle}>{validation.subCatName}</span>}
                                        </FormControl>
                                    </Grid>
                                )}

                                {/* Short Name */}
                                {fieldConfig["Short Name"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Short Name"]?.label || "Short Code"}
                                            placeholder={`Enter ${fieldConfig["Short Name"]?.label || "Short Code"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Short Name"]?.required}
                                            value={formData.shortName}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                                handleChange("shortName", v);
                                            }}
                                            error={!!validation.shortName}
                                            helperText={validation.shortName || null}
                                        />
                                    </Grid>
                                )}

                                {/* Sorting Order */}
                                {fieldConfig["Sorting Order"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Sorting Order"]?.label || "Sorting Order"}
                                            placeholder={`Enter ${fieldConfig["Sorting Order"]?.label || "Sorting Order"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Sorting Order"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.sortingOrder}
                                            onChange={(e) => handleChange("sortingOrder", e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </Grid>
                                )}

                                {/* Pack Size (variant) */}
                                {fieldConfig["Pack Size"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Pack Size"]?.label || "Size"}
                                            placeholder={`Enter ${fieldConfig["Pack Size"]?.label || "Size"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Pack Size"]?.required}
                                            value={formData.variant}
                                            onChange={(e) => handleChange("variant", e.target.value.replace(/^\s+/, ""))}
                                            error={!!validation.variant}
                                            helperText={validation.variant || null}
                                        />
                                    </Grid>
                                )}

                                {/* Ex Factory (ASP) */}
                                {fieldConfig["Ex Factory (ASP)"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Ex Factory (ASP)"]?.label || "Ex Factory (ASP)"}
                                            placeholder={`Enter ${fieldConfig["Ex Factory (ASP)"]?.label || "Factory Price"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Ex Factory (ASP)"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.asp}
                                            onChange={(e) => handleChange("asp", e.target.value.replace(/^\s+/, ""))}
                                            error={!!validation.asp}
                                            helperText={validation.asp || null}
                                        />
                                    </Grid>
                                )}

                                {/* CFA / Superstockist */}
                                {fieldConfig["CFA/ Superstockist"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["CFA/ Superstockist"]?.label || "CFA/ Superstockist"}
                                            placeholder={`Enter ${fieldConfig["CFA/ Superstockist"]?.label || "Super Stock-list"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["CFA/ Superstockist"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.cfa}
                                            onChange={(e) => handleChange("cfa", e.target.value.replace(/^\s+/, ""))}
                                            error={!!validation.cfa}
                                            helperText={validation.cfa || null}
                                        />
                                    </Grid>
                                )}

                                {/* Stockist Price (PTS) */}
                                {fieldConfig["Stockist Price (PTS)"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Stockist Price (PTS)"]?.label || `${stkLabel} Price (PTS)`}
                                            placeholder={`Enter ${fieldConfig["Stockist Price (PTS)"]?.label || "Stock Price"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Stockist Price (PTS)"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.pts}
                                            onChange={(e) => handleChange("pts", e.target.value.replace(/^\s+/, ""))}
                                            error={!!validation.pts}
                                            helperText={validation.pts || null}
                                        />
                                    </Grid>
                                )}

                                {/* Retail Price (PTR) */}
                                {fieldConfig["Retail Price (PTR)"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Retail Price (PTR)"]?.label || "Retail Price (PTR)"}
                                            placeholder={`Enter ${fieldConfig["Retail Price (PTR)"]?.label || "Retail Price"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Retail Price (PTR)"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.ptr}
                                            onChange={(e) => handleChange("ptr", e.target.value.replace(/^\s+/, ""))}
                                            error={!!validation.ptr}
                                            helperText={validation.ptr || null}
                                        />
                                    </Grid>
                                )}

                                {/* MRP */}
                                {fieldConfig["MRP"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["MRP"]?.label || "MRP"}
                                            placeholder={`Enter ${fieldConfig["MRP"]?.label || "MRP Price"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["MRP"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.mrp}
                                            onChange={(e) => handleChange("mrp", e.target.value.replace(/^\s+/, ""))}
                                            error={!!validation.mrp}
                                            helperText={validation.mrp || null}
                                        />
                                    </Grid>
                                )}

                                {/* GST % */}
                                {fieldConfig["GST %"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["GST %"]?.label || "GST %"}
                                            placeholder={`Enter ${fieldConfig["GST %"]?.label || "GST %"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["GST %"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.gst}
                                            onChange={(e) => handleChange("gst", e.target.value.replace(/^\s+/, ""))}
                                            error={!!validation.gst}
                                            helperText={validation.gst || null}
                                        />
                                    </Grid>
                                )}

                                {/* Pcs Per Pack */}
                                {fieldConfig["Pcs Per Pack"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Pcs Per Pack"]?.label || "Pcs Per Pack"}
                                            placeholder={`Enter ${fieldConfig["Pcs Per Pack"]?.label || "Pack Value"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Pcs Per Pack"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.pcsPerPack}
                                            onChange={(e) => handleChange("pcsPerPack", e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </Grid>
                                )}

                                {/* Pcs Per Carton */}
                                {fieldConfig["Pcs Per Carton"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Pcs Per Carton"]?.label || "Pcs Per Carton"}
                                            placeholder={`Enter ${fieldConfig["Pcs Per Carton"]?.label || "Carton Value"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Pcs Per Carton"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.pcsPerCarton}
                                            onChange={(e) => handleChange("pcsPerCarton", e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </Grid>
                                )}

                                {/* UOM */}
                                {fieldConfig["UOM"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["UOM"]?.label || "UOM"}
                                            placeholder={`Enter ${fieldConfig["UOM"]?.label || "UOM"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["UOM"]?.required}
                                            value={formData.uom}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                                handleChange("uom", v);
                                            }}
                                        />
                                    </Grid>
                                )}

                                {/* Unit Convertion */}
                                {fieldConfig["Unit Convertion"]?.show && (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <TextField
                                            label={fieldConfig["Unit Convertion"]?.label || "Unit Convertion"}
                                            placeholder={`Enter ${fieldConfig["Unit Convertion"]?.label || "Unit"}`}
                                            fullWidth size="small" variant="outlined" autoComplete="off"
                                            required={fieldConfig["Unit Convertion"]?.required}
                                            type="number"
                                            onKeyDown={blockInvalidNumberChars}
                                            value={formData.unitConvertion}
                                            onChange={(e) => handleChange("unitConvertion", e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </Grid>
                                )}
                            </Grid>

                            {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2 }}
                                    startIcon={<ImDownload3 style={{ height: "15px" }} />}
                                    color="primary" variant='contained'>Submit</Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2 }}
                                    startIcon={<ImDownload3 style={{ height: "15px" }} />}
                                    color="primary" variant='contained' disabled={!isEdited}>Update</Button>
                            )}
                        </TabPanel>

                        {/*---------------- View section--------------- */}
                        <TabPanel value="2" sx={{ padding: 0 }}>
                            <DataTable columns={columns} data={tableData} loading={loading} />
                        </TabPanel>
                    </TabContext>
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

export default Product