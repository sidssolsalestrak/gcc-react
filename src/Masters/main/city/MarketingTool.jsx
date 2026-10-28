import React, { useState, useEffect } from 'react'
import Layout from '../../../layout'
import { Box, TextField, Button, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import axios from "../../../services/api";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useToast from "../../../utils/useToast";
import ConfirmationDialog from "../../../utils/confirmDialog";
import { MdOutlineEdit } from "react-icons/md";
import usePageTitle from '../../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const MarketingTool = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [value, setValue] = useState('1');
    const [loading, setLoading] = useState(true)
    const [accStat, setAccStat] = useState(null);
    /*----------form fields ---------*/
    const [formData, setFormData] = useState({ marketingType: "" })
    /*---------- original value for edit (sent as hdnData) ---------*/
    const [original, setoriginal] = useState({ marketingType: "" })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({ marketingType: "" })

    const resetValidations = () => setValidations({ marketingType: "" })

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;
    usePageTitle("Marketing Tool Type")

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
        setConfirmationDialog({ ...confirmationDialog, open: false });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} Marketing Tool Type`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Marketing Tool Type`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteMarketing(row),
        });
    };

    /*----------check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = { marketingType: "" }
        if (!formData.marketingType || formData.marketingType.trim() === "") {
            newValidations.marketingType = "The Marketing Type field is required.";
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(formData.marketingType)) {
            newValidations.marketingType = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            const payload = { marketing_tool_type: formData.marketingType }
            const res = await axios.post("/addMarketingTool", payload)
            if (res?.data?.success) {
                showAlert.success("Marketing Type added successfully")
                setFormData({ marketingType: "" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                showAlert.error(error?.response?.data?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to add Marketing Type")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            const payload = {
                id: decodedId,
                marketing_tool_type: formData.marketingType,
                hdnData: original.marketingType,
            }
            const res = await axios.post("/updateMarketingTool", payload)
            if (res?.data?.success) {
                showAlert.success("Marketing Type updated successfully")
                setFormData({ marketingType: "" });
                setValue('1')
                navigate(`/masters/marketing`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                showAlert.error(error?.response?.data?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to update Marketing Type")
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- delete ---------*/
    const deleteMarketing = async (row) => {
        const rowId = row?.row?.id
        try {
            const res = await axios.post(`/deleteMarketingTool/${rowId}`);
            if (res?.data?.success) {
                showAlert.success("Successfully deleted Marketing Type")
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error(error?.response?.data?.message || "Failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*----------for formdata onchange---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({ ...prev, [field]: val }))
    }

    /*----------for tab change---------*/
    const handleChange = (event, newValue) => setValue(newValue);

    /*----------table columns---------*/
    const columns = [
        { field: "index", headerName: "#", filterable: true, sortable: true },
        { field: "marketing_tool_type", headerName: "Marketing Type", filterable: true, sortable: true },
        {
            field: "",
            headerName: "Action",
            filterable: true,
            sortable: true,
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
        },
    ]

    const editdata = (row) => {
        const encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/marketing/${btoa(encodeId)}`)
    }

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getMarketingTool");
            const data = Array.isArray(res?.data?.data) ? res.data.data.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            settableData(data);
            setAccStat(res?.data?.acc_stat ?? null);
            if (res?.data?.acc_stat !== null && res?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", res.data.acc_stat);
            }
        } catch (error) {
            console.error(error);
            settableData([]);
        } finally {
            setLoading(false)
        }
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editMarketingTool", { id: decodedId })
            const data = res?.data?.data || [];
            if (data.length > 0) {
                setFormData({ marketingType: data[0]?.marketing_tool_type || "" });
                setoriginal({ marketingType: data[0]?.marketing_tool_type || "" })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("Failed to load record for edit")
        }
    }

    useEffect(() => {
        fetchTableData();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData({ marketingType: "" });
            setoriginal({ marketingType: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: "Marketing Tool Type" },
        ]}>
            <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                <Box>
                    <h1 className="mainTitle">Marketing Tool Type</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="marketing tool tabs">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Marketing Tool Type</Typography>
                        }
                        {/*---------------- Add / Edit section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField
                                    value={formData.marketingType}
                                    onChange={(e) => {
                                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                        formDataChange("marketingType", cleaned)
                                    }}
                                    required size='small' variant='outlined' label="Marketing Type"
                                    placeholder="Enter Marketing Type"
                                    error={!!validation.marketingType}
                                    helperText={validation.marketingType && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.marketingType}</span>}
                                />
                            </Box>
                            {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained'>Create</Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Button
                                    onClick={() => showSubmitConfirmation()}
                                    sx={{ mt: 2, textTransform: 'none' }}
                                    color="primary"
                                    variant='contained'
                                    disabled={original.marketingType.toLowerCase().trim() === formData.marketingType.toLowerCase().trim()}
                                >
                                    Update
                                </Button>
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

export default MarketingTool