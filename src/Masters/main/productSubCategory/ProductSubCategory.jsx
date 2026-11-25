import React, { useEffect, useState, useCallback, useMemo } from 'react'
import Layout from '../../../layout'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Typography } from '@mui/material'
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

const SUBCAT_MASTER_ID = 4;

const formFields = {
    category: "",
    categoryName: "",
    businessUnit: "",
    subcode: "",
    subcolor: "",
}

const validationFields = {
    category: "",
    categoryName: "",
    businessUnit: "",
    subcode: "",
    subcolor: "",
}

const errStyle = { color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }

const ProductSubCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [catData, setCatData] = useState([])
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);
    const [buOption, setBuOption] = useState([])
    const [fieldConfig, setFieldConfig] = useState({});

    const subCatLabel = masterPanel["PSUB"] || "Product Sub Category";
    const catLabel = masterPanel["PCAT"] || "Category";
    usePageTitle(subCatLabel)

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
                    menu_url: "masters/catSub",
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
                const res = await axios.post("/getmasterLabelMas", { moduletype: SUBCAT_MASTER_ID });
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

    const [formData, setFormData] = useState(formFields)
    const [validation, setValidations] = useState(validationFields)
    const [original, setoriginal] = useState({
        category: "",
        catname: "",
        businessUnit: "",
        subcode: "",
        subcolor: "",
    })

    const decodedId = id ? atob(id) : null;

    const showAlert = useToast();

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
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} ${subCatLabel}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete ${subCatLabel}`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    const validations = () => {
        let isValid = true;
        const newValidations = { ...validationFields }

        const isReq = (key) => fieldConfig[key]?.show && fieldConfig[key]?.required;
        const isEmpty = (v) => v === "" || v === null || v === undefined || (typeof v === "string" && v.trim() === "");

        if (isReq("Product Category") && isEmpty(formData.category)) {
            newValidations.category = `The ${fieldConfig["Product Category"]?.label || catLabel} field is required`;
            isValid = false;
        }

        if (fieldConfig["Sub Category Code"]?.show) {
            const codeLabel = fieldConfig["Sub Category Code"]?.label || `${subCatLabel} Code`;
            if (isReq("Sub Category Code") && isEmpty(formData.subcode)) {
                newValidations.subcode = `The ${codeLabel} field is required.`;
                isValid = false;
            } else if (!isEmpty(formData.subcode) && /[^a-zA-Z0-9_\-\/ ]/.test(formData.subcode)) {
                newValidations.subcode = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
                isValid = false;
            }
        }

        if (fieldConfig["Sub Category Name"]?.show) {
            const nameLabel = fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`;
            if (isReq("Sub Category Name") && isEmpty(formData.categoryName)) {
                newValidations.categoryName = `The ${nameLabel} field is required.`;
                isValid = false;
            } else if (!isEmpty(formData.categoryName) && /[^a-zA-Z0-9_\-\/ ]/.test(formData.categoryName)) {
                newValidations.categoryName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
                isValid = false;
            }
        }

        if (fieldConfig["Sub Category Color"]?.show) {
            const colorLabel = fieldConfig["Sub Category Color"]?.label || `${subCatLabel} Color`;
            if (isReq("Sub Category Color") && isEmpty(formData.subcolor)) {
                newValidations.subcolor = `The ${colorLabel} field is required.`;
                isValid = false;
            } else if (!isEmpty(formData.subcolor) && !/^#[0-9a-fA-F]{6}$/.test(formData.subcolor)) {
                newValidations.subcolor = "Invalid color";
                isValid = false;
            }
        }

        if (isReq("Business Unit") && isEmpty(formData.businessUnit)) {
            newValidations.businessUnit = `The ${fieldConfig["Business Unit"]?.label || "Business Unit"} field is required`;
            isValid = false;
        }

        setValidations(newValidations)
        return isValid;
    }

    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/catSub/${btoa(encodeId)}`)
    }

    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                cat_id: formData.category,
                sub_name: formData.categoryName,
                sub_code: formData.subcode,
                sub_color: formData.subcolor,
                bu_id: Number(formData.businessUnit) || 0,
            }
            const res = await axios.post("/addCatSub", payload)
            if (res?.data?.success) {
                showAlert.success(`${subCatLabel} Added Successfully`)
                setFormData(formFields);
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) setValidations(prev => ({ ...prev, category: val?.message || "" }));
                else if (val?.type === 2) setValidations(prev => ({ ...prev, categoryName: val?.message || "" }));
                else if (val?.type === 3) setValidations(prev => ({ ...prev, businessUnit: val?.message || "" }));
                else if (val?.type === 4) setValidations(prev => ({ ...prev, subcode: val?.message || "" }));
                else if (val?.type === 5) setValidations(prev => ({ ...prev, subcolor: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to ADD ${subCatLabel}`)
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    const onEdit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                id: decodedId,
                cat_id: formData.category,
                hdnSubName: original.catname,
                sub_name: formData.categoryName,
                sub_code: formData.subcode,
                sub_color: formData.subcolor,
                bu_id: Number(formData.businessUnit) || 0,
            }
            const res = await axios.post("/subCatEdit", payload)
            if (res?.data?.success) {
                showAlert.success(`${subCatLabel} Updated Successfully`)
                setFormData(formFields);
                setValue('1')
                navigate(`/masters/catSub`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) setValidations(prev => ({ ...prev, category: val?.message || "" }));
                else if (val?.type === 2) setValidations(prev => ({ ...prev, categoryName: val?.message || "" }));
                else if (val?.type === 3) setValidations(prev => ({ ...prev, businessUnit: val?.message || "" }));
                else if (val?.type === 4) setValidations(prev => ({ ...prev, subcode: val?.message || "" }));
                else if (val?.type === 5) setValidations(prev => ({ ...prev, subcolor: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${subCatLabel}`)
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editCatSub", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                const bu = data[0]?.bu_id ? data[0].bu_id : "";
                setFormData({
                    category: data[0]?.cat_id || "",
                    categoryName: data[0]?.sub_name || "",
                    businessUnit: bu,
                    subcode: data[0]?.sub_code || "",
                    subcolor: data[0]?.sub_color || "",
                });
                setoriginal({
                    category: data[0]?.cat_id || "",
                    catname: data[0]?.sub_name || "",
                    businessUnit: bu,
                    subcode: data[0]?.sub_code || "",
                    subcolor: data[0]?.sub_color || "",
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

    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/deleteCatSub/${id}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${subCatLabel}`)
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error(error?.response?.data?.message || "failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    const columns = useMemo(() => {
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
                headerName: fieldConfig["Business Unit"]?.label || "Business Unit",
                filterable: true,
                sortable: true,
                width:30,
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

        // Product Category column (only if enabled in config)
        if (fieldConfig["Product Category"]?.show) {
            cols.push({
                field: "cat_name",
                headerName: `${fieldConfig["Product Category"]?.label || catLabel} Name`,
                filterable: true,
                sortable: true,
                 width:30,
            });
        }

        // Sub Category Code column (only if enabled in config)
        if (fieldConfig["Sub Category Code"]?.show) {
            cols.push({
                field: "sub_code",
                headerName: fieldConfig["Sub Category Code"]?.label || `${subCatLabel} Code`,
                filterable: true,
                sortable: true,
                width:30,
            });
        }

        // Sub Category Name column (only if enabled in config)
        if (fieldConfig["Sub Category Name"]?.show) {
            cols.push({
                field: "sub_name",
                headerName: fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`,
                filterable: true,
                sortable: true,
            });
        }

        // Sub Category Color column (only if enabled in config)
        if (fieldConfig["Sub Category Color"]?.show) {
            cols.push({
                field: "sub_color",
                headerName: fieldConfig["Sub Category Color"]?.label || `${subCatLabel} Color`,
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
    }, [fieldConfig, buOption, accStat, subCatLabel, catLabel]);

    // width grows with the number of visible data columns (min 60%, max 100% on lg)
    const dataColumnCount = columns.filter(
        (c) => c.field !== "index" && c.field !== "action"
    ).length;

    const lgWidth = value === '2'
        ? `${Math.min(100, Math.max(60, 40 + dataColumnCount * 10))}%`
        : '60%';

    const fetchCategory = async () => {
        try {
            const res = await axios.post("/getCategory");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
            setCatData(data);
        } catch (error) {
            console.error(error);
            setCatData([]);
        }
    }

    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getSubCat");
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

    useEffect(() => {
        fetchTableData();
        fetchCategory();
        fetchBuData();
    }, []);

    useEffect(() => {
        if (!decodedId) {
            setFormData(formFields);
            setoriginal({ category: "", catname: "", businessUnit: "", subcode: "", subcolor: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    const isEdited =
        String(formData.category) !== String(original.category) ||
        formData.categoryName.trim() !== original.catname.trim() ||
        String(formData.businessUnit ?? "") !== String(original.businessUnit ?? "") ||
        String(formData.subcode ?? "").trim() !== String(original.subcode ?? "").trim() ||
        String(formData.subcolor ?? "") !== String(original.subcolor ?? "");

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: subCatLabel },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{subCatLabel}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: lgWidth, md: '90%', sm: '98%', xs: '98%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {subCatLabel}</Typography>
                        }
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
                                {fieldConfig["Product Category"]?.show && (
                                    <FormControl fullWidth size="small" required={fieldConfig["Product Category"]?.required}>
                                        <InputLabel id="Category">{fieldConfig["Product Category"]?.label || catLabel}</InputLabel>
                                        <Select id='Category-select' label={fieldConfig["Product Category"]?.label || catLabel} labelId="Category" variant="outlined"
                                            value={formData.category} error={!!validation.category} MenuProps={menuStyle}
                                            onChange={(e) => formDataChange("category", e.target.value)}
                                        >
                                            <MenuItem style={{ fontSize: "11px" }} value="">Select {fieldConfig["Product Category"]?.label || catLabel}</MenuItem>
                                            {catData?.map((item, index) => (
                                                <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>
                                                    {item?.cat_name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {validation.category && <span style={errStyle}>{validation.category}</span>}
                                    </FormControl>
                                )}
                                {fieldConfig["Sub Category Code"]?.show && (
                                    <TextField
                                        value={formData.subcode}
                                        onChange={(e) => {
                                            const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                            formDataChange("subcode", onlyText)
                                        }}
                                        required={fieldConfig["Sub Category Code"]?.required}
                                        size='small'
                                        variant='outlined'
                                        label={fieldConfig["Sub Category Code"]?.label || `${subCatLabel} Code`}
                                        placeholder={`Enter ${fieldConfig["Sub Category Code"]?.label || `${subCatLabel} Code`}`}
                                        error={!!validation.subcode}
                                        helperText={validation.subcode && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.subcode}</span>} />
                                )}
                                {fieldConfig["Sub Category Name"]?.show && (
                                    <TextField
                                        value={formData.categoryName}
                                        onChange={(e) => {
                                            const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                            formDataChange("categoryName", onlyText)
                                        }}
                                        required={fieldConfig["Sub Category Name"]?.required}
                                        size='small'
                                        variant='outlined'
                                        label={fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`}
                                        placeholder={`Enter ${fieldConfig["Sub Category Name"]?.label || `${subCatLabel} Name`}`}
                                        error={!!validation.categoryName}
                                        helperText={validation.categoryName && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.categoryName}</span>} />
                                )}
                                {fieldConfig["Sub Category Color"]?.show && (
                                <TextField
                                    value={formData.subcolor}
                                    onChange={(e) => formDataChange("subcolor", e.target.value)}
                                    required={fieldConfig["Sub Category Color"]?.required}
                                    size='small'
                                    variant='outlined'
                                    label={fieldConfig["Sub Category Color"]?.label || `${subCatLabel} Color`}
                                    InputLabelProps={{ shrink: true }}
                                    error={!!validation.subcolor}
                                    helperText={validation.subcolor && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.subcolor}</span>} />
                             )}
                            </Box>
                            {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained'>Submit</Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained' disabled={!isEdited}>Update</Button>
                            )}
                        </TabPanel>
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
export default ProductSubCategory