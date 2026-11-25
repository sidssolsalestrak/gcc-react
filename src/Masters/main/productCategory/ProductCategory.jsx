import React, { useEffect, useState, useCallback, useMemo } from 'react'
import Layout from '../../../layout'
import { Box, TextField, Button, IconButton, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import axios from "../../../services/api";
import { MdOutlineEdit } from 'react-icons/md';
import DeleteIcon from "@mui/icons-material/Delete";
import useToast from "../../../utils/useToast";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmationDialog from "../../../utils/confirmDialog";
import { getMasterPanel } from "../../../services/masterPanelService";
import usePageTitle from '../../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const menuStyle = {
    PaperProps: {
        style: {
            maxHeight: 200
        }
    }
}

const CAT_MASTER_ID = 3;

const formFields = {
    businessUnit: "",
    productRange: "",
    categoryCode: "",
    categoryName: "",
}

const validationFields = {
    businessUnit: "",
    productRange: "",
    categoryCode: "",
    categoryName: "",
}

const errStyle = { color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }

const ProductCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([]);
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);
    const [buOption, setBuOption] = useState([])
    const [rangeOption, setRangeOption] = useState([])
    const [fieldConfig, setFieldConfig] = useState({});

    usePageTitle(masterPanel["PCAT"] || "Product Category")

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
                    menu_url: "masters/cat",
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

    useEffect(() => {
        const loadDynamicForm = async () => {
            try {
                const res = await axios.post("/getmasterLabelMas", { moduletype: CAT_MASTER_ID });
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

    /*---------- form fields ---------*/
    const [formData, setFormData] = useState(formFields)
    /*---------- original cat name for edit---------*/
    const [original, setoriginal] = useState({
        catname: "",
        businessUnit: "",
        productRange: "",
        categoryCode: "",
    })
    /*---------- form validations ---------*/
    const [validation, setValidations] = useState(validationFields)
    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

    /*---------- re usable toast ---------*/
    const showAlert = useToast();

    /*---------- reset validations ---------*/
    const resetValidations = () => {
        setValidations(validationFields)
    }
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
            loading: false,
        });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        const label = masterPanel["PCAT"] || "Product Category";
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} ${label}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Category`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    /*---------- check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = { ...validationFields }

        const label = masterPanel["PCAT"] || "Product Category";
        const isReq = (key) => fieldConfig[key]?.show && fieldConfig[key]?.required;
        const isEmpty = (v) => v === "" || v === null || v === undefined || (typeof v === "string" && v.trim() === "");

        if (isReq("Business Unit") && isEmpty(formData.businessUnit)) {
            newValidations.businessUnit = `The ${fieldConfig["Business Unit"]?.label || "Business Unit"} field is required`;
            isValid = false;
        }

        if (isReq("Product Range") && isEmpty(formData.productRange)) {
            newValidations.productRange = `The ${fieldConfig["Product Range"]?.label || "Product Range"} field is required`;
            isValid = false;
        }

        if (fieldConfig["Category Code"]?.show) {
            const codeLabel = fieldConfig["Category Code"]?.label || `${label} Code`;
            if (isReq("Category Code") && isEmpty(formData.categoryCode)) {
                newValidations.categoryCode = `The ${codeLabel} field is required`;
                isValid = false;
            } else if (!isEmpty(formData.categoryCode) && /[^a-zA-Z0-9_\-\/ ]/.test(formData.categoryCode)) {
                newValidations.categoryCode = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
                isValid = false;
            }
        }

        if (fieldConfig["Category Name"]?.show) {
            const nameLabel = fieldConfig["Category Name"]?.label || `${label} Name`;
            if (isReq("Category Name") && isEmpty(formData.categoryName)) {
                newValidations.categoryName = `The ${nameLabel} field is required`;
                isValid = false;
            } else if (!isEmpty(formData.categoryName) && formData.categoryName.trim().length < 3) {
                newValidations.categoryName = `${nameLabel} must be at least 3 characters`;
                isValid = false;
            } else if (!isEmpty(formData.categoryName) && /[^a-zA-Z0-9_\-\/ ]/.test(formData.categoryName)) {
                newValidations.categoryName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
                isValid = false;
            }
        }

        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                bu_id: Number(formData.businessUnit) || 0,
                range_id: Number(formData.productRange) || 0,
                cat_code: formData.categoryCode,
                cat_name: formData.categoryName
            }
            const res = await axios.post("/addCat", payload)
            if (res?.data?.success) {
                showAlert.success(`${masterPanel["PCAT"] || "Product Category"} Added Successfully`)
                setFormData(formFields);
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) setValidations(prev => ({ ...prev, businessUnit: val?.message || "" }));
                else if (val?.type === 2) setValidations(prev => ({ ...prev, productRange: val?.message || "" }));
                else if (val?.type === 3) setValidations(prev => ({ ...prev, categoryCode: val?.message || "" }));
                else setValidations(prev => ({ ...prev, categoryName: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to ADD ${masterPanel["PCAT"] || "Product Category"}`)
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                id: decodedId,
                hdnCatName: original.catname,
                bu_id: Number(formData.businessUnit) || 0,
                range_id: Number(formData.productRange) || 0,
                cat_code: formData.categoryCode,
                cat_name: formData.categoryName
            }
            const res = await axios.post("/editCat", payload)
            if (res?.data?.success) {
                showAlert.success(`${masterPanel["PCAT"] || "Product Category"} Updated Successfully`)
                setFormData(formFields);
                setValue('1')
                navigate(`/masters/cat`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) setValidations(prev => ({ ...prev, businessUnit: val?.message || "" }));
                else if (val?.type === 2) setValidations(prev => ({ ...prev, productRange: val?.message || "" }));
                else if (val?.type === 3) setValidations(prev => ({ ...prev, categoryCode: val?.message || "" }));
                else setValidations(prev => ({ ...prev, categoryName: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${masterPanel["PCAT"] || "Product Category"}`)
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- for formdata onchange---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    /*---------- for tab change---------*/
    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/cat/${btoa(encodeId)}`)
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/edit", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    businessUnit: data[0]?.bu_id ? data[0].bu_id : "",
                    productRange: data[0]?.brand_id ? data[0].brand_id : "",
                    categoryCode: data[0]?.cat_code || "",
                    categoryName: data[0]?.cat_name || ""
                });
                setoriginal({
                    catname: data[0]?.cat_name || "",
                    businessUnit: data[0]?.bu_id ? data[0].bu_id : "",
                    productRange: data[0]?.brand_id ? data[0].brand_id : "",
                    categoryCode: data[0]?.cat_code || "",
                })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    const fetchBuData = async () => {
        try {
            let response = await axios.post('/getBuisnessUnitData')
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setBuOption(data)
        }
        catch (err) {
            console.log("business fetch Err", err)
        }
    }

    const fetchRangeData = async () => {
        try {
            let response = await axios.post('/getProductRange')
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setRangeOption(data)
        }
        catch (err) {
            console.log("range fetch Err", err)
        }
    }

    /*---------- delete cat ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/deleteCat/${id}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${masterPanel["PCAT"] || "Product Category"}`)
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error(error?.response?.data?.message || "failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- table columns---------*/
    const columns = useMemo(() => {
        const pcat = masterPanel["PCAT"] || "Product Category";
        const buLabel = fieldConfig["Business Unit"]?.label || "Business Unit";
        const rangeLabel = fieldConfig["Product Range"]?.label || "Product Range";
        const codeLabel = fieldConfig["Category Code"]?.label || `${pcat} Code`;
        const nameLabel = fieldConfig["Category Name"]?.label || pcat;

        const cols = [
            {
                field: "index",
                headerName: "#",
                filterable: true,
                sortable: true,
            },
        ];

        // Business Unit column (only if enabled in config)
        if (fieldConfig["Business Unit"]?.show) {
            cols.push({
                field: "bu_name",
                headerName: buLabel,
                filterable: true,
                sortable: true,
                // fallback in case the list API only returns bu_id
                renderCell: (params) => {
                    const row = params?.row ?? params;
                    return (
                        buOption.find((b) => String(b.id) === String(row?.bu_id))?.bu_name ||
                        ""
                        );
                },
            });
        }

        // Product Range column (only if enabled in config)
        if (fieldConfig["Product Range"]?.show) {
            cols.push({
                field: "brand_name",
                headerName: rangeLabel,
                filterable: true,
                sortable: true,
                // fallback in case the list API only returns brand_id
                renderCell: (params) => {
                    const row = params?.row ?? params;
                    return (
                        rangeOption.find((r) => String(r.id) === String(row?.brand_id))?.brand_name ||
                        ""
                    );
                },
            });
        }

        // Category Code column (only if enabled in config)
        if (fieldConfig["Category Code"]?.show) {
            cols.push({
                field: "cat_code",
                headerName: codeLabel,
                filterable: true,
                sortable: true,
            });
        }

        // Category Name column (only if enabled in config)
        if (fieldConfig["Category Name"]?.show) {
            cols.push({
                field: "cat_name",
                headerName: nameLabel,
                filterable: true,
                sortable: true,
            });
        }

        // Action column (permission based)
        if ([0, 2].includes(Number(accStat))) {
            cols.push({
                field: "action",
                headerName: "Action",
                filterable: false,
                sortable: false,
                renderCell: (row) => (
                    <>
                        <IconButton className="updateBtn" size="small" onClick={() => editdata(row)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>
                        <IconButton className="deleteBtn" size="small" onClick={() => showDeleteConfirmation(row)}>
                            <DeleteIcon size={15} />
                        </IconButton>
                    </>
                ),
            });
        }

        return cols;
    }, [fieldConfig, buOption, rangeOption, accStat, masterPanel]);

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getCat");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            settableData(data);
        } catch (error) {
            console.error(error);
            settableData([]);
        } finally {
            setLoading(false)
        }
    }

    /*---------- Fetch table data ---------*/
    useEffect(() => {
        fetchTableData();
        fetchBuData();
        fetchRangeData();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData(formFields);
            setoriginal({ catname: "", businessUnit: "", productRange: "", categoryCode: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    const isEdited =
        formData.categoryName.trim() !== original.catname.trim() ||
        String(formData.businessUnit ?? "") !== String(original.businessUnit ?? "") ||
        String(formData.productRange ?? "") !== String(original.productRange ?? "") ||
        String(formData.categoryCode ?? "").trim() !== String(original.categoryCode ?? "").trim();

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: masterPanel["PCAT"] ? `${masterPanel["PCAT"]}` : "Product Category" },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{masterPanel["PCAT"] || "Product Category"}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {masterPanel["PCAT"]} Details</Typography>
                        }
                        {/*---------------- Add section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {fieldConfig["Business Unit"]?.show && (
                                    <FormControl fullWidth size="small" required={fieldConfig["Business Unit"]?.required}>
                                        <InputLabel id="bulabel">{fieldConfig["Business Unit"]?.label || "Business Unit"}</InputLabel>
                                        <Select labelId="bulabel" label={fieldConfig["Business Unit"]?.label || "Business Unit"} MenuProps={menuStyle}
                                            value={formData.businessUnit || ""} error={!!validation.businessUnit}
                                            onChange={(e) => formDataChange("businessUnit", e.target.value)}>
                                            <MenuItem style={{ fontSize: "11px" }} value="">Select {fieldConfig["Business Unit"]?.label || "Business Unit"}</MenuItem>
                                            {buOption.map((val) => (
                                                <MenuItem style={{ fontSize: "11px" }} value={val.id} key={val.id}>{val.bu_name}</MenuItem>
                                            ))}
                                        </Select>
                                        {validation.businessUnit && <span style={errStyle}>{validation.businessUnit}</span>}
                                    </FormControl>
                                )}
                                {fieldConfig["Product Range"]?.show && (
                                    <FormControl fullWidth size="small" required={fieldConfig["Product Range"]?.required}>
                                        <InputLabel id="rangelabel">{fieldConfig["Product Range"]?.label || "Product Range"}</InputLabel>
                                        <Select labelId="rangelabel" label={fieldConfig["Product Range"]?.label || "Product Range"} MenuProps={menuStyle}
                                            value={formData.productRange || ""} error={!!validation.productRange}
                                            onChange={(e) => formDataChange("productRange", e.target.value)}>
                                            <MenuItem style={{ fontSize: "11px" }} value="">Select {fieldConfig["Product Range"]?.label || "Product Range"}</MenuItem>
                                            {rangeOption.map((val) => (
                                                <MenuItem style={{ fontSize: "11px" }} value={val.id} key={val.id}>{val.brand_name}</MenuItem>
                                            ))}
                                        </Select>
                                        {validation.productRange && <span style={errStyle}>{validation.productRange}</span>}
                                    </FormControl>
                                )}
                                {fieldConfig["Category Code"]?.show && (
                                    <TextField
                                        value={formData.categoryCode}
                                        onChange={(e) => {
                                            const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                            formDataChange("categoryCode", onlyText)
                                        }}
                                        required={fieldConfig["Category Code"]?.required}
                                        size='small'
                                        variant='outlined'
                                        label={fieldConfig["Category Code"]?.label || `${masterPanel["PCAT"] || "Product Category"} Code`}
                                        placeholder={`Enter ${fieldConfig["Category Code"]?.label || `${masterPanel["PCAT"] || "Product Category"} Code`}`}
                                        error={!!validation.categoryCode}
                                        helperText={validation.categoryCode && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.categoryCode}</span>} />
                                )}
                                {fieldConfig["Category Name"]?.show && (
                                    <TextField
                                        value={formData.categoryName}
                                        onChange={(e) => {
                                            const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                            formDataChange("categoryName", onlyText)
                                        }}
                                        required={fieldConfig["Category Name"]?.required}
                                        size='small'
                                        variant='outlined'
                                        label={fieldConfig["Category Name"]?.label || (masterPanel["PCAT"] ? `${masterPanel["PCAT"]} Name` : "Product Category Name")}
                                        placeholder={`Enter ${fieldConfig["Category Name"]?.label || (masterPanel["PCAT"] ? `${masterPanel["PCAT"]} Name` : "Product Category Name")}`}
                                        error={!!validation.categoryName}
                                        helperText={validation.categoryName && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.categoryName}</span>} />
                                )}
                            </Box>
                            {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained'>Submit</Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained' disabled={!isEdited}>Update</Button>
                            )}
                        </TabPanel>
                        {/*---------------- View section--------------- */}
                        <TabPanel value="2" sx={{ padding: 0 }}>
                            <DataTable
                                columns={columns}
                                data={tableData}
                                loading={loading}
                            />
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
export default ProductCategory