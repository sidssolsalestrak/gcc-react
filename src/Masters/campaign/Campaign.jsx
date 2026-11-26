import React, { useState, useEffect } from 'react'
import Layout from '../../layout'
import { Box, TextField, Button, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../utils/dataTable';
import axios from "../../services/api";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useToast from "../../utils/useToast";
import ConfirmationDialog from "../../utils/confirmDialog";
import { MdOutlineEdit } from "react-icons/md";
import usePageTitle from '../../services/usePageTitle'

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

// allowed: letters, numbers, underscore, hyphen, forward slash and spaces
const invalidCharsRegex = /[^a-zA-Z0-9_\-\/ ]/;
const invalidCharsGlobal = /[^a-zA-Z0-9_\-\/ ]/g;

const Campaign = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [value, setValue] = useState('2');
    const [loading, setLoading] = useState(true)
    const [accStat, setAccStat] = useState(null);
    /*----------form fields ---------*/
    const [formData, setFormData] = useState({
        campName: "",
    })
    /*---------- original values for edit ---------*/
    const [original, setoriginal] = useState({
        campName: "",
    })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({
        campName: "",
    })

    const resetValidations = () => {
        setValidations({ campName: "" })
    }

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;
    usePageTitle("Campaign")

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
        });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} Campaign`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Campaign`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCamp(row),
        });
    };

    /*----------check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = { campName: "" }
        if (!formData.campName || formData.campName.trim() === "") {
            newValidations.campName = "The Campaign Name field is required.";
            isValid = false;
        } else if (invalidCharsRegex.test(formData.campName)) {
            newValidations.campName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            let payload = {
                campaign_name: formData.campName,
            }
            const res = await axios.post("/addCampaign", payload)
            if (res?.data?.success) {
                showAlert.success("Campaign added successfully")
                setFormData({ campName: "" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to ADD Campaign")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            let payload = {
                id: decodedId,
                campaign_name: formData.campName,
                hdnData: original.campName,
            }
            const res = await axios.post("/updateCampaign", payload)
            if (res?.data?.success) {
                showAlert.success("Campaign Updated successfully")
                setFormData({ campName: "" });
                setValue('1')
                navigate(`/masters/camp`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error("Failed to Update Campaign")
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- delete ---------*/
    const deleteCamp = async (row) => {
        let id = row?.row?.id
        try {
            const res = await axios.post(`/deleteCampaign/${id}`);
            if (res?.data?.success) {
                showAlert.success("Successfully Deleted Campaign")
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*----------for formdata onchange---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    /*----------for tab change---------*/
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    /*----------table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
            sortable: true,
        },
        {
            field: "campaign_name",
            headerName: "Campaign Name",
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
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/camp/${btoa(encodeId)}`)
    }

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getCampaign");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
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
            const res = await axios.post("/editCampaign", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                const vals = {
                    campName: data[0]?.campaign_name || "",
                };
                setFormData(vals);
                setoriginal(vals);
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
            setFormData({ campName: "" });
            setoriginal({ campName: "" })
            resetValidations();
            setValue('2');
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
            { label: "Campaign" },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">Campaign</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="campaign tabs">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Campaign Details</Typography>
                        }
                        {/*---------------- Add section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField value={formData.campName}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(invalidCharsGlobal, "").replace(/^\s+/, "");
                                        formDataChange("campName", onlyText)
                                    }}
                                    required size='small'
                                    variant='outlined' label="Campaign Name" placeholder="Enter Product Campaign Name" error={!!validation.campName}
                                    helperText={validation.campName && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.campName}</span>} />
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
                                    disabled={
                                        original.campName.toLowerCase().trim() === formData.campName.toLowerCase().trim()
                                    }
                                >
                                    Update
                                </Button>
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

export default Campaign