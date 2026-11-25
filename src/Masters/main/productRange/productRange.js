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

const CAT_MASTER_ID = 2;

const formFields = {
    businessUnit: "",
    rangeName: "",
}

const validationFields = {
    businessUnit: "",
    rangeName: "",
}

const errStyle = { color: "#d32f2f", fontSize: "9px", padding: "5px 0px 0px 12px" }

const ProductRange = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([]);
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    const [accStat, setAccStat] = useState(null);
    const [buOption, setBuOption] = useState([])
    const [fieldConfig, setFieldConfig] = useState({});
    const [masterPanel, setMasterPanel] = useState({});

    const rangeLabel = fieldConfig["Product Range"]?.label || "Product Range";
    const buLabel = fieldConfig["Business Unit"]?.label || "Business Unit";
    const pageLabel = masterPanel["PRDR"] || rangeLabel;
    usePageTitle(pageLabel)

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
                    menu_url: "masters/range",
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

    const [formData, setFormData] = useState(formFields)
    const [validation, setValidations] = useState(validationFields)
    const [original, setoriginal] = useState({
        rangeName: "",
        businessUnit: "",
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
            title: `${decodedId ? "Edit" : "Add"} ${pageLabel}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete ${pageLabel}`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteRange(row),
        });
    };

    const validations = () => {
        let isValid = true;
        const newValidations = { ...validationFields }

        const isReq = (key) => fieldConfig[key]?.show && fieldConfig[key]?.required;
        const isEmpty = (v) => v === "" || v === null || v === undefined || (typeof v === "string" && v.trim() === "");

        if (isReq("Business Unit") && isEmpty(formData.businessUnit)) {
            newValidations.businessUnit = `The ${buLabel} field is required`;
            isValid = false;
        }

        if (fieldConfig["Product Range"]?.show) {
            if (isReq("Product Range") && isEmpty(formData.rangeName)) {
                newValidations.rangeName = `The ${rangeLabel} field is required`;
                isValid = false;
            } else if (!isEmpty(formData.rangeName) && formData.rangeName.trim().length < 3) {
                newValidations.rangeName = `${rangeLabel} must be at least 3 characters`;
                isValid = false;
            } else if (!isEmpty(formData.rangeName) && /[^a-zA-Z0-9_\-\/ ]/.test(formData.rangeName)) {
                newValidations.rangeName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
                isValid = false;
            }
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
        navigate(`/masters/prod_range/${btoa(encodeId)}`)
    }

    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                bu_id: Number(formData.businessUnit) || 0,
                range_name: formData.rangeName,
            }
            const res = await axios.post("/addRange", payload)
            if (res?.data?.success) {
                showAlert.success(`${pageLabel} Added Successfully`)
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
                else setValidations(prev => ({ ...prev, rangeName: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to ADD ${pageLabel}`)
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
                hdnRangeName: original.rangeName,
                bu_id: Number(formData.businessUnit) || 0,
                range_name: formData.rangeName,
            }
            const res = await axios.post("/rangeEdit", payload)
            if (res?.data?.success) {
                showAlert.success(`${pageLabel} Updated Successfully`)
                setFormData(formFields);
                setValue('1')
                navigate(`/masters/prod_range`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) setValidations(prev => ({ ...prev, businessUnit: val?.message || "" }));
                else setValidations(prev => ({ ...prev, rangeName: val?.message || "" }));
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${pageLabel}`)
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/getProdRange", { brand_id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                const bu = data[0]?.bu_id ? data[0].bu_id : "";
                setFormData({
                    businessUnit: bu,
                    rangeName: data[0]?.brand_name || "",
                });
                setoriginal({
                    rangeName: data[0]?.brand_name || "",
                    businessUnit: bu,
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

    const deleteRange = async (row) => {
        let id = row?.row?.id
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/deleteRange/${id}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${pageLabel}`)
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

        if (fieldConfig["Business Unit"]?.show) {
            cols.push({
                field: "bu_name",
                headerName: buLabel,
                filterable: true,
                sortable: true,
                renderCell: (params) => {
                    const row = params?.row ?? params;
                    return (
                        row?.bu_name ||
                        buOption.find((b) => String(b.id) === String(row?.bu_id))?.bu_name ||
                        ""
                    );
                },
            });
        }

        if (fieldConfig["Product Range"]?.show) {
            cols.push({
                field: "brand_name",
                headerName: rangeLabel,
                filterable: true,
                sortable: true,
            });
        }

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
    }, [fieldConfig, buOption, accStat, rangeLabel, buLabel, pageLabel]);

    const fetchTableData = async () => {
        try {
            setLoading(true)
            let payload = { brand_id: 0 }
            const res = await axios.post("/getProdRange", payload);
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
        fetchBuData();
    }, []);

    useEffect(() => {
        if (!decodedId) {
            setFormData(formFields);
            setoriginal({ rangeName: "", businessUnit: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    const isEdited =
        formData.rangeName.trim() !== original.rangeName.trim() ||
        String(formData.businessUnit ?? "") !== String(original.businessUnit ?? "");

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: pageLabel },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{pageLabel}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '90%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {pageLabel} Details</Typography>
                        }
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {fieldConfig["Business Unit"]?.show && (
                                    <FormControl fullWidth size="small" required={fieldConfig["Business Unit"]?.required}>
                                        <InputLabel id="bulabel">{buLabel}</InputLabel>
                                        <Select labelId="bulabel" label={buLabel} MenuProps={menuStyle}
                                            value={formData.businessUnit || ""} error={!!validation.businessUnit}
                                            onChange={(e) => formDataChange("businessUnit", e.target.value)}>
                                            <MenuItem style={{ fontSize: "11px" }} value="">Select {buLabel}</MenuItem>
                                            {buOption.map((val) => (
                                                <MenuItem style={{ fontSize: "11px" }} value={val.id} key={val.id}>{val.bu_name}</MenuItem>
                                            ))}
                                        </Select>
                                        {validation.businessUnit && <span style={errStyle}>{validation.businessUnit}</span>}
                                    </FormControl>
                                )}
                                {fieldConfig["Product Range"]?.show && (
                                    <TextField
                                        value={formData.rangeName}
                                        onChange={(e) => {
                                            const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                            formDataChange("rangeName", onlyText)
                                        }}
                                        required={fieldConfig["Product Range"]?.required}
                                        size='small'
                                        variant='outlined'
                                        label={rangeLabel}
                                        placeholder={`Enter ${rangeLabel}`}
                                        error={!!validation.rangeName}
                                        helperText={validation.rangeName && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.rangeName}</span>} />
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
export default ProductRange