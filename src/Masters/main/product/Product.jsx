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
const columnStyle = { display: "flex", flexDirection: "column", gap: 2 }
const priceFields = ["fac_price", "stk_price", "retail_price", "mrp_price"];

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
    pts: "",
    ptr: "",
    mrp: "",
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

    /*----------form validations ---------*/
    const validations = () => {
        let isValid = true;
        const nv = { ...validationFields }
        if (!formData.productName || formData.productName.trim() === "") {
            nv.productName = `The ${prodLabel} Name field is required`;
            isValid = false;
        }
        if (formData.subCatName === "" || formData.subCatName == null) {
            nv.subCatName = `The ${subCatLabel} Name field is required`;
            isValid = false;
        }
        if (!formData.shortName || formData.shortName.trim() === "") {
            nv.shortName = "The Short Code field is required";
            isValid = false;
        }
        if (!formData.code || formData.code.trim() === "") {
            nv.code = `The ${prodLabel} Code field is required`;
            isValid = false;
        }
        if (formData.asp === "" || formData.asp == null) {
            nv.asp = "The Ex Factory Price field is required";
            isValid = false;
        }
        if (formData.pts === "" || formData.pts == null) {
            nv.pts = `The ${stkLabel} Price field is required`;
            isValid = false;
        }
        if (formData.ptr === "" || formData.ptr == null) {
            nv.ptr = "The Retail Price field is required";
            isValid = false;
        }
        if (formData.mrp === "" || formData.mrp == null) {
            nv.mrp = "The MRP Price field is required";
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

    /* ---------- text field helper (same MUI floating-label field as before) ---------- */
    const tf = (name, { label, required, numeric, sanitize, placeholder } = {}) => (
        <TextField fullWidth size="small" variant="outlined" required={required}
            label={label} placeholder={placeholder} value={formData[name]}
            type={numeric ? 'number' : 'text'} autoComplete="off"
            error={!!validation[name]} helperText={validation[name] || null}
            onKeyDown={numeric ? blockInvalidNumberChars : undefined}
            onChange={(e) => {
                let v = e.target.value;
                if (sanitize) v = v.replace(/[^a-zA-Z0-9_\-\/ ]/g, "");
                handleChange(name, v.replace(/^\s+/, ""));
            }} />
    );

    /*---------- table columns (same as PHP list) ---------*/
    const columns = [
        { field: "index", headerName: "#" },
        { field: "prod_name", headerName: `${prodLabel} Name` },
        { field: "prod_code", headerName: `${prodLabel} Code` },
        { field: "sub_name", headerName: `${subCatLabel} Name` },
        { field: "fac_price", headerName: "Factory Price" },
        { field: "stk_price", headerName: `${stkLabel} Price` },
        { field: "retail_price", headerName: "Retail Price" },
        { field: "mrp_price", headerName: "MRP" },
        { field: "pack_pcs", headerName: "Pcs Per Pack" },
        { field: "cart_pcs", headerName: "Pcs Per Carton" },
        { field: "prod_uom", headerName: "UOM" },
        { field: "unit_conv", headerName: "Unit Conversion" },
    ].map((col) => ({
        ...col,
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
                            <Grid container spacing={3}>
                                {/* ---------- column 1 ---------- */}
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Box sx={columnStyle}>
                                        {tf("productName", { label: `${prodLabel} Name`, required: true, sanitize: true, placeholder: `Enter ${prodLabel} Name` })}
                                        {tf("code", { label: `${prodLabel} Code`, required: true, sanitize: true, placeholder: `Enter ${prodLabel} Code` })}

                                        <FormControl fullWidth size="small" required>
                                            <InputLabel id="ProductType">{prodLabel} Type</InputLabel>
                                            <Select id='ProductType' label={`${prodLabel} Type`} error={!!validation.productType}
                                                labelId="ProductType" variant="outlined"
                                                value={formData.productType} onChange={(e) => handleChange("productType", e.target.value)}>
                                                <MenuItem style={{ fontSize: "11px" }} value="0">Existing</MenuItem>
                                                <MenuItem style={{ fontSize: "11px" }} value="1">New Launch</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth size="small">
                                            <InputLabel id="SubCategoryName">{subCatLabel} Name*</InputLabel>
                                            <Select id='SubCategoryName' label={`${subCatLabel} Name*`} value={formData.subCatName} MenuProps={menuStyle}
                                                onChange={(e) => handleChange("subCatName", e.target.value)} error={!!validation.subCatName}
                                                labelId="SubCategoryName" variant="outlined">
                                                <MenuItem style={{ fontSize: "11px" }} value="">Select {subCatLabel}</MenuItem>
                                                {subCat?.map((item, index) => (
                                                    <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.sub_name}</MenuItem>
                                                ))}
                                            </Select>
                                            {validation.subCatName && <span style={{ color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }}>{validation.subCatName}</span>}
                                        </FormControl>

                                        {tf("shortName", { label: "Short Code", required: true, sanitize: true, placeholder: "Enter Short Code" })}
                                        {tf("sortingOrder", { label: "Sorting Order", numeric: true, placeholder: "Enter Sorting Order" })}
                                    </Box>
                                </Grid>

                                {/* ---------- column 2 ---------- */}
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Box sx={columnStyle}>
                                        {tf("variant", { label: "Size", placeholder: "Enter Size" })}
                                        {tf("asp", { label: "Ex Factory (ASP)", required: true, numeric: true, placeholder: "Enter Factory Price" })}
                                        {tf("cfa", { label: "CFA/ Superstockist", numeric: true, placeholder: "Enter Super Stock-list" })}
                                        {tf("pts", { label: `${stkLabel} Price (PTS)`, required: true, numeric: true, placeholder: "Enter Stock Price" })}
                                        {tf("ptr", { label: "Retail Price (PTR)", required: true, numeric: true, placeholder: "Enter Retail Price" })}
                                        {tf("mrp", { label: "MRP", required: true, numeric: true, placeholder: "Enter MRP Price" })}
                                    </Box>
                                </Grid>

                                {/* ---------- column 3 ---------- */}
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <Box sx={columnStyle}>
                                        {tf("pcsPerPack", { label: "Pcs Per Pack", numeric: true, placeholder: "Enter Pack Value" })}
                                        {tf("pcsPerCarton", { label: "Pcs Per Carton", numeric: true, placeholder: "Enter Carton Value" })}
                                        {tf("uom", { label: "UOM", sanitize: true, placeholder: "Enter UOM" })}
                                        {tf("unitConvertion", { label: "Unit Convertion", numeric: true, placeholder: "Enter Unit" })}
                                    </Box>
                                </Grid>
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