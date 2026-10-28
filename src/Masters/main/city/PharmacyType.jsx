import React, { useEffect, useState } from 'react'
import Layout from '../../../layout'
import { Box, TextField, Button, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import axios from "../../../services/api";
import DeleteIcon from "@mui/icons-material/Delete";
import { MdOutlineEdit } from "react-icons/md";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useToast from "../../../utils/useToast";
import ConfirmationDialog from "../../../utils/confirmDialog";
import usePageTitle from '../../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const PharmacyType = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [value, setValue] = useState('1');
    const [loading, setLoading] = useState(true)
    const [accStat, setAccStat] = useState(null);

    /*---------- form fields ---------*/
    const [formData, setFormData] = useState({ pharmacyType: "" })
    /*---------- original value for edit (PHP: hdnData) ---------*/
    const [original, setoriginal] = useState({ pharmacyType: "" })
    /*---------- form validations ---------*/
    const [validation, setValidations] = useState({ pharmacyType: "" })

    const resetValidations = () => {
        setValidations({ pharmacyType: "" })
    }

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;
    usePageTitle("Pharmacy Type")

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
            loading: false,
        });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} Pharmacy Type`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Pharmacy Type`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deletePharmacyType(row),
        });
    };

    /*---------- check validations (PHP: required|trim) ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = { pharmacyType: "" }
        if (!formData.pharmacyType || formData.pharmacyType.trim() === "") {
            newValidations.pharmacyType = "The Pharmacy Type field is required";
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(formData.pharmacyType)) {
            newValidations.pharmacyType = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const payload = { pharmacy_type: formData.pharmacyType }
            const res = await axios.post("/addPharmacyType", payload)
            if (res?.data?.success) {
                showAlert.success("Pharmacy Type added successfully")
                setFormData({ pharmacyType: "" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                const val = error?.response?.data || "";
                setValidations({ pharmacyType: val?.message || "" });
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to ADD Pharmacy Type")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const payload = {
                id: decodedId,
                pharmacy_type: formData.pharmacyType,
                hdnData: original.pharmacyType,
            }
            const res = await axios.post("/updatePharmacyType", payload)
            if (res?.data?.success) {
                showAlert.success("Pharmacy Type Updated Successfully")
                setFormData({ pharmacyType: "" });
                setValue('1')
                navigate(`/masters/pharmacyType`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                const val = error?.response?.data || "";
                setValidations({ pharmacyType: val?.message || "" });
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to Update Pharmacy Type")
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- delete ---------*/
    const deletePharmacyType = async (row) => {
        const rowId = row?.row?.id
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/deletePharmacyType/${rowId}`);
            if (res?.data?.success) {
                showAlert.success("Successfully Deleted Pharmacy Type")
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error(error?.response?.data?.message || "failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- for formdata onchange ---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    /*---------- for tab change ---------*/
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    /*---------- table columns (PHP: #, Pharmacy Type, Action) ---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
            sortable: true,
        },
        {
            field: "pharmacy_type",
            headerName: "Pharmacy Type",
            filterable: true,
            sortable: true,
        },
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
        navigate(`/masters/pharmacyType/${btoa(encodeId)}`)
    }

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getPharmacyType");
            const data = Array.isArray(res?.data?.data) ? res.data.data.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            settableData(data);
            setAccStat(res?.data?.acc_stat ?? null);
            if (res?.data?.acc_stat !== null && res?.data?.acc_stat !== undefined) {
                localStorage.setItem("acc_stat", res?.data?.acc_stat);
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
            const res = await axios.post("/editPharmacyType", { id: decodedId })
            const data = res?.data?.data || [];
            if (data.length > 0) {
                setFormData({ pharmacyType: data[0]?.pharmacy_type || "" });
                setoriginal({ pharmacyType: data[0]?.pharmacy_type || "" })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    /*---------- Fetch table data ---------*/
    useEffect(() => {
        fetchTableData();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData({ pharmacyType: "" });
            setoriginal({ pharmacyType: "" })
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
            { label: "Pharmacy Type" },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">Pharmacy Type</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="pharmacy type tabs">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Pharmacy Type</Typography>
                        }
                        {/*---------------- Add / Edit section --------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField
                                    value={formData.pharmacyType}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                        formDataChange("pharmacyType", onlyText)
                                    }}
                                    required size='small'
                                    variant='outlined'
                                    label="Pharmacy Type"
                                    placeholder="Enter Pharmacy Type"
                                    error={!!validation.pharmacyType}
                                    helperText={validation.pharmacyType && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.pharmacyType}</span>} />
                            </Box>
                            {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2, textTransform: 'none' }} color="primary" variant='contained'>Submit</Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Button
                                    onClick={() => showSubmitConfirmation()}
                                    sx={{ mt: 2, textTransform: 'none' }}
                                    color="primary"
                                    variant='contained'
                                    disabled={original.pharmacyType.trim() === formData.pharmacyType.trim()}
                                >
                                    Update
                                </Button>
                            )}
                        </TabPanel>
                        {/*---------------- View section --------------- */}
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

export default PharmacyType